// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, MultiLineString } from "geojson";
import { CalculateRouteResponse } from "@aws-sdk/client-location";

/**
 * It converts a route to a GeoJSON FeatureCollection with a single MultiStringLine Feature, each LineString entry of
 * such MultiLineString represents a leg of the route.
 *
 * Fields other than `Legs` of the route will be mapped to a field of the Feature's properties.
 *
 * Any leg without the Geometry field will be skipped.
 *
 * Note: <b>IncludeLegGeometry</b> should be set to true when calling CalculateRoute or Geometry will not be present in
 * the result and such result will be converted to an empty MultiLineString.
 *
 * @example Sample input: calculateRoute result with 2 legs
 *
 * ```json
 * {
 *   "Summary": {
 *     // ...
 *   },
 *   "Legs": [
 *     {
 *       "StartPosition": [123.0, 11.0],
 *       "EndPosition": [123.0, 12.0],
 *       "Geometry": [
 *         [123.0, 11.0],
 *         [123.5, 11.5],
 *         [123.0, 12.0]
 *       ]
 *     },
 *     {
 *       "StartPosition": [123.0, 12.0],
 *       "EndPosition": [123.0, 13.0],
 *       "Geometry": [
 *         [123.0, 12.0],
 *         [123.5, 12.5],
 *         [123.0, 13.0]
 *       ]
 *     }
 *   ]
 * }
 * ```
 *
 * @example Output of above sample input
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "summary": {
 *           // ...
 *         }
 *       },
 *       "geometry": {
 *         "type": "MultiLineString",
 *         "coordinates": [
 *           [
 *             // Leg 1
 *             [123.0, 11.0],
 *             [123.5, 11.5],
 *             [123.0, 12.0]
 *           ],
 *           [
 *             // Leg 2
 *             [123.0, 12.0],
 *             [123.5, 12.5],
 *             [123.0, 13.0]
 *           ]
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export declare function routeToFeatureCollection(route: CalculateRouteResponse): FeatureCollection<MultiLineString>;
