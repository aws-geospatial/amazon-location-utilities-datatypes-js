# Amazon Location Utilities - Data Types for JavaScript

Utilities to translate geospatial data types used by [Amazon Location Service](https://aws.amazon.com/location/) from / to well-known geospatial data types such as GeoJSON.

# Installation

Install this library from NPM for usage with modules:

```
npm install @aws/amazon-location-utilities-datatypes
```

Importing in an HTML file for usage directly in the browser:

```html
<script src="TBA"></script>
```

# Usage

Import the library and call the utility functions in the top-level namespace as needed. You can find more details about these functions in the [Documentation](#documentation) section.

The examples below show how you can translate an Amazon Location [SearchPlaceIndexForText](https://docs.aws.amazon.com/location/latest/APIReference/API_SearchPlaceIndexForText.html) response from the [AWS JavaScript SDK](https://aws.amazon.com/sdk-for-javascript/) to a GeoJSON FeatureCollection:

### Usage with modules

This example uses [V3](https://github.com/aws/aws-sdk-js-v3) of the AWS JavaScript SDK.

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

This example uses [V2](https://github.com/aws/aws-sdk-js) of the AWS JavaScript SDK. Importing the AWS JavaScript SDK through a browser script is only possible with V2 of the SDK.

Utility functions will be within `amazonLocationDataConverter`.

```html
<!-- Importing AWS JavaScript SDK V2 -->
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1401.0.min.js"></script>
<!-- Importing the utility library from an HTML file -->
<script src="TBA"></script>
```

```javascript
const location = new AWS.Location(options);
const params = { ... };
location.searchPlaceIndexForText(params, function (err, data) {
  // Calling this utility function to convert the data to GeoJSON
  const featureCollection = amazonLocationDataConverter.placeToFeatureCollection(data);
});
```

# Documentation

Detailed documentation can be found under `/docs/index.html` after generating it by running:

```
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

```javascript
const response = { ... };
const featureCollection = placeToFeatureCollection(response)
```

### routeToFeatureCollection

Converts a [route](https://docs.aws.amazon.com/location/latest/developerguide/route-concepts.html) to a GeoJSON FeatureCollection with a single MultiLineString Feature. Each LineString entry of the MultiLineString represents a leg of the route.

```javascript
const response = { ... };
const featureCollection = routeToFeatureCollection(response)
```

## Error Handling

If the data provided to the utility functions are invalid, the entries in the data will be skipped.

Examples:

- A FeatureCollection containing a Feature of a non-polygon type when calling `featureCollectionToGeofence` will result in a set of geofence entries that do not contain that Feature.
- An input to `devicePositionsToFeatureCollection` with an device position entry that does not contain the coordinates of the device will result in a FeatureCollection with that device position entry skipped.

# Getting Help

The best way to interact with our team is through GitHub.
You can [open an issue](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new/choose) and choose from one of our templates for
[bug reports](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=bug%2C+needs-triage&template=---bug-report.md&title=),
[feature requests](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=feature-request&template=---feature-request.md&title=)
or [guidance](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/issues/new?assignees=&labels=guidance%2C+needs-triage&template=---questions---help.md&title=).
If you have a support plan with [AWS Support](https://aws.amazon.com/premiumsupport/), you can also create a new support case.

Please make sure to check out our resources too before opening an issue:

- Our [Changelog](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/master/CHANGELOG.md) for recent changes.

# Contributing

We welcome community contributions and pull requests. See [CONTRIBUTING.md](https://github.com/aws-geospatial/amazon-location-utilities-datatypes-js/blob/master/CONTRIBUTING.md) for information on how to set up a development environment and submit code.

# License

Amazon Location Utilities - Data Types for JavaScript is distributed under the
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0),
see LICENSE.txt and NOTICE.txt for more information.
