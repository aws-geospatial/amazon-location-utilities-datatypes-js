import { csvStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("csvToRoadSnapTracePointList", () => {
  it("should convert csv string to RoadSnapTracePointList", () => {
    const csvString = `latitude,longitude,speed_kmh,timestamp,heading
      53.3737131,-1.4704939,12.5,2024-11-15T10:30:00Z,45
      53.3742428,-1.4677477,15.8,2024-11-15T10:31:30Z,78`;
    expect(csvStringToRoadSnapTracePointList(csvString)).toEqual([
      {
        Position: [-1.470494, 53.373713],
        Speed: 12.5,
        Timestamp: "2024-11-15T10:30:00Z",
        Heading: 45,
      },
      {
        Position: [-1.467748, 53.374243],
        Speed: 15.8,
        Timestamp: "2024-11-15T10:31:30Z",
        Heading: 78,
      },
    ]);
  });
});
