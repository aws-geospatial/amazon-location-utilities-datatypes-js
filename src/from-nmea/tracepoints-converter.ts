// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";
import { parseGPGGA, parseGPRMC } from "./utils";

/**
 * It converts a NMEA string containing $GPRMC and/or $GPGGA sentences to an array of RoadSnapTracePoint, so the result
 * can be used to assemble the request to SnapToRoads API.
 *
 * Supported NMEA sentences:
 *
 * 1. GPGGA (Global Positioning System Fix Data): Format:
 *    $GPGGA,time,latitude,N/S,longitude,E/W,fix,satellites,HDOP,altitude,M,geoidHeight,M,DGPS,checksum Example:
 *    $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
 * 2. GPRMC (Recommended Minimum Specific GNSS Data): Format:
 *    $GPRMC,time,status,latitude,latitudeDirection(N/S),longitude,longitudeDirection(E/W),speed(knots),trackMadeGood(degrees),date,magneticVariation,E/W,mode_checksum
 *    Example: $GPRMC,203522.00,A,5109.0262308,N,11401.8407342,W,0.004,133.4,130522,0.0,E,D_2B
 *
 * Notes:
 *
 * - The function will use GPGGA for position and time if available, falling back to GPRMC if GPGGA is not present.
 * - Speed is extracted from GPRMC sentences only.
 * - Altitude, HDOP, magnetic variation, and other fields not relevant to SnapToRoads API are ignored.
 * - NMEA sentences use the format ddmm.mmmm for latitude and dddmm.mmmm for longitude, which this function converts to
 *   decimal degrees.
 * - Multiple sentences should be separated by newline characters.
 * - The mode field is not always present in GPRMC sentences and is not included in the example format.
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
