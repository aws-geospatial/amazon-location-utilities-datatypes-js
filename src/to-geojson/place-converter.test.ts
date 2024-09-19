// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GetPlaceResponse,
  SearchPlaceIndexForPositionResponse,
  SearchPlaceIndexForTextResponse,
} from "@aws-sdk/client-location";
import {
  GeocodeResponse,
  GetPlaceResponse as V2GetPlaceResponse,
  ReverseGeocodeResponse,
  SearchNearbyResponse,
  SearchTextResponse,
  SuggestResponse,
} from "@aws-sdk/client-geoplaces";

import { placeToFeatureCollection } from "./place-converter";
import { FeatureCollection } from "geojson";
import { emptyFeatureCollection } from "./utils";

describe("placeToFeatureCollection", () => {
  it("should convert GetPlaceResponse to a FeatureCollection with a single feature and nested properties when flattenProperties is false or undefined", () => {
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
        Categories: ["store", "grocery", "POI"],
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
              Categories: ["store", "grocery", "POI"],
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert GetPlaceResponse to a FeatureCollection with a single feature and flattened properties when flattenProperties is true", () => {
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
        Categories: ["store", "grocery", "POI"],
      },
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            "Place.AddressNumber": "111",
            "Place.Country": "CAN",
            "Place.Label": "Test Place",
            "Place.Municipality": "Vancouver",
            "Place.Neighborhood": "Downtown",
            "Place.PostalCode": "V6C",
            "Place.Region": "British Columbia",
            "Place.Street": "Burrard St",
            "Place.SubRegion": "Metro Vancouver",
            "Place.Categories.0": "store",
            "Place.Categories.1": "grocery",
            "Place.Categories.2": "POI",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert SearchPlaceIndexForTextResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
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
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert SearchPlaceIndexForTextResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
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
            "Place.AddressNumber": "1050",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          properties: {
            "Place.AddressNumber": "609",
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
            "Place.AddressNumber": "575",
          },
          geometry: {
            type: "Point",
            coordinates: [5, 5],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert SearchPlaceIndexForPositionResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
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
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert SearchPlaceIndexForPositionResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
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
            "Place.AddressNumber": "1050",
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
            "Place.AddressNumber": "609",
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
            "Place.AddressNumber": "575",
            Distance: 2,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 3],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert GeocodeResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: GeocodeResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
          Address: {
            StreetComponents: [
              {
                Suffix: "St",
              },
            ],
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
          Position: [3, 4],
        },
        {
          PlaceId: "ghi",
          PlaceType: "Block",
          Title: "title3",
          Position: [5, 6],
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
            PlaceType: "Block",
            Title: "title",
            Address: {
              StreetComponents: [
                {
                  Suffix: "St",
                },
              ],
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            PlaceType: "Block",
            Title: "title2",
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Block",
            Title: "title3",
          },
          geometry: {
            type: "Point",
            coordinates: [5, 6],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert GeocodeResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: GeocodeResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
          Address: {
            StreetComponents: [
              {
                Suffix: "St",
              },
            ],
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
          Position: [3, 4],
        },
        {
          PlaceId: "ghi",
          PlaceType: "Block",
          Title: "title3",
          Position: [5, 6],
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
            PlaceType: "Block",
            Title: "title",
            "Address.StreetComponents.0.Suffix": "St",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            PlaceType: "Block",
            Title: "title2",
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Block",
            Title: "title3",
          },
          geometry: {
            type: "Point",
            coordinates: [5, 6],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert V2GetPlaceResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: V2GetPlaceResponse = {
      PlaceId: "abc",
      PlaceType: "Locality",
      Title: "Test Place",
      PricingBucket: "pricing bucket",
      Address: {
        Label: "Main Street",
      },
      Position: [1, 2],
      MapView: [3, 4],
      Categories: [
        { Id: "1", Name: "grocery" },
        { Id: "2", Name: "food" },
      ],
      OpeningHours: [
        {
          Display: ["12:00 - 6:00 M-F", "Closed Sunday"],
          Components: [{ OpenTime: "12:00" }],
        },
      ],
      AccessPoints: [{ Position: [5, 6] }, { Position: [7, 8] }],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "abc",
          properties: {
            PlaceType: "Locality",
            Title: "Test Place",
            PricingBucket: "pricing bucket",
            Address: {
              Label: "Main Street",
            },
            MapView: [3, 4],
            Categories: [
              { Id: "1", Name: "grocery" },
              { Id: "2", Name: "food" },
            ],
            OpeningHours: [
              {
                Display: ["12:00 - 6:00 M-F", "Closed Sunday"],
                Components: [{ OpenTime: "12:00" }],
              },
            ],
            AccessPoints: [{ Position: [5, 6] }, { Position: [7, 8] }],
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert V2GetPlaceResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: V2GetPlaceResponse = {
      PlaceId: "abc",
      PlaceType: "Locality",
      Title: "Test Place",
      PricingBucket: "pricing bucket",
      Address: {
        Label: "Main Street",
      },
      Position: [1, 2],
      MapView: [3, 4],
      Categories: [
        { Id: "1", Name: "grocery" },
        { Id: "2", Name: "food" },
      ],
      OpeningHours: [
        {
          Display: ["12:00 - 6:00 M-F", "Closed Sunday"],
          Components: [{ OpenTime: "12:00" }],
        },
      ],
      AccessPoints: [{ Position: [5, 6] }, { Position: [7, 8] }],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "abc",
          properties: {
            PlaceType: "Locality",
            Title: "Test Place",
            PricingBucket: "pricing bucket",
            "Address.Label": "Main Street",
            MapView: [3, 4],
            "Categories.0.Id": "1",
            "Categories.0.Name": "grocery",
            "Categories.1.Id": "2",
            "Categories.1.Name": "food",
            "OpeningHours.0.Display.0": "12:00 - 6:00 M-F",
            "OpeningHours.0.Display.1": "Closed Sunday",
            "OpeningHours.0.Components.0.OpenTime": "12:00",
            "AccessPoints.0.Position": [5, 6],
            "AccessPoints.1.Position": [7, 8],
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert ReverseGeocodeResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: ReverseGeocodeResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Intersection",
          Title: "Test Place 1",
          Position: [1, 2],
          Distance: 123.456,
          PostalCodeDetails: [
            {
              PostalCode: "12345",
            },
            {
              PostalCode: "56789",
            },
          ],
        },
        {
          PlaceId: "def",
          PlaceType: "Locality",
          Title: "Missing Position - will not appear in output as a Point feature.",
          Distance: 456.789,
        },
        {
          PlaceId: "ghi",
          PlaceType: "Locality",
          Title: "Test Place 2",
          Position: [3, 4],
          Distance: 456.789,
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
            PlaceType: "Intersection",
            Title: "Test Place 1",
            Distance: 123.456,
            PostalCodeDetails: [
              {
                PostalCode: "12345",
              },
              {
                PostalCode: "56789",
              },
            ],
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Locality",
            Title: "Test Place 2",
            Distance: 456.789,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert ReverseGeocodeResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: ReverseGeocodeResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Intersection",
          Title: "Test Place 1",
          Position: [1, 2],
          Distance: 123.456,
          PostalCodeDetails: [
            {
              PostalCode: "12345",
            },
            {
              PostalCode: "56789",
            },
          ],
        },
        {
          PlaceId: "def",
          PlaceType: "Locality",
          Title: "Missing Position - will not appear in output as a Point feature.",
          Distance: 456.789,
        },
        {
          PlaceId: "ghi",
          PlaceType: "Locality",
          Title: "Test Place 2",
          Position: [3, 4],
          Distance: 456.789,
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
            PlaceType: "Intersection",
            Title: "Test Place 1",
            Distance: 123.456,
            "PostalCodeDetails.0.PostalCode": "12345",
            "PostalCodeDetails.1.PostalCode": "56789",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Locality",
            Title: "Test Place 2",
            Distance: 456.789,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert SearchNearbyResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: SearchNearbyResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
          Address: {
            StreetComponents: [{ Suffix: "St" }],
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "Missing Position - will not appear in output as a Point feature",
        },
        {
          PlaceId: "ghi",
          PlaceType: "Block",
          Title: "Test Response",
          Position: [3, 4],
          Address: {
            StreetComponents: [{ Prefix: "N" }],
          },
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
            PlaceType: "Block",
            Title: "title",
            Address: {
              StreetComponents: [{ Suffix: "St" }],
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Block",
            Title: "Test Response",
            Address: {
              StreetComponents: [{ Prefix: "N" }],
            },
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert SearchNearbyResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: SearchNearbyResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
          Address: {
            StreetComponents: [{ Suffix: "St" }],
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "Missing Position - will not appear in output as a Point feature",
        },
        {
          PlaceId: "ghi",
          PlaceType: "Block",
          Title: "Test Response",
          Position: [3, 4],
          Address: {
            StreetComponents: [{ Prefix: "N" }],
          },
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
            PlaceType: "Block",
            Title: "title",
            "Address.StreetComponents.0.Suffix": "St",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "ghi",
          properties: {
            PlaceType: "Block",
            Title: "Test Response",
            "Address.StreetComponents.0.Prefix": "N",
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert SearchTextResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: SearchTextResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Country",
          Title: "Test Place 1",
          Position: [1, 2],
          Distance: 123.456,
          Address: {
            Label: "Main Street",
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Country",
          Title: "Test Place 2",
          Position: [3, 4],
          Distance: 456.789,
          Address: {
            Label: "Elm Street",
          },
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
            PlaceType: "Country",
            Title: "Test Place 1",
            Distance: 123.456,
            Address: {
              Label: "Main Street",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            PlaceType: "Country",
            Title: "Test Place 2",
            Distance: 456.789,
            Address: {
              Label: "Elm Street",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert SearchTextResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: SearchTextResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Country",
          Title: "Test Place 1",
          Position: [1, 2],
          Distance: 123.456,
          Address: {
            Label: "Main Street",
          },
        },
        {
          PlaceId: "def",
          PlaceType: "Country",
          Title: "Test Place 2",
          Position: [3, 4],
          Distance: 456.789,
          Address: {
            Label: "Elm Street",
          },
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
            PlaceType: "Country",
            Title: "Test Place 1",
            Distance: 123.456,
            "Address.Label": "Main Street",
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          id: "def",
          properties: {
            PlaceType: "Country",
            Title: "Test Place 2",
            Distance: 456.789,
            "Address.Label": "Elm Street",
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });

  it("should convert SuggestResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: SuggestResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          Title: "Place Result 1 - good",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "abc",
            PlaceType: "Region",
            Position: [1, 2],
            Distance: 123.456,
          },
        },
        {
          Title: "Query Result - filtered out of results",
          SuggestResultItemType: "Query",
          Query: {
            QueryId: "queryId",
            QueryType: "Category",
          },
        },
        {
          Title: "Place Result 2 - no place ID",
          SuggestResultItemType: "Place",
          Place: {
            PlaceType: "Region",
            Position: [3, 4],
            Distance: 456.789,
          },
        },
        {
          Title: "Place Result 3 - no Position",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "def",
            PlaceType: "Region",
            Distance: 987.654,
          },
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
            Title: "Place Result 1 - good",
            SuggestResultItemType: "Place",
            Place: {
              PlaceType: "Region",
              Distance: 123.456,
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
            Title: "Place Result 2 - no place ID",
            SuggestResultItemType: "Place",
            Place: {
              PlaceType: "Region",
              Distance: 456.789,
            },
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should convert SuggestResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: SuggestResponse = {
      PricingBucket: "pricing bucket",
      ResultItems: [
        {
          Title: "Place Result 1 - good",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "abc",
            PlaceType: "Region",
            Position: [1, 2],
            Distance: 123.456,
          },
        },
        {
          Title: "Query Result - filtered out of results",
          SuggestResultItemType: "Query",
          Query: {
            QueryId: "queryId",
            QueryType: "Category",
          },
        },
        {
          Title: "Place Result 2 - no place ID",
          SuggestResultItemType: "Place",
          Place: {
            PlaceType: "Region",
            Position: [3, 4],
            Distance: 456.789,
          },
        },
        {
          Title: "Place Result 3 - no Position",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "def",
            PlaceType: "Region",
            Distance: 987.654,
          },
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
            Title: "Place Result 1 - good",
            SuggestResultItemType: "Place",
            "Place.PlaceType": "Region",
            "Place.Distance": 123.456,
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
        {
          type: "Feature",
          properties: {
            Title: "Place Result 2 - no place ID",
            SuggestResultItemType: "Place",
            "Place.PlaceType": "Region",
            "Place.Distance": 456.789,
          },
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
        },
      ],
    };
    expect(placeToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
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
    expect(placeToFeatureCollection(input)).toEqual(output);
  });

  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(placeToFeatureCollection({} as GetPlaceResponse)).toMatchObject(emptyFeatureCollection());
    expect(
      placeToFeatureCollection({
        Place: {},
      } as GetPlaceResponse),
    ).toMatchObject(emptyFeatureCollection());
    expect(
      placeToFeatureCollection({
        Results: [{}],
      } as SearchPlaceIndexForPositionResponse),
    ).toMatchObject(emptyFeatureCollection());
  });
});
