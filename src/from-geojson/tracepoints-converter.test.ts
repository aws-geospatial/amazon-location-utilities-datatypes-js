import { featureCollectionToRoadSnapTracePointList } from "./tracepoints-converter";

describe("featureCollectionToRoadSnapTracePointList", () => {
  it("should convert geojson to RoadSnapTracePointList", () => {
    expect(
      featureCollectionToRoadSnapTracePointList({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314007512,
              accuracy: 18.224,
              altitude: 213.361083984375,
              heading: 177.3,
              speed_mps: 0.65,
            },
            geometry: {
              type: "Point",
              coordinates: [8.53379056, 50.16352417],
            },
          },
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314022526,
              accuracy: 25.728,
              altitude: 269.29180908203125,
              heading: 69.4,
              speed_mps: 5.45,
            },
            geometry: {
              type: "Point",
              coordinates: [8.5349375, 50.16338086],
            },
          },
        ],
      }),
    ).toEqual([
      {
        Position: [8.53379056, 50.16352417],
        Timestamp: "2019-08-20T15:13:27.512Z",
        // Conversion formula: km/h = (m/s) * (3600 sec/hour) * (1 km/1000 m)
        // 0.65 m/s = (0.65 * 3600 / 1000) = 2.34 km/h
        Speed: 2.3400000000000003,
        Heading: 177.3,
      },
      {
        Position: [8.5349375, 50.16338086],
        Timestamp: "2019-08-20T15:13:42.526Z",
        // 5.45 m/s = (5.45 * 3600 / 1000) = 19.62 km/h
        Speed: 19.62,
        Heading: 69.4,
      },
    ]);
  });
  it("empty coordinates should throw an error", () => {
    expect(() =>
      featureCollectionToRoadSnapTracePointList({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314007512,
              accuracy: 18.224,
              altitude: 213.361083984375,
              heading: 177.3,
              speed_mps: 0.65,
            },
            geometry: {
              type: "Point",
              coordinates: [],
            },
          },
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314022526,
              accuracy: 25.728,
              altitude: 269.29180908203125,
              heading: 69.4,
              speed_mps: 5.45,
            },
            geometry: {
              type: "Point",
              coordinates: [8.5349375, 50.16338086],
            },
          },
        ],
      }),
    ).toThrow("Invalid feature: coordinates must have at least 2 elements");
  });
  it("invalid number of coordinates should throw an error", () => {
    expect(() =>
      featureCollectionToRoadSnapTracePointList({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314007512,
              accuracy: 18.224,
              altitude: 213.361083984375,
              heading: 177.3,
              speed_mps: 0.65,
            },
            geometry: {
              type: "Point",
              coordinates: [8.53379056],
            },
          },
          {
            type: "Feature",
            properties: {
              provider: "gps",
              timestamp_msec: 1566314022526,
              accuracy: 25.728,
              altitude: 269.29180908203125,
              heading: 69.4,
              speed_mps: 5.45,
            },
            geometry: {
              type: "Point",
              coordinates: [8.5349375, 50.16338086],
            },
          },
        ],
      }),
    ).toThrow("Invalid feature: coordinates must have at least 2 elements");
  });
});
