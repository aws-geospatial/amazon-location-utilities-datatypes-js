import { gpxToRoadSnapTracePointList } from "./tracepoints-converter";

describe("gpxToRoadSnapTracePointList", () => {
  it("should convert gpx string to RoadSnapTracePointList", () => {
    const gpxString = `<?xml version="1.0" encoding="UTF-8"?>
      <gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:gte="http://www.gpstrackeditor.com/xmlschemas/General/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3" targetNamespace="http://www.topografix.com/GPX/1/1" elementFormDefault="qualified" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
        <metadata>
            <name>sample_rome.gpx</name>
            <desc>Sample data</desc>
        </metadata>
        <trk>
            <name>Rome</name>
            <trkseg>
                <trkpt lat="41.899689" lon="12.419255"> <extensions><speed>10</speed></extensions> <time>2013-07-15T10:24:52Z</time>
                </trkpt>
                <trkpt lat="41.900891" lon="12.420505"> <extensions><speed>10</speed></extensions> <time>2013-07-15T10:24:52Z</time>
                </trkpt>
            </trkseg>
        </trk>
      </gpx>`;

    expect(gpxToRoadSnapTracePointList(gpxString)).toEqual([
      {
        Position: [12.419255, 41.899689],
        Speed: 36,
        Timestamp: "2013-07-15T10:24:52Z",
      },
      {
        Position: [12.420505, 41.900891],
        Speed: 36,
        Timestamp: "2013-07-15T10:24:52Z",
      },
    ]);
  });
});
