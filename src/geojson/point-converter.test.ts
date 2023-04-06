// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  AnyDevicePosition,
  convertDevicePositionsToPoints,
  convertPlaceContainersToPoints,
  convertPlaceContainerToPoint,
  convertPlaceToPoint,
  convertDevicePositionToPoint,
} from "./point-converter";
import { expectPoint } from "./test-utils";
import { DevicePosition, GetDevicePositionResponse, ListDevicePositionsResponseEntry } from "@aws-sdk/client-location";

describe("convertPlaceToPoint", () => {
  it("should return undefined when place.Geometry is undefined.", () => {
    expect(
      convertPlaceToPoint({
        Geometry: undefined,
      }),
    ).toBeUndefined();
  });
  it("should return undefined when place.Geometry.Point is undefined.", () => {
    expect(
      convertPlaceToPoint({
        Geometry: {
          Point: undefined,
        },
      }),
    ).toBeUndefined();
  });
  it("should convert place to point using place.Geometry.Point.", () => {
    const position = [1, 2];
    const point = convertPlaceToPoint({
      Geometry: {
        Point: position,
      },
    });
    expectPoint(point).toHavePosition(position);
  });
});

describe("convertPlaceContainerToPoint", () => {
  it("should return undefined when placeContainer.Place is undefined.", () => {
    expect(
      convertPlaceContainerToPoint({
        Place: undefined,
      }),
    ).toBeUndefined();
  });
  it("should return undefined when placeContainer.Place.Geometry is undefined.", () => {
    expect(
      convertPlaceContainerToPoint({
        Place: {
          Geometry: undefined,
        },
      }),
    ).toBeUndefined();
  });
  it("should return undefined when placeContainer.Place.Geometry.Point is undefined.", () => {
    expect(
      convertPlaceContainerToPoint({
        Place: {
          Geometry: {
            Point: undefined,
          },
        },
      }),
    ).toBeUndefined();
  });
  it("should convert place to point using placeContainer.Place.Geometry.Point.", () => {
    const position = [1, 2];
    const point = convertPlaceContainerToPoint({
      Place: {
        Geometry: {
          Point: position,
        },
      },
    });
    expectPoint(point).toHavePosition(position);
  });
});

describe("convertPlaceContainersToPoints", () => {
  const positions = [
    [1, 2],
    [3, 4],
  ];
  const placeContainers = [
    {
      Place: {
        Geometry: {
          Point: positions[0],
        },
      },
    },
    {
      Place: undefined,
    },
    {
      Place: {
        Geometry: undefined,
      },
    },
    {
      Place: {
        Geometry: {
          Point: positions[1],
        },
      },
    },
  ];

  it("should convert place containers to points and skip undefined entries by default.", () => {
    const points = convertPlaceContainersToPoints(placeContainers);
    expect(points).toHaveLength(2);
    expectPoint(points[0]).toHavePosition(positions[0]);
    expectPoint(points[1]).toHavePosition(positions[1]);
  });

  it("should convert place containers to points and convert undefined entries if specified.", () => {
    const points = convertPlaceContainersToPoints(placeContainers, true);
    expect(points).toHaveLength(4);
    expectPoint(points[0]).toHavePosition(positions[0]);
    expectPoint(points[1]).toBeUndefined();
    expectPoint(points[2]).toBeUndefined();
    expectPoint(points[3]).toHavePosition(positions[1]);
  });
});

describe("convertDevicePositionToPoint", () => {
  it("should convert device position to Point", () => {
    const position = [1, 2];
    const withPosition = {
      Position: position,
    };
    const withoutPosition = {
      Position: undefined,
    };
    expectPoint(convertDevicePositionToPoint(withPosition as ListDevicePositionsResponseEntry)).toHavePosition(
      position,
    );
    expectPoint(convertDevicePositionToPoint(withoutPosition as ListDevicePositionsResponseEntry)).toBeUndefined();

    expectPoint(convertDevicePositionToPoint(withPosition as DevicePosition)).toHavePosition(position);
    expectPoint(convertDevicePositionToPoint(withoutPosition as DevicePosition)).toBeUndefined();

    expectPoint(convertDevicePositionToPoint(withPosition as GetDevicePositionResponse)).toHavePosition(position);
    expectPoint(convertDevicePositionToPoint(withoutPosition as GetDevicePositionResponse)).toBeUndefined();
  });
});

describe("convertDevicePositionsToPoints", () => {
  const positions = [
    [1, 2],
    [3, 4],
  ];

  const devicePositions = [
    {
      Position: positions[0],
    },
    {
      Position: undefined,
    },
    {
      Position: positions[1],
    },
  ];

  it("should convert device positions to points and skip undefined entries by default.", () => {
    const assertSkipUndefinedPoints = (devicePositions: AnyDevicePosition[]) => {
      const points = convertDevicePositionsToPoints(devicePositions);
      expect(points).toHaveLength(2);
      expectPoint(points[0]).toHavePosition(positions[0]);
      expectPoint(points[1]).toHavePosition(positions[1]);
    };

    assertSkipUndefinedPoints(devicePositions as ListDevicePositionsResponseEntry[]);
    assertSkipUndefinedPoints(devicePositions as DevicePosition[]);
    assertSkipUndefinedPoints(devicePositions as GetDevicePositionResponse[]);
  });

  it("should convert device positions to points and convert undefined entries if specified.", () => {
    const assertKeepUndefinedPoints = (devicePositions: AnyDevicePosition[]) => {
      const points = convertDevicePositionsToPoints(devicePositions, true);
      expect(points).toHaveLength(3);
      expectPoint(points[0]).toHavePosition(positions[0]);
      expectPoint(points[1]).toBeUndefined();
      expectPoint(points[2]).toHavePosition(positions[1]);
    };

    assertKeepUndefinedPoints(devicePositions as ListDevicePositionsResponseEntry[]);
    assertKeepUndefinedPoints(devicePositions as DevicePosition[]);
    assertKeepUndefinedPoints(devicePositions as GetDevicePositionResponse[]);
  });
});
