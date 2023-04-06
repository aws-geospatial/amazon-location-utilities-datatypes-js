// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Point } from "geojson";
import { Place } from "@aws-sdk/client-location";

/**
 * Any Amazon Location object representing a device position, such as ListDevicePositionsResponseEntry, DevicePosition, GetDevicePositionResponse
 */
export interface AnyDevicePosition {
  Position?: number[];
}

/**
 * Any Amazon Location object containing a place, such as SearchForPositionResult, SearchForTextResult, GetPlaceResponse
 */
export interface AnyPlaceContainer {
  Place?: Place;
}

/**
 * Wrap a raw Position into a GeoJSON Point.
 * @param position A single point geometry specifies a location for a Place using WGS 84 coordinates.
 * @returns a GeoJSON Point on that position, or undefined if the position parameter is undefined.
 */
function wrapCoordinatesToPoint(coordinates?: number[]): Point | undefined {
  return (
    coordinates && {
      type: "Point",
      coordinates,
    }
  );
}

/**
 * Convert a Place from Amazon Location SDK to a GeoJSON Point.
 * @param place The Place object from Amazon Location SDK.
 * @returns a GeoJSON Point of that place, or undefined if the place's Geometry is undefined or contains no Point.
 *
 * @example
 *  const place: Place = { // the Place field in SearchForPositionResult, , SearchForTextResult or GetPlaceResponse.
 *      Geometry: {
 *          Point: [1, 2]
 *      }
 *  }
 *  convertPlaceToPoint(place); // returns { type: "Point", coordinates: [1,2] }
 */
export function convertPlaceToPoint(place: Place): Point | undefined {
  return wrapCoordinatesToPoint(place.Geometry?.Point);
}

/**
 * Convert any place container to a GeoJSON Point. It can convert GetPlaceResponse, SearchForPositionResult and SearchForTextResult
 * @param placeContainer an object returned by Amazon Location containing a Place.
 * @returns a GeoJSON Point of that place, or undefined if placeContainer does not contain a place.
 *
 * @example
 * const response = await locationClient.send(command); // command is a GetPlaceCommand.
 * const point = convertPlaceContainerToPoint(response); // returns a point representing the place returned.
 *
 * const response = await locationClient.send(command); // command is a SearchPlaceIndexForPositionCommand or SearchPlaceIndexForTextCommand.
 * const point = convertPlaceContainerToPoint(response?.Results?.[0]); // returns a point representing the first place returned.
 */
export function convertPlaceContainerToPoint(placeContainer: AnyPlaceContainer): Point | undefined {
  return wrapCoordinatesToPoint(placeContainer.Place?.Geometry?.Point);
}

/**
 * Convert an array of place containers to a list of GeoJSON Points.
 * @param placeContainers an array of objects returned by Amazon Location containing a Place, such as SearchPlaceIndexForPositionResponse.Results and SearchPlaceIndexForTextResponse.Results
 * @param keepUndefined keep undefined points in the result array.The undefined points are filtered out by default.
 * @returns An array of GeoJSON Points converted from the place containers.
 * @example
 * const response = await locationClient.send(command); // command is a SearchPlaceIndexForPositionCommand or SearchPlaceIndexForTextCommand.
 * const points = convertPlaceContainersToPoints(response?.Results); // returns an array of points representing the places returned.
 */
export function convertPlaceContainersToPoints(
  placeContainers: AnyPlaceContainer[],
  keepUndefined?: boolean,
): (Point | undefined)[] {
  return placeContainers
    .map((placeContainer) => convertPlaceContainerToPoint(placeContainer))
    .filter((point) => keepUndefined || point);
}

/**
 * Convert a device position to a GeoJSON Point.
 * @param devicePosition a device position, such as ListDevicePositionsResponseEntry, DevicePosition, GetDevicePositionResponse
 * @returns A GeoJSON Point of that device position, or undefined if the device position does not contain a Position.
 * @example
 * const response = await locationClient.send(command); // command is a GetDevicePositionCommand.
 * const point = convertDevicePositionToPoint(response); // returns a point representing the device position.
 *
 * const response = await locationClient.send(command); // command is a ListDevicePositionsCommand.
 * const point = convertDevicePositionToPoint(response?.Entries?.[0]); // return a point representing the first device position.
 *
 * const response = await locationClient.send(command); // command is a BatchGetDevicePositionResponse or GetDevicePositionHistoryCommand.
 * const point = convertDevicePositionToPoint(response?.DevicePositions?.[0]); // return a point representing the first position returned.
 */
export function convertDevicePositionToPoint(devicePosition: AnyDevicePosition): Point | undefined {
  return wrapCoordinatesToPoint(devicePosition.Position);
}

/**
 * Convert an array of device positions to a list of GeoJSON Points.
 * @param devicePositions an array device positions, such as BatchGetDevicePositionResponse.DevicePositions or ListDevicePositionsResponse.Entries
 * @param keepUndefined keep undefined points in the result array. The undefined points are filtered out by default.
 * @returns An array of GeoJSON Points converted from the device positions.
 * @example
 * const response = await locationClient.send(command); // command is a ListDevicePositionsCommand.
 * const point = convertDevicePositionsToPoints(response?.Entries); // returns an array of points representing each device's last known position.
 *
 * const response = await locationClient.send(command); // command is a BatchGetDevicePositionResponse or GetDevicePositionHistoryCommand.
 * const point = convertDevicePositionsToPoints(response?.DevicePositions); // returns an array of points representing position returned.
 */
export function convertDevicePositionsToPoints(
  devicePositions: AnyDevicePosition[],
  keepUndefined?: boolean,
): (Point | undefined)[] {
  return devicePositions
    .map((devicePosition) => convertDevicePositionToPoint(devicePosition))
    .filter((point) => keepUndefined || point);
}
