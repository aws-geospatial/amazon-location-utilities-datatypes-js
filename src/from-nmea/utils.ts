import { RoadSnapTracePoint } from "@aws-sdk/client-geo-routes";

/**
 * PIVOT_YEAR is used to interpret two-digit years in NMEA date strings. Years less than PIVOT_YEAR are assumed to be in
 * the 2000s, while years greater than or equal to PIVOT_YEAR are assumed to be in the 1900s.
 *
 * For example, with PIVOT_YEAR set to 80:
 *
 * - "79" would be interpreted as 2079
 * - "80" would be interpreted as 1980
 *
 * This helps handle the Y2K problem in older NMEA data formats.
 */
const PIVOT_YEAR = 80;

export function parseGPRMC(record: string): RoadSnapTracePoint | null {
  const parts = record.split(",");

  if (parts.length < 12) {
    throw new Error("Invalid GPRMC record: not enough fields");
  }

  // Field order in GPRMC:
  // 0: identifier (skipped)
  // 1: time
  // 2: status (skipped)
  // 3: latitude
  // 4: latitude direction (N/S)
  // 5: longitude
  // 6: longitude direction (E/W)
  // 7: speed in knots
  // 8: track (skipped)
  // 9: date
  // 10: magnetic variation (skipped)
  // 11: variation direction (skipped)
  const [, timeStr, , latitudeStr, latitudeDir, longitudeStr, longitudeDir, speedStr, , dateStr, , ,] = parts;

  const latitude = parseLatitude(latitudeStr, latitudeDir);
  const longitude = parseLongitude(longitudeStr, longitudeDir);

  if (latitude === null || longitude === null) {
    console.error("Invalid GPRMC record: invalid coordinates");
    return null;
  }

  const roadSnapTracePoint = { Position: [longitude, latitude] };

  if (timeStr && dateStr) {
    const timestamp = convertToISOTime(dateStr, timeStr);
    roadSnapTracePoint["Timestamp"] = timestamp;
  }
  if (speedStr) {
    const speed = parseFloat(speedStr);
    if (isNaN(speed)) {
      console.error(`"Invalid GPRMC record: invalid speed`);
    } else {
      roadSnapTracePoint["Speed"] = speed * 1.852; // convert knots to km/h
    }
  }

  return roadSnapTracePoint;
}

export function parseGPGGA(record: string): RoadSnapTracePoint | null {
  const parts = record.split(",");

  if (parts.length < 14) {
    throw new Error("Invalid GPGGA record: not enough fields");
  }

  // Field order in GPGGA:
  // 0: identifier (skipped)
  // 1: time (skipped - no date info available)
  // 2: latitude
  // 3: latitude direction (N/S)
  // 4: longitude
  // 5: longitude direction (E/W)
  // 6-13: various fields (skipped) including:
  //   - fix quality
  //   - number of satellites
  //   - HDOP
  //   - altitude and unit
  //   - geoid height and unit
  //   - DGPS update time
  //   - DGPS station ID
  const [, , latitudeStr, latitudeDir, longitudeStr, longitudeDir, , , , , , , , , ,] = parts;

  const latitude = parseLatitude(latitudeStr, latitudeDir);
  const longitude = parseLongitude(longitudeStr, longitudeDir);

  if (latitude === null || longitude === null) {
    console.error("Invalid GPRMC record: invalid coordinates");
    return null;
  }

  return { Position: [longitude, latitude] };
}

function parseLatitude(coord: string, direction: string): number {
  if (!coord || !direction) {
    console.error("Invalid coordinate: missing latitude or direction");
    return null;
  }
  const degrees = parseFloat(coord.slice(0, 2));
  const minutes = parseFloat(coord.slice(2)) / 60;
  let result = degrees + minutes;
  if (direction === "S") {
    result = -result;
  }
  return result;
}

function parseLongitude(coord: string, direction: string): number {
  if (!coord || !direction) {
    console.error("Invalid coordinate: missing longitude or direction");
    return null;
  }
  const degrees = parseFloat(coord.slice(0, 3));
  const minutes = parseFloat(coord.slice(3)) / 60;
  let result = degrees + minutes;
  if (direction === "W") {
    result = -result;
  }
  return result;
}

function convertToISOTime(dateStr: string, timeStr: string): string {
  if (dateStr.length !== 6 || timeStr.length < 6) {
    console.error("Invalid date or time format");
  }

  // Extract components from the date string
  const day = dateStr.slice(0, 2);
  const month = dateStr.slice(2, 4);
  const year = dateStr.slice(4, 6);

  // Extract components from the time string
  const hours = timeStr.slice(0, 2);
  const minutes = timeStr.slice(2, 4);
  const seconds = timeStr.slice(4, 6);
  const milliseconds = timeStr.length > 6 ? timeStr.slice(7) : "000";

  const fullYear = parseInt(year) < PIVOT_YEAR ? `20${year}` : `19${year}`;

  const isoString = `${fullYear}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

  return isoString;
}
