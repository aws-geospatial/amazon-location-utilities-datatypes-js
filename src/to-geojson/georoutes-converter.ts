// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { FeatureCollection, Feature, GeometryCollection, LineString, Point, Polygon } from "geojson";
import {
  CalculateRoutesResponse,
  CalculateIsolinesResponse,
  RouteLegGeometry,
  IsolineConnectionGeometry,
  IsolineShapeGeometry,
  OptimizeWaypointsResponse,
  SnapToRoadsResponse,
  RoadSnapSnappedGeometry,
} from "@aws-sdk/client-geo-routes";

import { flattenProperties } from "./utils";
import { decodeToLineString, decodeToPolygon } from "@aws/polyline";

/**
 * Base options for converting a GeoRoutes response to a GeoJSON FeatureCollection.
 *
 * @group GeoRoutes
 */
export interface BaseGeoRoutesOptions {
  /**
   * Controls the flattening of nested properties.
   *
   * If true, nested properties within the properties field on each Feature will be flattened into a single flat list.
   * This is required when using the properties in MapLibre expressions, as MapLibre doesn't support nested properties.
   *
   * @default true
   */
  flattenProperties?: boolean;
}
const defaultBaseGeoRoutesOptions = {
  flattenProperties: true,
};

/** Options for converting a CalculateRoutesResponse to a GeoJSON FeatureCollection. */
export interface CalculateRoutesResponseOptions extends BaseGeoRoutesOptions {
  /**
   * Optionally creates a LineString Feature for each leg of the route.
   *
   * @default true
   */
  includeLegs?: boolean;
  /**
   * Optionally creates a LineString Feature for each travel step in each leg of the route.
   *
   * @default false
   */
  includeTravelStepGeometry?: boolean;
  /**
   * Optionally creates a LineString Feature for each span in each leg of the route.
   *
   * @default false
   */
  includeSpans?: boolean;
  /**
   * Optionally creates Point Features for the arrival and departure positions of each leg of the route.
   *
   * @default false
   */
  includeLegArrivalDeparturePositions?: boolean;
  /**
   * Optionally creates a Point Feature for the start position of each travel step in each leg of the route.
   *
   * @default false
   */
  includeTravelStepStartPositions?: boolean;
}

