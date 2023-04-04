// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { Point } from "geojson";
import { Place } from "@aws-sdk/client-location";

/**
 * Any Amazon Location object representing a device position, such as ListDevicePositionsResponseEntry, DevicePosition, GetDevicePositionResponse
 */
export interface AnyDevicePosition {
  Position: number[] | undefined;
}

/**
 * Any Amazon Location object containing a place, such as SearchForPositionResult, SearchForTextResult, GetPlaceResponse
 */
export interface AnyPlaceContainer {
  Place: Place | undefined;
}

/**
 * Wrap a raw Position into a GeoJSON Point.
 * @param position A single point geometry specifies a location for a Place using WGS 84 coordinates.
 * @returns a GeoJSON Point on that position, or undefined if the position parameter is undefined or null.
 */
export function convertRawPositionToPoint(position: number[] | undefined | null): Point | undefined {
  return position == undefined
    ? undefined
    : {
        type: "Point",
        coordinates: position,
      };
}

/**
 * Convert a Place from Amazon Location SDK to a GeoJSON Point.
 * @param place The Place object from Amazon Location SDK.
 * @returns a GeoJSON Point of that place, or undefined if the place's Geometry is undefined or contains no Point.
 */
export function convertPlaceToPoint(place: Place): Point | undefined {
  return convertRawPositionToPoint(place.Geometry?.Point);
}

/**
 * Convert any place container to a GeoJSON Point. It can convert SearchForPositionResult, SearchForTextResult and GetPlaceResponse
 * @param placeContainer an object returned by Amazon Location containing a Place.
 * @returns a GeoJSON Point of that place, or undefined if placeContainer does not contain a place.
 */
export function convertPlaceContainerToPoint(placeContainer: AnyPlaceContainer): Point | undefined {
  return convertRawPositionToPoint(placeContainer.Place?.Geometry?.Point);
}

/**
 * Convert an array of place containers to a list of GeoJSON Points.
 * @param placeContainers an array of objects returned by Amazon Location containing a Place, such as SearchPlaceIndexForTextResponse.Results
 * @param keepUndefined keep undefined points in the result array.The undefined points are filtered out by default.
 * @returns An array of GeoJSON Points converted from the place containers.
 */
export function convertPlaceContainersToPoints(
  placeContainers: AnyPlaceContainer[],
  keepUndefined?: boolean,
): (Point | undefined)[] {
  return placeContainers
    .map((placeContainer) => convertPlaceContainerToPoint(placeContainer))
    .filter((point) => keepUndefined || point != undefined);
}

/**
 * Convert a device position to a GeoJSON Point.
 * @param devicePosition a device position, such as ListDevicePositionsResponseEntry, DevicePosition, GetDevicePositionResponse
 * @returns A GeoJSON Point of that device position, or undefined if the device position does not contain a Position.
 */
export function convertDevicePositionToPoint(devicePosition: AnyDevicePosition): Point | undefined {
  return convertRawPositionToPoint(devicePosition.Position);
}

/**
 * Convert an array of device positions to a list of GeoJSON Points.
 * @param devicePositions an array device positions, such as BatchGetDevicePositionResponse.DevicePositions or ListDevicePositionsResponse.Entries
 * @param keepUndefined keep undefined points in the result array. The undefined points are filtered out by default.
 * @returns An array of GeoJSON Points converted from the device positions.
 */
export function convertDevicePositionsToPoints(
  devicePositions: AnyDevicePosition[],
  keepUndefined?: boolean,
): (Point | undefined)[] {
  return devicePositions
    .map((devicePosition) => convertDevicePositionToPoint(devicePosition))
    .filter((point) => keepUndefined || point != undefined);
}
