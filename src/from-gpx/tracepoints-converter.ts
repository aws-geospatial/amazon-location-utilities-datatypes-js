// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as tj from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import { featureCollectionToRoadSnapTracePointList } from "../from-geojson";
import { convertToPointFeatureCollection, isValidXMLDocument } from "../utils";

/**
 * It converts a GPX string containing tracks to an array of RoadSnapTracePoint, so the result can be used to assemble
 * the request to SnapToRoads API. See: https://en.wikipedia.org/wiki/GPS_Exchange_Format#Data_types.
 *
 * Each track point in the GPX can include the following information:
 *
 * - Coordinates (always present, used): Latitude and longitude in WGS84 degrees. Example: <trkpt lat="48.0289225"
 *   lon="-4.298227">
 * - Timestamp (optional, used): Any ISO 8601 formatted timestamp. Example: <time>2013-07-15T10:24:52Z</time>
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
  const parser = new DOMParser();
  const gpxDoc = parser.parseFromString(content, "text/xml");

  if (!isValidXMLDocument(gpxDoc)) {
    throw new Error("Invalid XML document");
  }

  // Convert to GeoJSON
  const geoJSON = tj.gpx(gpxDoc as Document);

  const trackPoints = gpxDoc.getElementsByTagName("trkpt");

  const pointFeatures = geoJSON.features.map((feature) =>
    convertToPointFeatureCollection(feature, (properties, index) => {
      if (index === undefined) return properties;

      const trkpt = trackPoints[index];
      const timeElement = trkpt.getElementsByTagName("time")[0];
      const speedElement = trkpt.getElementsByTagName("speed")[0];

      return {
        ...properties,
        ...(timeElement?.textContent && {
          timestamp_msec: new Date(timeElement.textContent).getTime(),
        }),
        ...(speedElement?.textContent && {
          speed_mps: parseFloat(speedElement.textContent),
        }),
      };
    }),
  );

  const allFeatures = pointFeatures.flatMap((fc) => fc.features);

  return featureCollectionToRoadSnapTracePointList({
    type: "FeatureCollection",
    features: allFeatures,
  });
}