const defaultCalculateRoutesResponseOptions = {
  ...defaultBaseGeoRoutesOptions,
  includeLegs: true,
  includeTravelStepGeometry: false,
  includeSpans: false,
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
 * multiple are requested during the conversion:
 *
 * - `Leg`: A travel leg of the route. (LineString)
 * - `Span`: A span within a travel leg. (LineString)
 * - `TravelStepGeometry`: A travel step line within a travel leg. (LineString)
 * - `TravelStepStartPosition`: The start position of a travel step within a travel leg. (Point)
 * - `Arrival`: The arrival position of a travel leg. (Point)
 * - `Departure`: The departure position of a travel leg. (Point)
 *
 * Each FeatureCollection may contain a mixture of LineString and Point features, depending on the conversion options
 * provided.
 *
 * Any feature that is missing its geometry in the response or has invalid geometry will throw an Error.
 *
 * @example Drawing a route with travel step dots and hover-over popups at each travel step.
 *
 * ```js
 *         const popup = new maplibregl.Popup({
 *             closeButton: false,
 *             closeOnClick: false
 *         });
 *
 *         // Set up command to calculate route between 2 points
 *         const calculateRouteCommand =
 *             new amazonLocationClient.routes.CalculateRoutesCommand(params);
 *
 *         try {
 *             const response = await client.send(calculateRouteCommand);
 *
 *             const collections = amazonLocationDataConverter.calculateRoutesResponseToFeatureCollections(response, {
 *                 flattenProperties: true,
 *                 includeTravelStepGeometry: true,
 *                 includeLegs: true,
 *                 includeSpans: true,
 *                 includeLegArrivalDeparturePositions: true,
 *                 includeTravelStepStartPositions: true,
 *                 });
 *
 *             if (response.Routes.length > 0) {
 *                 // This is only adding a source for the first route in the returned collection.
 *                 // If all the routes are desired, add sources for each entry in collections[].
 *                 map.addSource("route-0", { type: "geojson", data: collections[0]});
 *
 *                 // This layer filters the GeoJSON to only draw lines of type TravelStepGeometry.
 *                 map.addLayer({
 *                     id: `route-0`,
 *                     type: 'line',
 *                     source: "route-0",
 *                     filter: ['all',
 *                         ['==', ['get', 'FeatureType'], 'TravelStepGeometry'],
 *                     ],
 *                     layout: {
 *                         'line-join': 'round',
 *                         'line-cap': 'round'
 *                     },
 *                     paint: {
 *                         'line-color': '#3887be',
 *                         'line-width': 5,
 *                         'line-opacity': 0.75
 *                     }
 *                 });
 *
 *                 // This layer filters the GeoJSON to only draw points of type TravelStepStartPosition.
 *                 map.addLayer({
 *                     id: "route-0-travelsteps",
 *                     type: "circle",
 *                     source: "route-0",
 *                     filter: ['all',
 *                         ['==', ['get', 'FeatureType'], 'TravelStepStartPosition'],
 *                     ],
 *                     paint: {
 *                         "circle-radius": 6,
 *                         "circle-color": "#B42222",
 *                     },
 *                 });
 *
 *                 // Show a popup on mouseenter with the directions, distance, and duration.
 *                 map.on('mouseenter', 'route-0-travelsteps', (e) => {
 *                     map.getCanvas().style.cursor = 'pointer';
 *
 *                     if (e.features.length > 0) {
 *                         const feature = e.features[0];
 *                         const coordinates = feature.geometry.coordinates.slice();
 *                         let title = e.features[0].properties['Type'] || '';
 *                         if (e.features[0].properties['TurnStepDetails.SteeringDirection']) {
 *                             title = title + ' ' + e.features[0].properties['TurnStepDetails.SteeringDirection'];
 *                         }
 *                         if (e.features[0].properties['RampStepDetails.SteeringDirection']) {
 *                             title = title + ' ' + e.features[0].properties['RampStepDetails.SteeringDirection'];
 *                         }
 *                         if (e.features[0].properties['KeepStepDetails.SteeringDirection']) {
 *                             title = title + ' ' + e.features[0].properties['KeepStepDetails.SteeringDirection'];
 *                         }
 *                         const distance = e.features[0].properties['Distance'] || '';
 *                         const duration = e.features[0].properties['Duration'] || '';
 *
 *                         // Create popup content
 *                         const popupContent = `
 *         <h3>${title}</h3>
 *         <p><strong>Distance:</strong> ${distance}</p>
 *         <p><strong>Duration:</strong> ${duration}</p>
 *       `;
 *
 *                         // Set popup coordinates and content
 *                         popup
 *                           .setLngLat(e.lngLat)
 *                           .setHTML(popupContent)
 *                           .addTo(map);
 *                     }
 *                 });
 *
 *                 // Remove popup on mouseleave
 *                 map.on('mouseleave', 'route-0-travelsteps', () => {
 *                     map.getCanvas().style.cursor = '';
 *                     popup.remove();
 *                 });
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
          throw Error("Route leg has invalid geometry.");
        }

        // Generically reference the appropriate LegDetails structure for this leg.
        const legDetails = leg.VehicleLegDetails
          ? leg.VehicleLegDetails
          : leg.PedestrianLegDetails
          ? leg.PedestrianLegDetails
          : leg.FerryLegDetails
          ? leg.FerryLegDetails
          : null;

        // If includeLegs is requested, we'll include a LineString feature for each Leg in the Route,
        // with all the Leg properties except for the Geometry property, since that would be
        // redundant with the Feature geometry.
        // These features have FeatureType = "Leg".
        if (options.includeLegs) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

        // If includeTravelStepGeometry is requested, we'll include a LineString feature for each TravelStep
        // in each Leg in the Route, with all the TravelStep properties except for the GeometryOffset property.
        // GeometryOffset is only needed for calculating the LineString belonging to the TravelStep, so there's
        // no reason to leave it in the results. TravelStep lines are useful for associating with information about
        // the route between each travel step, such as distance and time.
        // These features have FeatureType = "TravelStepGeometry".
        if (options.includeTravelStepGeometry) {
          extractNestedLinesIntoCollection(
            routeCollection,
            "TravelStepGeometry",
            legLineString,
            legDetails?.TravelSteps,
            options.flattenProperties,
          );
        }

        // If includeTravelStepStartPositions is requested, we'll include a Point feature for each TravelStep.
        // TravelStep start positions are useful for associating with the turn-by-turn direction information at
        // the exact location that it is needed.
        // These features have FeatureType = "TravelStepStartPosition".
        if (options.includeTravelStepStartPositions) {
          extractNestedPointsIntoCollection(
            routeCollection,
            "TravelStepStartPosition",
            legLineString,
            legDetails?.TravelSteps,
            options.flattenProperties,
          );
        }

        // If includeSpans is requested, we'll include a LineString feature for each Span in each Leg in
        // the Route, with all the Span properties except for the GeometryOffset property.
        // These features have FeatureType = "Span".
        if (options.includeSpans) {
          extractNestedLinesIntoCollection(
            routeCollection,
            "Span",
            legLineString,
            legDetails?.Spans,
            options.flattenProperties,
          );
        }
      }
    }

    routes.push(routeCollection);
  }

  return routes;
}

/** Options for converting a CalculateIsolinesResponseOptions to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CalculateIsolinesResponseOptions extends BaseGeoRoutesOptions {}
const defaultCalculateIsolinesResponseOptions = defaultBaseGeoRoutesOptions;

/**
 * This converts a CalculateIsolineResponse to a GeoJSON FeatureCollection which contains one Feature for each isoline
 * in the response. Isolines can contain both polygons for isoline regions and lines for connectors between regions
 * (such as ferry travel), so each Feature is a GeometryCollection that can contain a mix of Polygons and LineStrings.
 *
 * Any feature that is missing its geometry in the response or has invalid geometry will throw an Error.
 *
 * @example Drawing an isolines response with multiple isoline regions and connector lines.
 *
 * ```js
 *         // Set up command to calculate isolines
 *         const calculateIsolinesCommand =
 *             new amazonLocationClient.routes.CalculateIsolinesCommand(params);
 *
 *         try {
 *             const response = await client.send(calculateIsolinesCommand);
 *
 *             const collection = amazonLocationDataConverter.calculateIsolinesResponseToFeatureCollection(response, {
 *                 flattenProperties: true
 *                 });
 *
 *             // Add the results as a GeoJSON source
 *             map.addSource('isolines', { type: 'geojson', data: collection});
 *
 *             // Add a layer for drawing the isoline polygon regions.
 *             // It's important to filter the geometry type to polygons, because any connector lines
 *             // in the results would still try to draw a filled region on one side of the line.
 *             // These are being drawn as partially translucent so that overlapping isoline regions
 *             // additively get more opaque.
 *             map.addLayer({
 *                 id: 'isolines',
 *                 type: 'fill',
 *                 source: 'isolines',
 *                 layout: {
 *                 },
 *                 paint: {
 *                     "fill-color": "#3887be",
 *                     'fill-opacity': 0.6
 *                 },
 *                 'filter': ['==', ['geometry-type'], 'Polygon']
 *             });
 *
 *             // Draw any connector lines that exist in the result.
 *             // It's important to filter the geometry type to LineStrings. Otherwise, any polygons
 *             // would have their outlines drawn here as well.
 *             map.addLayer({
 *                 id: 'isolines-connector',
 *                 type: 'line',
 *                 source: 'isolines',
 *                 layout: {
 *                     'line-join': 'round',
 *                     'line-cap': 'round'
 *                 },
 *                 paint: {
 *                     'line-color': '#FF0000',  // Default color
 *                     'line-width': 3,
 *                     'line-opacity': 0.75
 *                 },
 *                 'filter': ['==', ['geometry-type'], 'LineString']
 *             });
 * ```
 */
export function calculateIsolinesResponseToFeatureCollection(
  isolinesResponse: CalculateIsolinesResponse,
  options?: CalculateIsolinesResponseOptions,
): FeatureCollection<GeometryCollection> {
  // Set any options that weren't passed in to the default values.
  options = { ...defaultCalculateIsolinesResponseOptions, ...options };

  const isolines: FeatureCollection<GeometryCollection> = {
    type: "FeatureCollection",
    features: [],
  };

  // CalculateIsolines can return multiple distinct isolines, so loop through and create
  // a Feature containing a GeometryCollection for each isoline.
  for (const isoline of isolinesResponse.Isolines) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Geometries, Connections, ...properties } = isoline;

    const feature: Feature<GeometryCollection> = {
      type: "Feature",
      id: isolines.features.length,
      properties: options.flattenProperties ? flattenProperties(properties, "") : properties,
      geometry: {
        type: "GeometryCollection",
        geometries: [],
      },
    };

    // Add all the isoline polygons into the GeometryCollection.
    for (const geometry of isoline.Geometries) {
      const polygon = createPolygon(geometry);
      if (polygon.coordinates.length > 0) {
        feature.geometry.geometries.push(polygon);
      }
    }

    // Add all the isoline connection lines into the GeometryCollection.
    for (const connection of isoline.Connections) {
      const connectionLine = createLineString(connection.Geometry);
      if (connectionLine.coordinates.length > 1) {
        feature.geometry.geometries.push(connectionLine);
      }
    }

    // As long as this feature has at least one polygon or line, add it to the result set.
    if (feature.geometry.geometries.length > 0) {
      isolines.features.push(feature);
    }
  }

  return isolines;
}

/** Options for converting an OptimizeWaypointsResponse to a GeoJSON FeatureCollection. */
// While we currently don't have any members, we expose it as an interface instead of a type
// so that the generated typedoc has the base options listed for it.
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OptimizeWaypointsResponseOptions extends BaseGeoRoutesOptions {}
const defaultOptimizeWaypointsResponseOptions = defaultBaseGeoRoutesOptions;

/**
 * This converts an OptimizeWaypointsResponse to a GeoJSON FeatureCollection which contains one Feature for each
 * waypoint in the response. The response can contain either impeding waypoints or optimized waypoints. They will both
 * get added into the GeoJSON with a FeatureType property of ImpedingWaypoint or OptimizedWaypoint respectively.
 *
 * @example Drawing labels underneath the waypoints that show the optimized order.
 *
 * ```js
 *         // Set up command to optimize waypoints
 *         const optimizeWaypointsCommand =
 *             new amazonLocationClient.routes.OptimizeWaypointsCommand(params);
 *
 *         try {
 *             const response = await client.send(optimizeWaypointsCommand);
 *
 *             const collection = amazonLocationDataConverter.optimizeWaypointsResponseToFeatureCollection(response, {
 *                 flattenProperties: true
 *                 });
 *
 *             // Add the GeoJSON collection as a source to the map
 *             map.addSource('waypoints', { type: 'geojson', data: collection});
 *
 *             // Add a layer that draws the numeric id of each point underneath the location.
 *             map.addLayer({
 *                 id: 'waypoint-numbers',
 *                 type: 'symbol',
 *                 source: 'waypoints',
 *                 layout: {
 *                     'text-field': ['id'],
 *                     "text-font": ["Amazon Ember Regular"],
 *                     'text-size': 18,
 *                     'text-offset': [0, 1.5],
 *                     'text-anchor': 'bottom'
 *                 },
 *                 paint: {
 *                     'text-color': '#000000',
 *                     'text-halo-color': '#FFFFFF',
 *                     'text-halo-width': 1
 *                 },
 *             });
 * ```
 */
export function optimizeWaypointsResponseToFeatureCollection(
  waypointsResponse: OptimizeWaypointsResponse,
  options?: OptimizeWaypointsResponseOptions,
): FeatureCollection<Point> {
  const waypoints: FeatureCollection<Point> = {
    type: "FeatureCollection",
    features: [],
  };

  // Set any options that weren't passed in to the default values.
  options = { ...defaultOptimizeWaypointsResponseOptions, ...options };

  // If there are impeding waypoints that cause the optimize call to fail, add them to the GeoJSON result
  // with a FeatureType of ImpedingWaypoint.
  for (const impedingWaypoint of waypointsResponse.ImpedingWaypoints) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = impedingWaypoint;
    properties["FeatureType"] = "ImpedingWaypoint";
    addFeatureToCollection(waypoints, options.flattenProperties, properties, {
      type: "Point",
      coordinates: impedingWaypoint.Position,
    });
  }

  // If the waypoints were optimized successfully, add them to the GeoJSON result with a
  // FeatureType of OptimizedWaypoint.
  for (const optimizedWaypoint of waypointsResponse.OptimizedWaypoints) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Position, ...properties } = optimizedWaypoint;
    properties["FeatureType"] = "OptimizedWaypoint";
    addFeatureToCollection(waypoints, options.flattenProperties, properties, {
      type: "Point",
      coordinates: optimizedWaypoint.Position,
    });
  }

  return waypoints;
}

/** Options for converting an SnapToRoadsResponseOptions to a GeoJSON FeatureCollection. */
export interface SnapToRoadsResponseOptions extends BaseGeoRoutesOptions {
  /**
   * Optionally creates a LineString Feature for the snapped route geometry.
   *
   * @default true
   */
  includeSnappedGeometry?: boolean;
  /**
   * Optionally creates a Point Feature for each original trace point submitted.
   *
   * @default false
   */
  includeSnappedTracePointOriginalPositions?: boolean;
  /**
   * Optionally creates a Point Feature for each snapped trace point.
   *
   * @default false
   */
  includeSnappedTracePointSnappedPositions?: boolean;
  /**
   * Optionally creates a LineString Feature containing a line from the submitted trace point to the snapped trace point
   * for each submitted point.
   *
   * @default false
   */
  includeOriginalToSnappedPositionLines?: boolean;
}

const defaultSnapToRoadsResponseOptions = {
  ...defaultBaseGeoRoutesOptions,
  includeSnappedGeometry: true,
  includeSnappedTracePointOriginalPositions: false,
  includeSnappedTracePointSnappedPositions: false,
  includeOriginalToSnappedPositionLines: false,
};

/**
 * This converts a SnapToRoadsResponse to a GeoJSON FeatureCollection. The FeatureCollection may optionally contain any
 * combination of the following:
 *
 * - A LineString Feature with the snapped route geometry, if includeSnappedGeometry is true.
 * - Point Features for each original trace point, if includeSnappedTracePointOriginalPositions is true.
 * - Point Features for each snapped trace point, if includeSnappedTracePointSnappedPositions is true.
 * - LineString Features for each snap line (line from original to snapped trace point), if
 *   includeOriginalToSnappedPositionLines is true.
 *
 * Each Feature contains a `FeatureType` property that can be used to distinguish between the types of features if
 * multiple are requested during the conversion:
 *
 * - `SnappedGeometry`: The snapped route geometry.
 * - `SnappedTracePointOriginalPosition`: The original submitted trace point.
 * - `SnappedTracePointSnappedPosition`: The snapped trace point.
 * - `OriginalToSnappedPositionLine`: A line from the original trace point to the corresponding snapped trace point.
 *
 * @example Drawing the snapped route, dots for each snapped trace point, and lines from the original trace points to
 * the snapped trace points.
 *
 * ```js
 *         // Set up command to optimize waypoints
 *         const snapToRoadsCommand =
 *             new amazonLocationClient.routes.SnapToRoadsCommand(params);
 *
 *         try {
 *             const response = await client.send(snapToRoadsCommand);
 *
 *             const collection = amazonLocationDataConverter.snapToRoadsResponseToFeatureCollection(response, {
 *                 flattenProperties: true,
 *                 includeSnappedGeometry: true,
 *                 includeSnappedTracePointOriginalPositions: true,
 *                 includeSnappedTracePointSnappedPositions: true,
 *                 includeOriginalToSnappedPositionLines: true
 *                 });
 *
 *             // Add the GeoJSON results as a source to the map.
 *             map.addSource('snapped', { type: 'geojson', data: collection});
 *
 *             // Add a layer that only draws the snapped route calculated from the trace points.
 *             // This is done by filtering the FeatureType to SnappedGeometry.
 *             map.addLayer({
 *                 id: 'SnappedGeometry',
 *                 type: 'line',
 *                 source: 'snapped',
 *                 layout: {
 *                     'line-join': 'round',
 *                     'line-cap': 'round'
 *                 },
 *                 paint: {
 *                     'line-color': '#3887be',  // Default color
 *                     'line-width': 3,
 *                     'line-opacity': 0.75
 *                 },
 *                 filter: ['==', ['get', 'FeatureType'], 'SnappedGeometry']
 *             });
 *
 *             // Add a layer that only draws the lines from the submitted points to the snapped points.
 *             // We draw these separately so that we can draw these in a different color than the route.
 *             // Alternatively, we could've used a case statement on the line-color to switch it.
 *             map.addLayer({
 *                 id: 'snappedLines',
 *                 type: 'line',
 *                 source: 'snapped',
 *                 layout: {
 *                     'line-join': 'round',
 *                     'line-cap': 'round'
 *                 },
 *                 paint: {
 *                     'line-color': '#FF0000',  // Default color
 *                     'line-width': 3,
 *                     'line-opacity': 0.75
 *                 },
 *                 filter: ['==', ['get', 'FeatureType'], 'OriginalToSnappedPositionLine']
 *             });
 *
 *             // Add a layer that only draws circles at the snapped trace points.
 *             map.addLayer({
 *                 id: 'snappedTracePoints',
 *                 type: 'circle',
 *                 source: 'snapped',
 *                 filter: ['all',
 *                     ['==', ['get', 'FeatureType'], 'SnappedTracePointSnappedPosition']
 *                 ],
 *                 paint: {
 *                     'circle-radius': 5,
 *                     'circle-color': '#FF0000'
 *                 }
 *             });
 * ```
 */
export function snapToRoadsResponseToFeatureCollection(
  snapToRoadsResponse: SnapToRoadsResponse,
  options?: SnapToRoadsResponseOptions,
): FeatureCollection<Point | LineString> {
  // Set any options that weren't passed in to the default values.
  options = { ...defaultSnapToRoadsResponseOptions, ...options };

  const snappedFeatures: FeatureCollection<Point | LineString> = {
    type: "FeatureCollection",
    features: [],
  };

  // Optionally include a LineString for the route that all the TracePoints seem to trace out.
  if (options.includeSnappedGeometry) {
    // Create a shallow copy of the passed-in properties and remove "$metadata", which can appear
    // in Response objects from the AWS SDK. Since $metadata is only metadata about the API call and
    // not a part of the Response data, we don't want or need it to appear in the generated GeoJSON.
    // We also remove SnappedGeometry, SnappedGeometryFormat, and SnappedTracePoints since these are
    // all redundant with the geometry we're returning in the GeoJSON.

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { SnappedGeometry, SnappedGeometryFormat, SnappedTracePoints, ...properties } = snapToRoadsResponse;
    properties["FeatureType"] = "SnappedGeometry";
    delete properties["$metadata"];

    addFeatureToCollection(
      snappedFeatures,
      options.flattenProperties,
      properties,
      createLineString(snapToRoadsResponse.SnappedGeometry),
    );
  }

  for (const snappedTracePoint of snapToRoadsResponse.SnappedTracePoints) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { OriginalPosition, SnappedPosition, ...tracePointProperties } = snappedTracePoint;

    // Optionally include a Point for each original TracePoint submitted.
    if (options.includeSnappedTracePointOriginalPositions) {
      const originalProperties = { ...tracePointProperties };
      originalProperties["FeatureType"] = "SnappedTracePointOriginalPosition";
      addFeatureToCollection(snappedFeatures, options.flattenProperties, originalProperties, {
        type: "Point",
        coordinates: snappedTracePoint.OriginalPosition,
      });
    }

    // Optionally include a Point for each snapped TracePoint submitted.
    if (options.includeSnappedTracePointSnappedPositions) {
      const snappedProperties = { ...tracePointProperties };
      snappedProperties["FeatureType"] = "SnappedTracePointSnappedPosition";
      addFeatureToCollection(snappedFeatures, options.flattenProperties, snappedProperties, {
        type: "Point",
        coordinates: snappedTracePoint.SnappedPosition,
      });
    }

    // Optionally include a LineString for the line between the original and snapped TracePoint.
    if (options.includeOriginalToSnappedPositionLines) {
      const snapLineProperties = { ...tracePointProperties };
      snapLineProperties["FeatureType"] = "OriginalToSnappedPositionLine";
      addFeatureToCollection(snappedFeatures, options.flattenProperties, snapLineProperties, {
        type: "LineString",
        coordinates: [snappedTracePoint.OriginalPosition, snappedTracePoint.SnappedPosition],
      });
    }
  }

  return snappedFeatures;
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
 * Helper function to create a GeoJSON LineString from a compressed or uncompressed Geometry.
 *
 * @param geometry The LineString/Polyline geometry to convert.
 * @returns A GeoJSON LineString.
 */
function createLineString(
  geometry: RouteLegGeometry | IsolineConnectionGeometry | RoadSnapSnappedGeometry,
): LineString {
  if (geometry.LineString) {
    return {
      type: "LineString",
      coordinates: geometry.LineString,
    };
  } else if (geometry.Polyline) {
    return decodeToLineString(geometry.Polyline);
  } else {
    throw Error("Response is missing both the LineString and Polyline fields for the geometry.");
  }
}

/**
 * Helper function to create a GeoJSON Polygon from a compressed or uncompressed Geometry.
 *
 * @param geometry The IsolineShapeGeometry to convert.
 * @returns A GeoJSON Polygon.
 */
function createPolygon(geometry: IsolineShapeGeometry): Polygon {
  if (geometry.Polygon) {
    return {
      type: "Polygon",
      coordinates: geometry.Polygon,
    };
  } else if (geometry.PolylinePolygon) {
    return decodeToPolygon(geometry.PolylinePolygon);
  } else {
    throw Error("Response is missing both the Polygon and PolylinePolygon fields for the geometry.");
  }
}

/**
 * Helper function to extract nested features into a FeatureCollection.
 *
 * @param features The FeatureCollection to add the features to.
 * @param lineFeatureType The value to add as a FeatureType property for extracted lines.
 * @param lineString The LineString to extract geometry from for the nested features.
 * @param featureList The list of features to extract.
 * @param flattenProperties Whether to flatten the properties or not.
 */
function extractNestedLinesIntoCollection(
  features: FeatureCollection<Point | LineString>,
  lineFeatureType: string,
  lineString: LineString,
  featureList: Array<object>,
  flattenProperties: boolean,
): void {
  if (!featureList) return;

  for (const [index, feature] of featureList.entries()) {
    // The featureList array contains an array of entries that each contain a GeometryOffset. The
    // GeometryOffset of the entry is the starting coordinate value of that entry, and it ends at
    // the GeometryOffset of the next entry, or at the end of the LineString if there are no more entries.
    const stepLineString = { ...lineString };
    stepLineString.coordinates = lineString.coordinates.slice(
      feature["GeometryOffset"],
      index < featureList.length - 1 ? featureList[index + 1]["GeometryOffset"] + 1 : lineString.coordinates.length,
    );

    // If this entry has a valid LineString add it to the FeatureCollection.
    if (stepLineString.coordinates.length > 1) {
      // Create a copy of the properties with GeometryOffset removed, and FeatureType added.
      const featureProperties = { ...feature };
      delete featureProperties["GeometryOffset"];
      featureProperties["FeatureType"] = lineFeatureType;
      addFeatureToCollection(features, flattenProperties, featureProperties, stepLineString);
    }
  }
}

/**
 * Helper function to extract nested features into a FeatureCollection.
 *
 * @param features The FeatureCollection to add the features to.
 * @param startPointFeatureType The value to add as a FeatureType property for extracted start points.
 * @param lineString The LineString to extract geometry from for the nested features.
 * @param featureList The list of features to extract.
 * @param flattenProperties Whether to flatten the properties or not.
 */
function extractNestedPointsIntoCollection(
  features: FeatureCollection<Point | LineString>,
  startPointFeatureType: string,
  lineString: LineString,
  featureList: Array<object>,
  flattenProperties: boolean,
): void {
  if (!featureList) return;

  for (const [index, feature] of featureList.entries()) {
    // The featureList array contains an array of entries that each contain a GeometryOffset. The
    // GeometryOffset of the entry is the starting coordinate value of that entry, and it ends at
    // the GeometryOffset of the next entry, or at the end of the LineString if there are no more entries.
    const stepLineString = { ...lineString };
    stepLineString.coordinates = lineString.coordinates.slice(
      feature["GeometryOffset"],
      index < featureList.length - 1 ? featureList[index + 1]["GeometryOffset"] + 1 : lineString.coordinates.length,
    );

    // If this entry has a valid Position add it to the FeatureCollection.
    if (stepLineString.coordinates.length > 0) {
      // Create a copy of the properties with GeometryOffset removed, and FeatureType added.
      const featureProperties = { ...feature };
      delete featureProperties["GeometryOffset"];
      featureProperties["FeatureType"] = startPointFeatureType;
      addFeatureToCollection(features, flattenProperties, featureProperties, {
        type: "Point",
        coordinates: stepLineString.coordinates[0],
      });
    }
  }
}
