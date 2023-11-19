// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CalculateRouteResponse } from "@aws-sdk/client-location";
import { routeToFeatureCollection } from "./route-converter";
import { FeatureCollection } from "geojson";
import { emptyFeatureCollection } from "./utils";

describe("routeToFeatureCollection", () => {
  it("should convert CalculateRouteResponse to a FeatureCollection and nested properties when flattenProperties is false or undefined", () => {
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
          bbox: [-123.149, 49.289, -123.141, 49.287],
          properties: {
            Summary: {
              DataSource: "Esri",
              Distance: 1,
              DistanceUnit: "Kilometers",
              DurationSeconds: 30,
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
    expect(routeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert CalculateRouteResponse to a FeatureCollection with a single feature and flattened properties when flattenProperties is true", () => {
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
          bbox: [-123.149, 49.289, -123.141, 49.287],
          properties: {
            DataSource: "Esri",
            Distance: 1,
            DistanceUnit: "Kilometers",
            DurationSeconds: 30,
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
    expect(routeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert CalculateRouteResponse without Summary", () => {
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
      Summary: undefined,
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
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
    expect(routeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert CalculateRouteResponse to a FeatureCollection a leg missing the Geometry field with a single feature and nested properties when flattenProperties is false or undefined", () => {
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
          bbox: [-123.149, 49.289, -123.141, 49.287],
          properties: {
            Summary: {
              DataSource: "Esri",
              Distance: 1,
              DistanceUnit: "Kilometers",
              DurationSeconds: 30,
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
    expect(routeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert CalculateRouteResponse to a FeatureCollection a leg missing the Geometry field with a single feature and flattened properties when flattenProperties is true", () => {
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
          bbox: [-123.149, 49.289, -123.141, 49.287],
          properties: {
            DataSource: "Esri",
            Distance: 1,
            DistanceUnit: "Kilometers",
            DurationSeconds: 30,
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
    expect(routeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should return empty FeatureCollection if Legs property is undefined", () => {
    expect(
      routeToFeatureCollection({
        Legs: undefined,
        Summary: undefined,
      }),
    ).toEqual(emptyFeatureCollection());
  });
});
