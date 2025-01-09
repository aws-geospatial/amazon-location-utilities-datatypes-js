import { nmeaStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("nmeaStringToRoadSnapTracePointList", () => {
  it("should convert kml string to RoadSnapTracePointList", () => {
    const nmeaString = `$GPGGA,123519,4916.45,N,12311.12,W,1,08,0.9,545.4,M,46.9,M,,*47
      $GPRMC,225446,A,3751.65,S,14507.36,E,022.4,084.4,191194,003.1,W*6A`;

    expect(nmeaStringToRoadSnapTracePointList(nmeaString)).toEqual([
      {
        Position: [-123.18533333333333, 49.274166666666666],
      },
      {
        Position: [145.12266666666667, -37.86083333333333],
        Speed: 41.4848,
        Timestamp: "1994-11-19T22:54:46.000Z",
      },
    ]);
  });
});
