// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, Point } from "geojson";

import {
  GeocodeResponse,
  GetPlaceResponse,
  ReverseGeocodeResponse,
  SearchNearbyResponse,
  SearchTextResponse,
  SuggestResponse,
} from "@aws-sdk/client-geo-places";

import { flattenProperties, emptyFeatureCollection } from "./utils";

/**
 * Base options for converting a GeoPlaces response to a GeoJSON FeatureCollection.
 *
 * @group GeoPlaces
 */
export interface BaseGeoPlacesOptions {
  /**
   * Controls the flattening of nested properties.
   *
   * If true, nested properties within the properties field on each Feature will be flattened into a single flat list.
   * This is required when using the properties in MapLibre expressions, as MapLibre doesn't support nested properties.
   *
   * @default true
   */
  flattenProperties?: boolean;
}
const defaultBaseGeoPlacesOptions = {
  flattenProperties: true,
};

/**
 * Options for converting a GetPlaceResponse to a GeoJSON FeatureCollection.
 *
 * @group GeoPlaces
 */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GetPlaceResponseOptions extends BaseGeoPlacesOptions {}
const defaultGetPlaceResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert GetPlaceResponse responses from our standalone Places SDK to a FeatureCollection with a Point Feature. Each
 * Feature is given a locally-unique integer id for easier use with MapLibre. `Position` is extracted as the location
 * for the Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If the result doesn't contain location information, the output will be an empty FeatureCollection.
 *
 * @example Drawing the result of GetPlaceCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.GetPlaceCommand(params);
 *
 * try {
 *   const response = await client.send(command);
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
 * @param response GetPlaceResponse from the GetPlace API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function getPlaceResponseToFeatureCollection(
  response: GetPlaceResponse,
  options?: GetPlaceResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultGetPlaceResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  // Create a single feature in the feature collection with the entire response in the properties except
  // for Position, since that becomes the feature's geometry coordinates.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { Position, ...properties } = response;
  addGeoJsonPointFeature(collection, response.Position, properties, options.flattenProperties);
  return collection;
}

/** Options for converting a GeocodeResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface GeocodeResponseOptions extends BaseGeoPlacesOptions {}
const defaultGeocodeResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert GeocodeResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features. Each
 * item in the `ResultItems` list is extracted as its own feature. `Position` is extracted as the location for the Point
 * Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @example Drawing the result of GeocodeCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.GeocodeCommand(params);
 *
 * try {
 *   const response = await client.send(command);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.geocodeResponseToFeatureCollection(response);
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
 * @param response GeocodeResponse from the Geocode API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function geocodeResponseToFeatureCollection(
  response: GeocodeResponse,
  options?: GeocodeResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultGeocodeResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  for (const result of response.ResultItems ?? []) {
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Position, since that becomes the feature's geometry coordinates.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = result;
    addGeoJsonPointFeature(collection, result.Position, properties, options.flattenProperties);
  }
  return collection;
}

/** Options for converting a ReverseGeocodeResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ReverseGeocodeResponseOptions extends BaseGeoPlacesOptions {}
const defaultReverseGeocodeResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert ReverseGeocodeResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `Position` is extracted as the location for the
 * Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @example Drawing the result of ReverseGeocodeCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.ReverseGeocodeCommand(params);
 *
 * try {
 *   const response = await client.send(command);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.reverseGeocodeResponseToFeatureCollection(response);
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
 * @param response ReverseGeocodeResponse from the ReverseGeocode API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function reverseGeocodeResponseToFeatureCollection(
  response: ReverseGeocodeResponse,
  options?: ReverseGeocodeResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultReverseGeocodeResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  for (const result of response.ResultItems ?? []) {
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Position, since that becomes the feature's geometry coordinates.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = result;
    addGeoJsonPointFeature(collection, result.Position, properties, options.flattenProperties);
  }
  return collection;
}

/** Options for converting a GetPlaceResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SearchNearbyResponseOptions extends BaseGeoPlacesOptions {}
const defaultSearchNearbyResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert SearchNearbyResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `Position` is extracted as the location for the
 * Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @example Drawing the result of SearchNearbyCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.SearchNearbyCommand(params);
 *
 * try {
 *   const response = await client.send(command);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.searchNearbyResponseToFeatureCollection(response);
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
 * @param response SearchNearbyResponse from the SearchNearby API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function searchNearbyResponseToFeatureCollection(
  response: SearchNearbyResponse,
  options?: SearchNearbyResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultSearchNearbyResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  for (const result of response.ResultItems ?? []) {
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Position, since that becomes the feature's geometry coordinates.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = result;
    addGeoJsonPointFeature(collection, result.Position, properties, options.flattenProperties);
  }
  return collection;
}

/** Options for converting a GetPlaceResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SearchTextResponseOptions extends BaseGeoPlacesOptions {}
const defaultSearchTextResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert SearchTextResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features.
 * Each item in the `ResultItems` list is extracted as its own feature. `Position` is extracted as the location for the
 * Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @example Drawing the result of SearchTextCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.SearchTextCommand(params);
 *
 * try {
 *   const response = await client.send(command);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.searchTextResponseToFeatureCollection(response);
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
 * @param response SearchTextResponse from the SearchText API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function searchTextResponseToFeatureCollection(
  response: SearchTextResponse,
  options?: SearchTextResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultSearchTextResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  for (const result of response.ResultItems ?? []) {
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Position, since that becomes the feature's geometry coordinates.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = result;
    addGeoJsonPointFeature(collection, result.Position, properties, options.flattenProperties);
  }
  return collection;
}

/** Options for converting a GetPlaceResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SuggestResponseOptions extends BaseGeoPlacesOptions {}
const defaultSuggestResponseOptions = defaultBaseGeoPlacesOptions;

/**
 * Convert SuggestResponse responses from our standalone Places SDK to a FeatureCollection with a Point Features. Each
 * item in the `ResultItems` list is extracted as its own feature. `Place.Position` is extracted as the location for the
 * Point Feature. All other properties in the response are mapped into the Feature properties.
 *
 * If a result item doesn't contain location information, it will not appear in the FeatureCollection.
 *
 * @example Drawing the result of SuggestCommand:
 *
 * ```js
 * // ...
 * const command = new amazonLocationClient.SuggestCommand(params);
 *
 * try {
 *   const response = await client.send(command);
 *   if (response.error) {
 *     // error handling
 *   } else {
 *     const featureCollection = amazonLocationDataConverter.suggestResponseToFeatureCollection(response);
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
 * @param response SuggestResponse from the SearchText API.
 * @param options Options for flattening the properties.
 * @returns A GeoJSON FeatureCollection
 * @group GeoPlaces
 */
export function suggestResponseToFeatureCollection(
  response: SuggestResponse,
  options?: SuggestResponseOptions,
): FeatureCollection<Point> {
  // Set any options that weren't passed in to the defaults.
  options = { ...defaultSuggestResponseOptions, ...options };

  const collection: FeatureCollection<Point> = emptyFeatureCollection();

  for (const result of response.ResultItems ?? []) {
    // Create a single feature in the feature collection for each result with the entire result in the properties except
    // for Place.Position, since that becomes the feature's geometry coordinates.
    // We use structuredClone here to make a deep copy to ensure that deleting from the nested
    // Place struct doesn't change the original value.
    const properties = structuredClone(result);
    delete properties.Place?.Position;
    addGeoJsonPointFeature(collection, result.Place?.Position, properties, options.flattenProperties);
  }
  return collection;
}

/**
 * Creates a GeoJSON feature from a given id, coordinates, and Response structure.
 *
 * @param collection The FeatureCollection to add the feature to.
 * @param coordinates The coordinates to use for the Point, extracted from the Response structure.
 * @param properties The Response structure with the placeId and coordinates removed from it. The placeId and
 *   coordinates are expected to be removed because they would be redundant data since they already appear as the id and
 *   the geometry coordinates of the Point Feature.
 * @param flatten Whether to flatten the properties or not. Defaults to true.
 * @returns A GeoJSON Point Feature of the Response object, or null if no coordinates were present.
 */
function addGeoJsonPointFeature(
  collection: FeatureCollection,
  coordinates: number[],
  properties: object,
  flatten: boolean,
) {
  if (coordinates) {
    // Create a shallow copy of the passed-in properties and remove "$metadata", which can appear
    // in Response objects from the AWS SDK. Since $metadata is only metadata about the API call and
    // not a part of the Response data, we don't want or need it to appear in the generated GeoJSON.
    const propertiesClone = { ...properties };
    delete propertiesClone["$metadata"];

    collection.features.push({
      type: "Feature",
      id: collection.features.length,
      properties: flatten ? flattenProperties(propertiesClone) : propertiesClone,
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
    });
  }
}
