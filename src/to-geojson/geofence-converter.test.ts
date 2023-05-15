// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { geofencesToFeatureCollection } from "./geofence-converter";
import { convertGeometryToFeature, emptyFeatureCollection, toFeatureCollection } from "./utils";
import { GetGeofenceResponse, ListGeofencesResponse } from "@aws-sdk/client-location";
import { Feature, Polygon } from "geojson";

describe("geofencesToFeatureCollection", () => {
  const CreateTime = new Date();
  const UpdateTime = new Date();
  const polygonGeofence = {
    GeofenceId: "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
    Geometry: {
      Polygon: [
        [
          [1, 2],
          [1, 3],
          [2, 3],
          [1, 2],
        ],
      ],
    },
    Status: "ACTIVE",
    CreateTime,
    UpdateTime,
  } as GetGeofenceResponse;
  const circularGeofence = {
    GeofenceId: "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
    Geometry: {
      Circle: {
        Center: [0, 0],
        Radius: 30,
      },
    },
    Status: "ACTIVE",
    CreateTime,
    UpdateTime,
  } as GetGeofenceResponse;

  const expectedPolygonFeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
        properties: {
          Status: "ACTIVE",
          CreateTime,
          UpdateTime,
        },
        geometry: convertGeometryToFeature(polygonGeofence.Geometry).geometry,
      },
    ],
  };

  const expectedCircularFeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        id: "0C1E4574-4A12-4219-A99D-AE4AEE6DE1AC",
        properties: {
          Status: "ACTIVE",
          CreateTime,
          UpdateTime,
          center: [0, 0],
          radius: 30,
        },
        geometry: convertGeometryToFeature(circularGeofence.Geometry).geometry,
      },
    ],
  };

  it("Should handle null values gracefully", () => {
    expect(geofencesToFeatureCollection({} as GetGeofenceResponse)).toEqual(emptyFeatureCollection());
    expect(
      geofencesToFeatureCollection({
        Geometry: {},
      } as GetGeofenceResponse),
    ).toEqual(emptyFeatureCollection());
    expect(
      geofencesToFeatureCollection({
        Entries: [],
      } as ListGeofencesResponse),
    ).toEqual(emptyFeatureCollection());
    expect(
      geofencesToFeatureCollection({
        Entries: [{}],
      } as ListGeofencesResponse),
    ).toEqual(emptyFeatureCollection());
    expect(
      geofencesToFeatureCollection({
        Entries: [
          {
            Geometry: {},
          },
        ],
      } as ListGeofencesResponse),
    ).toEqual(emptyFeatureCollection());
  });

  it("Should convert single polygon geofence to FeatureCollection", () => {
    expect(geofencesToFeatureCollection(polygonGeofence)).toEqual(expectedPolygonFeatureCollection);
  });

  it("Should convert single circular geofence to FeatureCollection", () => {
    expect(geofencesToFeatureCollection(circularGeofence)).toEqual(expectedCircularFeatureCollection);
  });

  it("Should convert multiple geofences to FeatureCollection, and skip empty geofences", () => {
    expect(
      geofencesToFeatureCollection({
        Entries: [polygonGeofence, circularGeofence, null, {}],
      } as ListGeofencesResponse),
    ).toEqual(
      toFeatureCollection([
        expectedPolygonFeatureCollection.features[0] as Feature<Polygon>,
        expectedCircularFeatureCollection.features[0] as Feature<Polygon>,
      ]),
    );
  });
});
