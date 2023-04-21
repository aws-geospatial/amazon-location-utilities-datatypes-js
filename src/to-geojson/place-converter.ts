// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Point } from "geojson";
import {
  GetPlaceResponse,
  SearchForPositionResult,
  SearchForTextResult,
  SearchPlaceIndexForPositionResponse,
  SearchPlaceIndexForTextResponse,
} from "@aws-sdk/client-location";
import { toFeatureCollection } from "./utils";

/**
 * It converts place responses to a FeatureCollection with Point Features. It converts
 *
 * 1. GetPlaceResponse to a FeatureCollection with a single feature.
 * 2. SearchPlaceIndexForPositionResponse, SearchPlaceIndexForTextResponse to a FeatureCollection with features
 *    corresponding to the entries in the response.
 *
 * `PlaceId` will be mapped to the `id` of the output Feature if `PlaceId` is provided. Fields other than `PlaceId` and
 * `Geometry` in a place will be mapped into the properties of the corresponding Feature.
 *
 * Any place without the `Point` field will be skipped.
 *
 * @example Drawing the result of SearchPlaceIndexForText with MapLibre could be simplified with this converter from
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
 * @example Converting a GetPlace result
 *
 * Result of GetPlace:
 *
 * ```json
 * {
 *   "Place": {
 *     "Label": "Whole Foods Market, 1675 Robson St, Vancouver, BC, V6G 1C8, CAN",
 *     "Geometry": {
 *       "Point": [-123.13, 49.28]
 *     },
 *     "AddressNumber": "1675",
 *     "Street": "Robson St",
 *     "Municipality": "Vancouver",
 *     "SubRegion": "Greater Vancouver",
 *     "Region": "British Columbia",
 *     "Country": "CAN",
 *     "PostalCode": "V6G 1C8",
 *     "Interpolated": false
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
 *         "Place": {
 *           "Label": "Whole Foods Market, 1675 Robson St, Vancouver, BC, V6G 1C8, CAN",
 *           "AddressNumber": "1675",
 *           "Street": "Robson St",
 *           "Municipality": "Vancouver",
 *           "SubRegion": "Greater Vancouver",
 *           "Region": "British Columbia",
 *           "Country": "CAN",
 *           "PostalCode": "V6G 1C8",
 *           "Interpolated": false
 *         }
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-123.13, 49.28]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * @example Converting a SearchPlaceIndexForTextResponse result with the second result missing the `Point` field
 *
 * Result of SearchPlaceIndexForTextResponse:
 *
 * ```json
 * {
 *   "Summary": {
 *     "Text": "whole foods",
 *     "BiasPosition": [-123.115, 49.295],
 *     "MaxResults": 2,
 *     "DataSource": "Here"
 *   },
 *   "Results": [
 *     {
 *       "Place": {
 *         "Label": "Whole Foods Market, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *         "Geometry": {
 *           "Point": [-123.132, 49.29]
 *         },
 *         "AddressNumber": "1675",
 *         "Street": "Robson St",
 *         "Neighborhood": "West End",
 *         "Municipality": "Vancouver",
 *         "SubRegion": "Metro Vancouver",
 *         "Region": "British Columbia",
 *         "Country": "CAN",
 *         "PostalCode": "V6G 1C8",
 *         "Interpolated": false,
 *         "TimeZone": {
 *           "Name": "America/Vancouver",
 *           "Offset": -25200
 *         }
 *       },
 *       "Distance": 1385.945532454018,
 *       "PlaceId": "AQAAAHAArZ9I7WtFD"
 *     },
 *     {
 *       "Place": {
 *         "Label": "Whole Foods Market, 510 W 8th Ave, Vancouver, BC V5Z 1C5, Canada",
 *         "Geometry": {}
 *       },
 *       "PlaceId": "AQAAAHAA0gZK0c"
 *     },
 *     {
 *       "Place": {
 *         "Label": "Whole Foods, 925 Main St, West Vancouver, BC V7T, Canada",
 *         "Geometry": {
 *           "Point": [-123.142, 49.325]
 *         },
 *         "AddressNumber": "925",
 *         "Street": "Main St",
 *         "Neighborhood": "Capilano Indian Reserve 5",
 *         "Municipality": "West Vancouver",
 *         "SubRegion": "Metro Vancouver",
 *         "Region": "British Columbia",
 *         "Country": "CAN",
 *         "PostalCode": "V7T",
 *         "Interpolated": false,
 *         "TimeZone": {
 *           "Name": "America/Vancouver",
 *           "Offset": -25200
 *         }
 *       },
 *       "Distance": 3876.5708436735226,
 *       "PlaceId": "AQAAAHAAo5aDp0fMX"
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
 *       "id": "AQAAAHAArZ9I7WtFD",
 *       "properties": {
 *         "Place": {
 *           "Label": "Whole Foods Market, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *           "AddressNumber": "1675",
 *           "Street": "Robson St",
 *           "Neighborhood": "West End",
 *           "Municipality": "Vancouver",
 *           "SubRegion": "Metro Vancouver",
 *           "Region": "British Columbia",
 *           "Country": "CAN",
 *           "PostalCode": "V6G 1C8",
 *           "Interpolated": false,
 *           "TimeZone": {
 *             "Name": "America/Vancouver",
 *             "Offset": -25200
 *           }
 *         },
 *         "Distance": 1385.945532454018
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-123.132, 49.29]
 *       }
 *     },
 *     {
 *       "type": "Feature",
 *       "id": "AQAAAHAAo5aDp0fMX",
 *       "properties": {
 *         "Place": {
 *           "Label": "Whole Foods, 925 Main St, West Vancouver, BC V7T, Canada",
 *           "AddressNumber": "925",
 *           "Street": "Main St",
 *           "Neighborhood": "Capilano Indian Reserve 5",
 *           "Municipality": "West Vancouver",
 *           "SubRegion": "Metro Vancouver",
 *           "Region": "British Columbia",
 *           "Country": "CAN",
 *           "PostalCode": "V7T",
 *           "Interpolated": false,
 *           "TimeZone": {
 *             "Name": "America/Vancouver",
 *             "Offset": -25200
 *           }
 *         },
 *         "Distance": 3876.5708436735226
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-123.142, 49.325]
 *       }
 *     }
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
    const features = place.Results.map((result) => result && convertPlaceToFeature(result));
    return toFeatureCollection(features) as FeatureCollection<Point | null>;
  } else if ("Place" in place) {
    const features = [convertPlaceToFeature(place)];
    return toFeatureCollection(features) as FeatureCollection<Point | null>;
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
function convertPlaceToFeature(
  place: GetPlaceResponse | SearchForPositionResult | SearchForTextResult,
): Feature<Point | null> | null {
  const coordinates = place.Place.Geometry.Point;
  if (coordinates) {
    const feature: Feature<Point | null> = {
      type: "Feature",
      id: "PlaceId" in place ? place.PlaceId : undefined,
      properties: { ...place },
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    };
    delete feature.properties.Place.Geometry;
    if ("PlaceId" in feature.properties) {
      delete feature.properties.PlaceId;
    }
    return feature;
  } else {
    return null;
  }
}
