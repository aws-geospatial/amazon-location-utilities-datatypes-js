// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GetGeofenceResponse,
  PutGeofenceRequest,
  BatchPutGeofenceRequest,
  ListGeofencesResponse,
} from "@aws-sdk/client-location";
import { Feature, FeatureCollection, Polygon } from "geojson";
import {
  BatchPutGeofenceRequestEntry,
  ListGeofenceResponseEntry,
} from "@aws-sdk/client-location/dist-types/models/models_0";
import { convertGeometryToFeature, toFeatureCollection } from "./utils";

/**
 * It converts a list of geofences to FeatureCollection with Polygon Features. It can convert geofences both in the
 * response and the request, so it can also help previewing geofences on the map before uploading with PutGeofence or
 * BatchPutGeofence.
 *
 * It will convert:
 *
 * 1. A Polygon Geofence to a Feature with such Polygon
 * 2. A Circle Geofence to a Feature with approximated Polygon with `Center` and `Radius` properties.
 *
 * `GeofenceId` field in the input will be mapped to the id of the corresponding Feature. Fields other then `GeofenceId`
 * and `Geometry` will be mapped into the properties of the corresponding Feature.
 *
 * Any geofence without any of `Polygon` or `Circle` geometry will be skipped.
 *
 * @example Converting a polygon geofence
 *
 * Result of a polygon geofence from GetGeofence:
 *
 * ```json
 * {
 *   "GeofenceId": "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
 *   "Geometry": {
 *     "Polygon": [
 *       [
 *         [1, 2],
 *         [1, 3],
 *         [2, 3],
 *         [1, 2]
 *       ]
 *     ]
 *   },
 *   "Status": "ACTIVE",
 *   "CreateTime": "2023-04-18T21:35:44Z",
 *   "UpdateTime": "2023-04-18T23:20:41Z"
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
 *         "CreateTime": "2023-04-18T21:35:44Z",
 *         "UpdateTime": "2023-04-18T23:20:41Z"
 *       },
 *       "geometry": {
 *         "type": "Polygon",
 *         "coordinates": [
 *           [
 *             [1, 2],
 *             [1, 3],
 *             [2, 3],
 *             [1, 2]
 *           ]
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a circle geofence
 *
 * Result of a circle geofence from GetGeofence:
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
 *   "Status": "ACTIVE",
 *   "CreateTime": "2023-04-18T21:35:44Z",
 *   "UpdateTime": "2023-04-18T23:20:41Z"
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
 * @example Converting a ListGeofences result with the second result missing the `Polygon` and `Circle` field
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
 *           [
 *             [1, 2],
 *             [1, 3],
 *             [2, 3],
 *             [1, 2]
 *           ]
 *         ]
 *       },
 *       "Status": "ACTIVE",
 *       "CreateTime": "2023-04-18T21:35:44Z",
 *       "UpdateTime": "2023-04-18T23:20:41Z"
 *     },
 *     {
 *       "GeofenceId": "1B4C6411-4A12-4219-4A12-AB5AEE6CD5XE",
 *       "Geometry": {},
 *       "Status": "ACTIVE",
 *       "CreateTime": "2023-04-18T21:35:44Z",
 *       "UpdateTime": "2023-04-18T23:20:41Z"
 *     },
 *     {
 *       "GeofenceId": "7D6C3456-4A12-4219-A99D-CD4AEE6DK4TX",
 *       "Geometry": {
 *         "Circle": {
 *           "Center": [1, 2],
 *           "Radius": 10.0
 *         }
 *       },
 *       "Status": "ACTIVE",
 *       "CreateTime": "2023-04-18T21:35:44Z",
 *       "UpdateTime": "2023-04-18T23:20:41Z"
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
 *         "Status": "ACTIVE",
 *         "CreateTime": "2023-04-18T21:35:44Z",
 *         "UpdateTime": "2023-04-18T23:20:41Z"
 *       },
 *       "geometry": {
 *         "type": "Polygon",
 *         "coordinates": [
 *           [
 *             [1, 2],
 *             [1, 3],
 *             [2, 3],
 *             [1, 2]
 *           ]
 *         ]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "id": "7D6C3456-4A12-4219-A99D-CD4AEE6DK4TX",
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
 */
export function geofencesToFeatureCollection(
  geofences: GetGeofenceResponse | PutGeofenceRequest | ListGeofencesResponse | BatchPutGeofenceRequest,
): FeatureCollection<Polygon> {
  if ("Entries" in geofences) {
    return toFeatureCollection(geofences.Entries.map((geofence) => geofenceToFeature(geofence)));
  } else {
    return toFeatureCollection([geofenceToFeature(geofences)]);
  }
}

function geofenceToFeature(
  geofence?: GetGeofenceResponse | PutGeofenceRequest | ListGeofenceResponseEntry | BatchPutGeofenceRequestEntry,
): Feature<Polygon> | undefined {
  if (geofence) {
    const result = convertGeometryToFeature(geofence?.Geometry, geofence) as Feature<Polygon>;
    if (result) {
      delete result.properties.Geometry;
      if ("GeofenceId" in geofence) {
        result.id = geofence.GeofenceId;
        delete result.properties.GeofenceId;
      }
      return result;
    }
  }
}
