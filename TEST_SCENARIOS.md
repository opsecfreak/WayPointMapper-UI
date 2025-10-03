# UAV Mission Planner - Test Scenarios & QA Guide

**Date**: October 3, 2025  
**Version**: 2.0  
**Purpose**: Comprehensive testing guide for all features

---

## 🏠 HOME POINT FEATURE TESTS

### Test 1: Automatic Home Point Assignment
**Objective**: Verify first waypoint automatically becomes home

**Steps**:
1. Open application with empty mission
2. Enable "Add Waypoint" mode
3. Click on map to add first waypoint
4. Observe waypoint marker and sidebar

**Expected Results**:
- ✅ First waypoint marker is **blue** (home color)
- ✅ Waypoint label shows "Home" or waypoint name
- ✅ Home point info section appears in waypoints tab
- ✅ Home point section shows coordinates, altitude, and "Go to Home" button
- ✅ Waypoint editor shows "Current Home Point" button (disabled)

**Pass/Fail**: ___________

---

### Test 2: Setting Different Waypoint as Home
**Objective**: Change which waypoint is home

**Steps**:
1. Add 3 waypoints to mission
2. Verify first waypoint is blue (home)
3. Click on second waypoint in sidebar to select it
4. In waypoint editor, click "Set as Home Point" button
5. Observe changes

**Expected Results**:
- ✅ Second waypoint marker turns **blue**
- ✅ First waypoint marker changes to its **original color**
- ✅ Home point info section updates with new coordinates
- ✅ Success notification appears: "Home point updated"
- ✅ Selected waypoint editor shows "Current Home Point" (disabled)
- ✅ Flight path recalculates correctly

**Pass/Fail**: ___________

---

### Test 3: Go to Home Point Navigation
**Objective**: Test map navigation to home point

**Steps**:
1. Create mission with home point
2. Pan and zoom map away from home location
3. Open Mission Details → Waypoints tab
4. Click "📍 Go to Home Point" button
5. Observe map behavior

**Expected Results**:
- ✅ Map smoothly centers on home point coordinates
- ✅ Map zooms to level 17
- ✅ Success notification: "Centered on home point"
- ✅ Home point marker is clearly visible

**Pass/Fail**: ___________

---

### Test 4: Home Point Persistence
**Objective**: Verify home point saves/loads correctly

**Steps**:
1. Create mission with 3 waypoints
2. Set second waypoint as home
3. Click "Save Mission" → save as "test_mission.json"
4. Click "Clear Mission" (if available) or refresh page
5. Click "Load Mission" → load "test_mission.json"
6. Check home point status

**Expected Results**:
- ✅ Home point flag (`isHome: true`) saved in JSON
- ✅ After loading, second waypoint is blue
- ✅ Home point info section shows correct waypoint
- ✅ All home point features work correctly

**Pass/Fail**: ___________

---

### Test 5: Deleting Home Point
**Objective**: Test behavior when home point is deleted

**Steps**:
1. Create mission with home point (first waypoint)
2. Select home point in sidebar
3. Click "Delete Waypoint" button
4. Confirm deletion
5. Observe changes

**Expected Results**:
- ✅ Home point is removed from map and sidebar
- ✅ If other waypoints exist, **no automatic reassignment** to new home
- ✅ Home point info section shows "No home point set" message
- ✅ Can manually set another waypoint as home
- ✅ No errors in console

**Pass/Fail**: ___________

---

### Test 6: Deleting Non-Home Waypoint
**Objective**: Verify home point persists when other waypoints deleted

**Steps**:
1. Create mission with 3 waypoints (first is home)
2. Select second waypoint (not home)
3. Delete second waypoint
4. Check home point status

**Expected Results**:
- ✅ Home point remains as first waypoint
- ✅ Home point marker still blue
- ✅ Home point info section unchanged
- ✅ Flight path recalculates correctly

**Pass/Fail**: ___________

---

### Test 7: Home Point in Empty Mission
**Objective**: Test home point section when no waypoints exist

