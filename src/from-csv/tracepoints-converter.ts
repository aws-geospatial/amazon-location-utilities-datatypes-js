// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parse } from "csv-parse/sync";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a CSV string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to
 * SnapToRoads API.
 *
 * Expected fields:
 *
 * | Field     | Required | Description                                       |
 * | --------- | -------- | ------------------------------------------------- |
 * | latitude  | Yes      | Latitude in decimal degrees (e.g., 37.7749295)    |
 * | longitude | Yes      | Longitude in decimal degrees (e.g., -122.4194239) |
 * | speed_kmh | No       | Speed in kilometers per hour                      |
 * | speed_mps | No       | Speed in meters per second                        |
 * | speed_mph | No       | Speed in miles per hour                           |
 * | timestamp | No       | ISO 8601 format (e.g., 2024-11-19T14:45:00Z)      |
 * | heading   | No       | Direction in degrees (0-360)                      |
 *
 * Note: If multiple speed fields are provided, speed_kmh takes precedence.
 *
 * @example Basic usage const result = csvStringToRoadSnapTracePointList(csvString);
 *
 * @example With custom column mapping const result = csvStringToRoadSnapTracePointList(csvString, { columnMapping: {
 * latitude: 'y', longitude: 'x' } });
 *
 * @param csvString - The input CSV string to be parsed.
 * @param options - Optional configuration for parsing.
 * @param options.columnMapping - Object mapping expected column names to actual CSV column names.
 * @returns An array of RoadSnapTracePoint objects.
 */

type ColumnMapping = {
  latitude?: string;
  longitude?: string;
  speed_kmh?: string;
  speed_mps?: string;
  speed_mph?: string;
  timestamp?: string;
  heading?: string;
};

interface ParseOptions {
  columnMapping?: ColumnMapping;
}

export function csvStringToRoadSnapTracePointList(csvString: string, options: ParseOptions = {}): RoadSnapTracePoint[] {
  const { columnMapping = {} } = options;

  const records = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  const effectiveColumnMapping = Object.keys(records[0]).reduce((acc, header) => {
    const key = Object.keys(columnMapping).find((k) => columnMapping[k] === header) || header;
    acc[key] = header;
    return acc;
  }, {});

  return records.map((row) => convertCSVToTracepoint(row, effectiveColumnMapping));
}

function convertCSVToTracepoint(
  row: Record<string, string>,
  columnMapping: Record<string, string>,
): RoadSnapTracePoint {
  const getValue = (key: string) => row[columnMapping[key]];

  const longitude = parseFloat(getValue("longitude"));
  const latitude = parseFloat(getValue("latitude"));

  const roadSnapTracePoint: RoadSnapTracePoint = { Position: [longitude, latitude] };

  // Handle speed (only one type will be provided)
  if (columnMapping.speed_kmh) {
    roadSnapTracePoint.Speed = parseFloat(getValue("speed_kmh"));
  } else if (columnMapping.speed_mps) {
    roadSnapTracePoint.Speed = parseFloat(getValue("speed_mps")) * 3.6;
  } else if (columnMapping.speed_mph) {
    roadSnapTracePoint.Speed = parseFloat(getValue("speed_mph")) * 1.60934;
  }

  const timestamp = getValue("timestamp");
  if (timestamp) {
    roadSnapTracePoint.Timestamp = timestamp;
  }

  const heading = getValue("heading");
  if (heading) {
    roadSnapTracePoint.Heading = parseFloat(heading);
  }

  return roadSnapTracePoint;
}
