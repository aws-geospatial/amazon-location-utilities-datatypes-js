import { convertLegsToLineString } from "./line-string-converter";
import { Leg } from "@aws-sdk/client-location";
import { expectLineString } from "./test-utils";

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

  it("should ignore StartPosition after the first leg assuming it should be the same as EndPosition of the previous leg.", () => {
    const legs = [
      {
        StartPosition: positions[0],
        EndPosition: positions[1],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[3],
      },
      {
        StartPosition: positions[3],
        EndPosition: positions[4],
      },
    ] as Leg[];
    const lineString = convertLegsToLineString(legs);
    expectLineString(lineString).toHavePositions(positions);
  });
  it("should throw an Error if the first Leg is missing StartPosition", () => {
    const legs = [
      {
        EndPosition: positions[1],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[3],
      },
      {
        StartPosition: positions[3],
        EndPosition: positions[4],
      },
    ] as Leg[];
    expect(() => convertLegsToLineString(legs)).toThrow("Leg 0 is missing StartPosition or EndPosition");
  });
  it("should throw an Error if the first Leg is missing EndPosition", () => {
    const legs = [
      {
        StartPosition: positions[0],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[3],
      },
      {
        StartPosition: positions[3],
        EndPosition: positions[4],
      },
    ] as Leg[];
    expect(() => convertLegsToLineString(legs)).toThrow("Leg 0 is missing StartPosition or EndPosition");
  });
  it("should throw an Error if a following Leg is missing StartPosition", () => {
    const legs = [
      {
        StartPosition: positions[0],
        EndPosition: positions[1],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
      },
      {
        EndPosition: positions[4],
      },
    ] as Leg[];
    expect(() => convertLegsToLineString(legs)).toThrow("Leg 2 is missing EndPosition");
  });
  it("should skip first leg with undefined StartPosition if specified skipErrors", () => {
    const legs = [
      {
        EndPosition: positions[1],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[3],
      },
      {
        StartPosition: positions[3],
        EndPosition: positions[4],
      },
    ] as Leg[];
    const lineString = convertLegsToLineString(legs, true);
    expectLineString(lineString).toHavePositions(positions.slice(1));
  });
  it("should skip first leg with undefined EndPosition if specified skipErrors", () => {
    const legs = [
      {
        StartPosition: positions[0],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
        EndPosition: positions[3],
      },
      {
        StartPosition: positions[3],
        EndPosition: positions[4],
      },
    ] as Leg[];
    const lineString = convertLegsToLineString(legs, true);
    expectLineString(lineString).toHavePositions(positions.slice(1));
  });
  it("should skip following legs with undefined EndPosition if specified skipErrors", () => {
    const legs = [
      {
        StartPosition: positions[0],
        EndPosition: positions[1],
      },
      {
        StartPosition: positions[1],
        EndPosition: positions[2],
      },
      {
        StartPosition: positions[2],
      },
      {
        EndPosition: positions[4],
      },
    ] as Leg[];
    const lineString = convertLegsToLineString(legs, true);
    expectLineString(lineString).toHavePositions([positions[0], positions[1], positions[2], positions[4]]);
  });
});
