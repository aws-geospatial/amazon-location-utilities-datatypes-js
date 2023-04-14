// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, Point } from "geojson";
import {
  GetPlaceResponse,
  SearchPlaceIndexForPositionResponse,
  SearchPlaceIndexForTextResponse,
} from "@aws-sdk/client-location";

/**
 * It converts place responses to a FeatureCollection with Point Features. It converts a GetPlaceResponse to a
 * FeatureCollection with a single feature, and SearchPlaceIndexForPositionResponse, SearchPlaceIndexForTextResponse to
 * a FeatureCollection with features corresponding to the entries in the response.
 *
 * Fields other than `Geometry` in a place will be mapped into the properties of the corresponding Feature. The field
 * name will be converted from PascalCase to snake_case. For example: `PostalCode` will be converted to `postal_code`.
 *
 * Any place without a coordinate, for example: not having a Geometry field, will be skipped by default.
 *
 * @example Drawing result of searchPlaceIndexForText with MapLibre couple be simplified with this converter from
 *
 * ```js
 * var map; // map is an initialized MapLibre instance
 * location.searchPlaceIndexForText(params, (err, result) => {
 *   if (err) {
 *     // error handling
 *   } else {
 *     const featureCollection = {
 *       type: "FeatureCollection",
 *       features:
 *         result?.Results?.map((result) => {
 *           return {
 *             type: "Feature",
 *             geometry: {
 *               type: "Point",
 *               properties: {}, // translate the properties here
 *               coordinates: result?.Place?.Geometry?.Point,
 *             },
 *           };
 *         }) || [],
 *     };
 *     map.addSource("search-result", featureCollection);
 *     map.addLayer({
 *       id: "search-result",
 *       type: "circle",
 *       source: "search-result",
 *       paint: {
 *         "circle-radius": 6,
 *         "circle-color": "#B42222",
 *       },
 *     });
 *   }
 * });
 * ```
 *
 * To
 *
 * ```js
 * location.searchPlaceIndexForText(params, (err, result) => {
 *   if (err) {
 *     // error handling
 *   } else {
 *     const featureCollection = convertPlaces(result);
 *     map.addSource("search-result", featureCollection);
 *     map.addLayer({
 *       id: "search-result",
 *       type: "circle",
 *       source: "search-result",
 *       paint: {
 *         "circle-radius": 6,
 *         "circle-color": "#B42222",
 *       },
 *     });
 *   }
 * });
 * ```
 *
 * @example Sample inputs:
 *
 * Result of searchPlaceIndexForText:
 *
 * ```json
 * {
 *   "Results": [
 *     {
 *       "Place": {
 *         "Geometry": {
 *           "Point": [123.0, 11.0]
 *         },
 *         "PostalCode": "12345"
 *       }
 *     },
 *     {
 *       "Place": {
 *         "Geometry": {
 *           "Point": [123.0, 12.0]
 *         }
 *       }
 *     }
 *     // , ...
 *   ]
 * }
 * ```
 *
 * Result of getPlace:
 *
 * ```json
 * {
 *   "Place": {
 *     "Geometry": {
 *       "Point": [123.0, 11.0]
 *     }
 *   }
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
 *       "properties": {
 *         "postal_code": "12345"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [123.0, 11.0]
 *       }
 *     },
 *     {
 *       "type": "Feature",
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
 *
 * @param place Response of the getPlace or searchPlace* API. default behaviour is to skip such place.
 * @returns A GeoJSON FeatureCollection
 */
export declare function placeToFeatureCollection(
  place: GetPlaceResponse | SearchPlaceIndexForPositionResponse | SearchPlaceIndexForTextResponse,
): FeatureCollection<Point | null>;
