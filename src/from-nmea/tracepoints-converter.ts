// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

const PIVOT_YEAR = 80;

/**
 * It converts a NMEA string containing $GPRMC and/or $GPGGA records to an array of RoadSnapTracePoint, so the result
 * can be used to assemble the request to SnapToRoads API.
 *
 * @example Converting a NMEA string
 *
 * Input:
 *
 * `$GPGGA,144500,3746.4945,N,12225.1642,W,1,08,1.2,25.4,M,-28.9,M,,*6E
 * $GPRMC,144630,A,3746.5019,N,12225.2094,W,5.1,185.0,191124,013.2,E*6A`
 *
 * Output:
 *
 * ```json
 * [
 *   {
 *     "Position": [-15.752737, 37.774908]
 *   },
 *   {
 *     "Position": [-15.75349, 37.775032],
 *     "Timestamp": "2024-11-19T14:46:30.000Z",
 *     "Speed": 9.45
 *   }
 * ]
 * ```
 */
export function nmeaStringToRoadSnapTracePointList(nmeaString: string) {
  const records = nmeaString
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");

  return records
    .map((record) => convertNMEAToTracepoint(record))
    .filter((data): data is RoadSnapTracePoint => data !== null);
}

function convertNMEAToTracepoint(record: string): RoadSnapTracePoint | null {
  if (record.startsWith("$GPRMC")) {
    return parseGPRMC(record);
  } else if (record.startsWith("$GPGGA")) {
    return parseGPGGA(record);
  } else {
    console.error("Unsupported NMEA record: ", record.split(",")[0]);
    return null;
  }
}

function parseGPRMC(record: string): RoadSnapTracePoint | null {
  const parts = record.split(",");

  if (parts.length < 12) {
    console.error("Invalid GPRMC record: not enough fields");
    return null;
  }

  const [
    ,
    // skipping identifier
    timeStr, // skipping status
    ,
    latitudeStr,
    latitudeDir,
    longitudeStr,
    longitudeDir,
    speedStr, // skipping track
    ,
    dateStr, // skipping magnetic variation // skipping variation direction
    ,
    ,
  ] = parts;

  const latitude = parseCoordinate(latitudeStr, latitudeDir);
  const longitude = parseCoordinate(longitudeStr, longitudeDir);

  const roadSnapTracePoint = { Position: [longitude, latitude] };

  if (timeStr && dateStr) {
    const timestamp = convertToISOTime(dateStr, timeStr);
    roadSnapTracePoint["Timestamp"] = timestamp;
  }
  if (speedStr) {
    const speedKMPH = parseFloat(speedStr) * 1.852; // convert knots to km/h
    roadSnapTracePoint["Speed"] = Math.round(speedKMPH * 100) / 100;
  }

  return roadSnapTracePoint;
}

function parseGPGGA(record: string): RoadSnapTracePoint | null {
  const parts = record.split(",");

  if (parts.length < 14) {
    console.error("Invalid GPGGA record: not enough fields");
    return null;
  }

  const [
    ,
    ,
    // skipping identifier
    // skipping time. GPGGA doesn't contain date information, so we cannot construct the timestamp.
    latitudeStr,
    latitudeDir,
    longitudeStr,
    longitudeDir, // skipping fix quality // skipping number of satellites // skipping HDOP // skipping altitude // skipping altitude unit // skipping geoid height // skipping geoid height unit // skipping time since last DGPS update // skipping DGPS station ID
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
  ] = parts;

  const latitude = parseCoordinate(latitudeStr, latitudeDir);
  const longitude = parseCoordinate(longitudeStr, longitudeDir);

  return { Position: [longitude, latitude] };
}

function parseCoordinate(coord: string, direction: string): number {
  if (!coord || !direction) return 0;
  const degrees = parseFloat(coord.slice(0, 2));
  const minutes = parseFloat(coord.slice(2)) / 60;
  let result = degrees + minutes;
  if (direction === "S" || direction === "W") {
    result = -result;
  }

  return Math.round(result * Math.pow(10, 6)) / Math.pow(10, 6);
}
function convertToISOTime(dateStr: string, timeStr: string): string {
  if (dateStr.length !== 6 || timeStr.length < 6) {
    throw new Error("Invalid date or time format");
  }

  // Extract components from the date string
  const day = dateStr.slice(0, 2);
  const month = dateStr.slice(2, 4);
  const year = dateStr.slice(4, 6);

  // Extract components from the time string
  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  const seconds = timeStr.slice(4, 6);
  const milliseconds = timeStr.length > 6 ? timeStr.slice(7) : "000";

  // Use a fixed windowing approach to interpret two-digit years:
  // Years 00-79 are interpreted as 2000-2079
  // Years 80-99 are interpreted as 1980-1999
  const fullYear = parseInt(year) < PIVOT_YEAR ? `20${year}` : `19${year}`;

  const isoString = `${fullYear}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

  return isoString;
}
