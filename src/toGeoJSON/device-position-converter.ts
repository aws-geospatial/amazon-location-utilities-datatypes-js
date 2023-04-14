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
 * It converts tracker responses to a FeatureCollection with Point Features. It converts a GetDevicePositionResponse to
 * a FeatureCollection with a single feature, and BatchGetDevicePositionResponse, GetDevicePositionHistoryResponse,
 * 51ListDevicePositionsResponse to a FeatureCollection with features corresponding to the entries in the response.
 *
 * `DeviceId` will be mapped to the `id` of the output Feature. Fields other than `Position` and `DeviceId` of the
 * device position will be mapped into the properties of the corresponding Feature. The field name will be converted
 * from PascalCase to snake_case. For example: `PostalCode` will be converted to `postal_code`.
 *
 * All properties in PositionProperties field of a device position will be mapped into the properties of the
 * corresponding Feature. The property name will be converted from PascalCase to snake_case.
 *
 * Any device position without the Position field will be skipped.
 *
 * @example Sample input:
 *
 * Result of GetDevicePosition:
 *
 * ```json
 * {
 *   "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Position": [123.0, 11.0],
 *   "SampleTime": "YYYY-MM-DDThh:mm:ss.sssZ"
 * }
 * ```
 *
 * Result of ListDevicePositions
 *
 * ```json
 * {
 *   "Entries": [
 *     {
 *       "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "Position": [123.0, 11.0],
 *       "SampleTime": "YYYY-MM-DDThh:mm:ss.sssZ"
 *     },
 *     {
 *       "DeviceId": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *       "Position": [123.0, 12.0]
 *     }
 *     // , ...
 *   ]
 * }
 * ```
 *
 * Result of BatchGetDevicePosition:
 *
 * ```json
 * {
 *   "DevicePositions": [
 *     {
 *       "DeviceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "Position": [123.0, 11.0],
 *       "SampleTime": "YYYY-MM-DDThh:mm:ss.sssZ"
 *     },
 *     {
 *       "DeviceId": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *       "Position": [123.0, 12.0]
 *     }
 *     // , ...
 *   ]
 * }
 * ```
 *
 * @example Sample output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "id": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "properties": {
 *         "sample_time": "YYYY-MM-DDThh:mm:ss.sssZ"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [123.0, 11.0]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "id": "D775D81A-BF1B-4311-9D54-2DCCA2B0BECA",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [123.0, 12.0]
 *       }
 *     }
 *     //, ...
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
