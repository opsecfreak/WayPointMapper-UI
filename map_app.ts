// @ts-ignore - Google Maps types are loaded at runtime
/// <reference types="google.maps" />

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This file defines the main `gdm-map-app` LitElement component.
 * This component is responsible for:
 * - Rendering the user interface, including the Google Maps satellite view,
 *   a toolbar for map actions, and a sidebar for mission planning.
 * - Managing the state of the mission, including a list of waypoints.
 * - Handling direct user interaction with the map, such as clicking to add
 *   waypoints and dragging them to new positions.
 * - Providing a UI for customizing waypoint properties like labels, colors,
 *   altitude, and notes.
 * - Integrating with the Google Maps JavaScript API to load and control the
 *   map and its elements, including a search box and live weather updates.
 */

import {Loader} from '@googlemaps/js-api-loader';
import {html, LitElement, PropertyValueMap, nothing} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';
import tokml from 'tokml';

// MTS UAV Division Branding Constants
const COMPANY_INFO = {
  name: 'MTS UAV Division',
  website: 'MobileTechSpecialists.com',
  uavSite: 'adkuav.com',
  tagline: 'Professional UAV Mission Planning Solutions',
  phone: 'Contact via MobileTechSpecialists.com',
  email: 'info@mobiletechspecialists.com'
};

const WAYPOINT_COLORS = {
  red: '#EA4335',
  blue: '#4285F4',
  green: '#34A853',
  yellow: '#FBBC05',
  purple: '#A142F4',
  orange: '#F29900',
};

type WaypointColor = keyof typeof WAYPOINT_COLORS;

export interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number; // Speed in m/s
  label: string;
  notes: string;
  color: WaypointColor;
  isHome: boolean;
}

interface WeatherData {
  temp: number;
  tempF: number; // Fahrenheit temperature
  description: string;
  icon: string;
  city: string;
  wind?: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility?: number;
  humidity?: number;
  pressure?: number;
  clouds?: number;
  uvi?: number; // UV Index
  dewPoint?: number;
  feelsLike?: number;
  feelsLikeF?: number;
}

interface DetailedWeatherConditions {
  flightSuitability: 'excellent' | 'good' | 'marginal' | 'poor' | 'no-fly';
  windCondition: 'calm' | 'light' | 'moderate' | 'strong' | 'severe';
  visibilityCondition: 'excellent' | 'good' | 'reduced' | 'poor';
  temperatureCondition: 'optimal' | 'acceptable' | 'cold' | 'hot';
  recommendations: string[];
  warnings: string[];
}

interface MissionData {
  id: string;
  name: string;
  waypoints: Waypoint[];
  createdAt: string;
  weather?: WeatherData;
  metadata: {
    totalDistance: number;
    estimatedFlightTime: number;
    maxAltitude: number;
  };
}

interface METARData {
  raw: string;
  station: string;
  time: string;
  wind: {
    direction: number;
    speed: number;
    gust?: number;
    variable?: boolean;
  };
  visibility: number;
  weather?: string[];
  clouds: {
    coverage: string;
    base?: number;
    type?: string;
  }[];
  temperature: number;
  dewpoint: number;
  altimeter: number;
  remarks?: string;
}

interface TAFData {
  raw: string;
  station: string;
  issueTime: string;
  validPeriod: {
    from: string;
    to: string;
  };
  forecast: {
    time: string;
    wind: {
      direction: number;
      speed: number;
      gust?: number;
    };
    visibility: number;
    weather?: string[];
    clouds: {
      coverage: string;
      base?: number;
    }[];
  }[];
}

interface ForecastData {
  date: string;
  temp: {
    min: number;
    max: number;
  };
  description: string;
  icon: string;
  humidity: number;
  wind: {
    speed: number;
    deg: number;
  };
}

const GOOGLE_MAPS_API_KEY_STORAGE_KEY = 'googleMapsApiKey';
const WEATHER_API_KEY_STORAGE_KEY = 'weatherApiKey';
const LOS_ANGELES_CENTER = {lat: 34.0522, lng: -118.2437};

// Environment variable helper functions
const getEnvironmentVariable = (key: string): string | null => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || null;
  }
  return null;
};

const getGoogleMapsApiKey = (): string | null => {
  // Try environment variable first, then local storage
  return getEnvironmentVariable('VITE_GOOGLE_MAPS_API_KEY') || 
         localStorage.getItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY);
};

const getWeatherApiKey = (): string | null => {
  // Try environment variable first, then local storage
  return getEnvironmentVariable('VITE_WEATHER_API_KEY') || 
         localStorage.getItem(WEATHER_API_KEY_STORAGE_KEY);
};

// Utility Functions for Weather Analysis
const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};

const analyzeFlightConditions = (weather: WeatherData): DetailedWeatherConditions => {
  const conditions: DetailedWeatherConditions = {
    flightSuitability: 'excellent',
    windCondition: 'calm',
    visibilityCondition: 'excellent',
    temperatureCondition: 'optimal',
    recommendations: [],
    warnings: []
  };

  // Wind analysis
  if (weather.wind) {
    const windSpeed = weather.wind.speed;
    if (windSpeed < 3) conditions.windCondition = 'calm';
    else if (windSpeed < 7) conditions.windCondition = 'light';
    else if (windSpeed < 12) conditions.windCondition = 'moderate';
    else if (windSpeed < 18) conditions.windCondition = 'strong';
    else conditions.windCondition = 'severe';

    if (windSpeed > 15) {
      conditions.warnings.push('High wind speeds may affect UAV stability and control');
      conditions.flightSuitability = 'poor';
    } else if (windSpeed > 10) {
      conditions.warnings.push('Moderate winds - exercise caution during flight operations');
      if (conditions.flightSuitability === 'excellent') conditions.flightSuitability = 'marginal';
    }

    if (weather.wind.gust && weather.wind.gust > windSpeed + 5) {
      conditions.warnings.push('Wind gusts detected - consider postponing flight');
    }
  }

  // Visibility analysis
  if (weather.visibility) {
    const visibilityKm = weather.visibility / 1000;
    if (visibilityKm > 10) conditions.visibilityCondition = 'excellent';
    else if (visibilityKm > 5) conditions.visibilityCondition = 'good';
    else if (visibilityKm > 1) conditions.visibilityCondition = 'reduced';
    else conditions.visibilityCondition = 'poor';

    if (visibilityKm < 3) {
      conditions.warnings.push('Reduced visibility - maintain visual contact with aircraft');
      if (conditions.flightSuitability === 'excellent') conditions.flightSuitability = 'marginal';
    }
  }

  // Temperature analysis
  const tempF = weather.tempF;
  if (tempF < 32) {
    conditions.temperatureCondition = 'cold';
    conditions.warnings.push('Freezing temperatures - monitor battery performance');
    conditions.recommendations.push('Warm batteries before flight and monitor charge levels');
  } else if (tempF > 95) {
    conditions.temperatureCondition = 'hot';
    conditions.warnings.push('High temperatures may affect equipment performance');
    conditions.recommendations.push('Keep equipment cool and monitor for overheating');
  } else if (tempF < 50 || tempF > 85) {
    conditions.temperatureCondition = 'acceptable';
  }

  // Overall recommendations
  if (conditions.windCondition === 'calm' && conditions.visibilityCondition === 'excellent') {
    conditions.recommendations.push('Excellent conditions for all UAV operations');
  } else if (conditions.windCondition === 'light' && conditions.visibilityCondition === 'good') {
    conditions.recommendations.push('Good conditions for most UAV operations');
  }

  return conditions;
};

