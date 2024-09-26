// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, LineString, Point } from "geojson";
import { CalculateRoutesResponse, RouteLegGeometry } from "@aws-sdk/client-georoutes";

import { flattenProperties } from "./utils";
import { decodeToLineString } from "@aws-geospatial/polyline";

/**
 * Options for converting a CalculateRoutesResponse to a GeoJSON FeatureCollection.
 *
 * @public - flattenProperties: Controls whether nested properties remain nested within the properties
 *   field on each Feature, or if they get flattened into a single flat list. Flattened properties are required when
 *   trying to use the properties in MapLibre expressions, as MapLibre doesn't support nested properties.
 * - includeLegLines: Creates a LineString Feature for each leg of the route.
 * - includeTravelStepLines: Creates a LineString Feature for each travel step in each leg of the route.
 * - includeSpanLines: Creates a LineString Feature for each span in each leg of the route.
 * - includeLegArrivalDeparturePositions: Creates Point Features for the arrival and departure positions of each leg of the route.
 * - includeTravelStepStartPositions: Creates a Point Feature for the start position of each travel step in the route.
 */
export class CalculateRoutesResponseOptions {
  flattenProperties?: boolean;
  includeLegLines?: boolean;
  includeTravelStepLines?: boolean;
  includeSpanLines?: boolean;
  includeLegArrivalDeparturePositions?: boolean;
  includeTravelStepStartPositions?: boolean;
}

const defaultCalculateRoutesResponseOptions = {
  flattenProperties: false,
  includeLegLines: true,
  includeTravelStepLines: false,
  includeSpanLines: false,
  includeLegArrivalDeparturePositions: false,
  includeTravelStepStartPositions: false,
};

