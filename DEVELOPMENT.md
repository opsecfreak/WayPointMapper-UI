# Development Guide

## 🏗️ Architecture Overview

The UAV Mission Planner follows a modular architecture built with modern web technologies:

### Core Technologies
- **LitElement**: Web Components framework for UI
- **TypeScript**: Type-safe JavaScript with enhanced developer experience
- **Vite**: Fast build tool and development server
- **Google Maps API**: Interactive mapping and geocoding
- **OpenWeatherMap API**: Real-time weather data

### File Structure
```
WayPointMapper-UI/
├── map_app.ts          # Main application component
├── schema.ts           # Data structures and type definitions
├── utils.ts            # Utility functions and error handling
├── index.html          # Application entry point
├── index.tsx           # Application bootstrap
├── vite.config.ts      # Build configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## 📋 Code Organization

### schema.ts - Data Layer
Contains all TypeScript interfaces, JSON schemas, and constants:

```typescript
// Core data structures
export interface Waypoint { ... }
export interface Mission { ... }
export interface WeatherData { ... }

// Configuration constants
export const DEFAULT_WAYPOINT_VALUES = { ... }
export const SIMULATION_CONFIG = { ... }
export const WEATHER_THRESHOLDS = { ... }

// JSON validation schemas
export const WaypointSchema = { ... }
export const MissionSchema = { ... }
```

**Benefits:**
- Centralized type definitions
- Consistent data validation
- Easy configuration management
- Reduced code duplication

### utils.ts - Utility Layer
Provides reusable functions for common operations:

```typescript
// Error handling
export class ApplicationError extends Error { ... }
export function handleError(error: unknown, context: string): void { ... }
export function showUserNotification(message: string, type: string): void { ... }

// Data validation
export function validateWaypoint(waypoint: any): boolean { ... }
export function validateMission(mission: any): boolean { ... }

// API utilities
export async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> { ... }

// File operations
export function downloadFile(content: string, filename: string, mimeType?: string): void { ... }
export function readFileAsText(file: File): Promise<string> { ... }

// Mathematical utilities
export function calculateDistance(point1: LatLng, point2: LatLng): number { ... }
export function calculateBearing(from: LatLng, to: LatLng): number { ... }
```

**Benefits:**
- Centralized error handling
- Consistent user notifications
- Reusable mathematical functions
- Safe file operations

### map_app.ts - Application Layer
Main component implementing the user interface and business logic:

```typescript
@customElement('gdm-map-app')
export class MapApp extends LitElement {
  // State management
  @state() private waypoints = new Map<string, Waypoint>();
  @state() private currentMission: Mission | null = null;
  @state() private simulationState: SimulationState | null = null;

  // Core functionality
  private addWaypoint(lat: number, lng: number): void { ... }
  private updateWaypoint(id: string, updates: Partial<Waypoint>): void { ... }
  private exportMission(): void { ... }
  private loadMission(file: File): Promise<void> { ... }

  // Simulation features
  private startSimulation(): void { ... }
  private updateDronePosition(): void { ... }
  private renderTelemetry(): TemplateResult { ... }
}
```

## 🔧 Development Workflow

### Setting Up Development Environment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   - Navigate to `http://localhost:3000`
   - Application will hot-reload on changes

### Build and Deployment

1. **Development Build**
   ```bash
   npm run build
   ```

2. **Preview Production Build**
   ```bash
   npm run preview
   ```

3. **Type Checking**
   ```bash
   npm run type-check
   ```

## 🧪 Code Quality Standards

### TypeScript Best Practices

1. **Strict Type Safety**
   ```typescript
   // Good: Explicit types
   const waypoint: Waypoint = {
     id: crypto.randomUUID(),
     lat: 40.7128,
     lng: -74.0060,
     altitude: DEFAULT_WAYPOINT_VALUES.altitude
   };

   // Avoid: Any types
   const waypoint: any = { ... };
   ```

2. **Interface Usage**
   ```typescript
   // Good: Import from schema
   import { Waypoint, Mission } from './schema.js';

   // Avoid: Local interfaces
   interface LocalWaypoint { ... }
   ```

3. **Error Handling**
   ```typescript
   // Good: Use utility functions
   try {
     validateWaypoint(waypoint);
     const result = await apiRequest<WeatherData>(url);
   } catch (error) {
     handleError(error, 'Weather Fetch');
   }

   // Avoid: Basic error handling
   try {
     // operation
   } catch (error) {
     console.error(error);
     alert('Error occurred');
   }
   ```

### Component Structure

1. **State Management**
   ```typescript
   // Group related state
   @state() private waypoints = new Map<string, Waypoint>();
   @state() private selectedWaypointId: string | null = null;
   @state() private mapMode: MapMode = 'add_waypoint';

   // Use descriptive names
   @state() private isSimulationRunning = false;
   @state() private simulationSpeed = 1.0;
   ```

2. **Method Organization**
   ```typescript
   export class MapApp extends LitElement {
     // Lifecycle methods first
     connectedCallback() { ... }
     updated(changedProperties: PropertyValues) { ... }

     // Public methods
     public exportMission(): void { ... }

     // Private methods grouped by functionality
     private addWaypoint(lat: number, lng: number): void { ... }
     private updateWaypoint(id: string, updates: Partial<Waypoint>): void { ... }

     // Simulation methods
     private startSimulation(): void { ... }
     private updateDronePosition(): void { ... }

     // Render methods
     render(): TemplateResult { ... }
     private renderWaypointList(): TemplateResult { ... }
   }
   ```

### Performance Guidelines

1. **Efficient State Updates**
   ```typescript
   // Good: Immutable updates
   const newWaypoints = new Map(this.waypoints);
   newWaypoints.set(id, updatedWaypoint);
   this.waypoints = newWaypoints;

   // Avoid: Direct mutation
   this.waypoints.set(id, updatedWaypoint);
   ```

