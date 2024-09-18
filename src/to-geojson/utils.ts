// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, Geometry, LineString, MultiLineString, Point, Polygon } from "geojson";
import { Circle, GeofenceGeometry, LegGeometry, PlaceGeometry } from "@aws-sdk/client-location";
import turfCircle from "@turf/circle";

/**
 * Converts an array of GeoJSON Features to a FeatureCollection.
 *
 * @param features An array of GeoJSON Features.
 * @returns A GeoJSON FeatureCollection containing provided Features.
 */
export function toFeatureCollection<T extends Point | MultiLineString | Polygon>(
  features: Feature<T>[],
): FeatureCollection<T> {
  return {
    type: "FeatureCollection",
    features: features.filter((feature) => feature),
  };
}

/**
 * Optionally flatten the Amazon Location Service object.
 *
 * @param obj Amazon Location Service object.
 * @returns Flattened object.
 */
export function flattenProperties(obj: unknown, prefix = ""): Record<string, unknown> {
  // The following fields are number[] arrays, but should be considered atomic datatypes, not lists of numbers,
  // so they shouldn't get flattened.
  const doNotFlattenList = [
    "Geometry",
    "Position",
    "Center",
    "BoundingBox",
    "BiasPosition",
    "QueryPosition",
    "DeparturePosition",
    "DestinationPosition",
    "StartPosition",
    "EndPosition",
    "Point",
    "SnappedDestination",
    "SnappedOrigin",
    "Destination",
    "Origin",
    "OriginalPosition",
    "SnappedPosition",
    "FilterBBox",
    "ResultBBox",
    "RouteBBox",
    "MapView",
    // LineString is actually a number[][] array, but we'll still treat it as an atomic datatype
    "LineString",
  ];

  // The following fields are number[][] or number[][][] arrays that represent lists of arrays that should then
  // be considered atomic, so only the first level gets flattened.
  // Polygon is a list of LineString values, which is why it only gets flattened once.
  const partialFlattenList = [
    "Polygon",
    "WaypointPositions",
    "DeparturePositions",
    "DestinationPositions",
    "SnappedDeparturePositions",
    "SnappedDestinationPositions",
  ];

  // If we've ended up in here without a struct or array, something has gone wrong, so just return.
  if (typeof obj !== "object" || obj === null) {
    return {};
  }

  const result: Record<string, unknown> = {};

  // If we're flattening an array, loop through the entries and flatten them to entries that look like
  // prefix.0, prefix.1, etc.
  if (Array.isArray(obj)) {
    for (const [index, entry] of obj.entries()) {
      // We shouldn't ever have an empty prefix, but just in case we do, just make the key "0", "1", etc.
      const newKey = prefix ? `${prefix}.${index}` : `${index}`;
      // Recursively flatten nested objects.
      if (typeof entry === "object" && entry !== null) {
        Object.assign(result, flattenProperties(entry, newKey));
      } else {
        result[newKey] = entry;
      }
    }
  } else {
    // If we're flattening a struct, loop through all the properties in the struct and flatten them out.
    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;
      // If we have nested structs or arrays, flatten them unless they're on one of our exception lists.
      if (typeof value === "object" && value !== null) {
        if (doNotFlattenList.includes(key)) {
          // For number[] values that represent a datatype like [lng, lat] instead of a list,
          // we'll keep them as-is without flattening.
          result[newKey] = value;
        } else if (partialFlattenList.includes(key)) {
          // For number[][] or number[][][] values that represent a list of datatypes, we'll flatten
          // one level but not recurse through them.
          for (const [index, entry] of value.entries()) {
            const flattenKey = `${newKey}.${index}`;
            result[flattenKey] = entry;
          }
        } else {
          // For every other nested struct or array, recursively flatten it.
          Object.assign(result, flattenProperties(value, newKey));
        }
      } else {
        result[newKey] = value;
      }
    });
  }

  return result;
}

export function emptyFeatureCollection<T extends Geometry>(): FeatureCollection<T> {
  return {
    type: "FeatureCollection",
    features: [],
  };
}

export function convertGeometryToFeature(
  geometry?: GeofenceGeometry | LegGeometry | PlaceGeometry,
  properties?,
): Feature<Point | Polygon | LineString> | undefined {
  if (geometry) {
    const [type, coordinates] =
      Object.entries(geometry).find(
        (
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          [_, coordinates],
        ) => coordinates != undefined,
      ) || [];

    switch (type) {
      case "Point":
      case "LineString":
      case "Polygon":
        return {
          type: "Feature",
          properties: {
            ...properties,
          },
          geometry: {
            type,
            coordinates,
          },
        } as Feature<Point | Polygon | LineString>;
      case "Circle": {
        const { Center: center, Radius: radius } = coordinates as Circle;
        return turfCircle(center, radius, {
          units: "meters", // Circular geofence's radius is in meters instead of turf's default (kilometers).
          properties: {
            center,
            radius,
            ...properties,
          },
        });
      }
    }
  }
}
