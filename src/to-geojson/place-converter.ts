// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Point } from "geojson";
import {
  GetPlaceResponse,
  Place,
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
 * @param place Response of the getPlace or searchPlace* API. default behaviour is to skip such place.
 * @returns A GeoJSON FeatureCollection
 */
export function placeToFeatureCollection(
  place: GetPlaceResponse | SearchPlaceIndexForPositionResponse | SearchPlaceIndexForTextResponse,
): FeatureCollection<Point | null> {
  if ("Results" in place) {
    const features = place.Results.map((result) => result.Place && convertPlaceToFeature(result.Place));
    return wrapFeatureCollection(features);
  } else if ("Place" in place) {
    const features = [place.Place && convertPlaceToFeature(place.Place)];
    return wrapFeatureCollection(features);
  } else {
    throw new Error("Results and Place properties cannot be found.");
  }
}

/**
 * Convert an Amazon Location Place object to a GeoJSON Feature.
 *
 * @param place The Place object from Amazon Location SDK.
 * @returns A GeoJSON Feature of the Place object, or null if there isn't the Geometry.Point property present.
 */
function convertPlaceToFeature(place: Place): Feature<Point | null> | null {
  const { Geometry, ...placeProperties } = place;
  if (Geometry?.Point) {
    const coordinates = Geometry.Point;
    return {
      type: "Feature",
      properties: { ...placeProperties },
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    };
  } else {
    return null;
  }
}

/**
 * Wraps an array of GeoJSON Features with a FeatureCollection.
 *
 * @param features An array of GeoJSON Features.
 * @returns A GeoJSON FeatureCollection containing provided Features.
 */
function wrapFeatureCollection(features: Feature<Point | null>[]): FeatureCollection<Point | null> {
  return {
    type: "FeatureCollection",
    features: features.filter((feature) => feature),
  };
}