/**
 * This converts a CalculateRoutesResponse to an array of GeoJSON FeatureCollections, one for each route in the
 * response. Route responses contain multiple different types of geometry in the response, so the conversion is
 * configurable to choose which features should be in the resulting GeoJSON. Each GeoJSON Feature contains properties
 * from that portion of the response along with any child arrays/structures. It will not contain properties from any
 * parent structures. So for example, with Route->Leg->TravelSteps, a converted Leg feature will contain properties for
 * everything on Leg and everything in TravelSteps, but it won't contain any properties from Route.
 *
 * Each Feature contains a `FeatureType` property that can be used to distinguish between the types of features if
 * multiple are requested during the conversion.
 *
 * Each FeatureCollection may contain a mixture of LineString and Point features, depending on the conversion options
 * provided.
 *
 * Any feature that is missing its geometry in the response will be skipped in the conversion.
 *
 * @example Converting a CalculateRoutesResponse with 1 route and 1 leg, with all the feature types converted and
 * flattenProperties set to true.
 *
 * Value of CalculateRoutesResponse:
 *
 * ```json
 * {
 *   "LegGeometryFormat": "FlexiblePolyline",
 *   "Notices": [],
 *   "Routes": [
 *     {
 *       "Legs": [
 *         {
 *           "Geometry": {
 *             "Polyline": "BG6ogqvC1975lFyhBVsnBnB8fTw5BnBsOTslCnB84BnBsiB7BgFA8aA4pC7BwMAs7BnBkhB7B8iCT8pB7Bk6B7Bk_B7B8-D3DokBT89B7BvCovDzFomF_E0zDnB4cnBsiB7B8zB_E0ezFgU3Ige_EgjBjDopBjDkrBvC4coBsTgF4SoG8VkIofsEkXsEofkD4csEopB8Bsd8B8VUgZwH8vDkIwwDoBofgFgrC0FkzCkDkwBoBgtBwCkhBgFs2B0Fo7CwC8kBwCopBgFosC4I4qE4Do4BwCsnBoBwb8BwM8BgKgFgK0F8GkIwHoL4IkIsE8GkDoG0F4DgF3STvlBArJA_JAv0BT72CnBz_C_EnVnBr7BjD_JrEzF3D7G_ErEnG3D_JjDvMUzKU7LAvHAnGT7GnB_E7BrE7B3DvC3DjD3D3D3DrE3D3DjDzFrEnQvM7QjN7QzP7VrT_JrJ7L_J3rBriB7L7GrJ_EnGAnGAvMkD7GwCnQ0FjN4D_E8BjI8BjS0FrJoB7GoBnGnBvHnBzFrEzFrErEvHrEvHvC3InBrJArJ8B_JkD3IgFjIgFnG8GrE8GvC8GnB8GoB8GwC8GsE0FoGsEwHkDsJsEoVoGwgBU4D0F4S8G8VsE8asE4c4SksD0FkhB4I0yB4I8zBsTgzD8LonCsdktFghCwjMsnB8sH8GsnBokBg3GkNgmC0Pk_BwMgtBwMwlB8GoQoLkc8V8zB4NgeoQsdgZssBkc4rBgU4c0jB0tB0Z4coLwMkwB0tB0oBgoBof4cqLoK"
 *           },
 *           "Language": "en-us",
 *           "TravelMode": "Car",
 *           "Type": "Vehicle",
 *           "VehicleLegDetails": {
 *             "AfterTravelSteps": [],
 *             "Arrival": {
 *               "Place": {
 *                 "ChargingStation": false,
 *                 "OriginalPosition": [-86.8590917, 41.5981923],
 *                 "Position": [-86.8639365, 41.6006313]
 *               }
 *             },
 *             "Departure": {
 *               "Place": {
 *                 "ChargingStation": false,
 *                 "OriginalPosition": [-86.9331426, 41.582714],
 *                 "Position": [-86.9314193, 41.5827334]
 *               }
 *             },
 *             "Incidents": [],
 *             "Notices": [],
 *             "PassThroughWaypoints": [],
 *             "Spans": [
 *               {
 *                 "GeometryOffset": 0
 *               },
 *               {
 *                 "GeometryOffset": 81,
 *                 "TollSystems": [0]
 *               }
 *             ],
 *             "Summary": {
 *               "Overview": {
 *                 "BestCaseDuration": 515,
 *                 "Distance": 9946,
 *                 "Duration": 515
 *               },
 *               "TravelOnly": {
 *                 "BestCaseDuration": 515,
 *                 "Duration": 515
 *               }
 *             },
 *             "TollSystems": [
 *               {
 *                 "Name": "INDIANA TOLL ROAD"
 *               }
 *             ],
 *             "Tolls": [],
 *             "TravelSteps": [
 *               {
 *                 "Distance": 1784,
 *                 "Duration": 91,
 *                 "ExitNumber": [],
 *                 "GeometryOffset": 0,
 *                 "Type": "Depart"
 *               },
 *               {
 *                 "Distance": 3006,
 *                 "Duration": 191,
 *                 "ExitNumber": [],
 *                 "GeometryOffset": 21,
 *                 "TurnStepDetails": {
 *                   "Intersection": [],
 *                   "SteeringDirection": "Right",
 *                   "TurnIntensity": "Typical"
 *                 },
 *                 "Type": "Turn"
 *               },
 *               {
 *                 "Distance": 696,
 *                 "Duration": 27,
 *                 "ExitNumber": [],
 *                 "GeometryOffset": 72,
 *                 "TurnStepDetails": {
 *                   "Intersection": [],
 *                   "SteeringDirection": "Right",
 *                   "TurnIntensity": "Sharp"
 *                 },
 *                 "Type": "Turn"
 *               },
 *               {
 *                 "Distance": 4460,
 *                 "Duration": 206,
 *                 "ExitNumber": [],
 *                 "GeometryOffset": 81,
 *                 "RampStepDetails": {
 *                   "Intersection": [],
 *                   "SteeringDirection": "Right"
 *                 },
 *                 "Type": "Ramp"
 *               },
 *               {
 *                 "Distance": 0,
 *                 "Duration": 0,
 *                 "ExitNumber": [],
 *                 "GeometryOffset": 180,
 *                 "Type": "Arrive"
 *               }
 *             ],
 *             "TruckRoadTypes": [],
 *             "Zones": []
 *           }
 *         }
 *       ],
 *       "MajorRoadLabels": [
 *         {
 *           "RouteNumber": {
 *             "Language": "en",
 *             "Value": "I-80"
 *           }
 *         },
 *         {
 *           "RoadName": {
 *             "Language": "en",
 *             "Value": "W Snyder Rd"
 *           }
 *         }
 *       ],
 *       "Summary": {
 *         "Distance": 9946,
 *         "Duration": 515
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * Output from calculateRoutesResponseToFeatureCollection:
 *
 * ```json
 * [
 *     {
 *         "type": "FeatureCollection",
 *         "features": [
 *             {
 *                 "type": "Feature",
 *                 "id": 0,
 *                 "properties": {
 *                     "Language": "en-us",
 *                     "TravelMode": "Car",
 *                     "Type": "Vehicle",
 *                     "VehicleLegDetails.Arrival.Place.ChargingStation": false,
 *                     "VehicleLegDetails.Arrival.Place.OriginalPosition": [
 *                         -86.8590917,
 *                         41.5981923
 *                     ],
 *                     "VehicleLegDetails.Arrival.Place.Position": [
 *                         -86.8639365,
 *                         41.6006313
 *                     ],
 *                     "VehicleLegDetails.Departure.Place.ChargingStation": false,
 *                     "VehicleLegDetails.Departure.Place.OriginalPosition": [
 *                         -86.9331426,
 *                         41.582714
 *                     ],
 *                     "VehicleLegDetails.Departure.Place.Position": [
 *                         -86.9314193,
 *                         41.5827334
 *                     ],
 *                     "VehicleLegDetails.Spans.0.GeometryOffset": 0,
 *                     "VehicleLegDetails.Spans.1.GeometryOffset": 81,
 *                     "VehicleLegDetails.Spans.1.TollSystems.0": 0,
 *                     "VehicleLegDetails.Summary.Overview.BestCaseDuration": 515,
 *                     "VehicleLegDetails.Summary.Overview.Distance": 9946,
 *                     "VehicleLegDetails.Summary.Overview.Duration": 515,
 *                     "VehicleLegDetails.Summary.TravelOnly.BestCaseDuration": 515,
 *                     "VehicleLegDetails.Summary.TravelOnly.Duration": 515,
 *                     "VehicleLegDetails.TollSystems.0.Name": "INDIANA TOLL ROAD",
 *                     "VehicleLegDetails.TravelSteps.0.Distance": 1784,
 *                     "VehicleLegDetails.TravelSteps.0.Duration": 91,
 *                     "VehicleLegDetails.TravelSteps.0.GeometryOffset": 0,
 *                     "VehicleLegDetails.TravelSteps.0.Type": "Depart",
 *                     "VehicleLegDetails.TravelSteps.1.Distance": 3006,
 *                     "VehicleLegDetails.TravelSteps.1.Duration": 191,
 *                     "VehicleLegDetails.TravelSteps.1.GeometryOffset": 21,
 *                     "VehicleLegDetails.TravelSteps.1.TurnStepDetails.SteeringDirection": "Right",
 *                     "VehicleLegDetails.TravelSteps.1.TurnStepDetails.TurnIntensity": "Typical",
 *                     "VehicleLegDetails.TravelSteps.1.Type": "Turn",
 *                     "VehicleLegDetails.TravelSteps.2.Distance": 696,
 *                     "VehicleLegDetails.TravelSteps.2.Duration": 27,
 *                     "VehicleLegDetails.TravelSteps.2.GeometryOffset": 72,
 *                     "VehicleLegDetails.TravelSteps.2.TurnStepDetails.SteeringDirection": "Right",
 *                     "VehicleLegDetails.TravelSteps.2.TurnStepDetails.TurnIntensity": "Sharp",
 *                     "VehicleLegDetails.TravelSteps.2.Type": "Turn",
 *                     "VehicleLegDetails.TravelSteps.3.Distance": 4460,
 *                     "VehicleLegDetails.TravelSteps.3.Duration": 206,
 *                     "VehicleLegDetails.TravelSteps.3.GeometryOffset": 81,
 *                     "VehicleLegDetails.TravelSteps.3.RampStepDetails.SteeringDirection": "Right",
 *                     "VehicleLegDetails.TravelSteps.3.Type": "Ramp",
 *                     "VehicleLegDetails.TravelSteps.4.Distance": 0,
 *                     "VehicleLegDetails.TravelSteps.4.Duration": 0,
 *                     "VehicleLegDetails.TravelSteps.4.GeometryOffset": 180,
 *                     "VehicleLegDetails.TravelSteps.4.Type": "Arrive",
 *                     "FeatureType": "Leg"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 1,
 *                 "properties": {
 *                     "Distance": 1784,
 *                     "Duration": 91,
 *                     "Type": "Depart",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 2,
 *                 "properties": {
 *                     "Distance": 1784,
 *                     "Duration": 91,
 *                     "Type": "Depart",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.931419, 41.582733 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 3,
 *                 "properties": {
 *                     "Distance": 3006,
 *                     "Duration": 191,
 *                     "TurnStepDetails.SteeringDirection": "Right",
 *                     "TurnStepDetails.TurnIntensity": "Typical",
 *                     "Type": "Turn",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 4,
 *                 "properties": {
 *                     "Distance": 3006,
 *                     "Duration": 191,
 *                     "TurnStepDetails.SteeringDirection": "Right",
 *                     "TurnStepDetails.TurnIntensity": "Typical",
 *                     "Type": "Turn",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.93184, 41.59878 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 5,
 *                 "properties": {
 *                     "Distance": 696,
 *                     "Duration": 27,
 *                     "TurnStepDetails.SteeringDirection": "Right",
 *                     "TurnStepDetails.TurnIntensity": "Sharp",
 *                     "Type": "Turn",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 6,
 *                 "properties": {
 *                     "Distance": 696,
 *                     "Duration": 27,
 *                     "TurnStepDetails.SteeringDirection": "Right",
 *                     "TurnStepDetails.TurnIntensity": "Sharp",
 *                     "Type": "Turn",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.89657, 41.60071 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 7,
 *                 "properties": {
 *                     "Distance": 4460,
 *                     "Duration": 206,
 *                     "RampStepDetails.SteeringDirection": "Right",
 *                     "Type": "Ramp",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 8,
 *                 "properties": {
 *                     "Distance": 4460,
 *                     "Duration": 206,
 *                     "RampStepDetails.SteeringDirection": "Right",
 *                     "Type": "Ramp",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.89676, 41.59445 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 9,
 *                 "properties": {
 *                     "Distance": 0,
 *                     "Duration": 0,
 *                     "Type": "Arrive",
 *                     "FeatureType": "TravelStep"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.863936, 41.600631 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 10,
 *                 "properties": {
 *                     "FeatureType": "Span"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 11,
 *                 "properties": {
 *                     "TollSystems.0": 0,
 *                     "FeatureType": "Span"
 *                 },
 *                 "geometry": {
 *                     "type": "LineString",
 *                     "coordinates": [ ... ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 12,
 *                 "properties": {
 *                     "Place.ChargingStation": false,
 *                     "Place.OriginalPosition": [
 *                         -86.9331426,
 *                         41.582714
 *                     ],
 *                     "FeatureType": "Departure"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.9314193, 41.5827334 ]
 *                 }
 *             },
 *             {
 *                 "type": "Feature",
 *                 "id": 13,
 *                 "properties": {
 *                     "Place.ChargingStation": false,
 *                     "Place.OriginalPosition": [
 *                         -86.8590917,
 *                         41.5981923
 *                     ],
 *                     "FeatureType": "Arrival"
 *                 },
 *                 "geometry": {
 *                     "type": "Point",
 *                     "coordinates": [ -86.8639365, 41.6006313 ]
 *                 }
 *             }
 *         ]
 *     }
 * ]
 * ```
 */
