// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, Point } from "geojson";
import {
  GetPlaceResponse,
  SearchPlaceIndexForPositionResponse,
  SearchPlaceIndexForTextResponse,
} from "@aws-sdk/client-location";

/**
 * It converts place responses to a FeatureCollection with Point Features. It converts
 *
 * 1. GetPlaceResponse to a FeatureCollection with a single feature.
 * 2. SearchPlaceIndexForPositionResponse, SearchPlaceIndexForTextResponse to a FeatureCollection with features
 *    corresponding to the entries in the response.
 *
 * Fields other than `Geometry` in a place will be mapped into the properties of the corresponding Feature.
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
 * @example Converting a SearchPlaceIndexForText result
 *
 * Result of SearchPlaceIndexForText:
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
 * Output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "PostalCode": "12345"
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
 * @example Converting a GetPlace result
 *
 * Result of GetPlace:
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
 * Output:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "properties": {},
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [123.0, 11.0]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a SearchPlaceIndexForPosition result with a missing Geometry field
 *
 * Result of SearchPlaceIndexForPosition:
 *
 * ```json
 * {
 *   "Results": [
 *     {
 *       "Place": {
 *         "Geometry": {
 *           "Point": [123.0, 11.0]
 *         },
 *         "PostalCode": "111111"
 *       }
 *     },
 *     {
 *       "Place": {
 *         "Geometry": undefined,
 *         "PostalCode": "222222"
 *       }
 *     },
 *     {
 *       "Place": {
 *         "Geometry": {
 *           "Point": [234.0, 22.0]
 *         },
 *         "PostalCode": "333333"
 *       }
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
 *         "PostalCode": "111111"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [123.0, 11.0]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "properties": {
 *         "PostalCode": "333333"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [234.0, 22.0]
 *       }
 *     }
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
