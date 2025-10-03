/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive schema definitions for the UAV Mission Planner
 * This file contains all TypeScript interfaces and JSON schema definitions
 * for data structures used throughout the application.
 */

// ============================================================================
// CORE DATA STRUCTURES
// ============================================================================

/**
 * Geographic coordinate with altitude and metadata
 */
export interface Coordinate {
  /** Latitude in decimal degrees (-90 to 90) */
  lat: number;
  /** Longitude in decimal degrees (-180 to 180) */
  lng: number;
  /** Altitude in meters above sea level */
  altitude?: number;
}

/**
 * Mission waypoint with complete navigation data
 */
export interface Waypoint {
  /** Unique identifier for the waypoint */
  id: string;
  /** Latitude in decimal degrees */
  lat: number;
  /** Longitude in decimal degrees */
  lng: number;
  /** Altitude in meters above sea level */
  altitude: number;
  /** Speed in meters per second */
  speed: number;
  /** Human-readable label for the waypoint */
  label: string;
  /** Optional notes or description */
  notes: string;
  /** Display color for the waypoint marker */
  color: 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';
  /** Whether this waypoint is the home/launch position */
  isHome: boolean;
}

/**
 * Search history item for location searches
 */
export interface SearchHistoryItem {
  /** Search query text */
  query: string;
  /** Location name from place result */
  placeName: string;
  /** Latitude of the location */
  lat: number;
  /** Longitude of the location */
  lng: number;
  /** Timestamp when search was performed */
  timestamp: number;
}

/**
 * Complete mission definition
 */
export interface Mission {
  /** Unique mission identifier */
  id: string;
  /** Mission name or title */
  name: string;
  /** Mission description */
  description?: string;
  /** Creation timestamp (ISO 8601) */
  createdAt: string;
  /** Last modified timestamp (ISO 8601) */
  updatedAt: string;
  /** Array of mission waypoints in order */
  waypoints: Waypoint[];
  /** Weather snapshot at time of mission creation */
  weatherSnapshot?: WeatherData;
  /** Estimated mission duration in seconds */
  estimatedDuration?: number;
  /** Total mission distance in meters */
  totalDistance?: number;
}

// ============================================================================
// WEATHER DATA STRUCTURES
// ============================================================================

/**
 * Wind information
 */
export interface WindData {
  /** Wind speed in meters per second */
  speed: number;
  /** Wind direction in degrees (0-360) */
  deg: number;
  /** Wind gust speed in meters per second (optional) */
  gust?: number;
}

/**
 * Current weather conditions
 */
export interface WeatherData {
  /** Temperature in Celsius */
  temp: number;
  /** Temperature in Fahrenheit */
  tempF: number;
  /** Weather description (e.g., "clear sky") */
  description: string;
  /** Weather icon identifier */
  icon: string;
  /** City or location name */
  city: string;
  /** Wind information */
  wind?: WindData;
  /** Visibility in meters */
  visibility?: number;
  /** Humidity percentage (0-100) */
  humidity?: number;
  /** Atmospheric pressure in hPa */
  pressure?: number;
  /** Cloud coverage percentage (0-100) */
  clouds?: number;
  /** UV index */
  uvi?: number;
  /** Dew point temperature in Celsius */
  dewPoint?: number;
  /** Feels like temperature in Celsius */
  feelsLike?: number;
  /** Feels like temperature in Fahrenheit */
  feelsLikeF?: number;
}

/**
 * METAR aviation weather report
 */
export interface METARData {
  /** Raw METAR string */
  raw: string;
  /** Station identifier (e.g., "KLAX") */
  station: string;
  /** Issue time (Zulu time) */
  time: string;
  /** Wind information */
  wind: {
    direction: number;
    speed: number;
    gust?: number;
  };
  /** Visibility in statute miles */
  visibility: number;
  /** Weather phenomena (e.g., ["rain", "fog"]) */
  weather?: string[];
  /** Cloud layer information */
  clouds: {
    coverage: string;
    base?: number;
    type?: string;
  }[];
  /** Temperature in Celsius */
  temperature: number;
  /** Dew point in Celsius */
  dewpoint: number;
  /** Altimeter setting in inches of mercury */
  altimeter: number;
  /** Remarks section */
  remarks?: string;
}

/**
 * TAF aviation forecast
 */
