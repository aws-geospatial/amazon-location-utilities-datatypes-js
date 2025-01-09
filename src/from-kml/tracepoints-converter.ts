// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fastXmlParser from "fast-xml-parser";

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
 *    - Coordinates are listed as a single string, separated by whitespace.
 * 2. Multiple Point format:
 *
 *    - Contains a <Document> element with multiple <Placemark> elements.
 *    - Each <Placemark> has a <Point> element with a <coordinates> child.
 *    - Each <coordinates> element contains a single point.
 *
 * Coordinate format in both cases:
 *
 * - Each coordinate is represented as: longitude,latitude,altitude
 * - Example: 8.64965,50.20365,0.0
 *
 * Notes:
 *
 * - Altitude is ignored during parsing as it's not included in SnapToRoads API requests.
 * - This function does not process KML timestamp or speed data.
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
 *     "Position": [12.419255, 41.899689],
 *     "Speed": 36,
 *     "Timestamp": "2013-07-15T10:24:52Z"
 *   },
 *   {
 *     "Position": [12.420505, 41.900891],
 *     "Speed": 36,
 *     "Timestamp": "2013-07-15T10:24:52Z"
 *   }
 * ]
 * ```
 */
export function kmlStringToRoadSnapTracePointList(kmlString: string) {
  const xmlParser = new fastXmlParser.XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const result = xmlParser.parse(kmlString);
  const placemarks = Array.isArray(result.kml.Document.Placemark)
    ? result.kml.Document.Placemark
    : [result.kml.Document.Placemark];

  return placemarks.flatMap((placemark) => {
    if (placemark.Point) {
      const [lon, lat] = placemark.Point.coordinates.split(",").map(Number);
      return [
        {
          Position: [parseFloat(lon), parseFloat(lat)],
        },
      ];
    } else if (placemark.LineString) {
      const coordinates = placemark.LineString.coordinates.trim().split(/\s+/);
      return coordinates.map((coord) => {
        const [lon, lat] = coord.split(",").map(Number);
        return {
          Position: [parseFloat(lon), parseFloat(lat)],
        };
      });
    } else {
      console.log("Invalid input: unrecognized placemark format'");
    }
  });
}