**Steps**:
1. Start with empty mission (or clear all waypoints)
2. Open Mission Details → Waypoints tab
3. Observe home point section

**Expected Results**:
- ✅ Home point section shows gray/muted style
- ✅ Message: "No home point set. Set a waypoint as home to enable RTH"
- ✅ Icon changes to indicate empty state
- ✅ No "Go to Home" button visible

**Pass/Fail**: ___________

---

### Test 8: Multiple Home Point Changes
**Objective**: Test rapidly changing home point

**Steps**:
1. Create mission with 5 waypoints
2. Set waypoint 2 as home → verify
3. Set waypoint 3 as home → verify
4. Set waypoint 5 as home → verify
5. Set waypoint 1 as home → verify

**Expected Results**:
- ✅ Each change updates marker colors correctly
- ✅ Previous home returns to original color
- ✅ Home point section always shows current home
- ✅ No visual glitches or lag
- ✅ No duplicate blue markers

**Pass/Fail**: ___________

---

## 🔍 SEARCH HISTORY FEATURE TESTS

### Test 9: Search History Storage
**Objective**: Verify search history saves and displays

**Steps**:
1. Search for "New York, NY" → press Enter
2. Search for "Los Angeles, CA" → press Enter
3. Search for "Chicago, IL" → press Enter
4. Click on search box to focus it
5. Observe dropdown

**Expected Results**:
- ✅ Search history dropdown appears
- ✅ Shows last 3 searches in **reverse order** (Chicago, LA, NY)
- ✅ Each item shows place name and coordinates
- ✅ Items have location pin icon
- ✅ "Clear All" button visible in header

**Pass/Fail**: ___________

---

### Test 10: Search History Navigation
**Objective**: Test clicking on history items

**Steps**:
1. Have 3+ items in search history
2. Focus search box to show dropdown
3. Click on second history item
4. Observe behavior

**Expected Results**:
- ✅ Map centers on selected location
- ✅ Map zooms to level 17
- ✅ Search box text updates to place name
- ✅ Dropdown closes automatically
- ✅ Success notification appears

**Pass/Fail**: ___________

---

### Test 11: Clear Search History
**Objective**: Test clearing all search history

**Steps**:
1. Have 5+ items in search history
2. Open search dropdown
3. Click "Clear All" button
4. Reopen search dropdown

**Expected Results**:
- ✅ Success notification: "Search history cleared"
- ✅ Dropdown no longer appears (no history)
- ✅ localStorage cleared (`search-history` key removed)
- ✅ Can build new history with new searches

**Pass/Fail**: ___________

---

### Test 12: Search History Deduplication
**Objective**: Verify duplicate locations removed

**Steps**:
1. Search for "San Francisco, CA"
2. Search for "Seattle, WA"
3. Search for "San Francisco, CA" again (same location)
4. Open search dropdown

**Expected Results**:
- ✅ Only one "San Francisco" entry appears
- ✅ Most recent search is at top
- ✅ Order: San Francisco (latest), Seattle
- ✅ No duplicate coordinates

**Pass/Fail**: ___________

---

### Test 13: Search History Limit
**Objective**: Test 10-item maximum limit

**Steps**:
1. Search for 12 different locations
2. Open search dropdown
3. Count items

**Expected Results**:
- ✅ Exactly **10 items** shown
- ✅ Oldest 2 searches removed
- ✅ Most recent 10 searches displayed
- ✅ Items in reverse chronological order

**Pass/Fail**: ___________

---

### Test 14: Clear Search Button
**Objective**: Test inline clear button

**Steps**:
1. Type "Paris" in search box
2. Observe search box
3. Click X (clear) button
4. Check search box

**Expected Results**:
- ✅ Clear button (X icon) appears when text present
- ✅ Clear button NOT visible when search box empty
- ✅ Clicking clear button empties search box
- ✅ Dropdown closes after clearing
- ✅ Map position unchanged

**Pass/Fail**: ___________

---

