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
  label: string;
  notes: string;
  color: WaypointColor;
  isHome: boolean;
}

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  city: string;
  wind?: {
    speed: number;
    deg: number;
  };
  visibility?: number;
  humidity?: number;
  pressure?: number;
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

  @state() private showApiKeyModal = true;
  @state() private mapInitialized = false;
  @state() private apiKeyError = '';
  @state() private waypoints = new Map<string, Waypoint>();
  @state() private selectedWaypointId: string | null = null;
  @state() private mapMode: 'pan' | 'add_waypoint' = 'pan';
  @state() private weather: WeatherData | null = null;
  @state() private activeTab: 'waypoints' | 'weather' | 'settings' = 'waypoints';
  @state() private missionWeather: WeatherData | null = null;
  @state() private currentMission: MissionData | null = null;

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
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather data fetch failed');
      const data = await response.json();
      this.weather = {
        temp: data.main.temp,
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
        city: data.name,
        wind: data.wind ? {
          speed: data.wind.speed,
          deg: data.wind.deg
        } : undefined,
        visibility: data.visibility,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
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

    // Calculate center of mission area
    const waypointArray = Array.from(this.waypoints.values());
    const centerLat = waypointArray.reduce((sum, wp) => sum + wp.lat, 0) / waypointArray.length;
    const centerLng = waypointArray.reduce((sum, wp) => sum + wp.lng, 0) / waypointArray.length;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${centerLat}&lon=${centerLng}&appid=${apiKey}&units=metric`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Mission weather data fetch failed');
      const data = await response.json();
      this.missionWeather = {
        temp: data.main.temp,
        description: data.weather[0].description,
        icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`,
        city: data.name,
        wind: data.wind ? {
          speed: data.wind.speed,
          deg: data.wind.deg
        } : undefined,
        visibility: data.visibility,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
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
                <div class="weather-temp">${Math.round(this.missionWeather.temp)}°C</div>
                <div class="weather-desc">${this.missionWeather.description}</div>
                <div class="weather-city">${this.missionWeather.city}</div>
              </div>
            </div>
            
            <div class="weather-details">
              ${this.missionWeather.wind ? html`
                <div class="weather-item">
                  <strong>Wind:</strong> ${this.missionWeather.wind.speed} m/s 
                  (${this.missionWeather.wind.deg}°)
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
            </div>
            
            ${metadata ? html`
              <div class="flight-conditions">
                <h4>Flight Conditions Analysis</h4>
                <div class="condition-item">
                  <strong>Wind Impact:</strong> ${this.missionWeather.wind && this.missionWeather.wind.speed > 10 ? 
                    'High wind speeds may affect flight stability' : 'Wind conditions suitable for flight'}
                </div>
                <div class="condition-item">
                  <strong>Visibility:</strong> ${this.missionWeather.visibility && this.missionWeather.visibility < 5000 ?
                    'Reduced visibility - exercise caution' : 'Good visibility for flight operations'}
                </div>
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
    
    return html`
      <div class="settings-tab" role="tabpanel">
        <h3>Mission Settings</h3>
        
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
              Load Mission
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