export function calculateRoutesResponseToFeatureCollections(
  routesResponse: CalculateRoutesResponse,
  options?: CalculateRoutesResponseOptions,
): FeatureCollection<Point | LineString>[] {
  const routes: FeatureCollection<Point | LineString>[] = [];

  // Any options that weren't passed in will get set to default values.
  options = { ...defaultCalculateRoutesResponseOptions, ...options };

  // CalculateRoutes can return multiple alternate routes, so loop through and create
  // a FeatureCollection for each route.
  for (const route of routesResponse.Routes) {
    const routeCollection: FeatureCollection<Point | LineString> = {
      type: "FeatureCollection",
      features: [],
    };

    // When converting a Route into GeoJSON, we can add properties at the Feature level, but not at the
    // FeatureCollection level. Consequently, our choice of what to convert into a Feature has implications
    // on what metadata is preserved and what metadata is ignored. The approach we've taken below is to include
    // metadata from all children, but not from the parents. This is because parent metadata would get duplicated
    // for each child and isn't necessarily relevant at that level.
    // For example, the response structure has Route->Legs->TravelSteps.
    // If we convert each Leg as a feature, each Leg feature will have properties for all the Leg metadata and all
    // the TravelSteps metadata. It will not contain any Route metadata.
    // If we convert each TravelStep as a feature, those will only have properties for that TravelStep, and none of
    // the Leg or Route metadata.

    for (const leg of route.Legs) {
      if (leg.Geometry) {
        // Convert the compressed or uncompressed geometry into an uncompressed GeoJSON LineString.
        const legLineString = createLineString(leg.Geometry);

        // If we don't have a valid leg LineString, we can't convert anything from this leg into GeoJSON.
        // Skip it and move on to the next leg.
        if (legLineString.coordinates.length < 2) {
          continue;
        }

        // Generically reference the appropriate LegDetails structure for this leg.
        const legDetails = leg.VehicleLegDetails
          ? leg.VehicleLegDetails
          : leg.PedestrianLegDetails
          ? leg.PedestrianLegDetails
          : leg.FerryLegDetails
          ? leg.FerryLegDetails
          : null;

        // If includeLegLines is requested, we'll include a LineString feature for each Leg in the Route,
        // with all the Leg properties except for the Geometry property, since that would be
        // redundant with the Feature geometry.
        // These features have FeatureType = "Leg".
        if (options.includeLegLines) {
          /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
          const { Geometry, ...legProperties } = leg;
          legProperties["FeatureType"] = "Leg";
          addFeatureToCollection(routeCollection, options.flattenProperties, legProperties, legLineString);
        }

        // If includeLegArrivalDeparturePositions is requested, we'll include Point features for the arrival
        // and departure positions for each leg.
        // These features have FeatureType = "Arrival" or "Departure".
        if (options.includeLegArrivalDeparturePositions) {
          if (legDetails) {
            for (const point of [legDetails.Departure, legDetails.Arrival]) {
              const pointProperties = structuredClone(point);
              delete pointProperties.Place.Position;
              pointProperties["FeatureType"] = point === legDetails.Departure ? "Departure" : "Arrival";
              addFeatureToCollection(routeCollection, options.flattenProperties, pointProperties, {
                type: "Point",
                coordinates: point.Place.Position,
              });
            }
          }
        }

        // If includeTravelStepLines is requested, we'll include a LineString feature for each TravelStep
        // in each Leg in the Route, with all the TravelStep properties except for the GeometryOffset property.
        // GeometryOffset is only needed for calculating the LineString belonging to the TravelStep, so there's
        // no reason to leave it in the results. TravelStep lines are useful for associating with information about
        // the route between each travel step, such as distance and time.
        // If includeTravelStepStartPositions is requested, we'll include a Point feature for each TravelStep.
        // TravelStep start positions are useful for associating with the turn-by-turn direction information at
        // the exact location that it is needed.
        // These features have FeatureType = "TravelStep".
        if (options.includeTravelStepLines || options.includeTravelStepStartPositions) {
          extractNestedFeaturesIntoCollection(routeCollection, "TravelStep", legLineString, legDetails?.TravelSteps, {
            flattenProperties: options.flattenProperties,
            includeLines: options.includeTravelStepLines,
            includeStartPoints: options.includeTravelStepStartPositions,
          });
        }

        // If includeSpanLines is requested, we'll include a LineString feature for each Span in each Leg in
        // the Route, with all the Span properties except for the GeometryOffset property.
        // These features have FeatureType = "Span".
        if (options.includeSpanLines) {
          extractNestedFeaturesIntoCollection(routeCollection, "Span", legLineString, legDetails?.Spans, {
            flattenProperties: options.flattenProperties,
            includeLines: true,
            includeStartPoints: false,
          });
        }
      }
    }

    routes.push(routeCollection);
  }

  return routes;
}

