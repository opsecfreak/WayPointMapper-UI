# Waypoint Mapper UI

An interactive waypoint mapping interface for mission planning with Google Maps integration, featuring customizable waypoints, satellite view, and real-time weather data.

![Waypoint Mapper UI](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## Features

- **Interactive Google Maps Integration**: Satellite view with click-to-add waypoints
- **Waypoint Management**: Create, edit, delete, and drag waypoints with custom properties
- **Real-time Weather**: Optional weather overlay using OpenWeatherMap API
- **Mission Planning**: Organized sidebar with waypoint details and editing
- **Responsive Design**: Works on desktop and mobile devices
- **Modular Architecture**: Separated components for map, sidebar, toolbar, and state management

## Quick Start

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd WayPointMapper-UI
   npm install
   ```

2. **Set up API keys** (choose one method):

   **Option A: Environment Variables (Recommended)**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env and add your API keys
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   VITE_WEATHER_API_KEY=your_weather_api_key_here  # Optional
   ```

   **Option B: Runtime Configuration**
   - Skip the .env setup
   - The app will prompt you to enter API keys when it starts

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - The application should load with the Google Maps interface

## API Keys Setup

### Google Maps API Key (Required)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Places API**  
   - **Geocoding API**
4. Create credentials (API Key)
5. Restrict the key to your domain for production use

[Get a Google Maps API Key →](https://developers.google.com/maps/documentation/javascript/get-api-key)

### OpenWeatherMap API Key (Optional)

1. Sign up at [OpenWeatherMap](https://openweathermap.org/appid)
2. Get your free API key
3. Add it to your environment variables or enter it in the app

[Get a Weather API Key →](https://openweathermap.org/appid)

## Usage

### Adding Waypoints
1. Click the "Add Waypoint" button in the toolbar
2. Click anywhere on the map to place a waypoint
3. The first waypoint becomes your "Home" position

### Editing Waypoints
1. Click on any waypoint in the sidebar list
2. Modify properties in the editor panel:
   - **Label**: Custom name for the waypoint
   - **Color**: Visual marker color
   - **Altitude**: Height in meters
   - **Notes**: Additional information

### Map Controls
- **Search**: Use the search box to find locations
- **Zoom**: Use +/- buttons or mouse wheel
- **Pan**: Drag to move around the map
- **Recenter**: Click the center button to return to default view

### Weather Information
- Displays current weather for the map center
- Updates automatically as you pan around
- Shows temperature, conditions, and location

## Development

### Project Structure
```
├── index.html          # Main HTML entry point
├── index.tsx          # Application bootstrap
├── map_app.ts         # Main MapApp LitElement component
├── index.css          # Global styles and theming
├── vite.config.ts     # Vite build configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Dependencies and scripts
```

### Key Components

**MapApp (`map_app.ts`)**
- Main LitElement component
- Manages application state (waypoints, selected waypoint, map mode)
- Handles Google Maps integration
- Coordinates all UI interactions

**Modular Design**
- **Map**: Google Maps integration with markers and interaction handlers
- **Sidebar**: Waypoint list and editing interface  
- **Toolbar**: Map controls and search functionality
- **Weather**: Optional weather overlay component

### Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | Google Maps JavaScript API key |
| `VITE_WEATHER_API_KEY` | No | OpenWeatherMap API key for weather data |

## Customization

### Waypoint Colors
Edit `WAYPOINT_COLORS` in `map_app.ts` to customize available marker colors.

### Default Location
Change `LOS_ANGELES_CENTER` in `map_app.ts` to set a different default map center.

### Styling
Modify `index.css` to customize the appearance. The app uses CSS custom properties for theming.

## Browser Support

- Chrome 90+
- Firefox 88+  
- Safari 14+
- Edge 90+

## Troubleshooting

### Common Issues

**"Cannot find module" errors during development**
- Run `npm install` to ensure all dependencies are installed
- Check that Node.js version is 16 or higher

**Map not loading**
- Verify your Google Maps API key is correct
- Check that the required APIs are enabled in Google Cloud Console
- Check browser console for detailed error messages

**Weather not showing**
- Weather requires a valid OpenWeatherMap API key
- Weather is optional - the app works without it

**Build errors**
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### Performance

The application is optimized for local development with:
- Minimal dependencies (only Lit and Google Maps loader)
- Efficient state management
- Responsive design for various screen sizes
- Debounced weather API calls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev`
5. Build and verify with `npm run build`
6. Submit a pull request

## License

Licensed under the Apache License 2.0. See LICENSE file for details.
