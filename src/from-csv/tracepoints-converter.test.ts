import { csvStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("csvToRoadSnapTracePointList", () => {
  it("should convert csv string with headers to RoadSnapTracePointList (speed_kmh)", () => {
    const csvString = `latitude,longitude,speed_kmh,timestamp,heading
      53.3737131,-1.4704939,12.5,2024-11-15T10:30:00Z,45
      53.3742428,-1.4677477,15.8,2024-11-15T10:31:30Z,78`;
    expect(csvStringToRoadSnapTracePointList(csvString)).toEqual([
      {
        Position: [-1.4704939, 53.3737131],
        Speed: 12.5,
        Timestamp: "2024-11-15T10:30:00Z",
        Heading: 45,
      },
      {
        Position: [-1.4677477, 53.3742428],
        Speed: 15.8,
        Timestamp: "2024-11-15T10:31:30Z",
        Heading: 78,
      },
    ]);
  });

  it("should handle custom column mapping", () => {
    const csvString = `y,x,velocity,time,direction
      53.3737131,-1.4704939,12.5,2024-11-15T10:30:00Z,45
      53.3742428,-1.4677477,15.8,2024-11-15T10:31:30Z,78`;

    const result = csvStringToRoadSnapTracePointList(csvString, {
      columnMapping: {
        latitude: "y",
        longitude: "x",
        speed_kmh: "velocity",
        timestamp: "time",
        heading: "direction",
      },
    });

    expect(result).toEqual([
      {
        Position: [-1.4704939, 53.3737131],
        Speed: 12.5,
        Timestamp: "2024-11-15T10:30:00Z",
        Heading: 45,
      },
      {
        Position: [-1.4677477, 53.3742428],
        Speed: 15.8,
        Timestamp: "2024-11-15T10:31:30Z",
        Heading: 78,
      },
    ]);
  });

  it("should handle speed in m/s", () => {
    const csvString = `latitude,longitude,speed_mps,timestamp,heading
      53.3737131,-1.4704939,3.47222,2024-11-15T10:30:00Z,45
      53.3742428,-1.4677477,4.38889,2024-11-15T10:31:30Z,78`;

    const result = csvStringToRoadSnapTracePointList(csvString);

    expect(result).toEqual([
      {
        Position: [-1.4704939, 53.3737131],
        Speed: 12.499992,
        Timestamp: "2024-11-15T10:30:00Z",
        Heading: 45,
      },
      {
        Position: [-1.4677477, 53.3742428],
        Speed: 15.800004,
        Timestamp: "2024-11-15T10:31:30Z",
        Heading: 78,
      },
    ]);
  });

  it("should handle speed in mph", () => {
    const csvString = `latitude,longitude,speed_mph,timestamp,heading
      53.3737131,-1.4704939,7.76713,2024-11-15T10:30:00Z,45
      53.3742428,-1.4677477,9.81747,2024-11-15T10:31:30Z,78`;

    const result = csvStringToRoadSnapTracePointList(csvString);

    expect(result).toEqual([
      {
        Position: [-1.4704939, 53.3737131],
        Speed: 12.4999529942,
        Timestamp: "2024-11-15T10:30:00Z",
        Heading: 45,
      },
      {
        Position: [-1.4677477, 53.3742428],
        Speed: 15.7996471698,
        Timestamp: "2024-11-15T10:31:30Z",
        Heading: 78,
      },
    ]);
  });
});
