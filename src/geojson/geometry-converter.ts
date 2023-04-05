// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Circle } from "@aws-sdk/client-location";
import { Geometry } from "geojson";

/**
 * A generic type of the geometries responding from Amazon Location. For example: LegGeometry, PlaceGeometry, GeofenceGeometry
 */
export interface AmazonLocationGeometry {
  Point?: number[];
  Polygon?: number[][][];
  Circle?: Circle;
  LineString?: number[][];
}

/**
 * Convert Amazon Location geometry to GeoJSON geometry
 * @param geometry an Amazon Location geometry, such as LegGeometry, PlaceGeometry, GeofenceGeometry
 * @returns a corresponding GeoJSON Geometry, or undefined if there is no coordinates of any type found in the input.
 */
export function convertAmazonLocationGeometry(geometry?: AmazonLocationGeometry): Geometry | undefined {
  const [type, coordinates] = Object.entries(geometry).find(
    (
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      [_, coordinates],
    ) => coordinates != undefined,
  );

  switch (type) {
    case "Point":
    case "LineString":
      return {
        type,
        coordinates,
      } as Geometry;
    case "Circle":
    case "Polygon":
      //TODO: look into these types when working on the Geofence converter.
      return undefined;
  }
}
