// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parse } from "csv-parse/sync";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a CSV string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to
 * SnapToRoads API.
 *
 * @example Converting a CSV string
 *
 * Input:
 *
 * `latitude,longitude,speed_kmh,timestamp,heading 37.7749295,-122.4194239,18.3,2024-11-19T14:45:00Z,210
 * 37.7750321,-122.4201567,22.6,2024-11-19T14:46:30Z,185`
 *
 * Output:
 *
 * ```json
 * [
 *   {
 *     "Position": [-122.419424, 37.77493],
 *     "Timestamp": "2024-11-19T14:45:00Z",
 *     "Speed": 18.3,
 *     "Heading": 210
 *   },
 *   {
 *     "Position": [-122.420157, 37.775032],
 *     "Timestamp": "2024-11-19T14:46:30Z",
 *     "Speed": 22.6,
 *     "Heading": 185
 *   }
 * ]
 * ```
 */
export function csvStringToRoadSnapTracePointList(csvString: string) {
  const records = parse(csvString, { columns: true, trim: true });

  return records.map((row) => convertCSVToTracepoint(row));
}

function convertCSVToTracepoint(row): RoadSnapTracePoint | undefined {
  const longitude = Math.round(parseFloat(row.longitude) * Math.pow(10, 6)) / Math.pow(10, 6);
  const latitude = Math.round(parseFloat(row.latitude) * Math.pow(10, 6)) / Math.pow(10, 6);

  const roadSnapTracePoint = { Position: [longitude, latitude] };
  if (row.timestamp) {
    roadSnapTracePoint["Timestamp"] = row.timestamp;
  }
  if (row.speed_kmh) {
    const speedKMPH = row.speed_kmh;
    roadSnapTracePoint["Speed"] = Math.round(speedKMPH * 100) / 100;
  } else if (row.speed_mps) {
    const speedKMPH = row.speed_mps * 3.6;
    roadSnapTracePoint["Speed"] = Math.round(speedKMPH * 100) / 100;
  } else if (row.speed_mph) {
    const speedKMPH = row.speed_mph * 1.60934;
    roadSnapTracePoint["Speed"] = Math.round(speedKMPH * 100) / 100;
  }
  if (row.heading) {
    roadSnapTracePoint["Heading"] = parseFloat(row.heading);
  }
  return roadSnapTracePoint;
}
