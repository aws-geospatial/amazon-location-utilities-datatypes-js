import { Feature, FeatureCollection, Point, Position, LineString } from "geojson";
import { TracePointProperties } from "../from-geojson";

type PropertyTransformer = (properties: Record<string, any>, index?: number) => TracePointProperties;

/**
 * Converts GeoJSON Point or LineString features to a FeatureCollection of Points.
 *
 * - Point features are converted directly to a Point feature (excluding altitude if present)
 * - LineString features are converted to multiple Point features (one for each coordinate, excluding altitude if present)
 * - Feature properties can be transformed using the provided callback function
 * - If no callback is provided, original properties are preserved (defaulting to {} if none exist)
 *
 * @example
 *
 * ```typescript
 * // Preserving original properties
 * convertToPointFeatureCollection(feature, (properties) => ({ ...properties }));
 *
 * // Transforming properties with index
 * convertToPointFeatureCollection(feature, (properties, index) => ({
 *   ...properties,
 *   pointNumber: index,
 * }));
 * ```
 */
export function convertToPointFeatureCollection(
  feature: Feature,
  getProperties: PropertyTransformer = (properties = {}) => properties,
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
        properties: getProperties(feature.properties),
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
      properties: getProperties(feature.properties, index),
    }));
  }

  return {
    type: "FeatureCollection",
    features,
  };
}
