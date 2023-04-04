import { LineString } from "geojson";
import { Leg } from "@aws-sdk/client-location";

/**
 * Convert an array of Amazon Location Legs to a GeoJSON LineString. It will assume the legs are connected and
 * get StartPosition and EndPosition from the first leg then connect only the EndPosition of the following legs.
 *
 * @param legs an array of Legs returned by AmazonLocation, such as CalculateRouteResponse.Legs
 * @param skipErrors skip a Leg if it is missing required position. An Error will be thrown by default
 * @returns A GeoJSON LineString representing the legs connected together.
 */
export function convertLegsToLineString(legs?: Leg[], skipErrors?: boolean): LineString | undefined {
  if (legs == undefined) {
    return undefined;
  }

  type Position = number[];

  const throwOrSkip = (message: string, positions: Position[]): Position[] => {
    if (skipErrors) {
      return positions;
    } else {
      throw new Error(message);
    }
  };

  const coordinates = legs.reduce((positions: Position[], leg, index): Position[] => {
    if (positions.length === 0) {
      if (leg.StartPosition == undefined || leg.EndPosition == undefined) {
        return throwOrSkip(`Leg ${index} is missing StartPosition or EndPosition.`, positions);
      } else {
        return [leg.StartPosition, leg.EndPosition];
      }
    } else {
      if (leg.EndPosition == undefined) {
        return throwOrSkip(`Leg ${index} is missing EndPosition.`, positions);
      } else {
        return [...positions, leg.EndPosition];
      }
    }
  }, [] as Position[]);

  return {
    type: "LineString",
    coordinates,
  };
}
