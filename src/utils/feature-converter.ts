import { Feature, FeatureCollection, Point, Position, LineString } from "geojson";
import { TracePointProperties } from "../from-geojson";

/**
 * Converts GeoJSON Point or LineString features to a FeatureCollection of Points.
 *
 * - Point features are converted directly to a Point feature (excluding altitude if present)
 * - LineString features are converted to multiple Point features (one for each coordinate, excluding altitude if present)
 *
 * Properties for each Point feature are generated using the provided callback function
 */
export function convertToPointFeatureCollection(
  feature: Feature,
  getProperties: (index?: number) => TracePointProperties,
): FeatureCollection<Point, TracePointProperties> {
  let features: Feature<Point, TracePointProperties>[] = [];

  if (feature.geometry.type === "Point") {
    features = [
      {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: (feature.geometry as Point).coordinates.slice(0, 2),
        },
        properties: getProperties(),
      },
    ];
  } else if (feature.geometry.type === "LineString") {
    const lineString = feature.geometry as LineString;
    features = lineString.coordinates.map((coord: Position, index: number) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coord.slice(0, 2),
      },
      properties: getProperties(index),
    }));
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
