// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  BatchGetDevicePositionResponse,
  GetDevicePositionHistoryResponse,
  GetDevicePositionResponse,
  ListDevicePositionsResponse,
} from "@aws-sdk/client-location";
import { devicePositionsToFeatureCollection } from "./device-position-converter";
import { FeatureCollection } from "geojson";

describe("devicePositionsToFeatureCollection", () => {
  it("should convert GetDevicePositionResponse to a FeatureCollection", () => {
    const input: GetDevicePositionResponse = {
      DeviceId: "testdevice-1",
      SampleTime: new Date("2023-04-18T21:33:44Z"),
      ReceivedTime: new Date("2023-04-18T21:53:14.386Z"),
      Position: [-123.14931047017575, 49.292785587335636],
      PositionProperties: {
        "test-key": "test-value",
        "test-key-2": "test-value-2",
      },
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-1",
            SampleTime: new Date("2023-04-18T21:33:44Z"),
            ReceivedTime: new Date("2023-04-18T21:53:14.386Z"),
            PositionProperties: {
              "test-key": "test-value",
              "test-key-2": "test-value-2",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-123.14931047017575, 49.292785587335636],
          },
        },
      ],
    };
    devicePositionsToFeatureCollection(input);
    expect(devicePositionsToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert BatchGetDevicePositionResponse to a FeatureCollection", () => {
    const input: BatchGetDevicePositionResponse = {
      DevicePositions: [
        {
          DeviceId: "testdevice-1",
          SampleTime: new Date("2023-04-18T21:33:44Z"),
          ReceivedTime: new Date("2023-04-18T21:53:14.386Z"),
          Position: [-123.14931047017575, 49.292785587335636],
          PositionProperties: {
            "test-key": "test-value",
            "test-key-2": "test-value-2",
          },
        },
        {
          DeviceId: "testdevice-2",
          SampleTime: new Date("2023-04-18T21:35:44Z"),
          ReceivedTime: new Date("2023-04-18T22:33:18.17Z"),
          Position: [-125.14931047017575, 49.292785587335636],
          PositionProperties: {
            test: "testtest",
          },
        },
      ],
      Errors: undefined,
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-1",
            SampleTime: new Date("2023-04-18T21:33:44Z"),
            ReceivedTime: new Date("2023-04-18T21:53:14.386Z"),
            PositionProperties: {
              "test-key": "test-value",
              "test-key-2": "test-value-2",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-123.14931047017575, 49.292785587335636],
          },
        },
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-2",
            SampleTime: new Date("2023-04-18T21:35:44Z"),
            ReceivedTime: new Date("2023-04-18T22:33:18.17Z"),
            PositionProperties: {
              test: "testtest",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-125.14931047017575, 49.292785587335636],
          },
        },
      ],
    };
    devicePositionsToFeatureCollection(input);
    expect(devicePositionsToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert GetDevicePositionHistoryResponse to a FeatureCollection", () => {
    const input: GetDevicePositionHistoryResponse = {
      DevicePositions: [
        {
          DeviceId: "testdevice-3",
          SampleTime: new Date("2023-04-18T21:35:44Z"),
          ReceivedTime: new Date("2023-04-19T18:23:28.936Z"),
          Position: [-125.14931047017575, 49.292785587335636],
          Accuracy: {
            Horizontal: 1,
          },
          PositionProperties: {
            Speed: "10",
          },
        },
        {
          DeviceId: "testdevice-3",
          SampleTime: new Date("2023-04-18T21:50:44Z"),
          ReceivedTime: new Date("2023-04-19T18:45:29.302Z"),
          Position: [-125.14531047017574, 49.29578558733564],
          Accuracy: {
            Horizontal: 1,
          },
          PositionProperties: {
            Speed: "25",
          },
        },
      ],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-3",
            SampleTime: new Date("2023-04-18T21:35:44Z"),
            ReceivedTime: new Date("2023-04-19T18:23:28.936Z"),
            Accuracy: {
              Horizontal: 1,
            },
            PositionProperties: {
              Speed: "10",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-125.14931047017575, 49.292785587335636],
          },
        },
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-3",
            SampleTime: new Date("2023-04-18T21:50:44Z"),
            ReceivedTime: new Date("2023-04-19T18:45:29.302Z"),
            Accuracy: {
              Horizontal: 1,
            },
            PositionProperties: {
              Speed: "25",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-125.14531047017574, 49.29578558733564],
          },
        },
      ],
    };
    devicePositionsToFeatureCollection(input);
    expect(devicePositionsToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert ListDevicePositionsResponse to a FeatureCollection", () => {
    const input: ListDevicePositionsResponse = {
      Entries: [
        {
          DeviceId: "testdevice-2",
          SampleTime: new Date("2023-04-18T21:35:44Z"),
          Position: [-125.14931047017575, 49.292785587335636],
          PositionProperties: {
            Speed: "10",
          },
        },
        {
          DeviceId: "testdevice-1",
          SampleTime: new Date("2023-04-18T21:33:44Z"),
          Position: [-123.14931047017575, 49.292785587335636],
          PositionProperties: {
            Speed: "25",
          },
        },
      ],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-2",
            SampleTime: new Date("2023-04-18T21:35:44Z"),
            PositionProperties: {
              Speed: "10",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-125.14931047017575, 49.292785587335636],
          },
        },
        {
          type: "Feature",
          properties: {
            DeviceId: "testdevice-1",
            SampleTime: new Date("2023-04-18T21:33:44Z"),
            PositionProperties: {
              Speed: "25",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [-123.14931047017575, 49.292785587335636],
          },
        },
      ],
    };
    devicePositionsToFeatureCollection(input);
    expect(devicePositionsToFeatureCollection(input)).toMatchObject(output);
  });

  it("should throw an error if Position, DevicePositions, and Entries properties cannot be found", () => {
    const input = {};
    expect(() => devicePositionsToFeatureCollection(input as GetDevicePositionResponse)).toThrow(
      "Position, DevicePositions, and Entries properties cannot be found.",
    );
  });
});
