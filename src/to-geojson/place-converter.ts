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
import {
  GeocodeResultItem,
  GeocodeResponse,
  GetPlaceResponse as V2GetPlaceResponse,
  ReverseGeocodeResultItem,
  ReverseGeocodeResponse,
  SearchNearbyResultItem,
  SearchNearbyResponse,
  SearchTextResultItem,
  SearchTextResponse,
  SuggestResultItem,
  SuggestResponse,
} from "@aws-sdk/client-geoplaces";
import { emptyFeatureCollection, toFeatureCollection, flattenProperties } from "./utils";

/**
 * It converts place responses to a FeatureCollection with Point Features. Specifically:
 *
 * 1. It converts GetPlaceResponse from our Location SDK and our standalone Places SDK to a FeatureCollection with a single
 *    feature.
 * 2. In converts SearchPlaceIndexForPositionResponse and SearchPlaceIndexForTextResponse from our LocationSDK and
 *    GeocodeResponse, ReverseGeocodeResponse, SearchNearbyResponse, SearchTextResponse, and SuggestResponse from our
 *    standalone Places SDK to a FeatureCollection with features corresponding to the entries in the response.
 *
 * Note that AutocompleteResponse isn't accepted by this method as the response doesn't include location information, so
 * it would never generate a Point Feature.
 *
 * `PlaceId` is extracted as the `id` of the output Feature if `PlaceId` exists in the response. Location information is
 * extracted as the location for the Point Feature. All other properties in the response are mapped into the Feature
 * properties.
 *
 * Any result that doesn't contain location information will be skipped.
 *
 * @example Drawing the result of SearchNearby with MapLibre could be simplified with this converter from the below
 * code:
 *
 * ```js
 * // ...
 * const searchNearbyCommand = new amazonLocationClient.SearchNearbyCommand(params);
 *
 * try {
 *   const response = await client.send(searchNearbyCommand);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = {
 *       type: "geojson",
 *       data: {
 *         type: "FeatureCollection",
 *         properties: {},
 *         features:
 *           response.ResultItems?.map((result) => {
 *             return {
 *               type: "Feature",
 *               properties: {}, // translate the properties here
 *               geometry: {
 *                 type: "Point",
 *                 coordinates: result?.Position,
 *               },
 *             };
 *           }) || [],
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
 * const searchNearbyCommand = new amazonLocationClient.SearchNearbyCommand(params);
 *
 * try {
 *   const response = await client.send(searchNearbyCommand);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.placeToFeatureCollection(response);
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
 * Output flattenProperties is true:
 *
 * ```json
 * {
 *   "type": "FeatureCollection",
 *   "features": [
 *     {
 *       "type": "Feature",
 *       "id": "AQAAAHAArZ9I7WtFD",
 *       "properties": {
 *          "Distance": 1385.945532454018
 *          "Place.Label": "Whole Foods Market, 1675 Robson St, Vancouver, BC V6G 1C8, Canada",
 *          "Place.AddressNumber": "1675",
 *          "Place.Street": "Robson St",
 *          "Place.Neighborhood": "West End",
 *          "Place.Municipality": "Vancouver",
 *          "Place.SubRegion": "Metro Vancouver",
 *          "Place.Region": "British Columbia",
 *          "Place.Country": "CAN",
 *          "Place.PostalCode": "V6G 1C8",
 *          "Place.Interpolated": false,
 *          "Place.TimeZone.Name": "America/Vancouver",
 *          "Place.TimeZone.Offset": -25200
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
 *          "Distance": 3876.5708436735226
 *          "Place.Label": "Whole Foods, 925 Main St, West Vancouver, BC V7T, Canada",
 *          "Place.AddressNumber": "925",
 *          "Place.Street": "Main St",
 *          "Place.Neighborhood": "Capilano Indian Reserve 5",
 *          "Place.Municipality": "West Vancouver",
 *          "Place.SubRegion": "Metro Vancouver",
 *          "Place.Region": "British Columbia",
 *          "Place.Country": "CAN",
 *          "Place.PostalCode": "V7T",
 *          "Place.Interpolated": false,
 *          "Place.TimeZone.Name": "America/Vancouver",
 *          "Place.TimeZone.Offset": -25200
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
 * @param place Response from the GetPlace, Search*, Geocode, ReverseGeocode, or Suggest APIs.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 */
