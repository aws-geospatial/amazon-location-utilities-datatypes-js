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
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return {};
  }
  const result: Record<string, unknown> = {};
  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value) && key !== "Geometry") {
      Object.assign(result, flattenProperties(value, newKey));
    } else {
      result[newKey] = value;
    }
  });
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
