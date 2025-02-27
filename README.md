# Amazon Location Utilities - Data Types for JavaScript

Utilities to translate geospatial data types used by [Amazon Location Service](https://aws.amazon.com/location/) from / to well-known geospatial data types such as GeoJSON.

## Installation

Install this library from NPM for usage with modules:

```shell
npm install @aws/amazon-location-utilities-datatypes
```

Importing in an HTML file for usage directly in the browser.

```html
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-utilities-datatypes@1"></script>
```

## Usage

Import the library and call the utility functions in the top-level namespace as needed. You can find more details about these functions in the [Documentation](#documentation) section.

The examples below show how you can translate an Amazon Location [SearchPlaceIndexForText](https://docs.aws.amazon.com/location/latest/APIReference/API_SearchPlaceIndexForText.html) response from the [AWS JavaScript SDK](https://aws.amazon.com/sdk-for-javascript/) to a GeoJSON FeatureCollection:

### Usage with modules

This example uses the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3).

```javascript
// Importing AWS JavaScript SDK V3
import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
// Importing the utility function
import { placeToFeatureCollection } from '@aws/amazon-location-utilities-datatypes'

const client = new LocationClient(config);
const input = { ... };
const command = new SearchPlaceIndexForTextCommand(input);
const response = await client.send(command);

// Calling this utility function to convert the response to GeoJSON
const featureCollection = placeToFeatureCollection(response);
```

### Usage with the browser

This example uses the Amazon Location Client. The Amazon Location Client is based on the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3), which allows the use of making calls to Amazon Location through the script added into the HTML file.

Utility functions will be within `amazonLocationDataConverter`.

```html
<!-- Import the Amazon Location Client -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-client@1"></script>
<!-- Import the utility library -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-utilities-datatypes@1"></script>
```

```javascript
const client = new amazonLocationClient.LocationClient(config);
const input = { ... };
const command = new amazonLocationClient.SearchPlaceIndexForTextCommand(input);
const response = await client.send(command);

// Calling this utility function to convert the response to GeoJSON
const featureCollection = amazonLocationDataConverter.placeToFeatureCollection(response);
```

## Documentation

Detailed documentation can be found under `/docs/index.html` after generating it by running:

```shell
npm run typedoc
```

## GeoJSON to Amazon Location Data Types

### featureCollectionToGeofence

Converts a GeoJSON FeatureCollection with Polygon Features to an array of BatchPutGeofenceRequestEntry, so the result can be used to assemble the request to BatchPutGeofence.

```javascript
const featureCollection = { ... };
const request = {
  CollectionName: "<Geofence Collection Name>",
  Entries: featureCollectionToGeofence(featureCollection),
};
```

### featureCollectionToRoadSnapTracePointList

Converts a GeoJSON FeatureCollection with Point Features to an array of RoadSnapTracePoint, so the result can be used to assemble the request to SnapToRoads API.

```javascript
const featureCollection = { ... };
const request = {
  Tracepoints: featureCollectionToRoadSnapTracePointList(featureCollection),
};
```

## CSV to Amazon Location Data Types

### csvStringToRoadSnapTracePointList

Converts a CSV string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to SnapToRoads API.
The first line contains the attribute names, the subsequent lines the data in temporal order.

```javascript
const csvString = "....";
const request = {
  Tracepoints: csvStringToRoadSnapTracePointList(csvString),
};
```

## GPX to Amazon Location Data Types

### gpxToRoadSnapTracePointList

Converts a GPX string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to SnapToRoads API.

```javascript
const gpxString = "....";
const request = {
  Tracepoints: gpxToRoadSnapTracePointList(gpxString),
};
```

## KML to Amazon Location Data Types

### kmlStringToRoadSnapTracePointList

Converts a KML string to an array of RoadSnapTracePoint, so the result can be used to assemble the request to SnapToRoads API.

```javascript
const kmlString = "....";
const request = {
  Tracepoints: kmlStringToRoadSnapTracePointList(kmlString),
};
```

## NMEA to Amazon Location Data Types

### nmeaStringToRoadSnapTracePointList

Converts a NMEA string containing $GPRMC and/or $GPGGA records to an array of RoadSnapTracePoint, so the result can be
used to assemble the request to SnapToRoads API.

```javascript
const nmeaString = "....";
const request = {
  Tracepoints: nmeaStringToRoadSnapTracePointList(nmeaString),
};
```

## Flexible Polyline to Amazon Location Data Types

### flexiblePolylineStringToRoadSnapTracePointList

Converts a Flexible Polyline string to an array of RoadSnapTracePoint, so the result can be used to assemble the request
to SnapToRoads API.

```javascript
const flexiblePolylineString = "....";
const request = {
  Tracepoints: flexiblePolylineStringToRoadSnapTracePointList(flexiblePolylineString),
};
__;
```

## Amazon Location Data Types to GeoJSON

### devicePositionsToFeatureCollection

Converts [tracker](https://docs.aws.amazon.com/location/latest/developerguide/geofence-tracker-concepts.html#tracking-overview) responses to a FeatureCollection with Point Features. It converts:

1. GetDevicePositionResponse to a FeatureCollection with a single feature.
2. BatchGetDevicePositionResponse, GetDevicePositionHistoryResponse, ListDevicePositionsResponse to a FeatureCollection with features corresponding to the entries in the response.

```javascript
const response = { ... };
const featureCollection = devicePositionsToFeatureCollection(response)
```

### geofencesToFeatureCollection

Converts a list of [geofences](https://docs.aws.amazon.com/location/latest/developerguide/geofence-tracker-concepts.html#geofence-overview) to FeatureCollection with Polygon Features. It can convert geofences both in the response and the request, so it can also help preview geofences on the map before uploading with PutGeofence or BatchPutGeofence. It converts:

1. A Polygon Geofence to a Feature with such Polygon
2. A Circle Geofence to a Feature with approximated Polygon with `Center` and `Radius` properties.

```javascript
const response = { ... };
const featureCollection = geofencesToFeatureCollection(response)
```

### placeToFeatureCollection

Converts [places search](https://docs.aws.amazon.com/location/latest/developerguide/places-concepts.html) responses to a FeatureCollection with Point Features. It converts:

1. GetPlaceResponse to a FeatureCollection with a single feature.
2. SearchPlaceIndexForPositionResponse, SearchPlaceIndexForTextResponse to a FeatureCollection with features corresponding to the entries in the response.
3. The flattenProperties option will flatten the JSON response in properties.This option is mainly used when retrieving "MapLibre GL JS" attributes.

```javascript
const response = { ... };
const featureCollection = placeToFeatureCollection(response)
```

```javascript
const response = { ... };
const featureCollection = placeToFeatureCollection(response, {
    flattenProperties: true
});
```

### routeToFeatureCollection

Converts a [route](https://docs.aws.amazon.com/location/latest/developerguide/route-concepts.html) to a GeoJSON FeatureCollection with a single MultiLineString Feature. Each LineString entry of the MultiLineString represents a leg of the route.

The flattenProperties option will flatten the JSON response in properties.This option is mainly used when retrieving "MapLibre GL JS" attributes.

```javascript
const response = { ... };
const featureCollection = routeToFeatureCollection(response)
```

```javascript
const response = { ... };
const featureCollection = routeToFeatureCollection(response, {
    flattenProperties: true
});
```

## Amazon Location GeoPlaces Data Types to GeoJSON

### geocodeResponseToFeatureCollection

Converts a Geocode response from the standalone Places SDK to a FeatureCollection with Point
Features. Only result items with location information will appear in the FeatureCollection.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = geocodeResponseToFeatureCollection(response)
```

### getPlaceResponseToFeatureCollection

Converts a GetPlace response from the standalone Places SDK to a FeatureCollection with a Point
Feature. If the response has no location information, an empty FeatureCollection will be returned.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = getPlaceResponseToFeatureCollection(response)
```

### reverseGeocodeResponseToFeatureCollection

Converts a ReverseGeocode response from the standalone Places SDK to a FeatureCollection with Point
Features. Only result items with location information will appear in the FeatureCollection.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = reverseGeocodeResponseToFeatureCollection(response)
```

### searchNearbyResponseToFeatureCollection

Converts a SearchNearby response from the standalone Places SDK to a FeatureCollection with Point
Features. Only result items with location information will appear in the FeatureCollection.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = searchNearbyResponseToFeatureCollection(response)
```

### searchTextResponseToFeatureCollection

Converts a SearchText response from the standalone Places SDK to a FeatureCollection with Point
Features. Only result items with location information will appear in the FeatureCollection.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = searchTextResponseToFeatureCollection(response)
```

### suggestResponseToFeatureCollection

Converts a Suggest response from the standalone Places SDK to a FeatureCollection with Point
Features. Only result items with location information will appear in the FeatureCollection.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

```javascript
const response = { ... };
const featureCollection = suggestResponseToFeatureCollection(response)
```

## Amazon Location GeoRoutes Data Types to GeoJSON

### calculateRoutesResponseToFeatureCollection

This converts a CalculateRoutesResponse from the standalone Routes SDK to an array of GeoJSON FeatureCollections, one for each route in the
response. Route responses contain multiple different types of geometry in the response, so the conversion is
configurable to choose which features should be in the resulting GeoJSON. Each GeoJSON Feature contains properties
from that portion of the response along with any child arrays/structures. It will not contain properties from any
parent structures. So for example, with Route->Leg->TravelSteps, a converted Leg feature will contain properties for
everything on Leg and everything in TravelSteps, but it won't contain any properties from Route.

Each Feature contains a `FeatureType` property that can be used to distinguish between the types of features if
multiple are requested during the conversion:

- `Leg`: A travel leg of the route. (LineString)
- `Span`: A span within a travel leg. (LineString)
- `TravelStepGeometry`: A travel step line within a travel leg. (LineString)
- `TravelStepStartPosition`: The start position of a travel step within a travel leg. (Point)
- `Arrival`: The arrival position of a travel leg. (Point)
- `Departure`: The departure position of a travel leg. (Point)

Each FeatureCollection may contain a mixture of LineString and Point features, depending on the conversion options
provided.

Any feature that is missing its geometry in the response or has invalid geometry will throw an Error().

The API optionally accepts the following conversion flags:

- `flattenProperties`: flatten nested properties in the response (default: true)
- `includeLegs`: include the Leg features (default: true)
- `includeSpans`: include the Span features (default: false)
- `includeTravelStepGeometry`: include the TravelStepGeometry features (default: false)
- `includeTravelStepStartPositions`: include the TravelStepStartPosition features (default: false)
- `includeLegArrivalDeparturePositions`: include the Arrival and Departure features (default: false)

```javascript
const response = { ... };
const featureCollections = calculateRoutesResponseToFeatureCollections(response)
```

### calculateIsolinesResponseToFeatureCollection

This converts a CalculateIsolineResponse from the standalone Routes SDK to a GeoJSON
FeatureCollection which contains one Feature for each isoline in the response. Isolines can contain
both polygons for isoline regions and lines for connectors between regions (such as ferry travel),
so each Feature contains either a GeometryCollection with a mix of Polygons and LineStrings or a
single Polygon. The `flattenProperties` option will flatten the nested response data into a flat
properties list. This option is enabled by default, as it makes the data easier to use from within
MapLibre expressions.

Any feature that is missing its geometry in the response or has invalid geometry will throw an Error().

```javascript
const response = { ... };
const featureCollection = calculateIsolinesResponseToFeatureCollection(response)
```

### optimizeWaypointsResponseToFeatureCollection

This converts an OptimizeWaypointsResponse from the standalone Routes SDK to a GeoJSON FeatureCollection which contains one Feature for each
waypoint in the response. The response can contain either impeding waypoints or optimized waypoints.
The `flattenProperties` option will flatten the nested response data into a flat properties list.
This option is enabled by default, as it makes the data easier to use from within MapLibre expressions.

Each Feature contains a `FeatureType` property that can be used to distinguish between the types of features:

- `ImpedingWaypoint`: A waypoint that impedes the optimization request.
- `OptimizedWaypoint`: An optimized waypoint in a successful optimization request.

```javascript
const response = { ... };
const featureCollection = optimizeWaypointsResponseToFeatureCollection(response)
```

### snapToRoadsResponseToFeatureCollection

This converts a SnapToRoadsResponse from the standalone Routes SDK to a GeoJSON FeatureCollection. The FeatureCollection may optionally contain any
combination of the snapped route geometry, the original trace points, the snapped trace points, and lines that
connect the original trace points to their snapped trace points.

Each Feature contains a `FeatureType` property that can be used to distinguish between the types of features if
multiple are requested during the conversion:

- `SnappedGeometry`: The snapped route geometry. (LineString)
- `SnappedTracePointOriginalPosition`: The original submitted trace point. (Point)
- `SnappedTracePointSnappedPosition`: The snapped trace point. (Point)
- `OriginalToSnappedPositionLine`: A line from the original trace point to the corresponding snapped trace point. (LineString)

The API optionally accepts the following conversion flags:

- `flattenProperties`: flatten nested properties in the response (default: true)
- `includeSnappedGeometry`: include the snapped route geometry features (default: true)
- `includeSnappedTracePointOriginalPositions`: include the original trace point features (default: false)
- `includeSnappedTracePointSnappedPositions`: include the snapped trace point features (default: false)
- `includeOriginalToSnappedPositionLines`: include the trace point connector line features (default: false)

```javascript
const response = { ... };
const featureCollection = snapToRoadsResponseToFeatureCollection(response)
```

## GeoJSON Utilities

### convertToPointFeatureCollection

Converts GeoJSON Point or LineString features to a FeatureCollection of Points. This utility function is particularly
useful when you need to convert complex geometries to individual points while preserving or transforming feature properties.

```typescript
const feature = {
  type: "Feature",
  geometry: {
    type: "LineString",
    coordinates: [
      [-122.4194, 37.7749],
      [-122.4201, 37.775],
    ],
  },
  properties: { timestamp: "2024-01-01T00:00:00Z" },
};
```

- Using default property handling (preserves existing properties or defaults to {})
  ```typescript
  const pointCollection = convertToPointFeatureCollection(feature);
  ```
- Custom property transformation
  ```typescript
  const pointCollectionWithCustomProps = convertToPointFeatureCollection(feature, (properties, index) => ({
    ...properties,
    pointNumber: index,
  }));
  ```

## Error Handling

If the data provided to the utility functions are invalid, the entries in the data will be skipped.

Examples:

- A FeatureCollection containing a Feature of a non-polygon type when calling `featureCollectionToGeofence` will result in a set of geofence entries that do not contain that Feature.
- An input to `devicePositionsToFeatureCollection` with an device position entry that does not contain the coordinates of the device will result in a FeatureCollection with that device position entry skipped.

The GeoRoutes converters will additionally throw an Error() if the geometry in the passed-in response is invalid.

## Getting Help

The best way to interact with our team is through GitHub.
You can [open an issue](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new/choose) and choose from one of our templates for
[bug reports](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=bug%2C+needs-triage&template=---bug-report.md&title=),
[feature requests](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=feature-request&template=---feature-request.md&title=)
or [guidance](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=guidance%2C+needs-triage&template=---questions---help.md&title=).
If you have a support plan with [AWS Support](https://aws.amazon.com/premiumsupport/), you can also create a new support case.

Please make sure to check out our resources too before opening an issue:

- Our [Changelog](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/master/CHANGELOG.md) for recent changes.

## Contributing

We welcome community contributions and pull requests. See [CONTRIBUTING.md](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/master/CONTRIBUTING.md) for information on how to set up a development environment and submit code.

## License

Amazon Location Utilities - Data Types for JavaScript is distributed under the
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0),
see LICENSE.txt and NOTICE.txt for more information.