2. **Debounced API Calls**
   ```typescript
   // Use debounce for expensive operations
   private debouncedWeatherFetch = debounce(this.fetchWeather.bind(this), 500);
   ```

3. **Throttled Animation**
   ```typescript
   // Use throttle for frequent updates
   private throttledPositionUpdate = throttle(this.updateDronePosition.bind(this), 16);
   ```

## 🐛 Debugging and Testing

### Development Tools

1. **Browser DevTools**
   - Use TypeScript source maps for debugging
   - Monitor network requests for API calls
   - Check console for error messages

2. **Vite DevServer**
   - Hot module replacement for fast development
   - Real-time error reporting
   - Automatic type checking

### Common Issues and Solutions

1. **API Key Issues**
   ```typescript
   // Check API key configuration
   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
   if (!apiKey) {
     throw new ApplicationError(
       'Missing Google Maps API key',
       'Please configure your API key in settings',
       'MISSING_API_KEY'
     );
   }
   ```

2. **Map Loading Problems**
   ```typescript
   // Ensure proper initialization order
   await this.initializeGoogleMaps();
   this.createMapMarkers();
   this.updateFlightPath();
   ```

3. **State Synchronization**
   ```typescript
   // Use requestUpdate() for manual updates
   this.waypoints = newWaypoints;
   this.requestUpdate();
   ```

## 🚀 Feature Development

### Adding New Features

1. **Define Data Structures** (schema.ts)
   ```typescript
   export interface NewFeature {
     id: string;
     name: string;
     config: NewFeatureConfig;
   }

   export const NEW_FEATURE_DEFAULTS = {
     enabled: true,
     timeout: 5000
   };
   ```

2. **Create Utility Functions** (utils.ts)
   ```typescript
   export function validateNewFeature(feature: any): boolean {
     // Validation logic
   }

   export function processNewFeatureData(data: any): NewFeature {
     // Processing logic
   }
   ```

3. **Implement Component Logic** (map_app.ts)
   ```typescript
   @state() private newFeature: NewFeature | null = null;

   private enableNewFeature(): void {
     // Implementation
   }

   private renderNewFeature(): TemplateResult {
     // UI rendering
   }
   ```

### Testing New Features

1. **Manual Testing**
   - Test all interaction paths
   - Verify error handling
   - Check responsive design

2. **Edge Case Testing**
   - Test with empty data
   - Test with invalid inputs
   - Test network failures

3. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge
   - Mobile devices
   - Different screen sizes

## 📚 API Integration

### Google Maps API

```typescript
// Map initialization
const loader = new Loader({
  apiKey: googleApiKey,
  version: 'weekly',
  libraries: ['places', 'geometry']
});

const google = await loader.load();
this.map = new google.maps.Map(this.mapContainerElement!, {
  zoom: 10,
  center: { lat: 40.7128, lng: -74.0060 },
  mapTypeId: 'satellite'
});
```

### Weather API Integration

```typescript
// Weather data fetching
const weatherData = await apiRequest<WeatherApiResponse>(
  `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric`,
  {},
  'Weather Data Fetch'
);

const weather: WeatherData = {
  temp: weatherData.main.temp,
  description: weatherData.weather[0].description,
  wind: weatherData.wind,
  // ... other fields
};
```

## 🔒 Security Considerations

### API Key Security

1. **Environment Variables**
   ```bash
   # .env file (never commit this)
   VITE_GOOGLE_MAPS_API_KEY=your_key_here
   VITE_WEATHER_API_KEY=your_weather_key_here
   ```

2. **API Key Restrictions**
   - Restrict Google Maps API to your domain
   - Limit API quotas appropriately
   - Monitor API usage

3. **Client-Side Limitations**
   ```typescript
   // Client-side API keys are visible to users
   // Only use APIs intended for client-side use
   // Never store sensitive data in client code
   ```

### Data Validation

```typescript
// Always validate user input
try {
  validateWaypoint(userInput);
  validateMission(missionData);
} catch (error) {
  handleError(error, 'Data Validation');
  return;
}
```

## 📈 Performance Optimization

### Bundle Size Optimization

1. **Tree Shaking**
   ```typescript
   // Import only what you need
   import { debounce, throttle } from './utils.js';
   
   // Avoid importing entire libraries
   // import * as utils from './utils.js'; // Don't do this
   ```

2. **Dynamic Imports**
   ```typescript
   // Load heavy libraries only when needed
   const { jsPDF } = await import('jspdf');
   ```

### Rendering Performance

1. **Efficient Updates**
   ```typescript
   // Use immutable state updates
   this.waypoints = new Map(this.waypoints);
   
   // Batch DOM updates
   this.requestUpdate();
   ```

2. **Throttled Operations**
   ```typescript
   // Limit expensive operations
   private throttledRender = throttle(() => {
     this.updateFlightPath();
     this.renderTelemetry();
   }, 16); // 60 FPS
   ```

## 🔄 Maintenance

### Regular Updates

1. **Dependency Updates**
   ```bash
   npm update
   npm audit
   ```

2. **API Compatibility**
   - Monitor Google Maps API changes
   - Check OpenWeatherMap API updates
   - Test with new browser versions

3. **Performance Monitoring**
   - Monitor bundle size
   - Check load times
   - Profile memory usage

### Code Refactoring

1. **Regular Code Reviews**
   - Check for code duplication
   - Verify error handling
   - Update documentation

2. **Type Safety Updates**
   - Add missing type annotations
   - Remove any types
   - Update interfaces for new features

---

This development guide provides the foundation for maintaining and extending the UAV Mission Planner. Follow these patterns and practices to ensure code quality, performance, and maintainability.