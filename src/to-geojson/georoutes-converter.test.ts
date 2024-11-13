// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  CalculateRoutesResponse,
  CalculateIsolinesResponse,
  OptimizeWaypointsResponse,
  SnapToRoadsResponse,
} from "@aws-sdk/client-geo-routes";
import {
  calculateRoutesResponseToFeatureCollections,
  calculateIsolinesResponseToFeatureCollection,
  optimizeWaypointsResponseToFeatureCollection,
  snapToRoadsResponseToFeatureCollection,
} from "./georoutes-converter";
import { FeatureCollection } from "geojson";
import { emptyFeatureCollection } from "./utils";
import { encodeFromLngLatArray } from "@aws/polyline";

describe("calculateRoutesResponseToFeatureCollections", () => {
  it("should throw error if Legs are missing geometry", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "FlexiblePolyline",
      Notices: [],
      PricingBucket: "bucket",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {},
              TravelMode: "Car",
              Type: "Vehicle",
            },
            {
              Geometry: {},
              TravelMode: "Car",
              Type: "Vehicle",
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 30,
          },
        },
      ],
    };
    expect(() => {
      calculateRoutesResponseToFeatureCollections(input, { flattenProperties: false });
    }).toThrow(Error);
  });

  it("should throw error if Legs have invalid geometry", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "bucket",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: { LineString: [[1.0, 2.0]] },
              TravelMode: "Car",
              Type: "Vehicle",
            },
            {
              Geometry: { LineString: [[3.0, 4.0]] },
              TravelMode: "Car",
              Type: "Vehicle",
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 30,
          },
        },
      ],
    };
    expect(() => {
      calculateRoutesResponseToFeatureCollections(input, { flattenProperties: false });
    }).toThrow(Error);
  });

  it("should return multiple FeatureCollections if multiple routes are present", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
            },
            {
              Geometry: {
                LineString: [
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [8, 7],
                  [6, 5],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
            },
            {
              Geometry: {
                LineString: [
                  [4, 3],
                  [2, 1],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
            },
          ],
          Summary: {
            Distance: 2,
            Duration: 20,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
            },
          },
        ],
      },
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [8, 7],
                [6, 5],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [4, 3],
                [2, 1],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
            },
          },
        ],
      },
    ];

    expect(calculateRoutesResponseToFeatureCollections(input, { flattenProperties: false })).toEqual(expectedResult);
  });

  it("should return nested properties if flattenProperties = false", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [1, 2] } },
                Departure: { Place: { Position: [3, 4] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [1, 2] } },
                Departure: { Place: { Position: [3, 4] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          },
        ],
      },
    ];

    expect(calculateRoutesResponseToFeatureCollections(input, { flattenProperties: false })).toEqual(expectedResult);
  });

  it("should return flattened properties if flattenProperties = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [1, 2] } },
                Departure: { Place: { Position: [3, 4] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
              "VehicleLegDetails.Arrival.Place.Position": [1, 2],
              "VehicleLegDetails.Departure.Place.Position": [3, 4],
              "VehicleLegDetails.Incidents.0.Type": "Accident",
              "VehicleLegDetails.Incidents.1.Type": "Congestion",
            },
          },
        ],
      },
    ];

    expect(calculateRoutesResponseToFeatureCollections(input, { flattenProperties: true })).toEqual(expectedResult);
  });

  it("should return correct trip steps and spans for pedestrian routes", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Pedestrian",
              Type: "Pedestrian",
              PedestrianLegDetails: {
                Arrival: { Place: { Position: [3, 4] } },
                Departure: { Place: { Position: [1, 2] } },
                Notices: [],
                PassThroughWaypoints: [],
                TravelSteps: [
                  {
                    GeometryOffset: 0,
                    Type: "Depart",
                    Duration: 1,
                  },
                ],
                Spans: [{ GeometryOffset: 0 }],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Pedestrian",
              Type: "Pedestrian",
              "PedestrianLegDetails.Arrival.Place.Position": [3, 4],
              "PedestrianLegDetails.Departure.Place.Position": [1, 2],
              "PedestrianLegDetails.Spans.0.GeometryOffset": 0,
              "PedestrianLegDetails.TravelSteps.0.Type": "Depart",
              "PedestrianLegDetails.TravelSteps.0.Duration": 1,
              "PedestrianLegDetails.TravelSteps.0.GeometryOffset": 0,
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Duration: 1,
              Type: "Depart",
            },
          },
          {
            type: "Feature",
            id: 2,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeSpans: true,
        includeTravelStepGeometry: true,
      }),
    ).toEqual(expectedResult);
  });

  it("should return correct trip steps and spans for ferry routes", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Ferry",
              Type: "Ferry",
              FerryLegDetails: {
                Arrival: { Place: { Position: [3, 4] } },
                Departure: { Place: { Position: [1, 2] } },
                AfterTravelSteps: [],
                BeforeTravelSteps: [],
                Notices: [],
                PassThroughWaypoints: [],
                TravelSteps: [
                  {
                    GeometryOffset: 0,
                    Type: "Depart",
                    Duration: 1,
                  },
                ],
                Spans: [{ GeometryOffset: 0 }],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Ferry",
              Type: "Ferry",
              "FerryLegDetails.Arrival.Place.Position": [3, 4],
              "FerryLegDetails.Departure.Place.Position": [1, 2],
              "FerryLegDetails.Spans.0.GeometryOffset": 0,
              "FerryLegDetails.TravelSteps.0.Type": "Depart",
              "FerryLegDetails.TravelSteps.0.Duration": 1,
              "FerryLegDetails.TravelSteps.0.GeometryOffset": 0,
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Duration: 1,
              Type: "Depart",
            },
          },
          {
            type: "Feature",
            id: 2,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeSpans: true,
        includeTravelStepGeometry: true,
      }),
    ).toEqual(expectedResult);
  });

  it("should function correctly if leg details are missing", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              TravelMode: "Ferry",
              Type: "Ferry",
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Ferry",
              Type: "Ferry",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeSpans: true,
        includeTravelStepGeometry: true,
      }),
    ).toEqual(expectedResult);
  });

  it("should return decoded geometry if encoded geometry was provided", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                Polyline: encodeFromLngLatArray([
                  [1, 2],
                  [3, 4],
                ]),
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [1, 2] } },
                Departure: { Place: { Position: [3, 4] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
              "VehicleLegDetails.Arrival.Place.Position": [1, 2],
              "VehicleLegDetails.Departure.Place.Position": [3, 4],
              "VehicleLegDetails.Incidents.0.Type": "Accident",
              "VehicleLegDetails.Incidents.1.Type": "Congestion",
            },
          },
        ],
      },
    ];

    expect(calculateRoutesResponseToFeatureCollections(input, { flattenProperties: true })).toEqual(expectedResult);
  });

  // For the following include* tests, we only test for setting the value to true, because we're implicitly testing
  // the false values by the fact that those results aren't getting included in the other tests.

  it("should return leg lines if includeLegLines = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
              "VehicleLegDetails.Arrival.Place.Position": [7, 8],
              "VehicleLegDetails.Departure.Place.Position": [1, 2],
              "VehicleLegDetails.Incidents.0.Type": "Accident",
              "VehicleLegDetails.Incidents.1.Type": "Congestion",
              "VehicleLegDetails.Spans.0.GeometryOffset": 0,
              "VehicleLegDetails.Spans.1.GeometryOffset": 2,
              "VehicleLegDetails.TravelSteps.0.Type": "Depart",
              "VehicleLegDetails.TravelSteps.0.Duration": 1,
              "VehicleLegDetails.TravelSteps.0.GeometryOffset": 0,
              "VehicleLegDetails.TravelSteps.1.Type": "Continue",
              "VehicleLegDetails.TravelSteps.1.Duration": 1,
              "VehicleLegDetails.TravelSteps.1.GeometryOffset": 1,
              "VehicleLegDetails.TravelSteps.2.Type": "Arrive",
              "VehicleLegDetails.TravelSteps.2.Duration": 1,
              "VehicleLegDetails.TravelSteps.2.GeometryOffset": 3,
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: true,
        includeTravelStepGeometry: false,
        includeSpans: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return travel step lines if includeTravelStepGeometry = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Type: "Depart",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [3, 4],
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Type: "Continue",
              Duration: 1,
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: false,
        includeTravelStepGeometry: true,
        includeSpans: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return span lines if includeSpans = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
                [5, 6],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "LineString",
              coordinates: [
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: false,
        includeTravelStepGeometry: false,
        includeSpans: true,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return TravelStep start points if includeTravelStepStartPositions = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Duration: 1,
              Type: "Depart",
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "Point",
              coordinates: [3, 4],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Duration: 1,
              Type: "Continue",
            },
          },
          {
            type: "Feature",
            id: 2,
            geometry: {
              type: "Point",
              coordinates: [7, 8],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Duration: 1,
              Type: "Arrive",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: false,
        includeTravelStepGeometry: false,
        includeSpans: false,
        includeTravelStepStartPositions: true,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return Leg start and end points if includeLegArrivalDeparturePositions = true", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              FeatureType: "Departure",
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "Point",
              coordinates: [7, 8],
            },
            properties: {
              FeatureType: "Arrival",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: false,
        includeTravelStepGeometry: false,
        includeSpans: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: true,
      }),
    ).toEqual(expectedResult);
  });

  it("should return an empty FeatureCollection if no includes are set", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: false,
        includeTravelStepGeometry: false,
        includeSpans: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual([emptyFeatureCollection()]);
  });

  it("should return all the lines/points if all includes are set", () => {
    const input: CalculateRoutesResponse = {
      LegGeometryFormat: "Simple",
      Notices: [],
      PricingBucket: "XXXXXX",
      Routes: [
        {
          MajorRoadLabels: [],
          Legs: [
            {
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                  [5, 6],
                  [7, 8],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
              VehicleLegDetails: {
                Arrival: { Place: { Position: [7, 8] } },
                Departure: { Place: { Position: [1, 2] } },
                Incidents: [{ Type: "Accident" }, { Type: "Congestion" }],
                Notices: [],
                PassThroughWaypoints: [],
                Spans: [{ GeometryOffset: 0 }, { GeometryOffset: 2 }],
                Tolls: [],
                TollSystems: [],
                TravelSteps: [
                  { Type: "Depart", Duration: 1, GeometryOffset: 0 },
                  { Type: "Continue", Duration: 1, GeometryOffset: 1 },
                  { Type: "Arrive", Duration: 1, GeometryOffset: 3 },
                ],
                TruckRoadTypes: [],
                Zones: [],
              },
            },
            {
              Geometry: {
                LineString: [
                  [9, 10],
                  [11, 12],
                ],
              },
              TravelMode: "Car",
              Type: "Vehicle",
            },
          ],
          Summary: {
            Distance: 1,
            Duration: 10,
          },
        },
      ],
    };

    const expectedResult: Array<FeatureCollection> = [
      {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 0,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
              "VehicleLegDetails.Arrival.Place.Position": [7, 8],
              "VehicleLegDetails.Departure.Place.Position": [1, 2],
              "VehicleLegDetails.Incidents.0.Type": "Accident",
              "VehicleLegDetails.Incidents.1.Type": "Congestion",
              "VehicleLegDetails.Spans.0.GeometryOffset": 0,
              "VehicleLegDetails.Spans.1.GeometryOffset": 2,
              "VehicleLegDetails.TravelSteps.0.Type": "Depart",
              "VehicleLegDetails.TravelSteps.0.Duration": 1,
              "VehicleLegDetails.TravelSteps.0.GeometryOffset": 0,
              "VehicleLegDetails.TravelSteps.1.Type": "Continue",
              "VehicleLegDetails.TravelSteps.1.Duration": 1,
              "VehicleLegDetails.TravelSteps.1.GeometryOffset": 1,
              "VehicleLegDetails.TravelSteps.2.Type": "Arrive",
              "VehicleLegDetails.TravelSteps.2.Duration": 1,
              "VehicleLegDetails.TravelSteps.2.GeometryOffset": 3,
            },
          },
          {
            type: "Feature",
            id: 1,
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              FeatureType: "Departure",
            },
          },
          {
            type: "Feature",
            id: 2,
            geometry: {
              type: "Point",
              coordinates: [7, 8],
            },
            properties: {
              FeatureType: "Arrival",
            },
          },
          {
            type: "Feature",
            id: 3,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Type: "Depart",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 4,
            geometry: {
              type: "LineString",
              coordinates: [
                [3, 4],
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "TravelStepGeometry",
              Type: "Continue",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 5,
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Type: "Depart",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 6,
            geometry: {
              type: "Point",
              coordinates: [3, 4],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Duration: 1,
              Type: "Continue",
            },
          },
          {
            type: "Feature",
            id: 7,
            geometry: {
              type: "Point",
              coordinates: [7, 8],
            },
            properties: {
              FeatureType: "TravelStepStartPosition",
              Duration: 1,
              Type: "Arrive",
            },
          },
          {
            type: "Feature",
            id: 8,
            geometry: {
              type: "LineString",
              coordinates: [
                [1, 2],
                [3, 4],
                [5, 6],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
          {
            type: "Feature",
            id: 9,
            geometry: {
              type: "LineString",
              coordinates: [
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "Span",
            },
          },
          {
            type: "Feature",
            id: 10,
            geometry: {
              type: "LineString",
              coordinates: [
                [9, 10],
                [11, 12],
              ],
            },
            properties: {
              FeatureType: "Leg",
              TravelMode: "Car",
              Type: "Vehicle",
            },
          },
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegs: true,
        includeTravelStepGeometry: true,
        includeSpans: true,
        includeTravelStepStartPositions: true,
        includeLegArrivalDeparturePositions: true,
      }),
    ).toEqual(expectedResult);
  });
});

