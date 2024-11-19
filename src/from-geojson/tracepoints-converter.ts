// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Point } from "geojson";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a FeatureCollection with Point Features to an array of RoadSnapTracePoint, so the result can be used to
 * assemble the request to SnapToRoads API.
 *
 * @example Converting geojson tracepoints
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
export function featureCollectionToRoadSnapTracePointList(featureCollection: FeatureCollection<Point>) {
  return featureCollection.features.map((feature) => convertFeatureToTracepoint(feature));
}

function convertFeatureToTracepoint(feature: Feature<Point>): RoadSnapTracePoint | undefined {
  if (feature) {
    const roadSnapTracePoint = {
      Position: feature.geometry.coordinates,
    };

    if (feature.properties.timestamp_msec) {
      const timestamp = new Date(feature.properties.timestamp_msec);
      roadSnapTracePoint["Timestamp"] = timestamp.toISOString();
    }

    if (feature.properties.speed_mps) {
      const speedKMPH = feature.properties.speed_mps * 3.6;
      roadSnapTracePoint["Speed"] = Math.round(speedKMPH * 100) / 100;
    }

    if (feature.properties.heading) {
      roadSnapTracePoint["Heading"] = parseFloat(feature.properties.heading);
    }

    return roadSnapTracePoint;
  }
}
