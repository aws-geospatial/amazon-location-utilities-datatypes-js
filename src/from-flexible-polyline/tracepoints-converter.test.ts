import { flexiblePolylineStringToRoadSnapTracePointList } from "./tracepoints-converter";
import { encodeFromLngLatArray } from "@aws/polyline";

describe("flexiblePolylineToRoadSnapTracePointList", () => {
  it("should convert flexible polyline string with FP prefix to RoadSnapTracePointList", () => {
    const input = [
      [8.69821, 50.10228],
      [8.69567, 50.10201],
      [8.6915, 50.10063],
      [8.68752, 50.09878],
    ];
    const encoded = encodeFromLngLatArray(input);
    expect(flexiblePolylineStringToRoadSnapTracePointList(`FP:${encoded}`)).toEqual(
      input.map((coordinates) => ({ Position: coordinates })),
    );
  });
  it("should convert flexible polyline string without FP prefix to RoadSnapTracePointList", () => {
    const input = [
      [8.69821, 50.10228],
      [8.69567, 50.10201],
      [8.6915, 50.10063],
      [8.68752, 50.09878],
    ];
    const encoded = encodeFromLngLatArray(input);
    expect(flexiblePolylineStringToRoadSnapTracePointList(`${encoded}`)).toEqual(
      input.map((coordinates) => ({ Position: coordinates })),
    );
  });
});
