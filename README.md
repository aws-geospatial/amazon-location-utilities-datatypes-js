# Amazon Location Utilities - Data Types for JavaScript

Utilities to translate geospatial data types used by [Amazon Location Service](https://aws.amazon.com/location/) from / to well-known geospatial data types such as GeoJSON.

# Installation

Install this library from NPM:

```
npm install @aws/amazon-location-utilities-datatypes
```

# Getting Started

## Import

Import the translating utility to be used. The [documentation](#documentation) shows all of the the available utilities.

```
import { placeToFeatureCollection } from '@aws/amazon-location-utilities-datatypes'
```

## Usage

Translating an Amazon Location [SearchPlaceIndexForText](https://docs.aws.amazon.com/location/latest/APIReference/API_SearchPlaceIndexForText.html) response from the [AWS JavaScript SDK](https://github.com/aws/aws-sdk-js-v3) to a GeoJSON FeatureCollection.

```
const client = new LocationClient(config);
const input = { ... };
const command = new SearchPlaceIndexForTextCommand(input);
const response = await client.send(command);
const featureCollection = placeToFeatureCollection(response);
```

# Documentation

Detailed documentation can be found under `/docs/index.html` after generating it by running:

```
npm run typedoc
```

## GeoJSON to Amazon Location

**featureCollectionToGeofence**

Converts a FeatureCollection with Polygon Features to an array of BatchPutGeofenceRequestEntry, so the result can be used to assemble the request to BatchPutGeofence.

```
const featureCollection = { ... };
const request = {
  CollectionName: "<Geofence Collection Name>",
  Entries: featureCollectionToGeofence(featureCollection),
};
```

## Amazon Location to GeoJSON

**devicePositionsToFeatureCollection**

Converts tracker responses to a FeatureCollection with Point Features. It converts:

1. GetDevicePositionResponse to a FeatureCollection with a single feature.
2. BatchGetDevicePositionResponse, GetDevicePositionHistoryResponse, ListDevicePositionsResponse to a FeatureCollection with features corresponding to the entries in the response.

```
const response = { ... };
const featureCollection = devicePositionsToFeatureCollection(response)
```

**geofencesToFeatureCollection**

Converts a list of geofences to FeatureCollection with Polygon Features. It can convert geofences both in the response and the request, so it can also help preview geofences on the map before uploading with PutGeofence or BatchPutGeofence. It converts:

1. A Polygon Geofence to a Feature with such Polygon
2. A Circle Geofence to a Feature with approximated Polygon with `Center` and `Radius` properties.

```
const response = { ... };
const featureCollection = geofencesToFeatureCollection(response)
```

**placeToFeatureCollection**

Converts place responses to a FeatureCollection with Point Features. It converts:

1. GetPlaceResponse to a FeatureCollection with a single feature.
2. SearchPlaceIndexForPositionResponse, SearchPlaceIndexForTextResponse to a FeatureCollection with features corresponding to the entries in the response.

```
const response = { ... };
const featureCollection = placeToFeatureCollection(response)
```

**routeToFeatureCollection**

Converts a route to a GeoJSON FeatureCollection with a single MultiStringLine Feature, each LineString entry of such MultiLineString represents a leg of the route.

```
const response = { ... };
const featureCollection = routeToFeatureCollection(response)
```

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