/**
 * Helper function to add a Feature to a FeatureCollection.
 *
 * @param collection The FeatureCollection to add the Feature to.
 * @param flatten Whether to flatten the properties or not.
 * @param properties The original nested properties of the Feature.
 * @param geometry The geometry of the Feature.
 */
function addFeatureToCollection(
  collection: FeatureCollection<Point | LineString>,
  flatten: boolean,
  properties: unknown,
  geometry: Point | LineString,
) {
  collection.features.push({
    type: "Feature",
    id: collection.features.length,
    properties: flatten ? flattenProperties(properties, "") : properties,
    geometry: geometry,
  });
}

/**
 * Helper function to create a GeoJSON LineString from a compressed or uncompressed RouteLegGeometry.
 *
 * @param geometry The RouteLegGeometry to convert.
 * @returns A GeoJSON LineString.
 */
function createLineString(geometry: RouteLegGeometry): LineString {
  if (geometry.LineString) {
    return {
      type: "LineString",
      coordinates: geometry.LineString,
    };
  } else if (geometry.Polyline) {
    return decodeToLineString(geometry.Polyline);
  } else {
    return { type: "LineString", coordinates: [] };
  }
}

/**
 * Helper function to extract nested features into a FeatureCollection.
 *
 * @param features The FeatureCollection to add the features to.
 * @param featureType The value to add as a FeatureType property.
 * @param lineString The LineString to extract geometry from for the nested features.
 * @param featureList The list of features to extract.
 * @param options The options for extracting the features.
 */
