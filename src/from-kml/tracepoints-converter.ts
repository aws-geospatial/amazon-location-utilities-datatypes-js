// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as tj from "@tmcw/togeojson";
import { JSDOM } from "jsdom";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";
import { Feature, FeatureCollection, Point } from "geojson";
import { featureCollectionToRoadSnapTracePointList } from "../from-geojson";

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
  const dom = new JSDOM(content, {
    contentType: "text/xml",
  });

  // Convert KML to GeoJSON
  const geoJson = tj.kml(dom.window.document);
  console.log("First feature properties:", JSON.stringify(geoJson.features[0].properties, null, 2));
  const features: Feature<Point>[] = geoJson.features.flatMap((feature) => {
    console.log("Feature properties:", JSON.stringify(feature.properties, null, 2));
    if (feature.geometry.type === "Point") {
      const [lon, lat] = (feature.geometry as Point).coordinates;
      return [
        {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [lon, lat],
          },
          properties: {
            ...(feature.properties.timestamp && {
              timestamp_msec: new Date(feature.properties.timestamp).getTime(),
            }),
          },
        },
      ];
    } else if (feature.geometry.type === "LineString") {
      return feature.geometry.coordinates.map((coord) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [coord[0], coord[1]], // Take only longitude and latitude
        },
        properties: {
          ...(feature.properties.timestamp && {
            timestamp_msec: new Date(feature.properties.timestamp).getTime(),
          }),
        },
      }));
    }
    return [];
  });

  const convertedGeoJson: FeatureCollection<Point, any> = {
    type: "FeatureCollection",
    features,
  };

  return featureCollectionToRoadSnapTracePointList(convertedGeoJson);
}

function processProperties(properties: any): any {
  const result: any = {};

  // Process timestamp
  if (properties.when) {
    result.timestamp_msec = new Date(properties.timeStamp).getTime();
  }

  // Process speed
  // Assuming speed is in m/s in the KML, convert to km/h for consistency
  if (properties.speed) {
    result.speed_mps = parseFloat(properties.speed);
  }

  return result;
}
