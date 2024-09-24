// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GeocodeResponse,
  GetPlaceResponse,
  ReverseGeocodeResponse,
  SearchNearbyResponse,
  SearchTextResponse,
  SuggestResponse,
} from "@aws-sdk/client-geoplaces";

import {
  geocodeResponseToFeatureCollection,
  getPlaceResponseToFeatureCollection,
  reverseGeocodeResponseToFeatureCollection,
  searchNearbyResponseToFeatureCollection,
  searchTextResponseToFeatureCollection,
  suggestResponseToFeatureCollection,
} from "./geoplaces-converter";
import { FeatureCollection } from "geojson";
import { emptyFeatureCollection } from "./utils";

describe("geocodeResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(geocodeResponseToFeatureCollection({ PricingBucket: "price" })).toMatchObject(emptyFeatureCollection());
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a location", () => {
    const input: GeocodeResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
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
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(geocodeResponseToFeatureCollection(input)).toEqual(output);
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
    expect(geocodeResponseToFeatureCollection(input)).toEqual(output);
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
    expect(geocodeResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});

describe("getPlaceResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(
      getPlaceResponseToFeatureCollection({ PricingBucket: "price", PlaceId: "", PlaceType: "Block", Title: "" }),
    ).toMatchObject(emptyFeatureCollection());
  });

  it("should return empty FeatureCollection if it is missing a location", () => {
    const input: GetPlaceResponse = {
      PricingBucket: "price",
      PlaceId: "abc",
      PlaceType: "Block",
      Title: "title",
    };

    expect(getPlaceResponseToFeatureCollection(input)).toMatchObject(emptyFeatureCollection());
  });

  it("should convert GetPlaceResponse to a FeatureCollection with a multiple features when flattenProperties is false", () => {
    const input: GetPlaceResponse = {
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
    expect(getPlaceResponseToFeatureCollection(input)).toEqual(output);
  });

  it("should convert GetPlaceResponse to a FeatureCollection with multiple features when flattenProperties is true", () => {
    const input: GetPlaceResponse = {
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
    expect(getPlaceResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});

describe("reverseGeocodeResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(reverseGeocodeResponseToFeatureCollection({ PricingBucket: "price" })).toMatchObject(
      emptyFeatureCollection(),
    );
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a location", () => {
    const input: ReverseGeocodeResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
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
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(reverseGeocodeResponseToFeatureCollection(input)).toEqual(output);
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
          id: "def",
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
    expect(reverseGeocodeResponseToFeatureCollection(input)).toEqual(output);
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
          id: "def",
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
    expect(reverseGeocodeResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});

describe("searchNearbyResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(searchNearbyResponseToFeatureCollection({ PricingBucket: "price" })).toMatchObject(emptyFeatureCollection());
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a location", () => {
    const input: SearchNearbyResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
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
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(searchNearbyResponseToFeatureCollection(input)).toEqual(output);
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
          id: "def",
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
    expect(reverseGeocodeResponseToFeatureCollection(input)).toEqual(output);
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
          id: "def",
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
    expect(searchNearbyResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});

describe("searchTextResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(searchTextResponseToFeatureCollection({ PricingBucket: "price" })).toMatchObject(emptyFeatureCollection());
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a location", () => {
    const input: SearchTextResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          PlaceId: "abc",
          PlaceType: "Block",
          Title: "title",
          Position: [1, 2],
        },
        {
          PlaceId: "def",
          PlaceType: "Block",
          Title: "title2",
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
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(searchTextResponseToFeatureCollection(input)).toEqual(output);
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
    expect(searchTextResponseToFeatureCollection(input)).toEqual(output);
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
    expect(searchTextResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});
describe("suggestResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection when no coordinate can be found in input.", () => {
    expect(suggestResponseToFeatureCollection({ PricingBucket: "price" })).toMatchObject(emptyFeatureCollection());
  });

  it("should skip a feature in the converted FeatureCollection if it is missing a location", () => {
    const input: SuggestResponse = {
      PricingBucket: "price",
      ResultItems: [
        {
          Title: "title1",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "abc",
            PlaceType: "Block",
            Position: [1, 2],
          },
        },
        {
          Title: "title2",
          SuggestResultItemType: "Place",
          Place: {
            PlaceId: "def",
            PlaceType: "Block",
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
            Title: "title1",
            SuggestResultItemType: "Place",
            Place: {
              PlaceType: "Block",
            },
          },
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
        },
      ],
    };
    expect(suggestResponseToFeatureCollection(input)).toEqual(output);
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
    expect(suggestResponseToFeatureCollection(input)).toEqual(output);
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
    expect(suggestResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(output);
  });
});
