// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Point } from "geojson";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a FeatureCollection with Point Features to an array of RoadSnapTracePoint, so the result can be used to
 * assemble the request to SnapToRoads API.
 *
 * @remarks
 * The function processes the following properties:
 *
 * - `timestamp_msec`
 * - `speed_mps`, `speed_kmh` or `speed_mph`
 * - `heading`
 *
 * Other properties that may be present in the input (such as provider, accuracy, and altitude) are ignored.
 *
 * Note: When multiple speed fields are provided, they are processed in this order of precedence:
 *
 * 1. Speed_kmh (used directly)
 * 2. Speed_mps (converted to km/h)
 * 3. Speed_mph (converted to km/h)
 *
 * @example Converting GeoJSON tracepoints
 *
 * Input:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "provider": "gps",
 *         "timestamp_msec": 1700470800000,
 *         "accuracy": 16.543,
 *         "altitude": 42.187652587890625,
 *         "heading": 189.6,
 *         "speed_mps": 0.87
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-122.41942389, 37.77492856]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "provider": "gps",
 *         "timestamp_msec": 1700470815000,
 *         "accuracy": 23.891,
 *         "altitude": 45.63214111328125,
 *         "heading": 201.3,
 *         "speed_mps": 4.12
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-122.42015672, 37.77503214]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * [
 *   {
 *     "Position": [-122.41942389, 37.77492856],
 *     "Timestamp": "2023-11-20T09:00:00.000Z",
 *     "Speed": 3.13,
 *     "Heading": 189.6
 *   },
 *   {
 *     "Position": [-122.42015672, 37.77503214],
 *     "Timestamp": "2023-11-20T09:00:15.000Z",
 *     "Speed": 14.83,
 *     "Heading": 201.3
 *   }
 * ]
 * ```
 */

export type TracePointProperties = {
  timestamp_msec?: number;
  speed_mps?: number;
  speed_kmh?: number;
  speed_mph?: number;
  heading?: number;
  [key: string]: any; // This allows for additional properties
};

export function featureCollectionToRoadSnapTracePointList(
  featureCollection: FeatureCollection<Point, TracePointProperties>,
) {
  return featureCollection.features.map((feature) => convertFeatureToTracepoint(feature));
}

function convertFeatureToTracepoint(feature: Feature<Point, TracePointProperties>): RoadSnapTracePoint | undefined {
  if (!feature) {
    throw new Error("Invalid feature: feature is null or undefined");
  }
  if (feature.geometry.coordinates.length < 2) {
    throw new Error("Invalid feature: coordinates must have at least 2 elements");
  }

  const roadSnapTracePoint = {
    Position: feature.geometry.coordinates,
  };

  if (feature.properties.timestamp_msec) {
    const timestamp = new Date(feature.properties.timestamp_msec);
    roadSnapTracePoint["Timestamp"] = timestamp.toISOString();
  }

  if (feature.properties.speed_kmh !== undefined) {
    roadSnapTracePoint["Speed"] = feature.properties.speed_kmh;
  } else if (feature.properties.speed_mps !== undefined) {
    const speedKMPH = feature.properties.speed_mps * 3.6;
    roadSnapTracePoint["Speed"] = speedKMPH;
  } else if (feature.properties.speed_mph !== undefined) {
    roadSnapTracePoint["Speed"] = feature.properties.speed_mph * 1.60934;
  }

  if (feature.properties.heading) {
    roadSnapTracePoint["Heading"] = feature.properties.heading;
  }

  return roadSnapTracePoint;
}
