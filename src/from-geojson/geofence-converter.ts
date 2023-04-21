// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, Polygon } from "geojson";
import { BatchPutGeofenceRequestEntry } from "@aws-sdk/client-location";

/**
 * It converts a FeatureCollection with Polygon Features to an array of BatchPutGeofenceRequestEntry, so the result can
 * be used to assemble the request to BatchPutGeofence.
 *
 * It will map the id of the Feature to the `GeofenceId` field of the corresponding entry in the output.
 *
 * If it sees the `Circle` property in a Feature, it will be converted to a Circle Geofence using its `Center` and
 * `Radius` properties instead of a Polygon Geofence.
 *
 * <b>Note</b>: when converting the output of `geofencesToFeatureCollection` function, the following fields will be
 * removed as we can not set them when uploading geofences:
 *
 * 1. Status
 * 2. CreateTime
 * 3. UpdateTime
 *
 * @example Converting a polygon geofence
 *
 * Input:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "id": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "properties": {
 *         "Status": "ACTIVE",
 *         "CreateTime": "2023-04-18T21:35:44Z",
 *         "UpdateTime": "2023-04-18T23:20:41Z"
 *       },
 *       "geometry": {
 *         "type": "Polygon",
 *         "coordinates": [
 *           [1, 2],
 *           [1, 3],
 *           [2, 3],
 *           [1, 2]
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * [{
 *   "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Geometry": {
 *     "Polygon": [
 *       [1, 2],
 *       [1, 3],
 *       [2, 3],
 *       [1, 2]
 *     ]
 *   }
 * }]
 * ```
 *
 * @example Converting a circle geofence
 *
 * Input:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "id": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "properties": {
 *         "Status": "ACTIVE",
 *         "CreateTime": "2023-04-18T21:35:44Z",
 *         "UpdateTime": "2023-04-18T23:20:41Z",
 *         "Circle": {
 *           "Center": [1, 2],
 *           "Radius": 10.0
 *         }
 *       },
 *       "geometry": {
 *         "type": "Polygon",
 *         "coordinates": [
 *           // ... approximated Polygon
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * Output:
 *
 * ```json
 * [{
 *   "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Geometry": {
 *     "Circle": {
 *       "Center": [1, 2],
 *       "Radius": 10.0
 *     }
 *   }
 * }]
 * ```
 */
export declare function featureCollectionToGeofence(
  featureCollection: FeatureCollection<Polygon>,
): BatchPutGeofenceRequestEntry[];
