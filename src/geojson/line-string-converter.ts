// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Position, LineString } from "geojson";
import { Leg } from "@aws-sdk/client-location";

/**
 * Convert an array of Amazon Location Legs to a GeoJSON LineString. It will assume the legs are connected and
 * get StartPosition and EndPosition from the first leg then connect only the EndPosition of the following legs.
 *
 * @param legs an array of Legs returned by AmazonLocation, such as CalculateRouteResponse.Legs
 * @param skipErrors skip a Leg if it is missing required position. An Error will be thrown by default
 * @returns A GeoJSON LineString representing the legs connected together.
 *
 * @example
 * const response = await locationClient.send(command); // command is a CalculateRouteCommand
 * const route = convertLegsToLineString(response?.Legs); // returns a LineString representing the calculated route.
 */
export function convertLegsToLineString(legs?: Leg[], skipErrors?: boolean): LineString | undefined {
  if (legs) {
    const throwOrSkip = (message: string, positions: Position[]): Position[] => {
      if (skipErrors) {
        return positions;
      } else {
        throw new Error(message);
      }
    };

    const coordinates = legs.reduce((positions: Position[], leg, index): Position[] => {
      const legGeometry = leg?.Geometry?.LineString;
      if (positions.length == 0) {
        if (legGeometry) {
          // Use leg geometry if possible
          return [...legGeometry];
        } else if (leg.StartPosition && leg.EndPosition) {
          // Fallback to a line between start position and end position
          return [leg.StartPosition, leg.EndPosition];
        } else {
          // No valid information in this leg
          return throwOrSkip(`Leg ${index} is missing StartPosition or EndPosition.`, positions);
        }
      } else {
        if (legGeometry) {
          // Use leg geometry if possible
          return [...positions, ...legGeometry.splice(1)];
        } else if (leg.EndPosition) {
          // Fallback to append the end position of the leg
          return [...positions, leg.EndPosition];
        } else {
          // No valid information in this leg
          return throwOrSkip(`Leg ${index} is missing EndPosition.`, positions);
        }
      }
    }, [] as Position[]);

    return {
      type: "LineString",
      coordinates,
    };
  }
}
