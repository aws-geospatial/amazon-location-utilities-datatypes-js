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
 * Any leg without the `Geometry` field will be skipped.
 *
 * Note: <b>IncludeLegGeometry</b> should be set to true when calling CalculateRoute or Geometry will not be present in
 * the result and such result will be converted to an empty MultiLineString.
 *
 * @example Converting a CalculateRoute result with 2 legs
 *
 * Result of CalculateRoute:
 *
 * ```json
 * {
 *   "Legs": [
 *     {
 *       "Distance": 0.05,
 *       "DurationSeconds": 10.88,
 *       "EndPosition": [123.0, 12.0],
 *       "Geometry": {
 *         "LineString": [
 *           [123.0, 11.0],
 *           [123.5, 11.5],
 *           [123.0, 12.0]
 *         ]
 *       },
 *       "StartPosition": [123.0, 11.0],
 *       "Steps": []
 *     },
 *     {
 *       "Distance": 0.05,
 *       "DurationSeconds": 9.4,
 *       "EndPosition": [123.0, 14.0],
 *       "Geometry": {
 *         "LineString": [
 *           [123.0, 12.0],
 *           [123.5, 13.5],
 *           [123.0, 14.0]
 *         ]
 *       },
 *       "StartPosition": [123.0, 12.0],
 *       "Steps": []
 *     }
 *   ],
 *   "Summary": {
 *     "DataSource": "Esri",
 *     "Distance": 1,
 *     "DistanceUnit": "Kilometers",
 *     "DurationSeconds": 30,
 *     "RouteBBox": [-123.149, 49.289, -123.141, 49.287]
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
 *         "Summary": {
 *           "DataSource": "Esri",
 *           "Distance": 1,
 *           "DistanceUnit": "Kilometers",
 *           "DurationSeconds": 30,
 *           "RouteBBox": [-123.149, 49.289, -123.141, 49.287]
 *         }
 *       },
 *       "geometry": {
 *         "type": "MultiLineString",
 *         "coordinates": [
 *           [
 *             [123.0, 11.0],
 *             [123.5, 11.5],
 *             [123.0, 12.0]
 *           ],
 *           [
 *             [123.0, 12.0],
 *             [123.5, 13.5],
 *             [123.0, 14.0]
 *           ]
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a CalculateRoute result with the second leg missing the `Geometry` field
 *
 * Result of CalculateRoute:
 *
 * ```json
 * {
 *   "Legs": [
 *     {
 *       "Distance": 0.05,
 *       "DurationSeconds": 10.88,
 *       "EndPosition": [123.0, 12.0],
 *       "Geometry": {
 *         "LineString": [
 *           [123.0, 11.0],
 *           [123.5, 11.5],
 *           [123.0, 12.0]
 *         ]
 *       },
 *       "StartPosition": [123.0, 11.0],
 *       "Steps": []
 *     },
 *     {
 *       "Distance": 0.05,
 *       "DurationSeconds": 10.7,
 *       "EndPosition": [123.0, 13.0],
 *       "StartPosition": [123.0, 12.0],
 *       "Steps": []
 *     },
 *     {
 *       "Distance": 0.05,
 *       "DurationSeconds": 9.4,
 *       "EndPosition": [123.0, 14.0],
 *       "Geometry": {
 *         "LineString": [
 *           [123.0, 13.0],
 *           [123.5, 13.5],
 *           [123.0, 14.0]
 *         ]
 *       },
 *       "StartPosition": [123.0, 13.0],
 *       "Steps": []
 *     }
 *   ],
 *   "Summary": {
 *     "DataSource": "Esri",
 *     "Distance": 1,
 *     "DistanceUnit": "Kilometers",
 *     "DurationSeconds": 30,
 *     "RouteBBox": [-123.149, 49.289, -123.141, 49.287]
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
 *         "Summary": {
 *           "DataSource": "Esri",
 *           "Distance": 1,
 *           "DistanceUnit": "Kilometers",
 *           "DurationSeconds": 30,
 *           "RouteBBox": [-123.149, 49.289, -123.141, 49.287]
 *         }
 *       },
 *       "geometry": {
 *         "type": "MultiLineString",
 *         "coordinates": [
 *           [
 *             [123.0, 11.0],
 *             [123.5, 11.5],
 *             [123.0, 12.0]
 *           ],
 *           [
 *             [123.0, 13.0],
 *             [123.5, 13.5],
 *             [123.0, 14.0]
 *           ]
 *         ]
 *       }
 *     }
 *   ]
 * }
 * ```
 */
export declare function routeToFeatureCollection(route: CalculateRouteResponse): FeatureCollection<MultiLineString>;
