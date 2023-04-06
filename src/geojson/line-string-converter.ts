// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position, LineString } from "geojson";
import { Leg } from "@aws-sdk/client-location";

/**
 * Convert an array of Amazon Location Legs to a GeoJSON LineString. It will assume the legs are connected and
 * get StartPosition and EndPosition from the first leg then connect only the EndPosition of the following legs.
 *
 * Note: <b>IncludeLegGeometry</b> should be set to true when calling CalculateRoute or Geometry will not be present in
 * the Legs response and this will throw an exception.
 *
 * @param legs an array of Legs returned by AmazonLocation, such as CalculateRouteResponse.Legs
 * @returns A GeoJSON LineString representing the legs connected together.
 *
 * @example
 * const response = await locationClient.send(command); // command is a CalculateRouteCommand
 * const route = convertLegsToLineString(response?.Legs); // returns a LineString representing the calculated route.
 */
export function convertLegsToLineString(legs?: Leg[]): LineString | undefined {
  if (legs) {
    const coordinates = legs.reduce((positions: Position[], leg): Position[] => {
      const legGeometry = leg?.Geometry?.LineString;
      if (!legGeometry) {
        throw new Error(
          "leg.Geometry is undefined, please make sure CalculateRoute is called with IncludeLegGeometry: true",
        );
      }

      return [...positions, ...legGeometry.splice(positions.length == 0 ? 0 : 1)];
    }, [] as Position[]);

    return {
      type: "LineString",
      coordinates,
    };
  }
}
