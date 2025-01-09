// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as fastXmlParser from "fast-xml-parser";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a GPX string with trkType to an array of RoadSnapTracePoint, so the result can be used to assemble the
 * request to SnapToRoads API.
 *
 * Each trace point in the GPX can include the following information:
 *
 * - Coordinates (always present, used): Latitude and longitude in WGS84 degrees. Example: <trkpt lat="48.0289225"
 *   lon="-4.298227">
 * - Timestamp (optional, used): In UTC time zone. Example: <time>2013-07-15T10:24:52Z</time>
 * - Speed (optional, used): In meters per second, within the extensions element. Example:
 *   <extensions><speed>21.9432334</speed></extensions>
 * - Elevation (optional, ignored): In meters above the WGS84 ellipsoid. Example: <ele>102.5999</ele>
 * - HDOP (optional, ignored): Horizontal Dilution of Precision. Example: <hdop>15.0</hdop>
 *
 * Note: Elevation and HDOP, if present, are ignored during parsing as they are not included in the SnapToRoads API
 * request.
 *
 * @example Converting a GPX string
 *
 * Input:
 *
 * ```xml
 * <?xml version="1.0" encoding="UTF-8"?>
 * <gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gte="http://www.gpstrackeditor.com/xmlschemas/General/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" targetNamespace="http://www.topografix.com/GPX/1/1" elementFormDefault="qualified" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
 *   <metadata>
 *     <name>sample_san_francisco.gpx</name>
 *     <desc>Sample data</desc>
 *   </metadata>
 *   <trk>
 *     <name>San Francisco</name>
 *     <trkseg>
 *       <trkpt lat="37.774930" lon="-122.419424">
 *         <extensions>
 *           <speed>5.08</speed>
 *         </extensions>
 *         <time>2024-11-19T14:45:00Z</time>
 *       </trkpt>
 *       <trkpt lat="37.775032" lon="-122.420157">
 *         <extensions>
 *           <speed>6.28</speed>
 *         </extensions>
 *         <time>2024-11-19T14:46:30Z</time>
 *       </trkpt>
 *     </trkseg>
 *   </trk>
 * </gpx>
 * ```
 *
 * Output:
 *
 * ```json
 * [
 *   {
 *     "Position": [-122.419424, 37.77493],
 *     "Speed": 18.29,
 *     "Timestamp": "2024-11-19T14:45:00Z"
 *   },
 *   {
 *     "Position": [-122.420157, 37.775032],
 *     "Speed": 22.61,
 *     "Timestamp": "2024-11-19T14:46:30Z"
 *   }
 * ]
 * ```
 */
export function gpxToRoadSnapTracePointList(content) {
  const options = {
    attributeNamePrefix: "",
    attrNodeName: "attr",
    textNodeName: "#text",
    ignoreAttributes: false,
    ignoreNamespace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    parseTrueNumberOnly: false,
    numParseOptions: {
      hex: true,
      leadingZeros: true,
      decimalSeparator: ".",
      parseType: "number",
    },
    arrayMode: "strict",
  };
  const xmlParser = new fastXmlParser.XMLParser(options);
  const jsonObj = xmlParser.parse(content, options);
  const trackPoints = jsonObj.gpx.trk.trkseg.trkpt;

  return trackPoints.map((trackPoint) => convertGPXToTracepoint(trackPoint));
}

function convertGPXToTracepoint(trackPoint): RoadSnapTracePoint | undefined {
  if (trackPoint) {
    const longitude = parseFloat(trackPoint.lon);
    const latitude = parseFloat(trackPoint.lat);

    const roadSnapTracePoint = { Position: [longitude, latitude] };
    if (trackPoint.extensions.speed) {
      const speedKMPH = trackPoint.extensions.speed * 3.6;
      roadSnapTracePoint["Speed"] = speedKMPH;
    }
    if (trackPoint.time) {
      roadSnapTracePoint["Timestamp"] = trackPoint.time;
    }
    return roadSnapTracePoint;
  }
}