export interface TAFData {
  /** Raw TAF string */
  raw: string;
  /** Station identifier */
  station: string;
  /** Issue time */
  issueTime: string;
  /** Valid time period */
  validPeriod: {
    from: string;
    to: string;
  };
  /** Forecast periods */
  forecast: {
    time: string;
    wind: WindData;
    visibility: number;
    weather?: string[];
    clouds: {
      coverage: string;
      base?: number;
    }[];
  }[];
}

/**
 * Extended weather forecast for a single day
 */
export interface ForecastData {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Temperature range */
  temp: {
    min: number;
    max: number;
  };
  /** Weather description */
  description: string;
  /** Weather icon identifier */
  icon: string;
  /** Humidity percentage */
  humidity: number;
  /** Wind information */
  wind: WindData;
}

// ============================================================================
// SIMULATION DATA STRUCTURES
// ============================================================================

/**
 * Real-time drone telemetry data
 */
export interface DroneTelemetry {
  /** Current latitude */
  latitude: number;
  /** Current longitude */
  longitude: number;
  /** Current altitude in meters */
  altitude: number;
  /** Current speed in m/s */
  speed: number;
  /** Current heading in degrees (0-360) */
  heading: number;
  /** Battery level percentage (0-100) */
  battery: number;
  /** Current wind speed in m/s */
  windSpeed: number;
  /** Current wind direction in degrees */
  windDirection: number;
  /** Ground speed in m/s (accounting for wind) */
  groundSpeed: number;
  /** Time to next waypoint in seconds */
  timeToWaypoint: number;
  /** Distance to next waypoint in meters */
  distanceToWaypoint: number;
  /** Timestamp of telemetry reading */
  timestamp?: number;
}

/**
 * Simulation state and control parameters
 */
export interface SimulationState {
  /** Whether simulation is currently active */
  isActive: boolean;
  /** Whether simulation is paused */
  isPaused: boolean;
  /** Index of current target waypoint */
  currentWaypointIndex: number;
  /** Progress between current and next waypoint (0-1) */
  progress: number;
  /** Simulation speed multiplier */
  speedMultiplier: number;
  /** Simulation start timestamp */
  startTime: number;
  /** Elapsed simulation time in seconds */
  elapsedTime: number;
  /** Total mission distance in meters */
  totalDistance: number;
  /** Distance traveled so far in meters */
  distanceTraveled: number;
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining: number;
  /** Whether in step-by-step mode */
  stepMode: boolean;
}

/**
 * Drone position history for trail visualization
 */
export interface DronePosition {
  /** Latitude at this position */
  lat: number;
  /** Longitude at this position */
  lng: number;
  /** Altitude at this position */
  altitude: number;
  /** Heading at this position */
  heading: number;
  /** Timestamp of this position */
  timestamp: number;
}

/**
 * Flight trail configuration and data
 */
export interface SimulationTrail {
  /** Array of historical positions */
  positions: DronePosition[];
  /** Maximum number of positions to keep */
  maxLength: number;
}

/**
 * Weather effects on simulation
 */
export interface WeatherEffect {
  /** Wind vector affecting movement */
  windVector: {
    x: number;
    y: number;
  };
  /** Visibility in meters */
  visibility: number;
  /** Whether precipitation is present */
  precipitation: boolean;
  /** Turbulence factor (0-1) */
  turbulence: number;
}

// ============================================================================
// EXPORT/IMPORT DATA STRUCTURES
// ============================================================================

/**
 * Mission export metadata
 */
export interface MissionExportData {
  /** Export format version */
  version: string;
  /** Export timestamp */
  exportedAt: string;
  /** Source application */
  source: string;
  /** Mission data */
  mission: Mission;
  /** Weather data at export time */
  weather?: WeatherData;
}

/**
 * PDF report metadata
 */
export interface PDFReportData {
  /** Report filename */
  filename: string;
  /** Generation timestamp */
  generatedAt: string;
  /** Mission data included in report */
  mission: Mission;
  /** Weather conditions */
  weather?: WeatherData;
  /** Simulation results (if available) */
  simulation?: {
    duration: number;
    avgSpeed: number;
    maxAltitude: number;
    totalDistance: number;
  };
}

// ============================================================================
// API RESPONSE STRUCTURES
// ============================================================================

/**
 * OpenWeatherMap API response structure
 */
export interface OpenWeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  clouds: { all: number };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * Google Maps geocoding response
 */
export interface GeocodeResponse {
  results: Array<{
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
      location_type: string;
      viewport: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    place_id: string;
    types: string[];
  }>;
  status: string;
}

// ============================================================================
// VALIDATION SCHEMAS (JSON Schema format)
// ============================================================================

/**
 * JSON Schema for waypoint validation
 */
