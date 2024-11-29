import { kmlStringToRoadSnapTracePointList } from "./tracepoints-converter";

describe("kmlStringToRoadSnapTracePointList", () => {
  it("should convert kml string with point placemarks to RoadSnapTracePointList", () => {
    const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/kml/2.2 ogckml22.xsd">
        <Document><name>Sample Frankfurt KML Trace</name> 
          <Placemark><Point><coordinates>8.64914,50.20346,0.0 </coordinates></Point></Placemark>
          <Placemark><Point><coordinates>8.64861,50.20319,0.0 </coordinates></Point></Placemark>
        </Document>
      </kml>`;

    expect(kmlStringToRoadSnapTracePointList(kmlString)).toEqual([
      {
        Position: [8.64914, 50.20346],
      },
      {
        Position: [8.64861, 50.20319],
      },
    ]);
  });
  it("should convert kml string with linestring placemarks to RoadSnapTracePointList", () => {
    const kmlString = `<?xml version="1.0" encoding="UTF-8"?>
      <kml xmlns="http://www.opengis.net/kml/2.2">
        <Document>
          <name>Sample LineString Path</name>
          <description>A simple path with three points</description>
          <Placemark>
            <name>Path Example</name>
            <description>This is a sample path</description>
            <LineString>
              <extrude>1</extrude>
              <tessellate>1</tessellate>
              <altitudeMode>relativeToGround</altitudeMode>
              <coordinates>
                -122.364383,37.824664,0
                -122.364152,37.824322,0
                -122.363932,37.824240,0
              </coordinates>
            </LineString>
          </Placemark>
        </Document>
      </kml>`;

    expect(kmlStringToRoadSnapTracePointList(kmlString)).toEqual([
      {
        Position: [-122.364383, 37.824664],
      },
      {
        Position: [-122.364152, 37.824322],
      },
      {
        Position: [-122.363932, 37.82424],
      },
    ]);
  });
});
