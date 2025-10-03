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

  private map?: google.maps.Map;
  private geocoder?: google.maps.Geocoder;
  private mapMarkers = new Map<string, google.maps.marker.AdvancedMarkerElement>();
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
      };
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      this.weather = null; // Clear weather on error
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
    this.selectedWaypointId = id;
    if (isHome) this.mapMode = 'add_waypoint';
    else this.mapMode = 'pan'; // Revert to pan after adding non-home waypoints
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
    const selectedWaypoint = this.selectedWaypointId
      ? this.waypoints.get(this.selectedWaypointId)
      : null;

    return html`
      <div
        class="sidebar"
        role="complementary"
        aria-labelledby="sidebar-heading">
        <h2 id="sidebar-heading">Mission Plan</h2>
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