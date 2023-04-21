// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Feature, FeatureCollection, MultiLineString, Point } from "geojson";

/**
 * Converts an array of GeoJSON Features to a FeatureCollection.
 *
 * @param features An array of GeoJSON Features.
 * @returns A GeoJSON FeatureCollection containing provided Features.
 */
export function toFeatureCollection(
  features: Feature<Point | MultiLineString | null>[],
): FeatureCollection<Point | MultiLineString | null> {
  return {
    type: "FeatureCollection",
    features: features.filter((feature) => feature),
  };
}