describe("calculateIsolinesResponseToFeatureCollection", () => {
  it("should throw error if Isolines are missing geometry", () => {
    const input: CalculateIsolinesResponse = {
      IsolineGeometryFormat: "FlexiblePolyline",
      PricingBucket: "bucket",
      Isolines: [
        {
          Connections: [],
          Geometries: [{}],
        },
      ],
    };
    expect(() => {
      calculateIsolinesResponseToFeatureCollection(input);
    }).toThrow(Error);
  });

  it("should return nested properties if flattenProperties = false", () => {
    const input: CalculateIsolinesResponse = {
      IsolineGeometryFormat: "FlexiblePolyline",
      PricingBucket: "bucket",
      Isolines: [
        {
          Connections: [
            {
              FromPolygonIndex: 0,
              Geometry: {
                Polyline: encodeFromLngLatArray([
                  [1, 2],
                  [3, 4],
                ]),
              },
              ToPolygonIndex: 1,
            },
          ],
          Geometries: [
            {
              PolylinePolygon: [
                encodeFromLngLatArray([
                  [0, 0],
                  [10, 0],
                  [10, 10],
                  [0, 10],
                  [0, 0],
                ]),
              ],
            },
          ],
          TimeThreshold: 1000,
        },
      ],
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "GeometryCollection",
            geometries: [
              {
                type: "Polygon",
                coordinates: [
                  [
                    [0, 0],
                    [10, 0],
                    [10, 10],
                    [0, 10],
                    [0, 0],
                  ],
                ],
              },
              {
                type: "LineString",
                coordinates: [
                  [1, 2],
                  [3, 4],
                ],
              },
            ],
          },
          properties: {
            TimeThreshold: 1000,
          },
        },
      ],
    };

    expect(calculateIsolinesResponseToFeatureCollection(input, { flattenProperties: false })).toEqual(expectedResult);
  });

  it("should return flattened properties if flattenProperties = true", () => {
    const input: CalculateIsolinesResponse = {
      IsolineGeometryFormat: "Simple",
      PricingBucket: "bucket",
      Isolines: [
        {
          Connections: [
            {
              FromPolygonIndex: 0,
              Geometry: {
                LineString: [
                  [1, 2],
                  [3, 4],
                ],
              },
              ToPolygonIndex: 1,
            },
          ],
          Geometries: [
            {
              Polygon: [
                [
                  [0, 0],
                  [10, 0],
                  [10, 10],
                  [0, 10],
                  [0, 0],
                ],
              ],
            },
          ],
          TimeThreshold: 1000,
        },
      ],
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "GeometryCollection",
            geometries: [
              {
                type: "Polygon",
                coordinates: [
                  [
                    [0, 0],
                    [10, 0],
                    [10, 10],
                    [0, 10],
                    [0, 0],
                  ],
                ],
              },
              {
                type: "LineString",
                coordinates: [
                  [1, 2],
                  [3, 4],
                ],
              },
            ],
          },
          properties: {
            TimeThreshold: 1000,
          },
        },
      ],
    };

    expect(calculateIsolinesResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(expectedResult);
  });

  it("should return a Polygon (not a GeometryCollection) if no LineString is produced", () => {
    const input: CalculateIsolinesResponse = {
      IsolineGeometryFormat: "FlexiblePolyline",
      PricingBucket: "bucket",
      Isolines: [
        {
          Connections: [],
          Geometries: [
            {
              PolylinePolygon: [
                encodeFromLngLatArray([
                  [0, 0],
                  [10, 0],
                  [10, 10],
                  [0, 10],
                  [0, 0],
                ]),
              ],
            },
          ],
          TimeThreshold: 1000,
        },
      ],
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [10, 0],
                [10, 10],
                [0, 10],
                [0, 0],
              ],
            ],
          },
          properties: {
            TimeThreshold: 1000,
          },
        },
      ],
    };

    expect(calculateIsolinesResponseToFeatureCollection(input, { flattenProperties: false })).toEqual(expectedResult);
  });
});

