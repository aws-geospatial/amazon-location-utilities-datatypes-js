// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as tj from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";
import { featureCollectionToRoadSnapTracePointList } from "../from-geojson";
import { convertToPointFeatureCollection, isValidXMLDocument } from "../utils";

/**
 * It converts a KML string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to
 * SnapToRoads API.
 *
 * Expected KML structures:
 *
 * 1. LineString format:
 *
 *    - Contains a <Document> element with one or more <Placemark> elements.
 *    - Each <Placemark> has a <LineString> element with a <coordinates> child.
 *    - Coordinates are listed as a single string.
 *    - Each point is "longitude,latitude,altitude" with points separated by whitespace.
 *    - Each <Placemark> can have a <TimeStamp> element with a <when> child for timestamp.
 * 2. Multiple Point format:
 *
 *    - Contains a <Document> element with multiple <Placemark> elements.
 *    - Each <Placemark> has a <Point> element with a <coordinates> child.
 *    - Each <coordinates> element contains a single point.
 *    - Each <Placemark> can have a <TimeStamp> element with a <when> child for timestamp.
 *
 * Coordinate format in both cases:
 *
 * - Each coordinate is represented as: longitude,latitude,altitude
 * - Example: 8.64965,50.20365,0.0
 *
 * Notes:
 *
 * - Coordinates are in longitude,latitude,altitude format.
 * - Altitude is ignored during parsing as it's not included in SnapToRoads API requests.
 * - Timestamps can be specified using the TimeStamp element with ISO 8601 format
 * - Speed data is not processed.
 * - Other KML elements like <name>, <description>, <extrude>, <tessellate>, and <altitudeMode> are ignored.
 *
 * @example Converting a KML string
 *
 * Input:
 *
 * ```xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <kml xmlns="http://www.opengis.net/kml/2.2">
 *   <Document>
 *     <name>San Francisco Path</name>
 *     <description>A simple path with two points in San Francisco</description>
 *     <Placemark>
 *       <name>SF Downtown Route</name>
 *       <description>A short route in downtown San Francisco</description>
 *       <TimeStamp><when>2024-11-19T14:45:00Z</when></TimeStamp>
 *       <LineString>
 *         <extrude>1</extrude>
 *         <tessellate>1</tessellate>
 *         <altitudeMode>relativeToGround</altitudeMode>
 *         <coordinates>
 *           -122.419424,37.774930,0
 *           -122.420157,37.775032,0
 *         </coordinates>
 *       </LineString>
 *     </Placemark>
 *   </Document>
 * </kml>
 * ```
 *
 * Output:
 *
 * ```json
 * [
 *   {
 *     "Position": [-122.419424, 37.774930],
 *     "Timestamp": "2024-11-19T14:45:00Z"
 *   },
 *   {
 *     "Position": [-122.420157, 37.775032],
 *     "Timestamp": "2024-11-19T14:45:00Z"
 *   }
 * ]
 * ```
 */

export function kmlStringToRoadSnapTracePointList(content: string): RoadSnapTracePoint[] {
  const parser = new DOMParser();
  const kmlDoc = parser.parseFromString(content, "text/xml");

  if (!isValidXMLDocument(kmlDoc)) {
    throw new Error("Invalid XML document");
  }

  // Convert to GeoJSON
  const geoJson = tj.kml(kmlDoc);

  const pointFeatures = geoJson.features.map((feature) =>
    convertToPointFeatureCollection(feature, (properties) => ({
      ...properties,
      ...(feature.properties.timestamp && {
        timestamp_msec: new Date(feature.properties.timestamp).getTime(),
      }),
    })),
  );

  const allFeatures = pointFeatures.flatMap((fc) => fc.features);

  return featureCollectionToRoadSnapTracePointList({
    type: "FeatureCollection",
    features: allFeatures,
  });
}