### Test 15: Search Loading Indicator
**Objective**: Verify loading spinner appears during search

**Steps**:
1. Start typing in search box (trigger autocomplete)
2. Observe search icon area
3. Wait for results

**Expected Results**:
- ✅ Search icon replaced by **spinner** during loading
- ✅ Spinner animates (rotating)
- ✅ Spinner returns to search icon after results load
- ✅ No visual glitches

**Pass/Fail**: ___________  
**Note**: This may be difficult to observe with fast connections

---

## 🎨 UI POLISH FEATURE TESTS

### Test 16: Button Ripple Effects
**Objective**: Verify ripple animations on buttons

**Steps**:
1. Click "Add Waypoint" button in toolbar
2. Click "Set as Home Point" button
3. Click "Go to Home Point" button
4. Click tab buttons (Waypoints, Weather, Settings)
5. Observe visual feedback

**Expected Results**:
- ✅ Ripple effect emanates from click point
- ✅ White/light ripple wave expands outward
- ✅ Effect completes in ~0.6 seconds
- ✅ No performance issues
- ✅ Works on all interactive buttons

**Pass/Fail**: ___________

---

### Test 17: Button Hover Effects
**Objective**: Test enhanced hover states

**Steps**:
1. Hover over toolbar buttons
2. Hover over control buttons (Save, Load, Export)
3. Hover over tab buttons
4. Hover over waypoint list items
5. Observe animations

**Expected Results**:
- ✅ Buttons lift slightly on hover (translateY)
- ✅ Subtle shadow appears under button
- ✅ Background color changes smoothly
- ✅ Transition completes in 0.2s
- ✅ Cursor changes to pointer

**Pass/Fail**: ___________

---

### Test 18: Button Active States
**Objective**: Test click/press animations

**Steps**:
1. Click and hold various buttons
2. Observe scale/transform effects
3. Release and observe return to normal

**Expected Results**:
- ✅ Button scales down slightly (0.98) when pressed
- ✅ Shadow disappears on press
- ✅ Returns to normal on release
- ✅ Smooth transition (0.2s)
- ✅ No jarring movements

**Pass/Fail**: ___________

---

### Test 19: Loading States for Async Operations
**Objective**: Verify loading indicators on async buttons

**Steps**:
1. Click "Save Mission" button
2. Observe button during save
3. Click "Load Mission" button
4. Observe button during load

**Expected Results**:
- ✅ Button shows loading spinner
- ✅ Button opacity reduces (0.7)
- ✅ Button becomes unclickable during operation
- ✅ Returns to normal after completion
- ✅ Spinner animation smooth

**Pass/Fail**: ___________  
**Note**: May need to simulate slow network

---

### Test 20: Smooth Color Transitions
**Objective**: Test theme color changes

**Steps**:
1. Switch between tabs multiple times
2. Select/deselect waypoints
3. Hover over various elements
4. Observe color transitions

**Expected Results**:
- ✅ All color changes animate smoothly
- ✅ No sudden color jumps
- ✅ Transition duration: 0.2s
- ✅ Applies to backgrounds, text, borders
- ✅ Consistent across all elements

**Pass/Fail**: ___________

---

### Test 21: Focus Visible (Accessibility)
**Objective**: Test keyboard navigation focus indicators

**Steps**:
1. Press Tab key repeatedly to navigate UI
2. Observe focus indicators on buttons, inputs
3. Check search box, waypoint list, tabs
4. Verify outline visibility

**Expected Results**:
- ✅ Blue outline (2px) appears on focused elements
- ✅ Outline offset: 2px from element
- ✅ Visible on buttons, inputs, links, list items
- ✅ Doesn't appear on mouse clicks (only Tab)
- ✅ Color matches theme accent

**Pass/Fail**: ___________

---

## 🔄 INTEGRATION TESTS

### Test 22: Search + Home Point Integration
**Objective**: Test search history with home point setting

**Steps**:
1. Search for "San Francisco Airport"
2. Add waypoint at that location
3. Set as home point
4. Search for "Golden Gate Bridge"
5. Use search history to return to airport
6. Verify home point