export function placeToFeatureCollection(
  place:
    | GetPlaceResponse
    | SearchPlaceIndexForPositionResponse
    | SearchPlaceIndexForTextResponse
    | GeocodeResponse
    | V2GetPlaceResponse
    | ReverseGeocodeResponse
    | SearchNearbyResponse
    | SearchTextResponse
    | SuggestResponse,
  options?: { flattenProperties?: boolean },
): FeatureCollection<Point> {
  // For convenience, we take in all the different V0 and V2 Places Response types in a single method.
  // However, the GetPlaceResponse APIs return a singular place, and the other APIs return an array of
  // results, so we need to partially detect the type of response passed in so that we can process it
  // correctly.
  if ("Place" in place) {
    // The V0 GetPlaceResponse has a place.Place field that can be used to identify it. It has a single
    // entry, so we create a FeatureCollection with a single Feature.
    return toFeatureCollection([convertPlaceToFeature(place, options)]);
  } else if ("PlaceId" in place) {
    // The V2 GetPlaceResponse can be identified by having place.PlaceId. It has a single
    // entry, so we create a FeatureCollection with a single Feature.
    return toFeatureCollection([convertPlaceToFeature(place, options)]);
  } else if ("Results" in place) {
    // The V0 SearchPlaceIndex*Response types return place.Results[], so we convert
    // each Result into a Feature.
    const features = place.Results.map((result) => result && convertPlaceToFeature(result, options));
    return toFeatureCollection(features);
  } else if ("ResultItems" in place) {
    // The V2 Geocoding and Search APIs return place.ResultItems[], so we convert
    // each ResultItem into a Feature.
    const features = place.ResultItems.map((result) => result && convertPlaceToFeature(result, options));
    return toFeatureCollection(features);
  } else {
    return emptyFeatureCollection();
  }
}

/**
 * Convert a Amazon Location Place object to a GeoJSON Feature.
 *
 * @param place The Place object from Amazon Location SDK.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON Point Feature of the Place object, or null if there isn't a location property present.
 */
function convertPlaceToFeature(
  place:
    | GetPlaceResponse
    | SearchForPositionResult
    | SearchForTextResult
    | V2GetPlaceResponse
    | GeocodeResultItem
    | ReverseGeocodeResultItem
    | SearchNearbyResultItem
    | SearchTextResultItem
    | SuggestResultItem,
  options?: { flattenProperties?: boolean },
): Feature<Point> | null {
  // Try to extract the PlaceId from the result structure. If it exists, it will be used
  // for the GeoJSON feature id.

  let placeId: string;
  if ("PlaceId" in place) {
    // Everything except GetPlaceResponse and SuggestResultItem should have place.PlaceId.
    placeId = place.PlaceId;
  } else if ("Place" in place) {
    // SuggestResultItem has place.Place.PlaceId for each result.
    if ("PlaceId" in place.Place) {
      placeId = place.Place.PlaceId;
    }
  } else {
    // GetPlaceResponse doesn't return a PlaceId at all, so it will stay undefined.
    placeId = undefined;
  }

  // Try to extract a location from the results. If it exists, we'll return a GeoJSON
  // Point feature with those coordinates. If it doesn't, we'll return a null GeoJSON
  // response.

  let coordinates: number[];

  if ("Position" in place) {
    // V2GetPlaceResponse, GeocodeResultItem, ReverseGeocodeResultItem,
    // SearchNearbyResultItem, and SearchTextResultItem all provide place.Position.
    coordinates = place.Position;
  } else if ("Place" in place) {
    if ("Position" in place.Place) {
      // SuggestResultItem has place.Place.Position.
      coordinates = place.Place.Position;
    } else if ("Geometry" in place.Place) {
      // GetPlaceResponse, SearchForPositionResult, and SearchForTextResult all have
      // place.Place.Geometry.Point.
      coordinates = place.Place.Geometry.Point;
    }
  }

  if (coordinates) {
    // Remove the PlaceId and Position properties from the cloned results so that neither property
    // ends up in the GeoJSON properties. It would be redundant since we've already extracted them
    // for the feature ID and coordinates.
    // This also removes the $metadata from the response since it's information about the API call,
    // not about the location(s).
    // Note: We use structuredClone() to make a deep copy - a shallow copy would cause us to mutate
    // the passed-in result when trying to delete placeClone.Place.*
    const placeClone = structuredClone(place);
    delete placeClone["Position"];
    delete placeClone["PlaceId"];
    delete placeClone["$metadata"];
    if ("Place" in placeClone) {
      delete placeClone.Place["Position"];
      delete placeClone.Place["PlaceId"];
      delete placeClone.Place["Geometry"];
    }

    return {
      type: "Feature",
      id: placeId,
      properties: options?.flattenProperties ? flattenProperties({ ...placeClone }) : { ...placeClone },
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    };
  }

  // If there's no location, there's no Point feature to return.
  return null;
}