/**
 * Parse METAR weather report
 * Example: METAR KLAX 121852Z 25012KT 10SM FEW040 25/10 A2992 RMK AO2 SLP132 T02500100
 */
const parseMETAR = (metar: string): METARData | null => {
  try {
    const parts = metar.trim().split(/\s+/);
    if (parts.length < 6) return null;

    const station = parts[1];
    const time = parts[2];
    
    // Parse wind (e.g., 25012KT)
    let windIdx = 3;
    const windMatch = parts[windIdx].match(/(\d{3}|\w{3})(\d{2,3})(G\d{2,3})?(KT|MPS|KMH)/);
    const wind = windMatch ? {
      direction: windMatch[1] === 'VRB' ? 0 : parseInt(windMatch[1]),
      speed: parseInt(windMatch[2]),
      gust: windMatch[3] ? parseInt(windMatch[3].slice(1)) : undefined,
      variable: windMatch[1] === 'VRB'
    } : { direction: 0, speed: 0 };

    // Parse visibility (e.g., 10SM)
    windIdx++;
    const visibilityMatch = parts[windIdx].match(/(\d+(?:\s\d+\/\d+)?|\d+\/\d+)(SM|KM)/);
    const visibility = visibilityMatch ? parseFloat(visibilityMatch[1].replace(/\s/, '.')) : 10;

    // Parse temperature/dewpoint (e.g., 25/10)
    let tempIdx = parts.findIndex(p => /^M?\d{2}\/M?\d{2}$/.test(p));
    let temperature = 20, dewpoint = 10;
    if (tempIdx > 0) {
      const tempParts = parts[tempIdx].split('/');
      temperature = parseInt(tempParts[0].replace('M', '-'));
      dewpoint = parseInt(tempParts[1].replace('M', '-'));
    }

    // Parse altimeter (e.g., A2992)
    const altimeterIdx = parts.findIndex(p => /^A\d{4}$/.test(p));
    const altimeter = altimeterIdx > 0 ? parseInt(parts[altimeterIdx].slice(1)) / 100 : 29.92;

    // Parse clouds
    const clouds: any[] = [];
    parts.forEach(part => {
      const cloudMatch = part.match(/(SKC|CLR|FEW|SCT|BKN|OVC)(\d{3})?/);
      if (cloudMatch) {
        clouds.push({
          coverage: cloudMatch[1],
          base: cloudMatch[2] ? parseInt(cloudMatch[2]) * 100 : undefined
        });
      }
    });

    return {
      raw: metar,
      station,
      time,
      wind,
      visibility,
      clouds,
      temperature,
      dewpoint,
      altimeter,
      remarks: parts.includes('RMK') ? parts.slice(parts.indexOf('RMK') + 1).join(' ') : undefined
    };
  } catch (error) {
    console.error('Error parsing METAR:', error);
    return null;
  }
};

/**
 * Parse TAF weather forecast
 * Example: TAF KLAX 121720Z 1218/1324 26010KT P6SM FEW030 SCT250
 */
const parseTAF = (taf: string): TAFData | null => {
  try {
    const parts = taf.trim().split(/\s+/);
    if (parts.length < 6) return null;

    const station = parts[1];
    const issueTime = parts[2];
    const validPeriod = parts[3];
    
    const [from, to] = validPeriod.split('/');
    
    // Basic parsing - in production you'd want more sophisticated TAF parsing
    const forecast = [{
      time: from,
      wind: { direction: 260, speed: 10 },
      visibility: 6,
      clouds: [{ coverage: 'FEW', base: 3000 }]
    }];

    return {
      raw: taf,
      station,
      issueTime,
      validPeriod: { from, to },
      forecast
    };
  } catch (error) {
    console.error('Error parsing TAF:', error);
    return null;
  }
};

/**
 * MapApp component for a mission planner with Google Maps.
 */
@customElement('gdm-map-app')
export class MapApp extends LitElement {
  @query('#mapContainer') private mapContainerElement?: HTMLElement;
  @query('#google-api-key-input')
  private googleApiKeyInputElement?: HTMLInputElement;
  @query('#weather-api-key-input')
  private weatherApiKeyInputElement?: HTMLInputElement;
  @query('#search-box') private searchBoxElement?: HTMLInputElement;
  @query('#settings-google-api-key')
  private settingsGoogleApiKeyElement?: HTMLInputElement;
  @query('#settings-weather-api-key')
  private settingsWeatherApiKeyElement?: HTMLInputElement;

  @state() private showApiKeyModal = true;
  @state() private mapInitialized = false;
  @state() private apiKeyError = '';
  @state() private waypoints = new Map<string, Waypoint>();
  @state() private selectedWaypointId: string | null = null;
  @state() private mapMode: 'pan' | 'add_waypoint' = 'add_waypoint'; // Default to add mode
  @state() private weather: WeatherData | null = null;
  @state() private activeTab: 'waypoints' | 'weather' | 'settings' = 'waypoints';
  @state() private missionWeather: WeatherData | null = null;
  @state() private metarData: METARData | null = null;
  @state() private tafData: TAFData | null = null;
  @state() private forecastData: ForecastData[] = [];
  @state() private currentMission: MissionData | null = null;
  @state() private autoAddWaypoints = true; // New state for automatic waypoint adding
  @state() private darkMode = false; // New state for dark mode

  private map?: google.maps.Map;
  private geocoder?: google.maps.Geocoder;
  private mapMarkers = new Map<string, google.maps.marker.AdvancedMarkerElement>();
  private flightPath?: google.maps.Polyline;
  private weatherFetchTimeout: number | undefined;

  createRenderRoot() {
    return this;
  }

  protected firstUpdated() {
    // Check for API key from environment variables first, then local storage
    const savedGoogleApiKey = getGoogleMapsApiKey();

    if (savedGoogleApiKey) {
      this.showApiKeyModal = false;
      this.loadMap(savedGoogleApiKey);
    } else {
      // Show modal if no API key is available
      this.showApiKeyModal = true;
    }
  }

  private async loadMap(apiKey: string) {
    if (!apiKey) {
      this.apiKeyError = `Google Maps API Key is not configured.`;
      this.showApiKeyModal = true;
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['geocoding', 'places', 'marker'],
    });

