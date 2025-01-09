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
    console.error("Invalid GPRMC record: not enough fields");
    return null;
  }

  const [
    ,
    // skipping identifier
    timeStr, // skipping status
    ,
    latitudeStr,
    latitudeDir,
    longitudeStr,
    longitudeDir,
    speedStr, // skipping track
    ,
    dateStr, // skipping magnetic variation // skipping variation direction
    ,
    ,
  ] = parts;

  const latitude = parseLatitude(latitudeStr, latitudeDir);
  const longitude = parseLongitude(longitudeStr, longitudeDir);

  const roadSnapTracePoint = { Position: [longitude, latitude] };

  if (timeStr && dateStr) {
    const timestamp = convertToISOTime(dateStr, timeStr);
    roadSnapTracePoint["Timestamp"] = timestamp;
  }
  if (speedStr) {
    const speedKMPH = parseFloat(speedStr) * 1.852; // convert knots to km/h
    roadSnapTracePoint["Speed"] = speedKMPH;
  }

  return roadSnapTracePoint;
}

export function parseGPGGA(record: string): RoadSnapTracePoint | null {
  const parts = record.split(",");

  if (parts.length < 14) {
    console.error("Invalid GPGGA record: not enough fields");
    return null;
  }

  const [
    ,
    ,
    // skipping identifier
    // skipping time. GPGGA doesn't contain date information, so we cannot construct the timestamp.
    latitudeStr,
    latitudeDir,
    longitudeStr,
    longitudeDir, // skipping fix quality // skipping number of satellites // skipping HDOP // skipping altitude // skipping altitude unit // skipping geoid height // skipping geoid height unit // skipping time since last DGPS update // skipping DGPS station ID
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
    ,
  ] = parts;

  const latitude = parseLatitude(latitudeStr, latitudeDir);
  const longitude = parseLongitude(longitudeStr, longitudeDir);

  return { Position: [longitude, latitude] };
}

function parseLatitude(coord: string, direction: string): number {
  if (!coord || !direction) return 0;
  const degrees = parseFloat(coord.slice(0, 2));
  const minutes = parseFloat(coord.slice(2)) / 60;
  let result = degrees + minutes;
  if (direction === "S") {
    result = -result;
  }
  return result;
}

function parseLongitude(coord: string, direction: string): number {
  if (!coord || !direction) return 0;
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
    throw new Error("Invalid date or time format");
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