describe("optimizeWaypointsResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection if there are no waypoints", () => {
    const input: OptimizeWaypointsResponse = {
      Connections: [],
      Distance: 1,
      ImpedingWaypoints: [],
      Duration: 10,
      OptimizedWaypoints: [],
      PricingBucket: "price",
      TimeBreakdown: {
        RestDuration: 1,
        ServiceDuration: 2,
        TravelDuration: 3,
        WaitDuration: 4,
      },
    };
    expect(optimizeWaypointsResponseToFeatureCollection(input)).toEqual(emptyFeatureCollection());
  });

  it("should return nested properties if flattenProperties = false", () => {
    const input: OptimizeWaypointsResponse = {
      Connections: [],
      Distance: 1,
      ImpedingWaypoints: [
        {
          FailedConstraints: [
            {
              Constraint: "AccessHours",
              Reason: "Access hours constraint",
            },
          ],
          Id: "Waypoint1",
          Position: [1, 2],
        },
      ],
      Duration: 10,
      OptimizedWaypoints: [
        {
          ArrivalTime: "12:00",
          DepartureTime: "11:00",
          Id: "Waypoint0",
          Position: [3, 4],
        },
      ],
      PricingBucket: "price",
      TimeBreakdown: {
        RestDuration: 1,
        ServiceDuration: 2,
        TravelDuration: 3,
        WaitDuration: 4,
      },
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
          properties: {
            FeatureType: "ImpedingWaypoint",
            FailedConstraints: [
              {
                Constraint: "AccessHours",
                Reason: "Access hours constraint",
              },
            ],
            Id: "Waypoint1",
          },
        },
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
          properties: {
            FeatureType: "OptimizedWaypoint",
            ArrivalTime: "12:00",
            DepartureTime: "11:00",
            Id: "Waypoint0",
          },
        },
      ],
    };

    expect(optimizeWaypointsResponseToFeatureCollection(input, { flattenProperties: false })).toEqual(expectedResult);
  });

  it("should return flattened properties if flattenProperties = true", () => {
    const input: OptimizeWaypointsResponse = {
      Connections: [],
      Distance: 1,
      ImpedingWaypoints: [
        {
          FailedConstraints: [
            {
              Constraint: "AccessHours",
              Reason: "Access hours constraint",
            },
          ],
          Id: "Waypoint1",
          Position: [1, 2],
        },
      ],
      Duration: 10,
      OptimizedWaypoints: [
        {
          ArrivalTime: "12:00",
          DepartureTime: "11:00",
          Id: "Waypoint0",
          Position: [3, 4],
        },
      ],
      PricingBucket: "price",
      TimeBreakdown: {
        RestDuration: 1,
        ServiceDuration: 2,
        TravelDuration: 3,
        WaitDuration: 4,
      },
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
          properties: {
            FeatureType: "ImpedingWaypoint",
            "FailedConstraints.0.Constraint": "AccessHours",
            "FailedConstraints.0.Reason": "Access hours constraint",
            Id: "Waypoint1",
          },
        },
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
          properties: {
            FeatureType: "OptimizedWaypoint",
            ArrivalTime: "12:00",
            DepartureTime: "11:00",
            Id: "Waypoint0",
          },
        },
      ],
    };

    expect(optimizeWaypointsResponseToFeatureCollection(input, { flattenProperties: true })).toEqual(expectedResult);
  });
});