export const waypointSchema = {
  type: "object",
  required: ["id", "lat", "lng", "altitude", "speed", "label", "color"],
  properties: {
    id: { type: "string", minLength: 1 },
    lat: { type: "number", minimum: -90, maximum: 90 },
    lng: { type: "number", minimum: -180, maximum: 180 },
    altitude: { type: "number", minimum: 0, maximum: 15000 },
    speed: { type: "number", minimum: 0.1, maximum: 100 },
    label: { type: "string", minLength: 1, maxLength: 50 },
    notes: { type: "string", maxLength: 500 },
    color: { 
      type: "string", 
      enum: ["red", "blue", "green", "yellow", "purple", "orange"] 
    },
    isHome: { type: "boolean" }
  }
};

/**
 * JSON Schema for mission validation
 */
export const missionSchema = {
  type: "object",
  required: ["id", "name", "createdAt", "waypoints"],
  properties: {
    id: { type: "string", minLength: 1 },
    name: { type: "string", minLength: 1, maxLength: 100 },
    description: { type: "string", maxLength: 1000 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    waypoints: {
      type: "array",
      minItems: 1,
      items: waypointSchema
    },
    estimatedDuration: { type: "number", minimum: 0 },
    totalDistance: { type: "number", minimum: 0 }
  }
};

/**
 * JSON Schema for telemetry validation
 */
export const telemetrySchema = {
  type: "object",
  required: ["latitude", "longitude", "altitude", "speed", "heading", "battery"],
  properties: {
    latitude: { type: "number", minimum: -90, maximum: 90 },
    longitude: { type: "number", minimum: -180, maximum: 180 },
    altitude: { type: "number", minimum: 0 },
    speed: { type: "number", minimum: 0 },
    heading: { type: "number", minimum: 0, maximum: 360 },
    battery: { type: "number", minimum: 0, maximum: 100 },
    windSpeed: { type: "number", minimum: 0 },
    windDirection: { type: "number", minimum: 0, maximum: 360 },
    groundSpeed: { type: "number", minimum: 0 },
    timeToWaypoint: { type: "number", minimum: 0 },
    distanceToWaypoint: { type: "number", minimum: 0 },
    timestamp: { type: "number", minimum: 0 }
  }
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Union type for waypoint colors
 */
export type WaypointColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

/**
 * Union type for tab identifiers
 */
export type TabIdentifier = 'waypoints' | 'weather' | 'settings' | 'simulation';

/**
 * Union type for map interaction modes
 */
export type MapMode = 'pan' | 'add_waypoint';

/**
 * Union type for flight conditions
 */
export type FlightCondition = 'excellent' | 'good' | 'marginal' | 'poor' | 'no-fly';

/**
 * Union type for weather alert levels
 */
export type WeatherAlert = 'safe' | 'warning' | 'danger';

/**
 * Battery status levels
 */
export type BatteryStatus = 'high' | 'medium' | 'low';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Default waypoint values
 */
export const DEFAULT_WAYPOINT_VALUES = {
  altitude: 100, // meters
  speed: 15,     // m/s
  color: 'blue' as WaypointColor,
  isHome: false
};

/**
 * Simulation configuration constants
 */
export const SIMULATION_CONFIG = {
  DEFAULT_SPEED_MULTIPLIER: 1.0,
  MIN_SPEED_MULTIPLIER: 0.1,
  MAX_SPEED_MULTIPLIER: 10.0,
  TELEMETRY_UPDATE_RATE: 50, // milliseconds (20Hz)
  DEFAULT_TRAIL_LENGTH: 100,
  MIN_TRAIL_LENGTH: 10,
  MAX_TRAIL_LENGTH: 500,
  BATTERY_DRAIN_RATE: 0.001 // per second at 1x speed
};

/**
 * Weather thresholds for flight safety
 */
export const WEATHER_THRESHOLDS = {
  WIND_SAFE: 10,     // m/s
  WIND_WARNING: 15,  // m/s
  WIND_DANGER: 20,   // m/s
  VISIBILITY_MIN: 1000, // meters
  BATTERY_LOW: 20,   // percentage
  BATTERY_CRITICAL: 10 // percentage
};

/**
 * Export format constants
 */
export const EXPORT_FORMATS = {
  JSON: 'application/json',
  KML: 'application/vnd.google-earth.kml+xml',
  CSV: 'text/csv',
  PDF: 'application/pdf',
  GEOJSON: 'application/geo+json',
  MAVLINK: 'application/json'
};