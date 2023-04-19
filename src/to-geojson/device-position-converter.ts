// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  BatchGetDevicePositionResponse,
  GetDevicePositionResponse,
  ListDevicePositionsResponse,
  GetDevicePositionHistoryResponse,
} from "@aws-sdk/client-location";
import { FeatureCollection, Point } from "geojson";

/**
 * It converts tracker responses to a FeatureCollection with Point Features. It converts
 *
 * 1. GetDevicePositionResponse to a FeatureCollection with a single feature.
 * 2. BatchGetDevicePositionResponse, GetDevicePositionHistoryResponse, ListDevicePositionsResponse to a FeatureCollection
 *    with features corresponding to the entries in the response.
 *
 * `DeviceId` will be mapped to the `id` of the output Feature. `DeviceId` will not be mapped for
 * GetDevicePositionHistory. Fields other than `Position` and `DeviceId` of the device position will be mapped into the
 * properties of the corresponding Feature.
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
 *       "id": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "properties": {
 *         "SampleTime": "2023-04-18T21:33:44Z",
 *         "PositionProperties": {
 *           "RouteNumber": "66",
 *           "Speed": "45mph"
 *         }
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
 *       "id": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "properties": {
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
 *       "id": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *       "properties": {
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
export declare function devicePositionsToFeatureCollection(
  devicePositions:
    | GetDevicePositionResponse
    | BatchGetDevicePositionResponse
    | GetDevicePositionHistoryResponse
    | ListDevicePositionsResponse,
): FeatureCollection<Point | null>;