**Expected Results**:
- ✅ Search history works independently
- ✅ Home point persists through searches
- ✅ Can navigate via search without affecting mission
- ✅ Home point marker always visible
- ✅ No conflicts between features

**Pass/Fail**: ___________

---

### Test 23: Export with Home Point
**Objective**: Verify home point in exported files

**Steps**:
1. Create mission with home point (waypoint 2)
2. Export as JSON
3. Export as KML
4. Open JSON file in text editor
5. Check for home point data

**Expected Results**:
- ✅ JSON contains `"isHome": true` for correct waypoint
- ✅ Only one waypoint has `isHome: true`
- ✅ KML file includes home point marker
- ✅ Exported data is valid and complete
- ✅ Can re-import and home point preserved

**Pass/Fail**: ___________

---

### Test 24: Simulation with Home Point
**Objective**: Test home point in simulation mode

**Steps**:
1. Create mission with home point
2. Add 4 more waypoints
3. Start simulation
4. Observe drone starting position
5. Watch telemetry for home reference

**Expected Results**:
- ✅ Simulation starts at home point location
- ✅ Drone altitude matches home altitude
- ✅ Distance calculations relative to home
- ✅ Home point marker remains visible during simulation
- ✅ RTH functionality references home point

**Pass/Fail**: ___________

---

### Test 25: Weather Integration
**Objective**: Test weather display with search history

**Steps**:
1. Search for "Miami, FL" → observe weather
2. Search for "Denver, CO" → observe weather update
3. Use search history to return to Miami
4. Check weather data

**Expected Results**:
- ✅ Weather updates when searching new location
- ✅ Weather overlay shows correct city
- ✅ Temperature matches location
- ✅ Using search history updates weather
- ✅ No weather API errors

**Pass/Fail**: ___________

---

## 📱 RESPONSIVE DESIGN TESTS

### Test 26: Mobile Layout - Home Point
**Objective**: Test home point features on mobile

**Browser**: Chrome DevTools Mobile Emulation (iPhone 12)

**Steps**:
1. Resize to mobile viewport (375px)
2. Add waypoints and set home
3. Test "Go to Home" button
4. Check home point info section

**Expected Results**:
- ✅ Home point section stacks vertically
- ✅ Buttons are touch-friendly (44px min)
- ✅ Info rows stack properly
- ✅ Text remains readable
- ✅ No horizontal overflow

**Pass/Fail**: ___________

---

### Test 27: Mobile Layout - Search History
**Objective**: Test search history on mobile

**Steps**:
1. Mobile viewport (375px)
2. Open search dropdown
3. Add 5+ history items
4. Test scrolling and clicking

**Expected Results**:
- ✅ Dropdown width adjusts to screen
- ✅ History items are touch-friendly
- ✅ Text truncates properly (ellipsis)
- ✅ Scrolling smooth on touch
- ✅ Clear button accessible

**Pass/Fail**: ___________

---

### Test 28: Tablet Layout
**Objective**: Test features on tablet size

**Browser**: Chrome DevTools (iPad)

**Steps**:
1. Resize to 768px width
2. Test all home point features
3. Test search history
4. Check button hover states (with mouse)

**Expected Results**:
- ✅ Layout adapts to tablet size
- ✅ Sidebar and map stack vertically (if < 900px)
- ✅ All features remain accessible
- ✅ Touch and mouse input both work
- ✅ No layout breaking

**Pass/Fail**: ___________

---

## 🌐 CROSS-BROWSER TESTS

### Test 29: Chrome/Edge (Chromium)
**Objective**: Full feature test in Chromium browsers

**Steps**: Run Tests 1-25 in Chrome or Edge

**Expected Results**:
- ✅ All features work perfectly
- ✅ Animations smooth (60fps)
- ✅ No console errors
- ✅ Google Maps API works
- ✅ LocalStorage persists

**Pass/Fail**: ___________

