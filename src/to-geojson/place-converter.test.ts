// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GetPlaceResponse,
  SearchPlaceIndexForPositionResponse,
  SearchPlaceIndexForTextResponse,
} from "@aws-sdk/client-location";
import { placeToFeatureCollection } from "./place-converter";
import { FeatureCollection } from "geojson";

describe("placeToFeatureCollection", () => {
  it("should convert GetPlaceResponse to a FeatureCollection with a single feature", () => {
    const input: GetPlaceResponse = {
      Place: {
        Label: "Test Place",
        Geometry: {
          Point: [1, 2],
        },
        AddressNumber: "111",
        Street: "Burrard St",
        Neighborhood: "Downtown",
        Municipality: "Vancouver",
        SubRegion: "Metro Vancouver",
        Region: "British Columbia",
        Country: "CAN",
        PostalCode: "V6C",
      },
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            Place: {
              AddressNumber: "111",
              Country: "CAN",
              Label: "Test Place",
              Municipality: "Vancouver",
              Neighborhood: "Downtown",
              PostalCode: "V6C",
              Region: "British Columbia",
              Street: "Burrard St",
              SubRegion: "Metro Vancouver",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert SearchPlaceIndexForTextResponse to a FeatureCollection with a multiple features", () => {
    const input: SearchPlaceIndexForTextResponse = {
      Summary: {
        Text: "grocery store",
        DataSource: "Esri",
      },
      Results: [
        {
          Place: {
            Geometry: {
              Point: [1, 2],
            },
            AddressNumber: "1050",
          },
          PlaceId: "abc",
        },
        {
          Place: {
            Geometry: {
              Point: [3, 3],
            },
            AddressNumber: "609",
          },
          Distance: 1,
        },
        {
          Place: {
            Geometry: {
              Point: [5, 5],
            },
            AddressNumber: "575",
          },
          PlaceId: "def",
        },
      ],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "abc",
          properties: {
            Place: {
              AddressNumber: "1050",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          properties: {
            Place: {
              AddressNumber: "609",
            },
            Distance: 1,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 3],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            Place: {
              AddressNumber: "575",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [5, 5],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toMatchObject(output);
  });

  it("should convert SearchPlaceIndexForPositionResponse to a FeatureCollection with a multiple features", () => {
    const input: SearchPlaceIndexForPositionResponse = {
      Summary: {
        Position: [5, 5],
        DataSource: "Esri",
      },
      Results: [
        {
          Place: {
            Geometry: {
              Point: [5, 5],
            },
            AddressNumber: "1050",
          },
          PlaceId: "abc",
          Distance: 0,
        },
        {
          Place: {
            Geometry: {
              Point: [4, 4],
            },
            AddressNumber: "609",
          },
          PlaceId: "def",
          Distance: 1,
        },
        {
          Place: {
            Geometry: {
              Point: [3, 3],
            },
            AddressNumber: "575",
          },
          PlaceId: "ghi",
          Distance: 2,
        },
      ],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "abc",
          properties: {
            Place: {
              AddressNumber: "1050",
            },
            Distance: 0,
          },
          geometry: {
            type: "Point",
            coordinates: [5, 5],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            Place: {
              AddressNumber: "609",
            },
            Distance: 1,
          },
          geometry: {
            type: "Point",
            coordinates: [4, 4],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            Place: {
              AddressNumber: "575",
            },
            Distance: 2,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 3],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toMatchObject(output);
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a Point field", () => {
    const input: SearchPlaceIndexForTextResponse = {
      Summary: {
        Text: "grocery store",
        DataSource: "Esri",
      },
      Results: [
        {
          Place: {
            Geometry: {
              Point: [1, 2],
            },
            AddressNumber: "1050",
          },
        },
        {
          Place: {
            Geometry: {
              Point: undefined,
            },
            AddressNumber: "609",
          },
        },
        {
          Place: {
            Geometry: {
              Point: [5, 5],
            },
            AddressNumber: "575",
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
            Place: {
              AddressNumber: "1050",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          properties: {
            Place: {
              AddressNumber: "575",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [5, 5],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toMatchObject(output);
  });

  it("should throw an error if Results and Places properties cannot be found", () => {
    const input = {};
    expect(() => placeToFeatureCollection(input as GetPlaceResponse)).toThrow(
      "Results and Place properties cannot be found.",
    );
  });
});