describe("snapToRoadsResponseToFeatureCollection", () => {
  it("should return empty FeatureCollection if nothing is requested", () => {
    const input: SnapToRoadsResponse = {
      Notices: [
        {
          Code: "TracePointsNotMatched",
          Title: "Notice",
          TracePointIndexes: [0, 1],
        },
      ],
      PricingBucket: "price",
      SnappedGeometry: {
        LineString: [
          [1, 2],
          [3, 4],
        ],
      },
      SnappedGeometryFormat: "Simple",
      SnappedTracePoints: [
        {
          Confidence: 20,
          OriginalPosition: [0.5, 1.5],
          SnappedPosition: [1, 2],
        },
        {
          Confidence: 80,
          OriginalPosition: [3.1, 4.1],
          SnappedPosition: [3, 4],
        },
      ],
    };
    expect(
      snapToRoadsResponseToFeatureCollection(input, {
        flattenProperties: false,
        includeSnappedGeometry: false,
        includeSnappedTracePointOriginalPositions: false,
        includeSnappedTracePointSnappedPositions: false,
        includeOriginalToSnappedPositionLines: false,
      }),
    ).toEqual(emptyFeatureCollection());
  });

  it("should return nested properties if flattenProperties = false", () => {
    const input: SnapToRoadsResponse = {
      Notices: [
        {
          Code: "TracePointsNotMatched",
          Title: "Notice",
          TracePointIndexes: [0, 1],
        },
      ],
      PricingBucket: "price",
      SnappedGeometry: {
        LineString: [
          [1, 2],
          [3, 4],
        ],
      },
      SnappedGeometryFormat: "Simple",
      SnappedTracePoints: [
        {
          Confidence: 20,
          OriginalPosition: [0.5, 1.5],
          SnappedPosition: [1, 2],
        },
        {
          Confidence: 80,
          OriginalPosition: [3.1, 4.1],
          SnappedPosition: [3, 4],
        },
      ],
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "LineString",
            coordinates: [
              [1, 2],
              [3, 4],
            ],
          },
          properties: {
            FeatureType: "SnappedGeometry",
            Notices: [
              {
                Code: "TracePointsNotMatched",
                Title: "Notice",
                TracePointIndexes: [0, 1],
              },
            ],
            PricingBucket: "price",
          },
        },
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Point",
            coordinates: [0.5, 1.5],
          },
          properties: {
            FeatureType: "SnappedTracePointOriginalPosition",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 2,
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
          properties: {
            FeatureType: "SnappedTracePointSnappedPosition",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 3,
          geometry: {
            type: "LineString",
            coordinates: [
              [0.5, 1.5],
              [1, 2],
            ],
          },
          properties: {
            FeatureType: "OriginalToSnappedPositionLine",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 4,
          geometry: {
            type: "Point",
            coordinates: [3.1, 4.1],
          },
          properties: {
            FeatureType: "SnappedTracePointOriginalPosition",
            Confidence: 80,
          },
        },
        {
          type: "Feature",
          id: 5,
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
          properties: {
            FeatureType: "SnappedTracePointSnappedPosition",
            Confidence: 80,
          },
        },
        {
          type: "Feature",
          id: 6,
          geometry: {
            type: "LineString",
            coordinates: [
              [3.1, 4.1],
              [3, 4],
            ],
          },
          properties: {
            FeatureType: "OriginalToSnappedPositionLine",
            Confidence: 80,
          },
        },
      ],
    };

    expect(
      snapToRoadsResponseToFeatureCollection(input, {
        flattenProperties: false,
        includeSnappedGeometry: true,
        includeSnappedTracePointOriginalPositions: true,
        includeSnappedTracePointSnappedPositions: true,
        includeOriginalToSnappedPositionLines: true,
      }),
    ).toEqual(expectedResult);
  });

  it("should return flattened properties if flattenProperties = true", () => {
    const input: SnapToRoadsResponse = {
      Notices: [
        {
          Code: "TracePointsNotMatched",
          Title: "Notice",
          TracePointIndexes: [0, 1],
        },
      ],
      PricingBucket: "price",
      SnappedGeometry: {
        LineString: [
          [1, 2],
          [3, 4],
        ],
      },
      SnappedGeometryFormat: "Simple",
      SnappedTracePoints: [
        {
          Confidence: 20,
          OriginalPosition: [0.5, 1.5],
          SnappedPosition: [1, 2],
        },
        {
          Confidence: 80,
          OriginalPosition: [3.1, 4.1],
          SnappedPosition: [3, 4],
        },
      ],
    };

    const expectedResult: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: 0,
          geometry: {
            type: "LineString",
            coordinates: [
              [1, 2],
              [3, 4],
            ],
          },
          properties: {
            FeatureType: "SnappedGeometry",
            "Notices.0.Code": "TracePointsNotMatched",
            "Notices.0.Title": "Notice",
            "Notices.0.TracePointIndexes.0": 0,
            "Notices.0.TracePointIndexes.1": 1,
            PricingBucket: "price",
          },
        },
        {
          type: "Feature",
          id: 1,
          geometry: {
            type: "Point",
            coordinates: [0.5, 1.5],
          },
          properties: {
            FeatureType: "SnappedTracePointOriginalPosition",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 2,
          geometry: {
            type: "Point",
            coordinates: [1, 2],
          },
          properties: {
            FeatureType: "SnappedTracePointSnappedPosition",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 3,
          geometry: {
            type: "LineString",
            coordinates: [
              [0.5, 1.5],
              [1, 2],
            ],
          },
          properties: {
            FeatureType: "OriginalToSnappedPositionLine",
            Confidence: 20,
          },
        },
        {
          type: "Feature",
          id: 4,
          geometry: {
            type: "Point",
            coordinates: [3.1, 4.1],
          },
          properties: {
            FeatureType: "SnappedTracePointOriginalPosition",
            Confidence: 80,
          },
        },
        {
          type: "Feature",
          id: 5,
          geometry: {
            type: "Point",
            coordinates: [3, 4],
          },
          properties: {
            FeatureType: "SnappedTracePointSnappedPosition",
            Confidence: 80,
          },
        },
        {
          type: "Feature",
          id: 6,
          geometry: {
            type: "LineString",
            coordinates: [
              [3.1, 4.1],
              [3, 4],
            ],
          },
          properties: {
            FeatureType: "OriginalToSnappedPositionLine",
            Confidence: 80,
          },
        },
      ],
    };

    expect(
      snapToRoadsResponseToFeatureCollection(input, {
        flattenProperties: true,
        includeSnappedGeometry: true,
        includeSnappedTracePointOriginalPositions: true,
        includeSnappedTracePointSnappedPositions: true,
        includeOriginalToSnappedPositionLines: true,
      }),
    ).toEqual(expectedResult);
  });
});
