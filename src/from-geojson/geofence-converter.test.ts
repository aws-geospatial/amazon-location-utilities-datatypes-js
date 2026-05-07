import { featureCollectionToGeofence } from "./geofence-converter";
import { FeatureCollection, Polygon } from "geojson";

describe("featureCollectionToGeofence", () => {
  const CreateTime = new Date();
  const UpdateTime = new Date();
  const polygon = [
    [
      [1, 2],
      [1, 3],
      [2, 3],
      [1, 2],
    ],
  ];
  it("should convert both polygon and circular geofences, and skip empty ones", () => {
    expect(
      featureCollectionToGeofence({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "polygon-fence",
            properties: {
              Status: "ACTIVE",
              CreateTime,
              UpdateTime,
            },
            geometry: {
              type: "Polygon",
              coordinates: polygon,
            },
          },
          {
            type: "Feature",
            id: "circular-fence",
            properties: {
              Status: "ACTIVE",
              CreateTime,
              UpdateTime,
              center: [0, 0],
              radius: 30,
            },
            geometry: {
              type: "Polygon",
              coordinates: [[[1, 1]]],
            },
          },
          {
            type: "Feature",
            id: "null-1",
            properties: {},
            geometry: null,
          },
          {
            type: "Feature",
            id: "null-2",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: [1, 1],
            },
          },
          {
            type: "Feature",
            id: "null-3",
            properties: {},
            geometry: {
              type: "Polygon",
              coordinates: null,
            },
          },
        ],
      } as FeatureCollection<Polygon>),
    ).toEqual([
      {
        GeofenceId: "polygon-fence",
        Geometry: {
          Polygon: polygon,
        },
      },
      {
        GeofenceId: "circular-fence",
        Geometry: {
          Circle: {
            Center: [0, 0],
            Radius: 30,
          },
        },
      },
    ]);
  });

  it("should auto-generate UUID for features without id", () => {
    const result = featureCollectionToGeofence({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: polygon,
          },
        },
      ],
    } as FeatureCollection<Polygon>);

    expect(result).toHaveLength(1);
    expect(result[0].Geometry.Polygon).toEqual(polygon);
    // Verify GeofenceId is a valid UUID format
    expect(result[0].GeofenceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });
});
