// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Point } from "geojson";

import {
  GeocodeResponse,
  GetPlaceResponse,
  ReverseGeocodeResponse,
  SearchNearbyResponse,
  SearchTextResponse,
  SuggestResponse,
} from "@aws-sdk/client-geoplaces";

import { toFeatureCollection, flattenProperties } from "./utils";

/**
 * Convert GetPlaceResponse responses from our standalone Places SDK to a FeatureCollection with a Point Feature.
 * `PlaceId` is extracted as the `id` of the output Feature if `PlaceId` exists in the response. `Position` is extracted
 * as the location for the Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If the result doesn't contain location information, the output will be an empty FeatureCollection.
 *
 * @example Drawing the result of GetPlaceCommand with MapLibre could be simplified with this converter from the below
 * code:
 *
 * ```js
 * // ...
 * const getPlaceCommand = new amazonLocationClient.GetPlaceCommand(params);
 *
 * try {
 *   const response = await client.send(getPlaceCommand);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = {
 *       type: "geojson",
 *       data: {
 *         type: "FeatureCollection",
 *         features: [
 *           type: "Feature",
 *           id: response?.PlaceId,
 *           properties: {}, // translate the properties here
 *           geometry: {
 *             type: "Point",
 *             coordinates: response?.Position,
 *           },
 *         ]
 *       },
 *     };
 *
 *     map.addSource("search-result", featureCollection);
 *     map.addLayer({
 *       id: "search-result-layer",
 *       type: "circle",
 *       source: "search-result",
 *       paint: {
 *         "circle-radius": 5,
 *         "circle-color": "#B42222",
 *       },
 *     });
 *   }
 * } catch (error) {
 *   // error handling
 * }
 * // ...
 * ```
 *
 * To:
 *
 * ```js
 * // ...
 * const getPlaceCommand = new amazonLocationClient.GetPlaceCommand(params);
 *
 * try {
 *   const response = await client.send(getPlaceCommand);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.getPlaceResponseToFeatureCollection(response);
 *     map.addSource("search-result", { type: "geojson", data: featureCollection });
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
 * } catch (error) {}
 * // ...
 * ```
 *
 * @example Converting a GetPlace result
 *
 * Result of GetPlace:
 *
 * ```json
 * {
 *   "AccessPoints": [
 *     {
 *       "Position": [-123.13303, 49.28992]
 *     }
 *   ],
 *   "Address": {
 *     "Label": "Whole Foods, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *     "Country": {
 *       "Code2": "CA",
 *       "Code3": "CAN",
 *       "Name": "Canada"
 *     },
 *     "Region": {
 *       "Code": "BC",
 *       "Name": "British Columbia"
 *     },
 *     "SubRegion": {
 *       "Name": "Metro Vancouver"
 *     },
 *     "Locality": "Vancouver",
 *     "District": "West End",
 *     "PostalCode": "V6G 1C8",
 *     "Street": "Robson St",
 *     "StreetComponents": [
 *       {
 *         "BaseName": "Robson",
 *         "Type": "St",
 *         "TypePlacement": "AfterBaseName",
 *         "TypeSeparator": " ",
 *         "Language": "en"
 *       }
 *     ],
 *     "AddressNumber": "1675"
 *   },
 *   "BusinessChains": [
 *     {
 *       "Name": "Whole Foods",
 *       "Id": "Whole_Foods"
 *     }
 *   ],
 *   "Categories": [
 *     {
 *       "Id": "grocery",
 *       "Name": "Grocery",
 *       "LocalizedName": "Grocery",
 *       "Primary": true
 *     }
 *   ],
 *   "Contacts": {
 *     "Phones": [
 *       {
 *         "Value": "+16046818568",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       },
 *       {
 *         "Value": "+16046875288"
 *       },
 *       {
 *         "Value": "+18449368255",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       }
 *     ],
 *     "Faxes": [
 *       {
 *         "Value": "+16046875063",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       }
 *     ],
 *     "Websites": [
 *       {
 *         "Value": "http://www.wholefoodsmarket.com",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       },
 *       {
 *         "Value": "http://www.wholefoodsmarket.com/stores/robson",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       },
 *       {
 *         "Value": "https://www.facebook.com/1888413144808506",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       },
 *       {
 *         "Value": "https://www.wholefoodsmarket.com/stores/Robson",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       },
 *       {
 *         "Value": "www.wholefoodsmarket.com",
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery"
 *           }
 *         ]
 *       }
 *     ]
 *   },
 *   "OpeningHours": [
 *     {
 *       "Display": ["Mon-Thu, Sat, Sun: 08:00 - 22:00"],
 *       "OpenNow": true,
 *       "Components": [
 *         {
 *           "OpenTime": "T080000",
 *           "OpenDuration": "PT14H00M",
 *           "Recurrence": "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SA,SU"
 *         }
 *       ],
 *       "Categories": [
 *         {
 *           "Id": "grocery",
 *           "Name": "Grocery"
 *         }
 *       ]
 *     }
 *   ],
 *   "PlaceId": "AQAAAFUAyxxcYKqlUYVtNfwVOz7yjB3RKYwaVIUAaKwve4Rhlr3M_t8eFffC2AxhWxhoUrY8orFocbsqCkB3yU8l4-ExvIBR3Iyi6lGu4uO3dZEWTYBkioJU1PS9HJ7fDcB9Ch1VJJQxrliB_pmDYYDqll99U6nr63Bh",
 *   "PlaceType": "PointOfInterest",
 *   "Position": [-123.1328, 49.29008],
 *   "TimeZone": {
 *     "Name": "America/Vancouver",
 *     "Offset": "-07:00",
 *     "OffsetSeconds": -25200
 *   },
 *   "Title": "Whole Foods"
 * }
 * ```
 *
 * Output flattenProperties is false:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "id": "AQAAAFUAyxxcYKqlUYVtNfwVOz7yjB3RKYwaVIUAaKwve4Rhlr3M_t8eFffC2AxhWxhoUrY8orFocbsqCkB3yU8l4-ExvIBR3Iyi6lGu4uO3dZEWTYBkioJU1PS9HJ7fDcB9Ch1VJJQxrliB_pmDYYDqll99U6nr63Bh",
 *       "properties": {
 *         "AccessPoints": [
 *           {
 *             "Position": [-123.13303, 49.28992]
 *           }
 *         ],
 *         "Address": {
 *           "Label": "Whole Foods, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *           "Country": {
 *             "Code2": "CA",
 *             "Code3": "CAN",
 *             "Name": "Canada"
 *           },
 *           "Region": {
 *             "Code": "BC",
 *             "Name": "British Columbia"
 *           },
 *           "SubRegion": {
 *             "Name": "Metro Vancouver"
 *           },
 *           "Locality": "Vancouver",
 *           "District": "West End",
 *           "PostalCode": "V6G 1C8",
 *           "Street": "Robson St",
 *           "StreetComponents": [
 *             {
 *               "BaseName": "Robson",
 *               "Type": "St",
 *               "TypePlacement": "AfterBaseName",
 *               "TypeSeparator": " ",
 *               "Language": "en"
 *             }
 *           ],
 *           "AddressNumber": "1675"
 *         },
 *         "BusinessChains": [
 *           {
 *             "Name": "Whole Foods",
 *             "Id": "Whole_Foods"
 *           }
 *         ],
 *         "Categories": [
 *           {
 *             "Id": "grocery",
 *             "Name": "Grocery",
 *             "LocalizedName": "Grocery",
 *             "Primary": true
 *           }
 *         ],
 *         "Contacts": {
 *           "Phones": [
 *             {
 *               "Value": "+16046818568",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             },
 *             {
 *               "Value": "+16046875288"
 *             },
 *             {
 *               "Value": "+18449368255",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             }
 *           ],
 *           "Faxes": [
 *             {
 *               "Value": "+16046875063",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             }
 *           ],
 *           "Websites": [
 *             {
 *               "Value": "http://www.wholefoodsmarket.com",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             },
 *             {
 *               "Value": "http://www.wholefoodsmarket.com/stores/robson",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             },
 *             {
 *               "Value": "https://www.facebook.com/1888413144808506",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             },
 *             {
 *               "Value": "https://www.wholefoodsmarket.com/stores/Robson",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             },
 *             {
 *               "Value": "www.wholefoodsmarket.com",
 *               "Categories": [
 *                 {
 *                   "Id": "grocery",
 *                   "Name": "Grocery"
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         "OpeningHours": [
 *           {
 *             "Display": ["Mon-Thu, Sat, Sun: 08:00 - 22:00"],
 *             "OpenNow": true,
 *             "Components": [
 *               {
 *                 "OpenTime": "T080000",
 *                 "OpenDuration": "PT14H00M",
 *                 "Recurrence": "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SA,SU"
 *               }
 *             ],
 *             "Categories": [
 *               {
 *                 "Id": "grocery",
 *                 "Name": "Grocery"
 *               }
 *             ]
 *           }
 *         ],
 *         "PlaceType": "PointOfInterest",
 *         "TimeZone": {
 *           "Name": "America/Vancouver",
 *           "Offset": "-07:00",
 *           "OffsetSeconds": -25200
 *         },
 *         "Title": "Whole Foods"
 *       },
 *       "geometry": {
 *         "type": "Point",
 *         "coordinates": [-123.1328, 49.29008]
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * - Output flattenProperties is true:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 * {
 *     "type": "FeatureCollection",
 *     "features": [
 *         {
 *             "type": "Feature",
 *             "id": "AQAAAFUAyxxcYKqlUYVtNfwVOz7yjB3RKYwaVIUAaKwve4Rhlr3M_t8eFffC2AxhWxhoUrY8orFocbsqCkB3yU8l4-ExvIBR3Iyi6lGu4uO3dZEWTYBkioJU1PS9HJ7fDcB9Ch1VJJQxrliB_pmDYYDqll99U6nr63Bh",
 *             "properties": {
 *                 "AccessPoints.0.Position": [
 *                     -123.13303,
 *                     49.28992
 *                 ],
 *                 "Address.Label": "Whole Foods, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *                 "Address.Country.Code2": "CA",
 *                 "Address.Country.Code3": "CAN",
 *                 "Address.Country.Name": "Canada",
 *                 "Address.Region.Code": "BC",
 *                 "Address.Region.Name": "British Columbia",
 *                 "Address.SubRegion.Name": "Metro Vancouver",
 *                 "Address.Locality": "Vancouver",
 *                 "Address.District": "West End",
 *                 "Address.PostalCode": "V6G 1C8",
 *                 "Address.Street": "Robson St",
 *                 "Address.StreetComponents.0.BaseName": "Robson",
 *                 "Address.StreetComponents.0.Type": "St",
 *                 "Address.StreetComponents.0.TypePlacement": "AfterBaseName",
 *                 "Address.StreetComponents.0.TypeSeparator": " ",
 *                 "Address.StreetComponents.0.Language": "en",
 *                 "Address.AddressNumber": "1675",
 *                 "BusinessChains.0.Name": "Whole Foods",
 *                 "BusinessChains.0.Id": "Whole_Foods",
 *                 "Categories.0.Id": "grocery",
 *                 "Categories.0.Name": "Grocery",
 *                 "Categories.0.LocalizedName": "Grocery",
 *                 "Categories.0.Primary": true,
 *                 "Contacts.Phones.0.Value": "+16046818568",
 *                 "Contacts.Phones.0.Categories.0.Id": "grocery",
 *                 "Contacts.Phones.0.Categories.0.Name": "Grocery",
 *                 "Contacts.Phones.1.Value": "+16046875288",
 *                 "Contacts.Phones.2.Value": "+18449368255",
 *                 "Contacts.Phones.2.Categories.0.Id": "grocery",
 *                 "Contacts.Phones.2.Categories.0.Name": "Grocery",
 *                 "Contacts.Faxes.0.Value": "+16046875063",
 *                 "Contacts.Faxes.0.Categories.0.Id": "grocery",
 *                 "Contacts.Faxes.0.Categories.0.Name": "Grocery",
 *                 "Contacts.Websites.0.Value": "http://www.wholefoodsmarket.com",
 *                 "Contacts.Websites.0.Categories.0.Id": "grocery",
 *                 "Contacts.Websites.0.Categories.0.Name": "Grocery",
 *                 "Contacts.Websites.1.Value": "http://www.wholefoodsmarket.com/stores/robson",
 *                 "Contacts.Websites.1.Categories.0.Id": "grocery",
 *                 "Contacts.Websites.1.Categories.0.Name": "Grocery",
 *                 "Contacts.Websites.2.Value": "https://www.facebook.com/1888413144808506",
 *                 "Contacts.Websites.2.Categories.0.Id": "grocery",
 *                 "Contacts.Websites.2.Categories.0.Name": "Grocery",
 *                 "Contacts.Websites.3.Value": "https://www.wholefoodsmarket.com/stores/Robson",
 *                 "Contacts.Websites.3.Categories.0.Id": "grocery",
 *                 "Contacts.Websites.3.Categories.0.Name": "Grocery",
 *                 "Contacts.Websites.4.Value": "www.wholefoodsmarket.com",
 *                 "Contacts.Websites.4.Categories.0.Id": "grocery",
 *                 "Contacts.Websites.4.Categories.0.Name": "Grocery",
 *                 "OpeningHours.0.Display.0": "Mon-Thu, Sat, Sun: 08:00 - 22:00",
 *                 "OpeningHours.0.OpenNow": true,
 *                 "OpeningHours.0.Components.0.OpenTime": "T080000",
 *                 "OpeningHours.0.Components.0.OpenDuration": "PT14H00M",
 *                 "OpeningHours.0.Components.0.Recurrence": "FREQ:DAILY;BYDAY:MO,TU,WE,TH,SA,SU",
 *                 "OpeningHours.0.Categories.0.Id": "grocery",
 *                 "OpeningHours.0.Categories.0.Name": "Grocery",
 *                 "PlaceType": "PointOfInterest",
 *                 "TimeZone.Name": "America/Vancouver",
 *                 "TimeZone.Offset": "-07:00",
 *                 "TimeZone.OffsetSeconds": -25200,
 *                 "Title": "Whole Foods"
 *             },
 *             "geometry": {
 *                 "type": "Point",
 *                 "coordinates": [
 *                     -123.1328,
 *                     49.29008
 *                 ]
 *             }
 *         }
 *     ]
 * }
 * ```
 *
 * @param response GetPlaceResponse from the GetPlace API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function getPlaceResponseToFeatureCollection(
  response: GetPlaceResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  // Create a single feature in the feature collection with the entire response in the properties except
  // for PlaceId and Position, since these become the feature's id and geometry coordinates.
  /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
  const { PlaceId, Position, ...properties } = response;
  return toFeatureCollection([createGeoJsonPointFeature(response.PlaceId, response.Position, properties, options)]);
}

/**
 * Convert GeocodeResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features. Each
 * item in the `ResultItems` list is extracted as its own feature. `PlaceId` is extracted as the `id` of the output
 * Feature if `PlaceId` exists in the item. `Position` is extracted as the location for the Point Feature. All other
 * properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @param response GeocodeResponse from the Geocode API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function geocodeResponseToFeatureCollection(
  response: GeocodeResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  const features = response.ResultItems?.map(
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for PlaceId and Position, since these become the feature's id and geometry coordinates.
    (result) => {
      /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
      const { PlaceId, Position, ...properties } = result;
      return createGeoJsonPointFeature(result.PlaceId, result.Position, properties, options);
    },
  );
  return toFeatureCollection(features);
}

/**
 * Convert ReverseGeocodeResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `PlaceId` is extracted as the `id` of the output
 * Feature if `PlaceId` exists in the item. `Position` is extracted as the location for the Point Feature. All other
 * properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @param response ReverseGeocodeResponse from the ReverseGeocode API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function reverseGeocodeResponseToFeatureCollection(
  response: ReverseGeocodeResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  const features = response.ResultItems?.map(
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for PlaceId and Position, since these become the feature's id and geometry coordinates.
    (result) => {
      /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
      const { PlaceId, Position, ...properties } = result;
      return createGeoJsonPointFeature(result.PlaceId, result.Position, properties, options);
    },
  );
  return toFeatureCollection(features);
}

/**
 * Convert SearchNearbyResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `PlaceId` is extracted as the `id` of the output
 * Feature if `PlaceId` exists in the item. `Position` is extracted as the location for the Point Feature. All other
 * properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @param response SearchNearbyResponse from the SearchNearby API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function searchNearbyResponseToFeatureCollection(
  response: SearchNearbyResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  const features = response.ResultItems?.map(
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for PlaceId and Position, since these become the feature's id and geometry coordinates.
    (result) => {
      /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
      const { PlaceId, Position, ...properties } = result;
      return createGeoJsonPointFeature(result.PlaceId, result.Position, properties, options);
    },
  );
  return toFeatureCollection(features);
}

/**
 * Convert SearchTextResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `PlaceId` is extracted as the `id` of the output
 * Feature if `PlaceId` exists in the item. `Position` is extracted as the location for the Point Feature. All other
 * properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @param response SearchTextResponse from the SearchText API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function searchTextResponseToFeatureCollection(
  response: SearchTextResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  const features = response.ResultItems?.map(
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for PlaceId and Position, since these become the feature's id and geometry coordinates.
    (result) => {
      /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
      const { PlaceId, Position, ...properties } = result;
      return createGeoJsonPointFeature(result.PlaceId, result.Position, properties, options);
    },
  );
  return toFeatureCollection(features);
}

/**
 * Convert SuggestResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features. Each
 * item in the `ResultItems` list is extracted as its own feature. `Place.PlaceId` is extracted as the `id` of the
 * output Feature if it exists in the item. `Place.Position` is extracted as the location for the Point Feature. All
 * other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @param response SuggestResponse from the SearchText API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function suggestResponseToFeatureCollection(
  response: SuggestResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  const features = response.ResultItems?.map(
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Place.PlaceId and Place.Position, since these become the feature's id and geometry coordinates.
    (result) => {
      // We use structuredClone here to make a deep copy to ensure that deleting from the nested
      // Place struct doesn't change the original value.
      const properties = structuredClone(result);
      delete properties.Place?.PlaceId;
      delete properties.Place?.Position;
      return createGeoJsonPointFeature(result.Place?.PlaceId, result.Place?.Position, properties, options);
    },
  );
  return toFeatureCollection(features);
}

/**
 * Creates a GeoJSON feature from a given id, coordinates, and Response structure.
 *
 * @param placeId The PlaceId extracted from the Response structure.
 * @param coordinates The coordinates to use for the Point, extracted from the Response structure.
 * @param properties The Response structure with the placeId and coordinates removed from it. The placeId and
 *   coordinates are expected to be removed because they would be redundant data since they already appear as the id and
 *   the geometry coordinates of the Point Feature.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON Point Feature of the Response object, or null if no coordinates were present.
 */
function createGeoJsonPointFeature(
  placeId: string,
  coordinates: number[],
  properties: object,
  options?: { flattenProperties?: boolean },
): Feature<Point> | null {
  if (coordinates) {
    // Create a shallow copy of the passed-in properties and remove "$metadata", which can appear
    // in Response objects from the AWS SDK. Since $metadata is only metadata about the API call and
    // not a part of the Response data, we don't want or need it to appear in the generated GeoJSON.
    const propertiesClone = { ...properties };
    delete propertiesClone["$metadata"];

    return {
      type: "Feature",
      id: placeId,
      properties: options?.flattenProperties ? flattenProperties(propertiesClone) : propertiesClone,
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    };
  }

  return null;
}
