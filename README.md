# Professional UAV Mission Planner

A comprehensive web-based mission planning application designed specifically for commercial UAV pilots and drone operators. Plan, visualize, and manage autonomous flight missions with precision and confidence.

![Waypoint Mapper UI](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚁 For Commercial UAV Pilots

This mission planner is designed with professional UAV operations in mind, providing the tools you need for:

- **Commercial Photography & Videography**: Plan precise flight paths for optimal shot sequences
- **Infrastructure Inspection**: Create systematic inspection routes for towers, pipelines, and structures  
- **Mapping & Surveying**: Design overlapping flight patterns for photogrammetry and LiDAR missions
- **Search & Rescue Operations**: Plan systematic search patterns and coordinate multi-aircraft missions
- **Agricultural Monitoring**: Create efficient crop monitoring and spraying routes
- **Security & Surveillance**: Plan patrol routes and establish observation points

## ✈️ Key Features for Professional Operations

### 🗺️ **Advanced Mission Planning**
- **Interactive Google Maps Integration**: High-resolution satellite imagery for precise planning
- **Dynamic Flight Path Visualization**: Real-time polylines with directional indicators
- **Waypoint Management**: Drag-and-drop waypoint editing with altitude control
- **Home Position Setting**: Automatic return-to-home point designation
- **Mission Statistics**: Distance, flight time, and altitude calculations

### 🌤️ **Weather Intelligence**
- **Mission-Area Weather**: Localized weather conditions for your specific flight zone
- **Flight Safety Analysis**: Wind speed warnings and visibility assessments
- **Real-Time Conditions**: Current temperature, humidity, pressure, and precipitation
- **Operational Recommendations**: Flight condition safety evaluations

### 💾 **Mission Data Management**
- **Export/Import Missions**: Save missions as JSON files for reuse and documentation
- **Mission Metadata**: Automatic calculation of flight parameters
- **Weather Snapshots**: Historical weather data preserved with each mission
- **Backup & Sharing**: Easy mission file sharing between team members

### 🎛️ **Professional Interface**
- **Tabbed Organization**: Separate views for waypoints, weather, settings, and simulation
- **Real-Time Updates**: All changes reflected immediately across the interface
- **Responsive Design**: Works on tablets and laptops in the field
- **Keyboard Shortcuts**: Efficient operation for experienced pilots
- **Smart Notifications**: User-friendly alerts and status updates
- **Advanced Error Handling**: Comprehensive error recovery and reporting

### 🎮 **Mission Simulation Mode** *(New Feature)*
- **Animated Drone Movement**: Realistic flight path visualization at 60 FPS
- **Real-Time Telemetry**: Live altitude, speed, distance, and bearing data
- **Simulation Controls**: Play, pause, stop, and speed adjustment (0.5x to 8x)
- **Weather Effects**: Visual weather overlay with rain and snow simulation
- **Progress Tracking**: Visual progress bar and waypoint completion status
- **Performance Metrics**: Flight time estimation and mission statistics

## 🚀 Quick Setup for Pilots

### System Requirements
- **Device**: Laptop, tablet, or desktop computer
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Internet**: Required for map tiles and weather data
- **Storage**: ~50MB for application files

### Installation (5 minutes)

1. **Download or Clone the Project**
   ```bash
   git clone https://github.com/opsecfreak/WayPointMapper-UI.git
   cd WayPointMapper-UI
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```
   *If you don't have Node.js, download it from [nodejs.org](https://nodejs.org)*

3. **Get Your API Keys** (Required)
   - **Google Maps API Key**: Visit [Google Cloud Console](https://console.cloud.google.com/)
     - Create a project or use existing
     - Enable: Maps JavaScript API, Places API, Geocoding API
     - Create API key and restrict to your domain
   - **OpenWeather API Key** (Optional): Register at [OpenWeatherMap](https://openweathermap.org/appid)

4. **Configure API Keys** (Choose one method):

   **Option A: Environment Variables (Recommended for security)**
   ```bash
   # Create environment file
   cp .env.example .env
   
   # Edit .env file with your keys
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
   VITE_WEATHER_API_KEY=your_openweather_key_here
   ```

   **Option B: Runtime Configuration**
   - Start the application without environment setup
   - Enter keys in the Settings tab when prompted

5. **Launch the Application**
   ```bash
   npm run dev
   ```
   Open browser to `http://localhost:3000`

## 📋 Mission Planning Workflow

### Phase 1: Mission Setup
1. **Access the Application**: Open in your web browser
2. **Configure Location**: Use search to navigate to your operation area
3. **Set Home Position**: Click "Add Waypoint" and place your takeoff point
4. **Check Weather**: Review current conditions in the Weather tab

### Phase 2: Waypoint Planning
1. **Add Waypoints**: Continue clicking map locations to build your route
2. **Adjust Altitudes**: Set appropriate heights for each waypoint
3. **Edit Properties**: Customize labels, colors, and notes for each point
4. **Review Flight Path**: Verify the connecting lines show your intended route

### Phase 3: Mission Validation
1. **Review Statistics**: Check total distance and estimated flight time
2. **Weather Analysis**: Ensure conditions are suitable for safe operations
3. **Flight Path Check**: Verify no obstacles intersect your route
4. **Altitude Verification**: Confirm all waypoints meet regulatory requirements

### Phase 4: Mission Execution Prep
1. **Save Mission**: Export mission file for your flight controller
2. **Backup Copy**: Save additional copies for records and safety
3. **Final Weather Check**: Verify conditions haven't changed
4. **Regulatory Compliance**: Ensure mission meets local UAV regulations

## 🎯 Professional Use Cases

### **Infrastructure Inspection**
- Plan systematic inspection routes around towers, bridges, or buildings
- Set waypoints at optimal distances for high-resolution imagery
- Account for wind conditions that might affect stability near structures
- Export missions for repeatable monthly/quarterly inspections

### **Mapping & Surveying**
- Create grid patterns with appropriate overlap for photogrammetry
- Calculate flight times to ensure battery endurance
- Plan multiple flights for large areas with consistent altitude
- Document flight parameters for survey accuracy requirements

### **Commercial Photography**
- Design cinematic flight paths for smooth video capture
- Plan reveal shots and establishing sequences
- Consider lighting conditions and optimal shooting angles
- Time flights with weather conditions for best results

### **Search & Rescue**
- Create systematic search patterns covering assigned areas
- Plan overlapping routes for multiple aircraft coordination
- Set appropriate altitudes for optimal visibility
- Save search patterns for rapid deployment in emergencies

## ⚙️ Settings & Configuration

### API Key Management
Access the **Settings Tab** to configure your API keys:

- **Google Maps API Key**: Required for all map functionality
- **OpenWeather API Key**: Optional, enables weather features
- **Save Securely**: Keys stored locally on your device only
- **Environment Override**: Use .env files for team deployments

### Mission Parameters
- **Default Altitude**: Set standard waypoint height
- **Flight Speed**: Affects time calculations (default: 15 m/s)
- **Distance Units**: Metric or imperial display options
- **Weather Updates**: Automatic refresh intervals

### Export Options
- **JSON Format**: Universal mission file format
- **Metadata Inclusion**: Flight parameters and weather data
- **Date Stamping**: Automatic file naming with timestamps
- **Backup Locations**: Save to multiple locations for redundancy

## 🛡️ Safety & Compliance

### Pre-Flight Checks
- ✅ Weather conditions suitable for operation
- ✅ Flight path clear of obstacles and restricted areas
- ✅ Waypoint altitudes comply with local regulations
- ✅ Mission duration within battery/fuel limits
- ✅ Emergency landing sites identified along route

### Weather Limitations
- **Wind Speed**: Monitor for aircraft stability limits
- **Visibility**: Ensure VLOS compliance where required
- **Precipitation**: Check for equipment protection needs
- **Temperature**: Verify battery performance in conditions

### Regulatory Compliance
- Verify waypoint altitudes meet height restrictions
- Ensure flight paths avoid restricted airspace
- Confirm operations comply with local UAV regulations
- Document missions for regulatory reporting if required

## 🔧 Technical Specifications

### Application Architecture
- **Frontend**: LitElement-based web application
- **Mapping**: Google Maps JavaScript API
- **Weather**: OpenWeatherMap API integration
- **Data Format**: JSON mission files
- **Real-Time**: WebSocket updates for live collaboration

### Performance Specifications
- **Waypoint Limit**: 1000+ waypoints per mission
- **File Size**: ~1-50KB per mission file
- **Load Time**: <3 seconds for typical missions
- **Update Rate**: Real-time flight path rendering
- **Weather Refresh**: 30-second intervals

### Supported Data Formats
- **Import**: JSON mission files
- **Export**: JSON with embedded metadata
- **Coordinates**: Decimal degrees (WGS84)
- **Altitudes**: Meters above ground level
- **Weather**: Current conditions and forecasts

## 🚁 Flight Controller Integration

### Supported Formats
While this planner creates JSON mission files, you can adapt the waypoint data for:
- **DJI Flight Controllers**: Convert coordinates to DJI format
- **ArduPilot/PX4**: Extract waypoints for Mission Planner
- **Autel/Parrot**: Format for manufacturer mission formats
- **Custom Controllers**: Use JSON data directly

### Coordinate Conversion
```javascript
// Example: Extract waypoints for external systems
const mission = JSON.parse(missionFile);
const waypoints = mission.waypoints.map(wp => ({
  lat: wp.lat,
  lng: wp.lng,
  alt: wp.altitude,
  action: wp.isHome ? 'takeoff' : 'waypoint'
}));
```

## 📞 Support & Community

### Getting Help
- **Documentation**: Check this README for detailed guidance
- **Issues**: Report bugs via GitHub Issues
- **Feature Requests**: Suggest improvements through GitHub
- **Community**: Join discussions with other UAV professionals

### Contributing
- **Pilot Feedback**: Share your operational experience
- **Feature Suggestions**: Request professional features
- **Bug Reports**: Help improve reliability
- **Code Contributions**: Submit pull requests for enhancements

## 📜 License & Legal

- **License**: Apache 2.0 - Free for commercial use
- **Liability**: Users responsible for regulatory compliance
- **Weather Data**: Provided for planning only, verify conditions independently
- **Map Data**: Subject to Google Maps terms of service

---

**Fly Safe, Plan Smart** 🚁

*Professional UAV operations require careful planning, regulatory compliance, and safety consciousness. This tool assists in mission planning but does not replace pilot judgment, weather verification, or regulatory compliance requirements.*
