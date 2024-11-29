import { nmeaStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("nmeaStringToRoadSnapTracePointList", () => {
  it("should convert kml string to RoadSnapTracePointList", () => {
    const nmeaString = `$GPGGA,123519,4916.45,N,12311.12,W,1,08,0.9,545.4,M,46.9,M,,*47
      $GPRMC,225446,A,3751.65,S,14507.36,E,022.4,084.4,191194,003.1,W*6A`;

    expect(nmeaStringToRoadSnapTracePointList(nmeaString)).toEqual([
      {
        Position: [-17.185333, 49.274167],
      },
      {
        Position: [22.456, -37.860833],
        Speed: 41.48,
        Timestamp: "1994-11-19T22:54:46.000Z",
      },
    ]);
  });
});
