/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This file defines the main `gdm-map-app` LitElement component.
 * This component is responsible for:
 * - Rendering the user interface, including the Google Photorealistic 3D Map,
 *   a toolbar for map actions, and a sidebar for mission planning.
 * - Managing the state of the mission, including a list of waypoints.
 * - Handling direct user interaction with the map, such as clicking to add
 *   waypoints and dragging them to new positions.
 * - Providing a UI for customizing waypoint properties like labels, colors,
 *   altitude, and notes.
 * - Integrating with the Google Maps JavaScript API to load and control the
 *   map and its elements.
 */

import {Loader} from '@googlemaps/js-api-loader';
import {html, LitElement, PropertyValueMap, nothing} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import {classMap} from 'lit/directives/class-map.js';
import {styleMap} from 'lit/directives/style-map.js';

// Google Maps API Key is loaded from environment variables.
// This key is essential for loading and using Google Maps services.
// Ensure this key is configured with access to the "Maps JavaScript API",
// "Geocoding API", and the "Directions API".
const USER_PROVIDED_GOOGLE_MAPS_API_KEY = process.env.API_KEY;

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
}

/**
 * MapApp component for Photorealistic 3D Maps Mission Planner.
 */
@customElement('gdm-map-app')
export class MapApp extends LitElement {
  @query('#mapContainer') mapContainerElement?: HTMLElement;

  @state() mapInitialized = false;
  @state() mapError = '';
  @state() waypoints = new Map<string, Waypoint>();
  @state() selectedWaypointId: string | null = null;
  @state() mapMode: 'pan' | 'add_waypoint' = 'pan';

  private map?: any;
  private geocoder?: any;
  private Map3DElement?: any;
  private Marker3DElement?: any;
  private mapMarkers = new Map<string, any>();

  createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>,
  ): void {
    this.loadMap();
  }

  async loadMap() {
    if (
      !USER_PROVIDED_GOOGLE_MAPS_API_KEY ||
      USER_PROVIDED_GOOGLE_MAPS_API_KEY === ''
    ) {
      this.mapError = `Google Maps API Key is not configured. Please ensure the API_KEY environment variable is set.`;
      console.error(this.mapError);
      // FIX: The `requestUpdate` call was removed because updating the `@state` decorated `mapError` property already triggers a re-render.
      return;
    }

    const loader = new Loader({
      apiKey: USER_PROVIDED_GOOGLE_MAPS_API_KEY,
      version: 'beta',
      libraries: ['geocoding', 'routes', 'geometry'],
    });

    try {
      await loader.load();
      const maps3dLibrary = await (window as any).google.maps.importLibrary(
        'maps3d',
      );
      this.Map3DElement = maps3dLibrary.Map3DElement;
      this.Marker3DElement = maps3dLibrary.Marker3DElement;

      this.initializeMap();
      this.mapInitialized = true;
      this.mapError = '';
    } catch (error) {
      console.error('Error loading Google Maps API:', error);
      this.mapError =
        'Could not load Google Maps. Check console and API key.';
      this.mapInitialized = false;
    }
    // FIX: The `requestUpdate` call was removed because updates to `@state` decorated properties (`mapInitialized`, `mapError`) inside the try/catch block already trigger a re-render.
  }

  initializeMap() {
    if (!this.mapContainerElement || !this.Map3DElement) return;
    this.map = this.mapContainerElement;
    this.map.addEventListener('click', (event: any) =>
      this.handleMapClick(event),
    );
    if ((window as any).google && (window as any).google.maps) {
      this.geocoder = new (window as any).google.maps.Geocoder();
    }
  }

  private handleMapClick(event: any) {
    if (this.mapMode !== 'add_waypoint' || !event.latLng) return;
    this.addWaypoint(event.latLng.lat, event.latLng.lng);
    this.mapMode = 'pan'; // Revert to pan mode after adding a waypoint
  }

  private addWaypoint(lat: number, lng: number) {
    const id = crypto.randomUUID();
    const newWaypoint: Waypoint = {
      id,
      lat,
      lng,
      altitude: 100,
      label: `Waypoint ${this.waypoints.size + 1}`,
      notes: '',
      color: 'red',
    };

    // FIX: Used an immutable update pattern by creating a new Map. This automatically triggers a re-render in Lit.
    const newWaypoints = new Map(this.waypoints);
    newWaypoints.set(id, newWaypoint);
    this.waypoints = newWaypoints;
    this.createMapMarker(newWaypoint);
    this.selectedWaypointId = id;
  }

  private createMapMarker(waypoint: Waypoint) {
    if (!this.map || !this.Marker3DElement) return;

    const marker = new this.Marker3DElement();
    marker.position = {lat: waypoint.lat, lng: waypoint.lng, altitude: 0};
    marker.label = waypoint.label;
    marker.style.color = WAYPOINT_COLORS[waypoint.color];
    marker.draggable = true;

    marker.addEventListener('gmp-click', () => {
      this.selectedWaypointId = waypoint.id;
    });

    marker.addEventListener('gmp-dragend', (event: any) => {
      const {lat, lng} = event.position;
      this.updateWaypoint(waypoint.id, {lat, lng});
    });

    this.map.appendChild(marker);
    this.mapMarkers.set(waypoint.id, marker);
  }

  private updateWaypoint(id: string, newProps: Partial<Waypoint>) {
    const waypoint = this.waypoints.get(id);
    if (!waypoint) return;

    const updatedWaypoint = {...waypoint, ...newProps};
    // FIX: Used an immutable update pattern by creating a new Map. This automatically triggers a re-render in Lit.
    const newWaypoints = new Map(this.waypoints);
    newWaypoints.set(id, updatedWaypoint);
    this.waypoints = newWaypoints;

    const marker = this.mapMarkers.get(id);
    if (marker) {
      if (newProps.label) marker.label = newProps.label;
      if (newProps.color) marker.style.color = WAYPOINT_COLORS[newProps.color];
      if (newProps.lat !== undefined && newProps.lng !== undefined) {
        marker.position = {
          lat: newProps.lat,
          lng: newProps.lng,
          altitude: 0,
        };
      }
    }
  }

  private deleteWaypoint(id: string) {
    // FIX: Used an immutable update pattern by creating a new Map. This automatically triggers a re-render in Lit.
    const newWaypoints = new Map(this.waypoints);
    newWaypoints.delete(id);
    this.waypoints = newWaypoints;
    const marker = this.mapMarkers.get(id);
    if (marker) {
      marker.remove();
      this.mapMarkers.delete(id);
    }
    if (this.selectedWaypointId === id) {
      this.selectedWaypointId = null;
    }
  }

  private renderToolbar() {
    return html` <div class="toolbar" role="toolbar">
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
      <button
        @click=${() => {
          this.map.mode = 'roadmap';
        }}
        title="Roadmap View">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
          <path
            d="M480-40 320-200v-560l160-120 160 120v560L480-40Zm-80-600 80-60 80 60v440l-80 60-80-60v-440ZM160-120 40-280v-560l120-80 120 80v560L160-120Zm-40-520 40-20 40 20v400l-40 40-40-40v-400Zm720 520L680-280v-560l120-80 120 80v560L800-120Zm-40-520 40-20 40 20v400l-40 40-40-40v-400ZM120-640v400-400Zm640 0v400-400ZM480-160Z" />
        </svg>
        <span>Roadmap</span>
      </button>
      <button
        @click=${() => {
          this.map.mode = 'hybrid';
        }}
        title="Satellite View">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="currentColor">
          <path
            d="m616-322-56-56 103-102-224-224-102 102-56-56 158-158 280 280-153 154ZM240-80l-44-44 104-104-56-56-104 104L0-280l280-280 156 156-104 104 56 56 104-104 44 44L240-80Zm440-440-44-44 104-104-56-56-104 104L536-880l280-280 280 280-280 280L680-520Z" />
        </svg>
        <span>Satellite</span>
      </button>
    </div>`;
  }

  private renderSidebar() {
    const selectedWaypoint = this.selectedWaypointId
      ? this.waypoints.get(this.selectedWaypointId)
      : null;

    return html`
      <div class="sidebar" role="complementary" aria-labelledby="sidebar-heading">
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
                <span class="waypoint-label">${waypoint.label}</span>
              </div>
            `,
          )}
          ${
            this.waypoints.size === 0
              ? html`<p class="empty-list-message">
                  No waypoints added. Click "Add Waypoint" on the toolbar and
                  then click on the map to begin.
                </p>`
              : nothing
          }
        </div>
        ${selectedWaypoint ? this.renderWaypointEditor(selectedWaypoint) : ''}
      </div>
    `;
  }

  private renderWaypointEditor(waypoint: Waypoint) {
    return html`
      <div class="waypoint-editor" aria-labelledby="editor-heading">
        <h3 id="editor-heading">Edit Waypoint</h3>
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

  render() {
    const initialCenter = '34.0522,-118.2437,100'; // Los Angeles
    const initialRange = '20000';
    const initialTilt = '45';
    const initialHeading = '0';

    return html`
      <div class="gdm-map-app">
        <div
          class="main-container"
          role="application"
          aria-label="Interactive Map Area">
          ${this.renderToolbar()}
          ${
            this.mapError
              ? html`<div class="map-error-message" role="alert">
                  ${this.mapError}
                </div>`
              : ''
          }
          <gmp-map-3d
            id="mapContainer"
            style="height: 100%; width: 100%; cursor: ${this.mapMode ===
            'add_waypoint'
              ? 'crosshair'
              : 'grab'};"
            aria-label="Google Photorealistic 3D Map Display"
            mode="hybrid"
            center="${initialCenter}"
            heading="${initialHeading}"
            tilt="${initialTilt}"
            range="${initialRange}"
            internal-usage-attribution-ids="gmp_aistudio_missionplanner_v0.1_showcase"
            default-ui-disabled="true"
            role="application">
          </gmp-map-3d>
        </div>
        ${this.renderSidebar()}
      </div>
    `;
  }
}
