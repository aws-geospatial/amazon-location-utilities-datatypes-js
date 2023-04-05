// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { AmazonLocationGeometry, convertAmazonLocationGeometry } from "./geometry-converter";
import { Circle, GeofenceGeometry, LegGeometry, PlaceGeometry } from "@aws-sdk/client-location";
import { LineString, Point } from "geojson";

describe("convertAmazonLocationGeometry", () => {
  it("should convert object without any valid geometry type to undefined", () => {
    expect(convertAmazonLocationGeometry({ OtherField: "test" } as AmazonLocationGeometry)).toBeUndefined();
  });
  it("should convert PlaceGeometry to Point", () => {
    const point = [1, 2];
    const placeGeometry: PlaceGeometry = {
      Point: point,
    };
    const result = convertAmazonLocationGeometry(placeGeometry);
    expect(result).toBeDefined();
    expect(result!.type).toBe("Point");
    expect((result as Point)!.coordinates).toBe(point);
  });
  it("should convert LegGeometry to LineString", () => {
    const lineString = [
      [1, 2],
      [3, 4],
    ];
    const legGeometry: LegGeometry = {
      LineString: lineString,
    };
    const result = convertAmazonLocationGeometry(legGeometry);
    expect(result).toBeDefined();
    expect(result!.type).toBe("LineString");
    expect((result as LineString)!.coordinates).toBe(lineString);
  });
  it("convert Circle is not implemented", () => {
    const circle: Circle = {
      Center: [0, 0],
      Radius: 30,
    };
    const geofence: GeofenceGeometry = {
      Circle: circle,
    };
    expect(convertAmazonLocationGeometry(geofence)).toBeUndefined();
  });
  it("convert Polygon is not implemented", () => {
    const polygon = [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ];
    const geofence: GeofenceGeometry = {
      Polygon: polygon,
    };
    expect(convertAmazonLocationGeometry(geofence)).toBeUndefined();
  });
});
