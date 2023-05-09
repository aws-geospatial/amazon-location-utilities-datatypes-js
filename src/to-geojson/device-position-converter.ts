// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  BatchGetDevicePositionResponse,
  GetDevicePositionResponse,
  ListDevicePositionsResponse,
  GetDevicePositionHistoryResponse,
  DevicePosition,
  ListDevicePositionsResponseEntry,
} from "@aws-sdk/client-location";
import { Feature, FeatureCollection, Point } from "geojson";
import { emptyFeatureCollection, toFeatureCollection } from "./utils";

/**
 * It converts tracker responses to a FeatureCollection with Point Features. It converts
 *
 * 1. GetDevicePositionResponse to a FeatureCollection with a single feature.
 * 2. BatchGetDevicePositionResponse, GetDevicePositionHistoryResponse, ListDevicePositionsResponse to a FeatureCollection
 *    with features corresponding to the entries in the response.
 *
 * Fields other than `Position` of the device position will be mapped into the properties of the corresponding Feature.
 *
 * @example Converting a GetDevicePosition result
 *
 * Result of GetDevicePosition:
 *
 * ```json
 * {
 *   "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "SampleTime": "2023-04-18T21:35:44Z",
 *   "Position": [-125.14, 49.29],
 *   "Accuracy": {
 *     "Horizontal": 1
 *   },
 *   "PositionProperties": {
 *     "RouteNumber": "66",
 *     "Speed": "45mph"
 *   }
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *         "SampleTime": "2023-04-18T21:33:44Z",
 *         "PositionProperties": {
 *           "RouteNumber": "66",
 *           "Speed": "45mph"
 *         },
 *         "Accuracy": {
 *           "Horizontal": 1
 *         }
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-125.14, 49.29]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a ListDevicePositions result
 *
 * Result of ListDevicePositions:
 *
 * ```json
 * {
 *   "Entries": [
 *     {
 *       "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "SampleTime": "2023-04-18T21:35:44Z",
 *       "Position": [-125.14, 49.29],
 *       "PositionProperties": {
 *         "RouteNumber": "66",
 *         "Speed": "45mph"
 *       },
 *       "Accuracy": {
 *         "Horizontal": 1
 *       }
 *     },
 *     {
 *       "DeviceId": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *       "SampleTime": "2023-04-18T21:40:44Z",
 *       "Position": [-120.57, 50.36]
 *     }
 *   ]
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *         "SampleTime": "2023-04-18T21:35:44Z",
 *         "PositionProperties": {
 *           "RouteNumber": "66",
 *           "Speed": "45mph"
 *         },
 *         "Accuracy": {
 *           "Horizontal": 1
 *         }
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-125.14, 49.29]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "DeviceId": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *         "SampleTime": "2023-04-18T21:40:44Z"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-120.57, 50.36]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a GetDevicePositionHistory result
 *
 * Result of GetDevicePositionHistory:
 *
 * ```json
 * {
 *   "DevicePositions": [
 *     {
 *       "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "SampleTime": "2023-04-18T21:35:44Z",
 *       "ReceivedTime": "2023-04-18T21:35:44Z",
 *       "Position": [-125.25, 49.32]
 *     },
 *     {
 *       "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "SampleTime": "2023-04-18T21:50:44Z",
 *       "ReceivedTime": "2023-04-18T21:50:44Z",
 *       "Position": [-125.14, 49.29]
 *     }
 *   ]
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *         "SampleTime": "2023-04-18T21:35:44Z"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-125.25, 49.32]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *         "SampleTime": "2023-04-18T21:50:44Z"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-125.14, 49.29]
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export function devicePositionsToFeatureCollection(
  devicePositions:
    | GetDevicePositionResponse
    | BatchGetDevicePositionResponse
    | GetDevicePositionHistoryResponse
    | ListDevicePositionsResponse,
): FeatureCollection<Point> {
  if ("Position" in devicePositions) {
    const features = [convertDevicePositionToFeature(devicePositions)];
    return toFeatureCollection(features);
  } else if ("DevicePositions" in devicePositions) {
    const features = devicePositions.DevicePositions.map((result) => result && convertDevicePositionToFeature(result));
    return toFeatureCollection(features);
  } else if ("Entries" in devicePositions) {
    const features = devicePositions.Entries.map((result) => result && convertDevicePositionToFeature(result));
    return toFeatureCollection(features);
  } else {
    return emptyFeatureCollection();
  }
}

function convertDevicePositionToFeature(
  devicePosition: GetDevicePositionResponse | DevicePosition | ListDevicePositionsResponseEntry,
): Feature<Point> | null {
  const { Position, ...devicePositionProperties } = devicePosition;
  if (Position) {
    return {
      type: "Feature",
      properties: { ...devicePositionProperties },
      geometry: {
        type: "Point",
        coordinates: Position,
      },
    };
  } else {
    return null;
  }
}
