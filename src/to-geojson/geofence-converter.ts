// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GetGeofenceResponse,
  PutGeofenceRequest,
  BatchPutGeofenceRequest,
  ListGeofencesResponse,
} from "@aws-sdk/client-location";
import { FeatureCollection, Polygon } from "geojson";

/**
 * It converts a list of geofences to FeatureCollection with Polygon Features. It can convert geofences both in the
 * response and the request, so it can also help previewing geofences on the map before uploading with PutGeofence or
 * BatchPutGeofence.
 *
 * It will convert:
 *
 * 1. A Polygon Geofence to a Feature with such Polygon
 * 2. A Circle Geofence to a Feature with approximated Polygon with “center” and “radius” properties.
 *
 * `GeofenceId` field in the input will be mapped to the id of the corresponding Feature. Fields other then `GeofenceId`
 * and `Geometry` will be mapped into the properties of the corresponding Feature.
 *
 * Any geofence without any of `Polygon` or `Circle` geometry will be skipped by default.
 *
 * @example Converting a polygon geofence
 *
 * Input:
 *
 * ```json
 * {
 *   "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Geometry": {
 *     "Polygon": [
 *       [1, 2],
 *       [1, 3],
 *       [2, 3],
 *       [1, 2]
 *     ]
 *   },
 *   "Status": "ACTIVE"
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
 *         "Status": "ACTIVE"
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
 * @example Converting a circle geofence
 *
 * Input:
 *
 * ```json
 * {
 *   "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Geometry": {
 *     "Circle": {
 *       "Center": [1, 2],
 *       "Radius": 10.0
 *     }
 *   },
 *   "Status": "ACTIVE"
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
 *         "Status": "ACTIVE",
 *         "center": [1, 2],
 *         "radius": 10.0
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
 * @example Converting a ListGeofences result with a missing Geometry field
 *
 * Result of ListGeofences:
 *
 * ```json
 * {
 *   "Entries": [
 *     {
 *       "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *       "Geometry": {
 *         "Polygon": [
 *           [1, 2],
 *           [1, 3],
 *           [2, 3],
 *           [1, 2]
 *         ]
 *       },
 *       "Status": "ACTIVE"
 *     },
 *     {
 *       "GeofenceId": "1B4C6411-4A12-4219-4A12-AB5AEE6CD5XE",
 *       "Geometry": undefined,
 *       "Status": "ACTIVE"
 *     },
 *     {
 *       "GeofenceId": "7D6C3456-4A12-4219-A99D-CD4AEE6DK4TX",
 *       "Geometry": {
 *         "Circle": {
 *           "Center": [1, 2],
 *           "Radius": 10.0
 *         }
 *       },
 *       "Status": "ACTIVE"
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
 *         "Status": "ACTIVE"
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
 *     },
 *     {
 *       "type": "Feature",
 *       "id": "7D6C3456-4A12-4219-A99D-CD4AEE6DK4TX",
 *       "properties": {
 *         "Status": "ACTIVE",
 *         "center": [1, 2],
 *         "radius": 10.0
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
 */
export declare function geofencesToFeatureCollection(
  geofences: GetGeofenceResponse | PutGeofenceRequest | ListGeofencesResponse | BatchPutGeofenceRequest,
): FeatureCollection<Polygon | null>;
