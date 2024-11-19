// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { decode } from "@here/flexpolyline";
import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * It converts a Flexible Polyline string to an array of RoadSnapTracePoint, so the result can be used to assemble the
 * request to SnapToRoads API.
 *
 * @example Converting a Flexible Polyline string
 *
 * Input:
 *
 * "FP:BFoz5xJ67i1B"
 *
 * Output:
 *
 * ```json
 * [
 *   { "Position": [-122.4194155, 37.77493] },
 *   { "Position": [-122.4201567, 37.77503] },
 *   { "Position": [-122.4209878, 37.77522] },
 *   { "Position": [-122.4218390, 37.77540] }
 * ]
 * ```
 */
export function flexiblePolylineStringToRoadSnapTracePointList(fpString: string) {
  if (fpString.startsWith("FP:")) {
    const encodedString = fpString.slice(3);
    const decodedString = decode(encodedString);

    if (decodedString.polyline) {
      return decodedString.polyline.map((coordinates) => convertCoordinatesToTracepoint(coordinates));
    }
  } else {
    console.log("Invalid input: Flexible polyline string should start with 'FP:'");
  }
}

function convertCoordinatesToTracepoint(coordinates): RoadSnapTracePoint {
  const longitude = Math.round(coordinates[1] * Math.pow(10, 6)) / Math.pow(10, 6);
  const latitude = Math.round(coordinates[0] * Math.pow(10, 6)) / Math.pow(10, 6);

  return {
    Position: [longitude, latitude],
  };
}
