import { convertGeometryToFeature } from "./utils";
import { Circle, PlaceGeometry } from "@aws-sdk/client-location";
import distance from "@turf/distance";
import { Polygon } from "geojson";

describe("convertGeometry", () => {
  it("should convert object without any valid geometry type to undefined", () => {
    expect(convertGeometryToFeature(undefined)).toBeUndefined();
    expect(convertGeometryToFeature({ OtherField: "test" } as PlaceGeometry)).toBeUndefined();
    expect(convertGeometryToFeature({ Point: null })).toBeUndefined();
    expect(convertGeometryToFeature({ LineString: null })).toBeUndefined();
    expect(convertGeometryToFeature({ Polygon: null })).toBeUndefined();
    expect(convertGeometryToFeature({ Circle: null })).toBeUndefined();
  });
  it("should convert Point", () => {
    const point = [1, 2];
    const result = convertGeometryToFeature({
      Point: point,
    });
    expect(result).toBeDefined();
    expect(result).toEqual({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: point,
      },
    });
  });

  it("should convert LineString", () => {
    const lineString = [
      [1, 2],
      [3, 4],
    ];

    const result = convertGeometryToFeature({
      LineString: lineString,
    });
    expect(result).toBeDefined();
    expect(result).toEqual({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: lineString,
      },
    });
  });

  it("should convert Polygon", () => {
    const polygon = [
      [
        [1, 2],
        [3, 4],
        [1, 4],
        [1, 2],
      ],
    ];

    const result = convertGeometryToFeature({
      Polygon: polygon,
    });
    expect(result).toBeDefined();
    expect(result).toEqual({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: polygon,
      },
    });
  });

  it("should convert with properties", () => {
    const polygon = [
      [
        [1, 2],
        [3, 4],
        [1, 4],
        [1, 2],
      ],
    ];

    const properties = {
      key1: "value1",
      key2: "value2",
    };

    const result = convertGeometryToFeature(
      {
        Polygon: polygon,
      },
      properties,
    );
    expect(result).toBeDefined();
    expect(result).toEqual({
      type: "Feature",
      properties,
      geometry: {
        type: "Polygon",
        coordinates: polygon,
      },
    });
  });

  it("should convert Circle", () => {
    const circle: Circle = {
      Center: [0, 0],
      Radius: 30,
    };

    const result = convertGeometryToFeature({
      Circle: circle,
    });
    expect(result).toBeDefined();
    expect(result!.type).toBe("Feature");
    expect(result!.properties).toEqual({
      center: circle.Center,
      radius: circle.Radius,
    });
    const polygon = result!.geometry! as Polygon;
    expect(polygon.type).toBe("Polygon");
    polygon.coordinates[0].forEach((point) => {
      expect(
        Math.abs(
          distance(circle.Center, point, {
            units: "meters",
          }) - circle.Radius,
        ),
      ).toBeLessThan(0.01);
    });
  });

  it("should convert Circle with extra properties", () => {
    const circle: Circle = {
      Center: [0, 0],
      Radius: 30,
    };
    const properties = {
      key1: "value1",
      key2: "value2",
    };

    const result = convertGeometryToFeature(
      {
        Circle: circle,
      },
      properties,
    );
    expect(result).toBeDefined();
    expect(result!.type).toBe("Feature");
    expect(result!.properties).toEqual({
      center: circle.Center,
      radius: circle.Radius,
      key1: "value1",
      key2: "value2",
    });
    const polygon = result!.geometry! as Polygon;
    expect(polygon.type).toBe("Polygon");
    polygon.coordinates[0].forEach((point) => {
      expect(
        Math.abs(
          distance(circle.Center, point, {
            units: "meters",
          }) - circle.Radius,
        ),
      ).toBeLessThan(0.01);
    });
  });
});
