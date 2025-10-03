# 🚁 UAV Mission Planner - User Guide

**Version**: 2.0  
**Last Updated**: October 3, 2025  
**Difficulty**: Beginner to Advanced

---

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Interface Overview](#interface-overview)
3. [Creating Your First Mission](#creating-your-first-mission)
4. [Home Point Management](#home-point-management)
5. [Location Search & History](#location-search--history)
6. [Waypoint Management](#waypoint-management)
7. [Weather Integration](#weather-integration)
8. [Mission Simulation](#mission-simulation)
9. [Saving & Exporting](#saving--exporting)
10. [Keyboard Shortcuts](#keyboard-shortcuts)
11. [Tips & Best Practices](#tips--best-practices)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+
- **Internet**: Required for maps and weather data
- **Screen**: Minimum 1024x768 (responsive design supports mobile)
- **APIs**: Google Maps API key (free tier available)

### Initial Setup

1. **First Launch**
   - Open the application
   - You'll see an API Key configuration modal
   - Enter your Google Maps API Key
   - Optionally add OpenWeatherMap API Key for weather

2. **Get API Keys** (Free)
   - **Google Maps**: https://console.cloud.google.com/
     - Enable: Maps JavaScript API, Places API, Geocoding API
   - **OpenWeather**: https://openweathermap.org/api
     - Free tier: 1,000 calls/day

3. **Save Configuration**
   - Click "Save API Key"
   - Map will initialize automatically
   - Settings saved to browser localStorage

---

## 🖥️ Interface Overview

### Main Layout

```
┌─────────────────────────────────────────────────┐
│  [Toolbar]                                      │
│  ┌──────────────────┐  ┌────────────────────┐  │
│  │                  │  │                    │  │
│  │                  │  │   Sidebar:         │  │
│  │   Map Area       │  │   - Waypoints      │  │
│  │   (Satellite)    │  │   - Weather        │  │
│  │                  │  │   - Settings       │  │
│  │                  │  │   - Simulation     │  │
│  └──────────────────┘  └────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Toolbar Components

**Search Box** 🔍
- Search for locations worldwide
- Auto-complete suggestions
- Clear button (X) when text entered
- Recent searches dropdown

**Add Waypoint** ➕
- Toggle waypoint placement mode
- Blue when active

**Zoom Controls** 🔍
- (+) Zoom in
- (-) Zoom out

**Map Type** 🗺️
- Switch between satellite/roadmap views

### Sidebar Tabs

**📍 Waypoints**
- View all mission waypoints
- Edit waypoint properties
- Home point information

**🌤️ Weather**
- Current weather conditions
- METAR/TAF aviation reports
- Flight condition analysis

**⚙️ Settings**
- API key configuration
- Mission statistics
- Save/Load/Export controls

**🎮 Simulation**
- Flight simulation mode
- Real-time telemetry
- Speed controls

---

## 🎯 Creating Your First Mission

### Step 1: Find Your Launch Location

1. **Use Search Box**
   ```
   Type: "Central Park, New York"
   Press: Enter or click suggestion
   ```
   - Map automatically centers on location
   - Zoom level adjusts for best view

2. **Manual Navigation**
   - Click and drag map to pan
   - Use +/- buttons or scroll wheel to zoom
   - Double-click to zoom in

### Step 2: Add Waypoints

1. **Enable Add Mode**
   - Click "Add Waypoint" button (turns blue)
   - Cursor changes to crosshair

2. **Place First Waypoint (Home Point)**
   - Click on map at desired launch location
   - **Automatically becomes Home Point** (blue marker)
   - Label: "Home"

3. **Add More Waypoints**
   - Continue clicking to add waypoints
   - Each click creates new waypoint
   - Connected by flight path line

### Step 3: Configure Waypoints

1. **Select Waypoint**
   - Click marker on map, OR
   - Click waypoint in sidebar list

2. **Edit Properties**
   - **Label**: Give it a meaningful name
   - **Altitude**: Height in meters (default: 50m)
   - **Speed**: Flight speed in m/s (default: 5 m/s)
   - **Color**: Choose marker color
   - **Notes**: Optional description

3. **Save Changes**
   - Changes auto-save as you type
   - Watch marker update in real-time

---

## 🏠 Home Point Management

### What is a Home Point?

The **Home Point** is your drone's:
- Launch location
- Return-to-home (RTH) destination
- Emergency landing site
- Starting point for distance/time calculations

### Home Point Features

#### Automatic Assignment
- ✅ **First waypoint** automatically becomes home
- 🔵 **Blue marker** indicates home point
- 🏠 **"Home" label** by default

#### Home Point Information Section

Located at top of **Waypoints** tab:

```
┌─────────────────────────────────┐
│ 🏠 Home Point                   │
│ Coordinates: 40.712776, -74.006 │
│ Altitude: 50m                   │
│ Label: Launch Pad               │
│ [📍 Go to Home Point]           │
└─────────────────────────────────┘
```

#### Setting a Different Home Point

1. **Select waypoint** in sidebar (click on it)
2. Scroll down in waypoint editor
3. Click **"Set as Home Point"** button (green)
4. Confirm in notification: "Home point updated"

**What Changes:**
- ✅ Selected waypoint → Blue marker
- ✅ Previous home → Original color
- ✅ Home info section updates
- ✅ Flight path recalculates

#### Navigate to Home Point

**Quick Jump:**
1. Open **Waypoints** tab
2. Find home point info section
3. Click **"📍 Go to Home Point"** button
4. Map centers on home (zoom level 17)

**Use Cases:**
- After panning away during mission planning
- To verify home location before flight
- Quick return to start of mission

#### No Home Point Set

If you delete the home waypoint:
```
┌─────────────────────────────────┐
│ 🏠 No home point set            │
│ Set a waypoint as home to       │
│ enable RTH (Return to Home)     │
└─────────────────────────────────┘
```

To fix: Select any waypoint → Click "Set as Home Point"

---

## 🔍 Location Search & History

### Using the Search Box

#### Basic Search
1. Click search box in toolbar
2. Type location name:
   - **City**: "San Francisco"
   - **Address**: "1600 Pennsylvania Ave"
   - **Landmark**: "Statue of Liberty"
   - **Airport**: "LAX" or "Los Angeles International"
3. Select from dropdown suggestions
4. Map centers automatically

#### Search Features

**🔄 Loading Indicator**
- Spinner appears while searching
- Replaces search icon temporarily

**❌ Clear Button**
- X button appears when text entered
- Click to clear search box
- Doesn't affect map position

### Search History

#### Automatic History Tracking

Every search is saved:
- **Max 10 items** (oldest removed)
- **Duplicates removed** (based on coordinates)
- **Persists** across browser sessions
- **Stored locally** (localStorage)

#### Using Search History

1. **Open History**
   - Click in search box (focus)
   - Dropdown appears automatically

2. **History Format**
   ```
   Recent Searches              [Clear All]
   ─────────────────────────────────────
   📍 Chicago, IL
      41.87811, -87.62980
   📍 New York, NY
      40.71278, -74.00594
   📍 Los Angeles, CA
      34.05223, -118.24368
   ```

3. **Jump to Location**
   - Click any history item
   - Map centers on location
   - Search box updates with name
   - Notification: "Jumped to [Location]"

#### Clear History

**Clear All:**
- Open search history dropdown
- Click **"Clear All"** button (top right)
- Confirms: "Search history cleared"
- Dropdown closes (empty)

**Clear Individual:**
- Currently not supported
- Workaround: Clear all, rebuild history

---

## 📍 Waypoint Management

### Waypoint Properties

Each waypoint has:
- **Position**: Lat/Lng coordinates
- **Altitude**: Height above ground (meters)
- **Speed**: Target flight speed (m/s)
- **Label**: Human-readable name
- **Color**: Marker color (red/blue/green/yellow/purple/orange)
- **Notes**: Optional description
- **Home Flag**: Whether it's the home point

### Adding Waypoints

**Method 1: Click on Map**
1. Enable "Add Waypoint" mode
2. Click desired locations
3. Waypoints appear instantly

**Method 2: From Search**
1. Search for location
2. Map centers there
3. Click to add waypoint

### Editing Waypoints

1. **Select**: Click marker or sidebar item
2. **Edit Panel Appears**: Bottom of sidebar
3. **Modify**: Any property
4. **Auto-Save**: Changes save immediately

### Deleting Waypoints

1. Select waypoint to delete
2. Scroll to bottom of editor
3. Click **"Delete Waypoint"** (red button)
4. Waypoint removed instantly

**Warning**: Cannot undo! Save mission first if unsure.

### Reordering Waypoints

**Current**: Manual reordering not supported

**Workaround**:
1. Note waypoint coordinates
2. Delete waypoints in wrong order
3. Re-add in correct sequence

**Future**: Drag-and-drop reordering planned

### Waypoint Colors

**Available Colors**:
- 🔴 **Red**: Default
- 🔵 **Blue**: Home point (automatic)
- 🟢 **Green**: Checkpoints
- 🟡 **Yellow**: Warnings/caution areas
- 🟣 **Purple**: Special markers
- 🟠 **Orange**: Alternate routes

**Tip**: Use colors to categorize waypoints!

---

## 🌤️ Weather Integration

### Current Weather Display

**Map Overlay** (Top Right):
```
┌─────────────────────┐
│ ☀️  72°F (22°C)     │
│ Clear Sky           │
│ Los Angeles, CA     │
└─────────────────────┘
```

- Updates when map moves
- Shows location name
- Temperature in F and C
- Weather icon

### Detailed Weather Tab

Open **Weather** tab in sidebar for:

**Current Conditions**:
- Temperature & feels-like
- Humidity & pressure
- Wind speed & direction
- Visibility
- Cloud cover
- Dew point

**Flight Conditions Analysis**:
```
Condition: ✅ Excellent
━━━━━━━━━━━━━━━━━━━━━━
Wind: 5 mph - Safe
Visibility: 10 mi - Clear
Temperature: 72°F - Good
Humidity: 45% - Comfortable
```

**METAR Report** (Aviation Weather):
- Raw METAR text
- Decoded information
- Station ID & time

**TAF Forecast** (if available):
- Terminal Aerodrome Forecast
- 24-hour prediction
- Ideal for flight planning

### Weather-Based Recommendations

**Excellent Conditions** ✅
- All systems go
- Ideal for flying

**Good Conditions** ✓
- Safe to fly
- Minor considerations

**Marginal Conditions** ⚠️
- Proceed with caution
- Check warnings

**Poor / No-Fly** ❌
- DO NOT FLY
- Wait for better weather

---

## 🎮 Mission Simulation

### Starting Simulation

1. **Complete Mission**
   - Add minimum 2 waypoints
   - Set home point

2. **Open Simulation Tab**
   - Click "Simulation" tab in sidebar

3. **Configure Options** (optional)
   - Speed multiplier (0.1x to 10x)
   - Auto-advance waypoints
   - Show drone trail
   - Step mode

4. **Start**
   - Click **"▶ Start Simulation"** button
   - Telemetry appears at top of screen

### Telemetry Display

**Top Bar Shows**:
```
Mission Status        Telemetry Data        Weather      Flight Stats
─────────────────────────────────────────────────────────────────────
🚁 In Flight          Alt: 50m             ☀️ 72°F      Distance: 1.2km
Progress: 45%         Speed: 5 m/s         Wind: 5mph   Time: 2:30
                      Battery: 85%         Safe         ETA: 3:15
```

### Simulation Controls

**Speed Control**:
- Slider: 0.1x to 10x real-time
- Presets: 0.5x, 1x, 2x, 5x buttons
- Change during flight

**Pause/Resume**:
- Click **"⏸ Pause"** to pause
- Click **"▶ Resume"** to continue
- Useful for inspection

**Stop**:
- Click **"⏹ Stop"** to end
- Returns drone to home
- Clears telemetry

**Reset**:
- Click **"🔄 Reset"** 
- Returns to start
- Keeps current settings

### Viewing Simulation

**Drone Marker**: 🚁
- Red/orange drone icon
- Shows current position
- Animates along path

**Trail**:
- Green/blue line showing path traveled
- Adjustable length (slider)
- Can clear during flight

**Camera Follow** (optional):
- Enable to keep drone centered
- Map moves automatically
- Can disable to view full mission

---

## 💾 Saving & Exporting

### Save Mission

1. **Open Settings Tab**
2. Click **"💾 Save Mission"** button
3. Choose location and filename
4. Saves as `.json` file

**What's Saved**:
- All waypoints with properties
- Home point designation
- Mission name & description
- Weather snapshot (if available)
- Metadata (timestamps, distances)

### Load Mission

1. **Open Settings Tab**
2. Click **"📁 Load Mission"** button
3. Select `.json` file
4. Mission loads instantly

**Notes**:
- Replaces current mission
- Save current mission first if needed
- Validates file format

### Export Formats

#### **GeoJSON** (.geojson)
- Standard geographic data format
- Compatible with QGIS, Mapbox, etc.
- Includes all waypoint properties

#### **KML** (.kml)
- Google Earth format
- Opens in Google Earth Pro
- Visualize flight path in 3D

#### **CSV** (.csv)
- Spreadsheet format
- Excel, Google Sheets compatible
- Columns: ID, Label, Lat, Lng, Alt, Speed

#### **Mavlink** (.waypoints)
- Mission Planner format
- QGroundControl compatible
- Ardupilot/PX4 waypoint file

#### **PDF** (.pdf)
- Mission briefing document
- Includes waypoint table
- Map screenshot (if available)
- Weather summary
- Printable flight plan

**Export Steps**:
1. Open Settings tab
2. Click desired export format button
3. Choose save location
4. File downloads automatically

---

## ⌨️ Keyboard Shortcuts

### Navigation
- **Arrow Keys**: Pan map (coming soon)
- **+/-**: Zoom in/out (coming soon)
- **Spacebar**: Toggle add waypoint mode (coming soon)

### General
- **Ctrl+S**: Save mission (coming soon)
- **Ctrl+O**: Load mission (coming soon)
- **Tab**: Navigate between fields
- **Enter**: Confirm input
- **Esc**: Close modals/dropdowns

### Accessibility
- **Tab**: Focus next element
- **Shift+Tab**: Focus previous
- **Enter/Space**: Activate button
- **Arrows**: Navigate lists

---

## 💡 Tips & Best Practices

### Mission Planning

✅ **DO**:
- Set home point at launch location
- Plan for adequate clearance altitude
- Check weather before flying
- Save missions frequently
- Export backup copies
- Test in simulation first

❌ **DON'T**:
- Place waypoints in restricted airspace
- Ignore weather warnings
- Forget to set home point
- Delete waypoints without saving
- Exceed drone's range/battery

### Home Point Strategy

**Best Practices**:
1. Set home at safest open area
2. Verify GPS coordinates
3. Note altitude above ground
4. Ensure clear approach path
5. Test "Go to Home" button

**Emergency RTH**:
- Home point = emergency landing site
- Should be obstacle-free
- Consider wind direction
- Account for battery level

### Search History Usage

**Efficient Planning**:
1. Search all key locations first
2. Build history of mission area
3. Quick-switch between points
4. Clear history when switching projects

**Pro Tip**: Search radius around mission area to build comprehensive history

### Performance Optimization

**Large Missions (50+ waypoints)**:
- Consider splitting into segments
- Use simulation to verify
- Export frequently
- Monitor browser memory

**Slow Performance?**:
- Close unnecessary tabs
- Clear browser cache
- Disable browser extensions
- Use newer browser version

---

## 🔧 Troubleshooting

### Common Issues

#### Map Won't Load

**Problem**: Gray screen, no map

**Solutions**:
1. Check API key is entered
2. Verify API key is valid
3. Check internet connection
4. Enable Maps JavaScript API in Google Console
5. Check browser console for errors
6. Try different browser

#### Search Not Working

**Problem**: Search box doesn't respond

**Solutions**:
1. Check API key includes Places API
2. Verify internet connection
3. Clear browser cache
4. Check console for errors
5. Try incognito mode

#### Weather Not Displaying

**Problem**: No weather data shown

**Solutions**:
1. Enter OpenWeather API key in Settings
2. Check internet connection
3. Verify API key is active
4. Wait for API quota reset (free tier limit)
5. Move map to trigger update

#### Waypoints Not Appearing

**Problem**: Clicking doesn't add waypoints

**Solutions**:
1. Enable "Add Waypoint" mode (should be blue)
2. Click map area (not UI overlay)
3. Check browser console for errors
4. Try zooming in closer
5. Refresh page

#### Home Point Issues

**Problem**: Can't set or change home point

**Solutions**:
1. Ensure waypoint exists first
2. Select waypoint in sidebar
3. Scroll down to see button
4. Check "Set as Home" not disabled
5. Verify only one home point exists

#### Search History Not Saving

**Problem**: History disappears

**Solutions**:
1. Check browser allows localStorage
2. Disable private/incognito mode
3. Check browser storage settings
4. Clear localStorage and retry
5. Use different browser

### Error Messages

#### "No details available for input"

**Meaning**: Google couldn't find location

**Fix**: Try more specific search (add city/state)

#### "Failed to load weather data"

**Meaning**: Weather API error

**Fix**: Check API key, internet, wait and retry

#### "Invalid mission file"

**Meaning**: JSON file corrupted or wrong format

**Fix**: Load different file, check JSON syntax

### Browser Compatibility

**Fully Supported**:
- Chrome 90+
- Edge 90+
- Firefox 88+
- Safari 14+

**Limited Support**:
- Older browsers (upgrade recommended)
- Internet Explorer (not supported)

### Getting Help

**Report Issues**:
1. Note browser and version
2. Check browser console (F12)
3. Screenshot error message
4. Describe steps to reproduce
5. Include mission file (if relevant)

**Resources**:
- GitHub Issues: (repository link)
- Documentation: (docs link)
- Email Support: (support email)

---

## 📚 Appendix

### Glossary

- **Home Point**: Launch/return location for drone
- **RTH**: Return to Home
- **Waypoint**: GPS coordinate on flight path
- **METAR**: Aviation weather report format
- **TAF**: Terminal Aerodrome Forecast
- **GeoJSON**: Geographic data format
- **KML**: Keyhole Markup Language (Google Earth)

### Units Reference

**Altitude**:
- Meters (m): Default
- Feet (ft): Meters × 3.281

**Speed**:
- Meters/second (m/s): Default
- Miles/hour (mph): m/s × 2.237
- Kilometers/hour (km/h): m/s × 3.6

**Distance**:
- Kilometers (km): 1000 meters
- Miles (mi): 1.609 kilometers

---

**End of User Guide**

*Last Updated: October 3, 2025*  
*Version: 2.0*  
*© 2025 UAV Mission Planner*
