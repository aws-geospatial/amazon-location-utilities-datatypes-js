import { flexiblePolylineStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("flexiblePolylineToRoadSnapTracePointList", () => {
  it("should convert flexible polyline string to RoadSnapTracePointList", () => {
    expect(flexiblePolylineStringToRoadSnapTracePointList("FP:BFoz5xJ67i1B1B7PzIhaxL7Y")).toEqual([
      {
        Position: [8.69821, 50.10228],
      },
      {
        Position: [8.69567, 50.10201],
      },
      {
        Position: [8.6915, 50.10063],
      },
      {
        Position: [8.68752, 50.09878],
      },
    ]);
  });
});
