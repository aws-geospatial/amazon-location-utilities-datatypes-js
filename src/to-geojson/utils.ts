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