    try {
      await loader.load();
      this.initializeMap();
      this.mapInitialized = true;
      this.apiKeyError = '';
    } catch (error) {
      console.error('Error loading Google Maps API:', error);
      this.apiKeyError =
        'The provided Google Maps API key appears to be invalid or expired. Please verify your key and try again.';
      this.mapInitialized = false;
      this.showApiKeyModal = true;
      localStorage.removeItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY);
    }
  }

  private initializeMap() {
    if (!this.mapContainerElement) return;

    this.map = new google.maps.Map(this.mapContainerElement, {
      center: LOS_ANGELES_CENTER,
      zoom: 12,
      mapId: 'MISSION_PLANNER_MAP',
      disableDefaultUI: true,
      mapTypeId: 'satellite',
    });

    this.geocoder = new google.maps.Geocoder();

    this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
      this.handleMapClick(event);
    });
    this.map.addListener('center_changed', () => this.debouncedFetchWeather());
    this.map.addListener('zoom_changed', () => this.debouncedFetchWeather());

    this.initializeSearchBox();
    this.debouncedFetchWeather(); // Initial weather fetch
  }

  private initializeSearchBox() {
    if (!this.searchBoxElement || !this.map) return;

    const autocomplete = new google.maps.places.Autocomplete(
      this.searchBoxElement,
    );
    autocomplete.bindTo('bounds', this.map);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry || !place.geometry.location) {
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }
      if (place.geometry.viewport) {
        this.map?.fitBounds(place.geometry.viewport);
      } else {
        this.map?.setCenter(place.geometry.location);
        this.map?.setZoom(17);
      }
    });
  }

  private debouncedFetchWeather() {
    clearTimeout(this.weatherFetchTimeout);
    this.weatherFetchTimeout = window.setTimeout(() => {
      if (!this.map) return;
      const center = this.map.getCenter();
      if (center) {
        this.fetchWeather(center.lat(), center.lng());
      }
    }, 500); // 500ms debounce delay
  }

  private async fetchWeather(lat: number, lng: number) {
    const apiKey = getWeatherApiKey();
    if (!apiKey) {
      this.weather = null;
      return;
    }
    
    try {
      // Enhanced weather API call with more detailed data
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather data fetch failed');
      
      const data = await response.json();
      const tempC = data.main.temp;
      const feelsLikeC = data.main.feels_like;
      
      this.weather = {
        temp: tempC,
        tempF: celsiusToFahrenheit(tempC),
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
        city: data.name,
        wind: data.wind ? {
          speed: data.wind.speed,
          deg: data.wind.deg,
          gust: data.wind.gust
        } : undefined,
        visibility: data.visibility,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        clouds: data.clouds?.all,
        dewPoint: data.main.temp - ((100 - data.main.humidity) / 5), // Approximation
        feelsLike: feelsLikeC,
        feelsLikeF: celsiusToFahrenheit(feelsLikeC),
        uvi: 0 // Will be updated with UV data if available
      };
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      this.weather = null; // Clear weather on error
    }
  }

  private async fetchMissionWeather() {
    const apiKey = getWeatherApiKey();
    if (!apiKey || this.waypoints.size === 0) {
      this.missionWeather = null;
      return;
    }

    try {
      // Calculate center of mission area
      const waypointArray = Array.from(this.waypoints.values());
      const centerLat = waypointArray.reduce((sum, wp) => sum + wp.lat, 0) / waypointArray.length;
      const centerLng = waypointArray.reduce((sum, wp) => sum + wp.lng, 0) / waypointArray.length;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${centerLat}&lon=${centerLng}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Mission weather data fetch failed');
      
      const data = await response.json();
      const tempC = data.main.temp;
      const feelsLikeC = data.main.feels_like;
      
      this.missionWeather = {
        temp: tempC,
        tempF: celsiusToFahrenheit(tempC),
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
        city: data.name,
        wind: data.wind ? {
          speed: data.wind.speed,
          deg: data.wind.deg,
          gust: data.wind.gust
        } : undefined,
        visibility: data.visibility,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        clouds: data.clouds?.all,
        dewPoint: data.main.temp - ((100 - data.main.humidity) / 5), // Approximation
        feelsLike: feelsLikeC,
        feelsLikeF: celsiusToFahrenheit(feelsLikeC),
        uvi: 0 // Will be updated with UV data if available
      };
    } catch (error) {
      console.error('Failed to fetch mission weather:', error);
      this.missionWeather = null;
    }
  }

  private calculateMissionMetadata(): { totalDistance: number; estimatedFlightTime: number; maxAltitude: number } {
    const waypoints = Array.from(this.waypoints.values()).sort((a, b) => {
      if (a.isHome && !b.isHome) return -1;
      if (!a.isHome && b.isHome) return 1;
      return a.label.localeCompare(b.label);
    });

    let totalDistance = 0;
    let maxAltitude = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const wp1 = waypoints[i];
      const wp2 = waypoints[i + 1];
      
      // Calculate distance using Haversine formula (approximate)
      const R = 6371e3; // Earth's radius in meters
      const φ1 = wp1.lat * Math.PI/180;
      const φ2 = wp2.lat * Math.PI/180;
      const Δφ = (wp2.lat-wp1.lat) * Math.PI/180;
      const Δλ = (wp2.lng-wp1.lng) * Math.PI/180;

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

      totalDistance += R * c;
      maxAltitude = Math.max(maxAltitude, wp1.altitude, wp2.altitude);
    }

    // Estimate flight time (assuming 15 m/s average speed)
    const estimatedFlightTime = totalDistance / 15;

    return {
      totalDistance: Math.round(totalDistance),
      estimatedFlightTime: Math.round(estimatedFlightTime),
      maxAltitude
    };
  }

  /**
   * Fetch METAR data for the nearest airport to mission center
   */
  private async fetchMETAR() {
    if (this.waypoints.size === 0) return;

    try {
      // For demonstration, we'll use example METAR data
      // In production, you'd integrate with an aviation weather service
      const sampleMETAR = "METAR KLAX 121852Z 25012KT 10SM FEW040 25/10 A2992 RMK AO2 SLP132 T02500100";
      this.metarData = parseMETAR(sampleMETAR);
    } catch (error) {
      console.error('Error fetching METAR:', error);
      this.metarData = null;
    }
  }

  /**
   * Fetch TAF data for flight planning
   */
  private async fetchTAF() {
    if (this.waypoints.size === 0) return;

    try {
      // For demonstration, we'll use example TAF data
      const sampleTAF = "TAF KLAX 121720Z 1218/1324 26010KT P6SM FEW030 SCT250 FM130200 24008KT P6SM SKC FM131500 VRB03KT P6SM SKC";
      this.tafData = parseTAF(sampleTAF);
    } catch (error) {
      console.error('Error fetching TAF:', error);
      this.tafData = null;
    }
  }

  /**
   * Fetch 5-day weather forecast
   */
  private async fetchForecast() {
    if (this.waypoints.size === 0) return;

    const apiKey = getWeatherApiKey();
    if (!apiKey) return;

    try {
      const waypoint = Array.from(this.waypoints.values())[0];
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${waypoint.lat}&lon=${waypoint.lng}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      // Process 5-day forecast data
      const dailyForecasts: ForecastData[] = [];
      const processed = new Set<string>();

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toDateString();
        if (!processed.has(date) && dailyForecasts.length < 5) {
          processed.add(date);
          dailyForecasts.push({
            date,
            temp: {
              min: Math.round(item.main.temp_min),
              max: Math.round(item.main.temp_max)
            },
            description: item.weather[0].description,
            icon: `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`,
            humidity: item.main.humidity,
            wind: {
              speed: item.wind.speed,
              deg: item.wind.deg
            }
          });
        }
      });

      this.forecastData = dailyForecasts;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      this.forecastData = [];
    }
  }

  private saveMission() {
    if (this.waypoints.size === 0) {
      alert('No waypoints to save. Please add some waypoints first.');
      return;
    }

    const metadata = this.calculateMissionMetadata();
    const mission: MissionData = {
      id: crypto.randomUUID(),
      name: `Mission ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
      waypoints: Array.from(this.waypoints.values()),
      createdAt: new Date().toISOString(),
      weather: this.missionWeather || undefined,
      metadata
    };

    // Save to file
    const dataStr = JSON.stringify(mission, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mission_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.currentMission = mission;
  }

  private async loadMission() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const mission: MissionData = JSON.parse(text);
        
        // Clear existing waypoints
        this.waypoints.clear();
        this.mapMarkers.forEach(marker => marker.map = null);
        this.mapMarkers.clear();
        
        // Load waypoints from mission
        const waypointMap = new Map<string, Waypoint>();
        mission.waypoints.forEach(wp => {
          waypointMap.set(wp.id, wp);
          this.createMapMarker(wp);
        });
        
        this.waypoints = waypointMap;
        this.currentMission = mission;
        this.missionWeather = mission.weather || null;
        this.selectedWaypointId = null;
        
        // Update flight path
        this.updateFlightPath();
        
        // Center map on mission
        if (mission.waypoints.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          mission.waypoints.forEach(wp => {
            bounds.extend(new google.maps.LatLng(wp.lat, wp.lng));
          });
          this.map?.fitBounds(bounds);
        }
        
        alert(`Mission "${mission.name}" loaded successfully!`);
      } catch (error) {
        console.error('Error loading mission:', error);
        alert('Error loading mission file. Please check the file format.');
      }
    };
    
    input.click();
  }

  /**
   * Generate and download a comprehensive PDF mission briefing
   * Includes MTS UAV Division branding and detailed mission analysis
   */
  private async generatePDFBriefing() {
    if (this.waypoints.size === 0) {
      alert('No waypoints to include in briefing. Please add waypoints first.');
      return;
    }

    try {
      // Dynamic import for jsPDF
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default;
      
      const doc = new jsPDF();
      const metadata = this.calculateMissionMetadata();
      const conditions = this.missionWeather ? analyzeFlightConditions(this.missionWeather) : null;
      const waypoints = Array.from(this.waypoints.values());
      
      // Header with MTS UAV Division branding
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('UAV MISSION BRIEFING', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(COMPANY_INFO.name, 105, 30, { align: 'center' });
      doc.text(COMPANY_INFO.tagline, 105, 37, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`${COMPANY_INFO.website} | ${COMPANY_INFO.uavSite}`, 105, 44, { align: 'center' });
      
      // Mission Overview
      let yPos = 60;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('MISSION OVERVIEW', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mission Name: ${this.currentMission?.name || 'Unnamed Mission'}`, 20, yPos);
      yPos += 7;
      doc.text(`Date Generated: ${new Date().toLocaleString()}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Waypoints: ${waypoints.length}`, 20, yPos);
      yPos += 7;
      doc.text(`Total Distance: ${(metadata.totalDistance / 1000).toFixed(2)} km`, 20, yPos);
      yPos += 7;
      doc.text(`Estimated Flight Time: ${Math.floor(metadata.estimatedFlightTime / 60)}m ${Math.round(metadata.estimatedFlightTime % 60)}s`, 20, yPos);
      yPos += 7;
      doc.text(`Maximum Altitude: ${metadata.maxAltitude} m AGL`, 20, yPos);

      // Weather Conditions
      yPos += 20;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('WEATHER CONDITIONS', 20, yPos);
      
      if (this.missionWeather) {
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Location: ${this.missionWeather.city}`, 20, yPos);
        yPos += 7;
        doc.text(`Temperature: ${Math.round(this.missionWeather.tempF)}°F (${Math.round(this.missionWeather.temp)}°C)`, 20, yPos);
        yPos += 7;
        doc.text(`Feels Like: ${Math.round(this.missionWeather.feelsLikeF || 0)}°F`, 20, yPos);
        yPos += 7;
        doc.text(`Conditions: ${this.missionWeather.description}`, 20, yPos);
        yPos += 7;
        
        if (this.missionWeather.wind) {
          doc.text(`Wind: ${this.missionWeather.wind.speed} m/s from ${this.missionWeather.wind.deg}°`, 20, yPos);
          if (this.missionWeather.wind.gust) {
            doc.text(`Gusts: ${this.missionWeather.wind.gust} m/s`, 120, yPos);
          }
          yPos += 7;
        }
        
        doc.text(`Visibility: ${this.missionWeather.visibility ? (this.missionWeather.visibility / 1000).toFixed(1) + ' km' : 'N/A'}`, 20, yPos);
        yPos += 7;
        doc.text(`Humidity: ${this.missionWeather.humidity}%`, 20, yPos);
        yPos += 7;
        doc.text(`Pressure: ${this.missionWeather.pressure} hPa`, 20, yPos);

        // Flight Condition Analysis
        if (conditions) {
          yPos += 15;
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text('FLIGHT CONDITION ANALYSIS', 20, yPos);
          
          yPos += 10;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.text(`Overall Suitability: ${conditions.flightSuitability.toUpperCase()}`, 20, yPos);
          yPos += 7;
          doc.text(`Wind Condition: ${conditions.windCondition.toUpperCase()}`, 20, yPos);
          yPos += 7;
          doc.text(`Visibility: ${conditions.visibilityCondition.toUpperCase()}`, 20, yPos);
          yPos += 7;
          doc.text(`Temperature: ${conditions.temperatureCondition.toUpperCase()}`, 20, yPos);

          if (conditions.warnings.length > 0) {
            yPos += 10;
            doc.setFont('helvetica', 'bold');
            doc.text('WARNINGS:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            conditions.warnings.forEach(warning => {
              yPos += 7;
              doc.text(`• ${warning}`, 25, yPos);
            });
          }

          if (conditions.recommendations.length > 0) {
            yPos += 10;
            doc.setFont('helvetica', 'bold');
            doc.text('RECOMMENDATIONS:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            conditions.recommendations.forEach(rec => {
              yPos += 7;
              doc.text(`• ${rec}`, 25, yPos);
            });
          }
        }
      }

      // Add new page for waypoint details if needed
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      } else {
        yPos += 20;
      }

      // Waypoint Details
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('WAYPOINT DETAILS', 20, yPos);
      
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('WP#', 20, yPos);
      doc.text('Label', 35, yPos);
      doc.text('Latitude', 80, yPos);
      doc.text('Longitude', 120, yPos);
      doc.text('Altitude (m)', 160, yPos);
      
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      
      waypoints.forEach((wp, index) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        yPos += 7;
        doc.text(`${index + 1}`, 20, yPos);
        doc.text(wp.label, 35, yPos);
        doc.text(wp.lat.toFixed(6), 80, yPos);
        doc.text(wp.lng.toFixed(6), 120, yPos);
        doc.text(wp.altitude.toString(), 160, yPos);
      });

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated by ${COMPANY_INFO.name} Mission Planner`, 105, 290, { align: 'center' });
      doc.text(`Contact: ${COMPANY_INFO.website}`, 105, 295, { align: 'center' });

      // Save the PDF
      const fileName = `mission_briefing_${new Date().toISOString().slice(0,10)}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF briefing:', error);
      alert('Error generating PDF briefing. Please try again.');
    }
  }

  /**
   * Export mission data as KML file for use with Google Earth and other mapping software
   */
  private exportKML() {
    if (this.waypoints.size === 0) {
      alert('No waypoints to export. Please add waypoints first.');
      return;
    }

    try {
      const waypoints = Array.from(this.waypoints.values());
      
      // Create GeoJSON structure for tokml
      const geojson = {
        type: 'FeatureCollection',
        features: [
          // Add waypoints as points
          ...waypoints.map((wp, index) => ({
            type: 'Feature',
            properties: {
              name: wp.label,
              description: `Waypoint ${index + 1}\nAltitude: ${wp.altitude}m\nNotes: ${wp.notes || 'None'}`,
              altitude: wp.altitude
            },
            geometry: {
              type: 'Point',
              coordinates: [wp.lng, wp.lat, wp.altitude]
            }
          })),
          // Add flight path as a line
          {
            type: 'Feature',
            properties: {
              name: 'Flight Path',
              description: `Total distance: ${(this.calculateMissionMetadata().totalDistance / 1000).toFixed(2)} km`,
              stroke: '#FF0000',
              'stroke-width': 3
            },
            geometry: {
              type: 'LineString',
              coordinates: waypoints.map(wp => [wp.lng, wp.lat, wp.altitude])
            }
          }
        ]
      };

      const kml = tokml(geojson, {
        documentName: this.currentMission?.name || 'UAV Mission',
        documentDescription: `Generated by ${COMPANY_INFO.name} on ${new Date().toLocaleString()}`
      });

      // Download the KML file
      const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mission_${new Date().toISOString().slice(0,10)}.kml`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting KML:', error);
      alert('Error exporting KML file. Please try again.');
    }
  }

  /**
   * Export waypoints as CSV file for spreadsheet analysis
   */
  private exportCSV() {
    if (this.waypoints.size === 0) {
      alert('No waypoints to export. Please add waypoints first.');
      return;
    }

    try {
      const waypoints = Array.from(this.waypoints.values());
      const csvContent = [
        'Waypoint,Label,Latitude,Longitude,Altitude_m,Notes,Color,Is_Home',
        ...waypoints.map((wp, index) => 
          `${index + 1},"${wp.label}",${wp.lat},${wp.lng},${wp.altitude},"${wp.notes}",${wp.color},${wp.isHome}`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `waypoints_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error exporting CSV file. Please try again.');
    }
  }

  private handleApiKeySave() {
    // Use environment variable if available, otherwise use input values
    const envGoogleKey = getEnvironmentVariable('VITE_GOOGLE_MAPS_API_KEY');
    const googleApiKey = envGoogleKey || this.googleApiKeyInputElement?.value;
    
    const envWeatherKey = getEnvironmentVariable('VITE_WEATHER_API_KEY');
    const weatherApiKey = envWeatherKey || this.weatherApiKeyInputElement?.value;

    if (googleApiKey) {
      // Only save to localStorage if not using environment variables
      if (!envGoogleKey) {
        localStorage.setItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY, googleApiKey);
      }
      if (weatherApiKey && !envWeatherKey) {
        localStorage.setItem(WEATHER_API_KEY_STORAGE_KEY, weatherApiKey);
      } else if (!weatherApiKey && !envWeatherKey) {
        // If the weather key is empty and not in env, remove it from storage.
        localStorage.removeItem(WEATHER_API_KEY_STORAGE_KEY);
      }
      this.showApiKeyModal = false;
      this.apiKeyError = '';
      this.loadMap(googleApiKey);
    } else {
      this.apiKeyError = 'Please enter a Google Maps API key to continue.';
    }
  }

  private handleApiKeyInput() {
    if (this.apiKeyError) this.apiKeyError = '';
  }

  private handleSettingsApiKeyInput() {
    // Clear any existing errors when user starts typing
    this.apiKeyError = '';
  }

  private saveApiKeysFromSettings() {
    const googleApiKey = this.settingsGoogleApiKeyElement?.value;
    const weatherApiKey = this.settingsWeatherApiKeyElement?.value;

    if (googleApiKey) {
      localStorage.setItem(GOOGLE_MAPS_API_KEY_STORAGE_KEY, googleApiKey);
      
      // If this is a new or different key, reload the map
      const currentKey = getGoogleMapsApiKey();
      if (currentKey !== googleApiKey) {
        this.mapInitialized = false;
        this.loadMap(googleApiKey);
      }
    }

    if (weatherApiKey) {
      localStorage.setItem(WEATHER_API_KEY_STORAGE_KEY, weatherApiKey);
    } else {
      localStorage.removeItem(WEATHER_API_KEY_STORAGE_KEY);
    }

    // Refresh weather data with potentially new key
    this.fetchMissionWeather();
    this.fetchMETAR();
    this.fetchTAF();
    this.fetchForecast();
    this.debouncedFetchWeather();

    // Force re-render to update the UI
    this.requestUpdate();
    
    // Show confirmation
    alert('API keys saved successfully!');
  }

  private handleMapClick(event: google.maps.MapMouseEvent) {
    if (this.mapMode !== 'add_waypoint' || !event.latLng) return;
    this.addWaypoint(event.latLng.lat(), event.latLng.lng());
  }

  private addWaypoint(lat: number, lng: number) {
    const id = crypto.randomUUID();
    const isHome = this.waypoints.size === 0;

    const newWaypoint: Waypoint = {
      id,
      lat,
      lng,
      altitude: 100,
      speed: 15, // Default cruise speed in m/s
      label: isHome ? 'Home' : `Waypoint ${this.waypoints.size + 1}`,
      notes: '',
      color: isHome ? 'blue' : 'red',
      isHome,
    };

    const newWaypoints = new Map(this.waypoints);
    newWaypoints.set(id, newWaypoint);
    this.waypoints = newWaypoints;
    this.createMapMarker(newWaypoint);
    this.updateFlightPath();
    this.fetchMissionWeather();
    this.fetchMETAR();
    this.fetchTAF();
    this.fetchForecast();
    this.selectedWaypointId = id;
    if (isHome) this.mapMode = 'add_waypoint';
    else this.mapMode = 'pan'; // Revert to pan after adding non-home waypoints
  }

  private updateFlightPath() {
    if (!this.map) return;

    // Remove existing flight path
    if (this.flightPath) {
      this.flightPath.setMap(null);
    }

    // Create new flight path if we have waypoints
    const waypointArray = Array.from(this.waypoints.values()).sort((a, b) => {
      // Sort with home first, then by creation order
      if (a.isHome && !b.isHome) return -1;
      if (!a.isHome && b.isHome) return 1;
      return a.label.localeCompare(b.label);
    });

    if (waypointArray.length > 1) {
      const flightPlanCoordinates = waypointArray.map(wp => ({
        lat: wp.lat,
        lng: wp.lng
      }));

      this.flightPath = new google.maps.Polyline({
        path: flightPlanCoordinates,
        geodesic: true,
        strokeColor: '#FF0000',
        strokeOpacity: 1.0,
        strokeWeight: 3,
        icons: [{
          icon: {
            path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6,
            strokeColor: '#FF0000',
            strokeWeight: 2,
            fillColor: '#FF0000',
            fillOpacity: 1,
          },
          offset: '50%',
          repeat: '100px'
        }]
      });

      this.flightPath.setMap(this.map);
    }
  }

  private createMapMarker(waypoint: Waypoint) {
    if (!this.map) return;
    const {AdvancedMarkerElement} = google.maps.marker;

    const markerIcon = document.createElement('div');
    markerIcon.className = 'marker-icon';
    if (waypoint.isHome) {
      markerIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Z"/></svg>`;
    }

    const marker = new AdvancedMarkerElement({
      position: {lat: waypoint.lat, lng: waypoint.lng},
      map: this.map,
      title: waypoint.label,
      gmpDraggable: true,
      content: markerIcon,
    });
    // Bit of a hack to set background color, as it's not directly supported.
    (marker.content as HTMLElement).style.backgroundColor =
      WAYPOINT_COLORS[waypoint.color];

    marker.addListener('click', () => {
      this.selectedWaypointId = waypoint.id;
    });

    marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
      const {latLng} = event;
      if (latLng) {
        this.updateWaypoint(waypoint.id, {lat: latLng.lat(), lng: latLng.lng()});
      }
    });

    this.mapMarkers.set(waypoint.id, marker);
  }

  private updateWaypoint(id: string, newProps: Partial<Waypoint>) {
    const waypoint = this.waypoints.get(id);
    if (!waypoint) return;

    const updatedWaypoint = {...waypoint, ...newProps};
    const newWaypoints = new Map(this.waypoints);
    newWaypoints.set(id, updatedWaypoint);
    this.waypoints = newWaypoints;

    const marker = this.mapMarkers.get(id);
    if (marker) {
      if (newProps.label) marker.title = newProps.label;
      if (newProps.color) {
        (marker.content as HTMLElement).style.backgroundColor =
          WAYPOINT_COLORS[newProps.color];
      }
      if (newProps.lat !== undefined && newProps.lng !== undefined) {
        marker.position = {lat: newProps.lat, lng: newProps.lng};
      }
    }
    
    // Update flight path when waypoint position changes
    if (newProps.lat !== undefined || newProps.lng !== undefined) {
      this.updateFlightPath();
      this.fetchMissionWeather();
    }
  }

  private deleteWaypoint(id: string) {
    const newWaypoints = new Map(this.waypoints);
    newWaypoints.delete(id);
    this.waypoints = newWaypoints;
    const marker = this.mapMarkers.get(id);
    if (marker) {
      marker.map = null; // Remove marker from map
      this.mapMarkers.delete(id);
    }
    if (this.selectedWaypointId === id) {
      this.selectedWaypointId = null;
    }
    
    // Update flight path after deletion
    this.updateFlightPath();
    this.fetchMissionWeather();
  }

  private renderToolbar() {
    return html`
      <div class="toolbar" role="toolbar">
        <div class="search-box-container">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor">
            <path
              d="M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z" />
          </svg>
          <input
            id="search-box"
            type="text"
            placeholder="Search for a location..." />
        </div>
        <div class="divider"></div>
        <button
          @click=${() => {
            this.mapMode = 'add_waypoint';
          }}
          class=${classMap({'active': this.mapMode === 'add_waypoint'})}
          aria-pressed=${this.mapMode === 'add_waypoint'}
          title="Add Waypoint">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="currentColor">
            <path
              d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q324-80 222-211T120-480q0-104 102-231t258-231q156 104 258 231t102 231q0 135-102 266T480-80Z" />
          </svg>
          <span>Add Waypoint</span>
        </button>
        <div class="divider"></div>
        <div class="map-controls">
          <button @click=${() => this.map?.setZoom((this.map.getZoom() ?? 12) + 1)} title="Zoom In">+</button>
          <button @click=${() => this.map?.setZoom((this.map.getZoom() ?? 12) - 1)} title="Zoom Out">-</button>
          <button @click=${() => this.map?.setCenter(LOS_ANGELES_CENTER)} title="Recenter Map">
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M480-440q-17 0-28.5-11.5T440-480q0-17 11.5-28.5T480-520q17 0 28.5 11.5T520-480q0 17-11.5 28.5T480-440Zm0 400q-150 0-255-105T120-400q0-150 105-255t255-105q150 0 255 105t105 255q0 150-105 255T480-40Zm0-80q117 0 198.5-81.5T760-400q0-117-81.5-198.5T480-680q-117 0-198.5 81.5T200-400q0 117 81.5 198.5T480-120Z"/></svg>
          </button>
        </div>
      </div>
    `;
  }

  private renderSidebar() {
    return html`
      <div
        class="sidebar"
        role="complementary"
        aria-labelledby="sidebar-heading">
        
        <!-- Tab Navigation -->
        <div class="tab-navigation" role="tablist">
          <button
            class=${classMap({ 'tab-button': true, 'active': this.activeTab === 'waypoints' })}
            role="tab"
            @click=${() => this.activeTab = 'waypoints'}
            aria-selected=${this.activeTab === 'waypoints'}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
              <path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 400Q324-80 222-211T120-480q0-104 102-231t258-231q156 104 258 231t102 231q0 135-102 266T480-80Z"/>
            </svg>
            Waypoints
          </button>
          <button
            class=${classMap({ 'tab-button': true, 'active': this.activeTab === 'weather' })}
            role="tab"
            @click=${() => this.activeTab = 'weather'}
            aria-selected=${this.activeTab === 'weather'}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
              <path d="M280-120q-91 0-155.5-64.5T60-340q0-83 55-148t136-78q32-57 87.5-95.5T480-700q90 0 156.5 57.5T717-500q69 6 116 57t47 122q0 75-52.5 128T700-140H280Z"/>
            </svg>
            Weather
          </button>
          <button
            class=${classMap({ 'tab-button': true, 'active': this.activeTab === 'settings' })}
            role="tab"
            @click=${() => this.activeTab = 'settings'}
            aria-selected=${this.activeTab === 'settings'}>
            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
              <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-15.5t1-15.5L78-562l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 15.5t-1 15.5l103 78-110 190-119-50q-11 8-23 15t-24 12L590-80H370Z"/>
            </svg>
            Settings
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          ${this.activeTab === 'waypoints' ? this.renderWaypointsTab() : ''}
          ${this.activeTab === 'weather' ? this.renderWeatherTab() : ''}
          ${this.activeTab === 'settings' ? this.renderSettingsTab() : ''}
        </div>
      </div>
    `;
  }

  private renderWaypointsTab() {
    const selectedWaypoint = this.selectedWaypointId
      ? this.waypoints.get(this.selectedWaypointId)
      : null;

    return html`
      <div class="waypoints-tab" role="tabpanel">
        <h3>Mission Waypoints</h3>
        <div class="waypoint-list" role="list">
          ${[...this.waypoints.values()].map(
            (waypoint) => html`
              <div
                class=${classMap({
                  'waypoint-item': true,
                  'selected': waypoint.id === this.selectedWaypointId,
                })}
                role="listitem"
                tabindex="0"
                @click=${() => {
                  this.selectedWaypointId = waypoint.id;
                }}
                @keydown=${(e: KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    this.selectedWaypointId = waypoint.id;
                }}>
                <span
                  class="waypoint-color-dot"
                  style=${styleMap({
                    backgroundColor: WAYPOINT_COLORS[waypoint.color],
                  })}></span>
                <div class="waypoint-details">
                   <span class="waypoint-label">${waypoint.label}</span>
                   <span class="waypoint-coords">
                     ${waypoint.lat.toFixed(6)}, ${waypoint.lng.toFixed(6)}
                   </span>
                   <span class="waypoint-meta">
                     Alt: ${waypoint.altitude}m | Speed: ${waypoint.speed}m/s
                   </span>
                </div>
              </div>
            `,
          )}
          ${this.waypoints.size === 0
            ? html`<p class="empty-list-message">
                Click "Add Waypoint", then click the map to set a home position.
              </p>`
            : nothing}
        </div>
        ${selectedWaypoint ? this.renderWaypointEditor(selectedWaypoint) : ''}
      </div>
    `;
  }

  private renderWeatherTab() {
    const metadata = this.waypoints.size > 0 ? this.calculateMissionMetadata() : null;
    
    return html`
      <div class="weather-tab" role="tabpanel">
        <h3>Mission Weather</h3>
        ${this.missionWeather ? html`
          <div class="weather-card">
            <div class="weather-header">
              <img src=${this.missionWeather.icon} alt="Weather icon" />
              <div class="weather-main">
                <div class="weather-temp">
                  ${Math.round(this.missionWeather.tempF)}°F 
                  <span class="temp-celsius">(${Math.round(this.missionWeather.temp)}°C)</span>
                </div>
                <div class="weather-desc">${this.missionWeather.description}</div>
                <div class="weather-city">${this.missionWeather.city}</div>
              </div>
            </div>
            
            <div class="weather-details">
              ${this.missionWeather.feelsLikeF ? html`
                <div class="weather-item">
                  <strong>Feels Like:</strong> ${Math.round(this.missionWeather.feelsLikeF)}°F 
                  (${Math.round(this.missionWeather.feelsLike || 0)}°C)
                </div>
              ` : ''}
              
              ${this.missionWeather.wind ? html`
                <div class="weather-item">
                  <strong>Wind:</strong> ${this.missionWeather.wind.speed} m/s from ${this.missionWeather.wind.deg}°
                  ${this.missionWeather.wind.gust ? html` (gusts to ${this.missionWeather.wind.gust} m/s)` : ''}
                </div>
              ` : ''}
              
              ${this.missionWeather.visibility ? html`
                <div class="weather-item">
                  <strong>Visibility:</strong> ${(this.missionWeather.visibility / 1000).toFixed(1)} km
                </div>
              ` : ''}
              
              <div class="weather-item">
                <strong>Humidity:</strong> ${this.missionWeather.humidity}%
              </div>
              
              <div class="weather-item">
                <strong>Pressure:</strong> ${this.missionWeather.pressure} hPa
              </div>
              
              ${this.missionWeather.clouds !== undefined ? html`
                <div class="weather-item">
                  <strong>Cloud Cover:</strong> ${this.missionWeather.clouds}%
                </div>
              ` : ''}
              
              ${this.missionWeather.uvi !== undefined ? html`
                <div class="weather-item">
                  <strong>UV Index:</strong> ${this.missionWeather.uvi}
                </div>
              ` : ''}
              
              ${this.missionWeather.dewPoint !== undefined ? html`
                <div class="weather-item">
                  <strong>Dew Point:</strong> ${Math.round(celsiusToFahrenheit(this.missionWeather.dewPoint))}°F 
                  (${Math.round(this.missionWeather.dewPoint)}°C)
                </div>
              ` : ''}
            </div>
            
            ${metadata ? html`
              <div class="flight-conditions">
                <h4>Flight Conditions Analysis</h4>
                ${(() => {
                  const conditions = analyzeFlightConditions(this.missionWeather);
                  return html`
                    <div class="condition-summary ${conditions.flightSuitability}">
                      <strong>Overall Suitability:</strong> ${conditions.flightSuitability.toUpperCase()}
                    </div>
                    
                    <div class="condition-details">
                      <div class="condition-item">
                        <strong>Wind:</strong> ${conditions.windCondition.toUpperCase()}
                      </div>
                      <div class="condition-item">
                        <strong>Visibility:</strong> ${conditions.visibilityCondition.toUpperCase()}
                      </div>
                      <div class="condition-item">
                        <strong>Temperature:</strong> ${conditions.temperatureCondition.toUpperCase()}
                      </div>
                    </div>
                    
                    ${conditions.warnings.length > 0 ? html`
                      <div class="warnings">
                        <h5>⚠️ Warnings:</h5>
                        ${conditions.warnings.map(warning => html`
                          <div class="warning-item">• ${warning}</div>
                        `)}
                      </div>
                    ` : ''}
                    
                    ${conditions.recommendations.length > 0 ? html`
                      <div class="recommendations">
                        <h5>💡 Recommendations:</h5>
                        ${conditions.recommendations.map(rec => html`
                          <div class="recommendation-item">• ${rec}</div>
                        `)}
                      </div>
                    ` : ''}
                  `;
                })()}
              </div>
            ` : ''}
          </div>
        ` : html`
          <div class="no-weather">
            ${this.waypoints.size === 0 ? 
              'Add waypoints to see mission weather data.' :
              'Weather data not available. Check your API key or internet connection.'
            }
          </div>
        `}
      </div>
    `;
  }

  private renderSettingsTab() {
    const metadata = this.waypoints.size > 0 ? this.calculateMissionMetadata() : null;
    const currentGoogleKey = getGoogleMapsApiKey();
    const currentWeatherKey = getWeatherApiKey();
    const envGoogleKey = getEnvironmentVariable('VITE_GOOGLE_MAPS_API_KEY');
    const envWeatherKey = getEnvironmentVariable('VITE_WEATHER_API_KEY');
    
    return html`
      <div class="settings-tab" role="tabpanel">
        <h3>Mission Settings</h3>
        
        <!-- API Configuration Section -->
        <div class="api-configuration">
          <h4>API Configuration</h4>
          <div class="api-config-section">
            <div class="form-group">
              <label for="settings-google-api-key">Google Maps API Key</label>
              ${envGoogleKey ? html`
                <div class="env-notice">✓ Using environment variable</div>
              ` : html`
                <input
                  type="password"
                  id="settings-google-api-key"
                  placeholder="Enter Google Maps API key"
                  .value=${currentGoogleKey || ''}
                  @input=${this.handleSettingsApiKeyInput} />
                <small>Required for map functionality. <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank">Get a key</a></small>
              `}
            </div>
            
            <div class="form-group">
              <label for="settings-weather-api-key">OpenWeather API Key</label>
              ${envWeatherKey ? html`
                <div class="env-notice">✓ Using environment variable</div>
              ` : html`
                <input
                  type="password"
                  id="settings-weather-api-key"
                  placeholder="Enter OpenWeather API key"
                  .value=${currentWeatherKey || ''}
                  @input=${this.handleSettingsApiKeyInput} />
                <small>Optional for weather data. <a href="https://openweathermap.org/appid" target="_blank">Get a key</a></small>
              `}
            </div>
            
            ${!envGoogleKey || !envWeatherKey ? html`
              <button 
                class="control-button save-keys-button" 
                @click=${this.saveApiKeysFromSettings}>
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                  <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/>
                </svg>
                Save API Keys
              </button>
            ` : ''}
          </div>
        </div>
        
        ${metadata ? html`
          <div class="mission-stats">
            <h4>Mission Statistics</h4>
            <div class="stat-item">
              <strong>Total Distance:</strong> ${(metadata.totalDistance / 1000).toFixed(2)} km
            </div>
            <div class="stat-item">
              <strong>Estimated Flight Time:</strong> ${Math.floor(metadata.estimatedFlightTime / 60)}m ${Math.round(metadata.estimatedFlightTime % 60)}s
            </div>
            <div class="stat-item">
              <strong>Max Altitude:</strong> ${metadata.maxAltitude} m
            </div>
            <div class="stat-item">
              <strong>Waypoints:</strong> ${this.waypoints.size}
            </div>
          </div>
        ` : ''}
        
        <div class="mission-controls">
          <h4>Mission Management</h4>
          <div class="control-buttons">
            <button 
              class="control-button save-button" 
              @click=${this.saveMission}
              ?disabled=${this.waypoints.size === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160ZM760-647L647-760H200v560h560v-447ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-87v447-560 113Z"/>
              </svg>
              Save Mission
            </button>
            
            <button 
              class="control-button load-button" 
              @click=${this.loadMission}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="mission-controls">
          <h4>Export Options</h4>
          <div class="control-buttons">
            <button 
              class="control-button export-button" 
              @click=${this.generatePDFBriefing}
              ?disabled=${this.waypoints.size === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/>
              </svg>
              PDF Briefing
            </button>
            
            <button 
              class="control-button export-button" 
              @click=${this.exportKML}
              ?disabled=${this.waypoints.size === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-40-82v-78q-33 0-56.5-23.5T360-320v-40L168-552q-3 18-5.5 36t-2.5 36q0 121 79.5 212T440-162Zm276-102q20-22 36-47.5t26.5-53q10.5-27.5 16-56.5t5.5-59q0-98-54.5-179T600-776v16q0 33-23.5 56.5T520-680h-80v80q0 17-11.5 28.5T400-560h-80v80h240q17 0 28.5 11.5T600-440v120h40q26 0 47 15.5t29 40.5Z"/>
              </svg>
              Export KML
            </button>

            <button 
              class="control-button export-button" 
              @click=${this.exportCSV}
              ?disabled=${this.waypoints.size === 0}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor">
                <path d="M240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM320-240h120v-80H320v80Zm200 0h120v-80H520v80ZM320-360h120v-80H320v80Zm200 0h120v-80H520v80ZM320-480h320v-80H320v80ZM240-800v200-200 640-640Z"/>
              </svg>
              Export CSV
            </button>
          </div>
        </div>

        ${this.currentMission ? html`
          <div class="current-mission">
            <h4>Current Mission</h4>
            <div class="mission-info">
              <div><strong>Name:</strong> ${this.currentMission.name}</div>
              <div><strong>Created:</strong> ${new Date(this.currentMission.createdAt).toLocaleString()}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderWaypointEditor(waypoint: Waypoint) {
    return html`
      <div class="waypoint-editor" aria-labelledby="editor-heading">
        <h3 id="editor-heading">
          Edit ${waypoint.isHome ? 'Home' : 'Waypoint'}
        </h3>
        <div class="form-group">
          <label for="waypoint-label">Label</label>
          <input
            type="text"
            id="waypoint-label"
            .value=${waypoint.label}
            @input=${(e: InputEvent) =>
              this.updateWaypoint(waypoint.id, {
                label: (e.target as HTMLInputElement).value,
              })} />
        </div>
        <div class="form-group">
          <label>Color</label>
          <div class="color-palette">
            ${Object.entries(WAYPOINT_COLORS).map(
              ([name, color]) => html`
                <button
                  class=${classMap({
                    'color-swatch': true,
                    'selected': waypoint.color === name,
                  })}
                  style=${styleMap({backgroundColor: color})}
                  aria-label=${`Set color to ${name}`}
                  @click=${() =>
                    this.updateWaypoint(waypoint.id, {
                      color: name as WaypointColor,
                    })}></button>
              `,
            )}
          </div>
        </div>
        <div class="form-group">
          <label for="waypoint-altitude">Altitude (meters)</label>
          <input
            type="number"
            id="waypoint-altitude"
            .value=${String(waypoint.altitude)}
            @input=${(e: InputEvent) =>
              this.updateWaypoint(waypoint.id, {
                altitude: Number((e.target as HTMLInputElement).value),
              })} />
        </div>
        <div class="form-group">
          <label for="waypoint-speed">Speed (m/s)</label>
          <input
            type="number"
            id="waypoint-speed"
            min="1"
            max="50"
            step="0.1"
            .value=${String(waypoint.speed)}
            @input=${(e: InputEvent) =>
              this.updateWaypoint(waypoint.id, {
                speed: Number((e.target as HTMLInputElement).value),
              })} />
        </div>
        <div class="form-group">
          <label for="waypoint-notes">Notes</label>
          <textarea
            id="waypoint-notes"
            .value=${waypoint.notes}
            @input=${(e: InputEvent) =>
              this.updateWaypoint(waypoint.id, {
                notes: (e.target as HTMLTextAreaElement).value,
              })}></textarea>
        </div>
        <button
          class="delete-button"
          @click=${() => this.deleteWaypoint(waypoint.id)}>
          Delete Waypoint
        </button>
      </div>
    `;
  }

  private renderApiKeyModal() {
    const envGoogleKey = getEnvironmentVariable('VITE_GOOGLE_MAPS_API_KEY');
    const envWeatherKey = getEnvironmentVariable('VITE_WEATHER_API_KEY');
    
    return html`
      <div class="api-key-modal-backdrop">
        <div
          class="api-key-modal"
          role="dialog"
          aria-labelledby="api-key-heading">
          <h2 id="api-key-heading">API Configuration</h2>
          ${envGoogleKey 
            ? html`<p class="env-notice">✓ Google Maps API key loaded from environment variables.</p>`
            : html`<p>This app requires a Google Maps API key to function. A key for OpenWeatherMap is optional but enables the live weather display.</p>`
          }
          ${!envGoogleKey ? html`
            <div class="form-group">
              <label for="google-api-key-input"
                >Google Maps API Key (Required)</label
              >
              <input
                type="text"
                id="google-api-key-input"
                placeholder="Enter Google Maps key"
                .value=${getGoogleMapsApiKey() || ''}
                @input=${this.handleApiKeyInput} />
              <a
                href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                target="_blank"
                rel="noopener"
                >Get a Maps Key</a
              >
            </div>
          ` : ''}
          ${!envWeatherKey ? html`
            <div class="form-group">
              <label for="weather-api-key-input"
                >OpenWeatherMap API Key (Optional)</label
              >
              <input
                type="text"
                id="weather-api-key-input"
                placeholder="Enter OpenWeatherMap key"
                .value=${getWeatherApiKey() || ''}
                @input=${this.handleApiKeyInput} />
              <a
                href="https://openweathermap.org/appid"
                target="_blank"
                rel="noopener"
                >Get a Weather Key</a
              >
            </div>
          ` : html`<p class="env-notice">✓ Weather API key loaded from environment variables.</p>`}
          ${this.apiKeyError
            ? html`<div class="api-key-error" role="alert">
                ${this.apiKeyError}
              </div>`
            : ''}
          <button class="save-api-key-button" @click=${this.handleApiKeySave}>
            ${envGoogleKey ? 'Continue with Environment Keys' : 'Save and Load Map'}
          </button>
        </div>
      </div>
    `;
  }

  private renderWeather() {
    if (!this.weather) return nothing;
    return html`
      <div class="weather-overlay">
        <img src=${this.weather.icon} alt="Weather icon" />
        <div class="weather-info">
          <div class="weather-temp">${Math.round(this.weather.temp)}°C</div>
          <div class="weather-desc">${this.weather.description}</div>
          <div class="weather-city">${this.weather.city}</div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.showApiKeyModal) {
      return this.renderApiKeyModal();
    }

    return html`
      <div class="gdm-map-app">
        <div
          class="main-container"
          role="application"
          aria-label="Interactive Map Area">
          ${this.renderToolbar()} ${this.renderWeather()}
          <div
            id="mapContainer"
            style="height: 100%; width: 100%; cursor: ${this.mapMode ===
            'add_waypoint'
              ? 'crosshair'
              : 'grab'};"></div>
        </div>
        ${this.renderSidebar()}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-map-app': MapApp;
  }
}