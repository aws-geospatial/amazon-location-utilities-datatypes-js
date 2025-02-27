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
        Speed: 2.3400000000000003,
        Heading: 177.3,
      },
      {
        Position: [8.5349375, 50.16338086],
        Timestamp: "2019-08-20T15:13:42.526Z",
        Speed: 19.62,
        Heading: 69.4,
      },
    ]);
  });
});
