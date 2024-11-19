// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fastXmlParser from "fast-xml-parser";

/**
 * It converts a KML string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to
 * SnapToRoads API.
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
          Position: roundCoordinates(lon, lat),
        },
      ];
    } else if (placemark.LineString) {
      const coordinates = placemark.LineString.coordinates.trim().split(/\s+/);
      return coordinates.map((coord) => {
        const [lon, lat] = coord.split(",").map(Number);
        return {
          Position: roundCoordinates(lon, lat),
        };
      });
    } else {
      console.log("Invalid input: unrecognized placemark format'");
    }
  });
}

function roundCoordinates(lon, lat): [number, number] {
  return [
    Math.round(parseFloat(lon) * Math.pow(10, 6)) / Math.pow(10, 6),
    Math.round(parseFloat(lat) * Math.pow(10, 6)) / Math.pow(10, 6),
  ];
}
