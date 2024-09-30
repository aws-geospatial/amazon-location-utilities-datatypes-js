// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { CalculateRoutesResponse } from "@aws-sdk/client-georoutes";
import { calculateRoutesResponseToFeatureCollections } from "./georoutes-converter";
import { FeatureCollection } from "geojson";
import { emptyFeatureCollection } from "./utils";
import { encodeFromLngLatArray } from "@aws-geospatial/polyline";

describe("calculateRoutesResponseToFeatureCollections", () => {
  it("should return empty FeatureCollection if Legs are missing geometry", () => {
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
    expect(calculateRoutesResponseToFeatureCollections(input)).toEqual([emptyFeatureCollection()]);
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

    expect(calculateRoutesResponseToFeatureCollections(input)).toEqual(expectedResult);
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
                AfterTravelSteps: [],
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
                AfterTravelSteps: [],
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

    expect(calculateRoutesResponseToFeatureCollections(input)).toEqual(expectedResult);
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
                AfterTravelSteps: [],
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
                AfterTravelSteps: [],
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
              FeatureType: "TravelStep",
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
        includeSpanLines: true,
        includeTravelStepLines: true,
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
              FeatureType: "TravelStep",
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
        includeSpanLines: true,
        includeTravelStepLines: true,
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
        includeSpanLines: true,
        includeTravelStepLines: true,
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
                AfterTravelSteps: [],
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
                AfterTravelSteps: [],
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
        includeLegLines: true,
        includeTravelStepLines: false,
        includeSpanLines: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return travel step lines if includeTravelStepLines = true", () => {
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
                AfterTravelSteps: [],
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
              FeatureType: "TravelStep",
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
              FeatureType: "TravelStep",
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
        includeLegLines: false,
        includeTravelStepLines: true,
        includeSpanLines: false,
        includeTravelStepStartPositions: false,
        includeLegArrivalDeparturePositions: false,
      }),
    ).toEqual(expectedResult);
  });

  it("should return span lines if includeSpanLines = true", () => {
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
                AfterTravelSteps: [],
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
        includeLegLines: false,
        includeTravelStepLines: false,
        includeSpanLines: true,
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
                AfterTravelSteps: [],
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
              FeatureType: "TravelStep",
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
              FeatureType: "TravelStep",
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
              FeatureType: "TravelStep",
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
        includeLegLines: false,
        includeTravelStepLines: false,
        includeSpanLines: false,
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
                AfterTravelSteps: [],
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
        includeLegLines: false,
        includeTravelStepLines: false,
        includeSpanLines: false,
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
                AfterTravelSteps: [],
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
        includeLegLines: false,
        includeTravelStepLines: false,
        includeSpanLines: false,
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
                AfterTravelSteps: [],
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
              FeatureType: "TravelStep",
              Type: "Depart",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 4,
            geometry: {
              type: "Point",
              coordinates: [1, 2],
            },
            properties: {
              FeatureType: "TravelStep",
              Type: "Depart",
              Duration: 1,
            },
          },
          {
            type: "Feature",
            id: 5,
            geometry: {
              type: "LineString",
              coordinates: [
                [3, 4],
                [5, 6],
                [7, 8],
              ],
            },
            properties: {
              FeatureType: "TravelStep",
              Type: "Continue",
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
              FeatureType: "TravelStep",
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
              FeatureType: "TravelStep",
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
        ],
      },
    ];

    expect(
      calculateRoutesResponseToFeatureCollections(input, {
        flattenProperties: true,
        includeLegLines: true,
        includeTravelStepLines: true,
        includeSpanLines: true,
        includeTravelStepStartPositions: true,
        includeLegArrivalDeparturePositions: true,
      }),
    ).toEqual(expectedResult);
  });
});