function extractNestedFeaturesIntoCollection(
  features: FeatureCollection<Point | LineString>,
  featureType: string,
  lineString: LineString,
  featureList: Array<unknown>,
  options: {
    flattenProperties: boolean;
    includeLines: boolean;
    includeStartPoints: boolean;
  },
): void {
  if (!featureList) return;

  for (const [index, feature] of featureList.entries()) {
    // The featureList array contains an array of entries that each contain a GeometryOffset. The
    // GeometryOffset of the entry is the starting coordinate value of that entry, and it ends at
    // the GeometryOffset of the next entry, or at the end of the LineString if there are no more entries.
    const stepLineString = structuredClone(lineString);
    stepLineString.coordinates = stepLineString.coordinates.slice(
      feature["GeometryOffset"],
      index < featureList.length - 1 ? featureList[index + 1]["GeometryOffset"] + 1 : lineString.coordinates.length,
    );

    // Create a copy of the properties with GeometryOffset removed, and FeatureType added.
    /* eslint @typescript-eslint/no-unused-vars: ["error", { "ignoreRestSiblings": true }] */
    const featureProperties = structuredClone(feature);
    delete featureProperties["GeometryOffset"];
    featureProperties["FeatureType"] = featureType;

    // If this entry has a valid LineString, and we're including lines, add it to the FeatureCollection.
    if (options.includeLines && stepLineString.coordinates.length > 1) {
      addFeatureToCollection(features, options.flattenProperties, featureProperties, stepLineString);
    }
    // If this entry has a valid Position, and we're including Points, add it to the FeatureCollection.
    if (options.includeStartPoints && stepLineString.coordinates.length > 0) {
      addFeatureToCollection(features, options.flattenProperties, featureProperties, {
        type: "Point",
        coordinates: stepLineString.coordinates[0],
      });
    }
  }
}
