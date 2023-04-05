// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { LineString, Point, Position } from "geojson";

export function expectPoint(point?: Point) {
  return {
    toBeUndefined: () => {
      expect(point).toBeUndefined();
    },
    toHavePosition: (position: Position) => {
      expect(point).toBeDefined();
      expect(point!.type).toBe("Point");
      expect(point!.coordinates).toBe(position);
    },
  };
}

export function expectLineString(lineString?: LineString) {
  return {
    toBeUndefined: () => {
      expect(lineString).toBeUndefined();
    },
    toHavePositions: (positions: Position[]) => {
      expect(lineString).toBeDefined();
      expect(lineString!.type).toBe("LineString");
      expect(lineString!.coordinates).toStrictEqual(positions);
    },
  };
}