---

### Test 30: Firefox
**Objective**: Test in Firefox browser

**Steps**: Run Tests 1, 2, 9, 10, 16, 17 in Firefox

**Expected Results**:
- ✅ Home point features work
- ✅ Search history works
- ✅ CSS animations work
- ✅ Button effects work
- ✅ No browser-specific bugs

**Pass/Fail**: ___________

---

### Test 31: Safari (macOS/iOS)
**Objective**: Test in Safari browser

**Steps**: Run Tests 1, 2, 9, 10 in Safari

**Expected Results**:
- ✅ All features functional
- ✅ Webkit-specific CSS works
- ✅ Touch events work (iOS)
- ✅ LocalStorage works
- ✅ No webkit rendering issues

**Pass/Fail**: ___________

---

## ⚡ PERFORMANCE TESTS

### Test 32: Large Mission Performance
**Objective**: Test with 50+ waypoints

**Steps**:
1. Create mission with 50 waypoints
2. Change home point to waypoint 40
3. Observe rendering performance
4. Test search history with large mission

**Expected Results**:
- ✅ No lag when setting home point
- ✅ Markers render smoothly
- ✅ Map remains responsive
- ✅ Flight path calculates quickly (< 1s)
- ✅ UI updates in < 100ms

**Pass/Fail**: ___________

---

### Test 33: Search History Performance
**Objective**: Test with maximum history (10 items)

**Steps**:
1. Fill search history to 10 items
2. Open/close dropdown rapidly 10 times
3. Click through all history items
4. Monitor browser performance

**Expected Results**:
- ✅ Dropdown opens instantly (< 50ms)
- ✅ No lag or jank
- ✅ Smooth scrolling
- ✅ Memory usage stable
- ✅ No memory leaks

**Pass/Fail**: ___________

---

## 🐛 ERROR HANDLING TESTS

### Test 34: Invalid Home Point Recovery
**Objective**: Test edge case error handling

**Steps**:
1. Manually edit saved mission JSON
2. Set multiple waypoints with `isHome: true`
3. Load corrupted mission
4. Observe behavior

**Expected Results**:
- ✅ App handles corrupted data gracefully
- ✅ Error message shown to user
- ✅ Either: first home point used, or no home set
- ✅ No app crash
- ✅ Can manually fix by setting new home

**Pass/Fail**: ___________

---

### Test 35: Network Failure in Search
**Objective**: Test offline search behavior

**Steps**:
1. Open app with working internet
2. Open DevTools → Network tab
3. Set to "Offline" mode
4. Try to search for location
5. Observe behavior

**Expected Results**:
- ✅ Error notification shown
- ✅ App doesn't crash
- ✅ Previous search history still accessible
- ✅ Can use history to navigate offline
- ✅ Graceful degradation

**Pass/Fail**: ___________

---

## 📊 TEST SUMMARY

### Results Overview

**Total Tests**: 35  
**Passed**: _______  
**Failed**: _______  
**Skipped**: _______  

### Critical Failures
List any test failures that block production release:

1. ___________________________________
2. ___________________________________
3. ___________________________________

### Minor Issues
List non-critical issues or cosmetic problems:

1. ___________________________________
2. ___________________________________
3. ___________________________________

### Recommendations

#### High Priority Fixes
- [ ] ___________________________________
- [ ] ___________________________________

#### Medium Priority Enhancements
- [ ] ___________________________________
- [ ] ___________________________________

#### Low Priority / Future
- [ ] ___________________________________
- [ ] ___________________________________

---

## 🔄 REGRESSION TESTING

When making changes, always run:
- **Core Tests**: 1, 2, 3, 9, 10
- **Integration Tests**: 22, 23, 24
- **Mobile Tests**: 26, 27

---

## 📝 NOTES

**Tester Name**: ___________________  
**Test Date**: ___________________  
**App Version**: ___________________  
**Browser/Device**: ___________________  

**Additional Comments**:
_______________________________________________
_______________________________________________
_______________________________________________
