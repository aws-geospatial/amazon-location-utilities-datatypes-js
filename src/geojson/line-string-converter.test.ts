// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { convertLegsToLineString } from "./line-string-converter";
import { expectLineString } from "./test-utils";
import { Leg } from "@aws-sdk/client-location";

describe("convertLegsToLineString", () => {
  it("should return undefined if legs parameter is undefined", () => {
    expect(convertLegsToLineString(undefined)).toBeUndefined();
  });

  const positions = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  it("should ignore the first point in leg geometry after the first leg assuming it should be the same as EndPosition of the previous leg.", () => {
    const legs = [
      {
        Geometry: {
          LineString: [positions[0], positions[1], positions[2]],
        },
        StartPosition: positions[0],
        EndPosition: positions[2],
      },
      {
        Geometry: {
          LineString: [positions[2], positions[3], positions[4]],
        },
        StartPosition: positions[2],
        EndPosition: positions[4],
      },
    ] as Leg[];
    const lineString = convertLegsToLineString(legs);
    expectLineString(lineString).toHavePositions(positions);
  });
  it("should throw an Error if a leg is missing Geometry", () => {
    const legs = [
      {
        StartPosition: positions[0],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[4],
      },
    ] as Leg[];
    expect(() => convertLegsToLineString(legs)).toThrow(
      "leg.Geometry is undefined, please make sure CalculateRoute is called with IncludeLegGeometry: true",
    );
  });
});
