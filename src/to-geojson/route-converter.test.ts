// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CalculateRouteResponse } from "@aws-sdk/client-location";
import { routeToFeatureCollection } from "./route-converter";
import { FeatureCollection } from "geojson";

describe("routeToFeatureCollection", () => {
  it("should convert CalculateRouteResponse to a FeatureCollection", () => {
    const input: CalculateRouteResponse = {
      Legs: [
        {
          Distance: 0.05,
          DurationSeconds: 10.88,
          EndPosition: [123.0, 12.0],
          Geometry: {
            LineString: [
              [123.0, 11.0],
              [123.5, 11.5],
              [123.0, 12.0],
            ],
          },
          StartPosition: [123.0, 11.0],
          Steps: [],
        },
        {
          Distance: 0.05,
          DurationSeconds: 9.4,
          EndPosition: [123.0, 14.0],
          Geometry: {
            LineString: [
              [123.0, 12.0],
              [123.5, 13.5],
              [123.0, 14.0],
            ],
          },
          StartPosition: [123.0, 12.0],
          Steps: [],
        },
      ],
      Summary: {
        DataSource: "Esri",
        Distance: 1,
        DistanceUnit: "Kilometers",
        DurationSeconds: 30,
        RouteBBox: [-123.149, 49.289, -123.141, 49.287],
      },
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            Summary: {
              DataSource: "Esri",
              Distance: 1,
              DistanceUnit: "Kilometers",
              DurationSeconds: 30,
              RouteBBox: [-123.149, 49.289, -123.141, 49.287],
            },
          },
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [123.0, 11.0],
                [123.5, 11.5],
                [123.0, 12.0],
              ],
              [
                [123.0, 12.0],
                [123.5, 13.5],
                [123.0, 14.0],
              ],
            ],
          },
        },
      ],
    };
    expect(routeToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert CalculateRouteResponse to a FeatureCollection a leg missing the Geometry field", () => {
    const input: CalculateRouteResponse = {
      Legs: [
        {
          Distance: 0.05,
          DurationSeconds: 10.88,
          EndPosition: [123.0, 12.0],
          Geometry: {
            LineString: [
              [123.0, 11.0],
              [123.5, 11.5],
              [123.0, 12.0],
            ],
          },
          StartPosition: [123.0, 11.0],
          Steps: [],
        },
        {
          Distance: 0.05,
          DurationSeconds: 10.7,
          EndPosition: [123.0, 13.0],
          StartPosition: [123.0, 12.0],
          Steps: [],
        },
        {
          Distance: 0.05,
          DurationSeconds: 9.4,
          EndPosition: [123.0, 14.0],
          Geometry: {
            LineString: [
              [123.0, 13.0],
              [123.5, 13.5],
              [123.0, 14.0],
            ],
          },
          StartPosition: [123.0, 13.0],
          Steps: [],
        },
      ],
      Summary: {
        DataSource: "Esri",
        Distance: 1,
        DistanceUnit: "Kilometers",
        DurationSeconds: 30,
        RouteBBox: [-123.149, 49.289, -123.141, 49.287],
      },
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            Summary: {
              DataSource: "Esri",
              Distance: 1,
              DistanceUnit: "Kilometers",
              DurationSeconds: 30,
              RouteBBox: [-123.149, 49.289, -123.141, 49.287],
            },
          },
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [123.0, 11.0],
                [123.5, 11.5],
                [123.0, 12.0],
              ],
              [
                [123.0, 13.0],
                [123.5, 13.5],
                [123.0, 14.0],
              ],
            ],
          },
        },
      ],
    };
    expect(routeToFeatureCollection(input)).toMatchObject(output);
  });
});
