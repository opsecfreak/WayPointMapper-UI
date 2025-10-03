/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Comprehensive error handling and utility functions for the UAV Mission Planner
 */

// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

/**
 * Enhanced error handler with user-friendly messages
 */
export class ApplicationError extends Error {
  public readonly userMessage: string;
  public readonly code: string;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    userMessage: string,
    code: string = 'UNKNOWN_ERROR',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.userMessage = userMessage;
    this.code = code;
    this.context = context;
  }
}

/**
 * Centralized error handling function
 */
export function handleError(error: unknown, context: string = 'Unknown'): void {
  console.group(`🚨 Error in ${context}`);
  
  if (error instanceof ApplicationError) {
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    console.error('User Message:', error.userMessage);
    if (error.context) {
      console.error('Context:', error.context);
    }
    showUserNotification(error.userMessage, 'error');
  } else if (error instanceof Error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    showUserNotification('An unexpected error occurred. Please try again.', 'error');
  } else {
    console.error('Unknown error:', error);
    showUserNotification('An unknown error occurred. Please refresh and try again.', 'error');
  }
  
  console.groupEnd();
}

/**
 * User notification system (replaces basic alerts)
 */
export function showUserNotification(
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration: number = 5000
): void {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Style the notification
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    border-radius: 6px;
    color: white;
    font-family: 'Google Sans Text', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
  `;
  
  // Set background color based on type
  const colors = {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3'
  };
  notification.style.backgroundColor = colors[type];
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate waypoint data
 */
export function validateWaypoint(waypoint: any): boolean {
  const required = ['id', 'lat', 'lng', 'altitude', 'speed', 'label', 'color'];
  
  for (const field of required) {
    if (!(field in waypoint)) {
      throw new ApplicationError(
        `Missing required field: ${field}`,
        `Waypoint validation failed: missing ${field}`,
        'VALIDATION_ERROR',
        { waypoint, missingField: field }
      );
    }
  }
  
  // Validate coordinates
  if (waypoint.lat < -90 || waypoint.lat > 90) {
    throw new ApplicationError(
      `Invalid latitude: ${waypoint.lat}`,
      'Latitude must be between -90 and 90 degrees',
      'INVALID_COORDINATE'
    );
  }
  
  if (waypoint.lng < -180 || waypoint.lng > 180) {
    throw new ApplicationError(
      `Invalid longitude: ${waypoint.lng}`,
      'Longitude must be between -180 and 180 degrees',
      'INVALID_COORDINATE'
    );
  }
  
  // Validate altitude
  if (waypoint.altitude < 0 || waypoint.altitude > 15000) {
    throw new ApplicationError(
      `Invalid altitude: ${waypoint.altitude}`,
      'Altitude must be between 0 and 15,000 meters',
      'INVALID_ALTITUDE'
    );
  }
  
  // Validate speed
  if (waypoint.speed <= 0 || waypoint.speed > 100) {
    throw new ApplicationError(
      `Invalid speed: ${waypoint.speed}`,
      'Speed must be between 0.1 and 100 m/s',
      'INVALID_SPEED'
    );
  }
  
  return true;
}

/**
 * Validate mission data
 */
export function validateMission(mission: any): boolean {
  const required = ['id', 'name', 'waypoints', 'createdAt'];
  
  for (const field of required) {
    if (!(field in mission)) {
      throw new ApplicationError(
        `Missing required field: ${field}`,
        `Mission validation failed: missing ${field}`,
        'VALIDATION_ERROR'
      );
    }
  }
  
  if (!Array.isArray(mission.waypoints) || mission.waypoints.length === 0) {
    throw new ApplicationError(
      'Mission must have at least one waypoint',
      'Please add at least one waypoint to the mission',
      'INSUFFICIENT_WAYPOINTS'
    );
  }
  
  // Validate each waypoint
  mission.waypoints.forEach((waypoint: any, index: number) => {
    try {
      validateWaypoint(waypoint);
    } catch (error) {
      throw new ApplicationError(
        `Invalid waypoint at index ${index}`,
        `Waypoint ${index + 1} is invalid`,
        'INVALID_WAYPOINT',
        { index, waypoint }
      );
    }
  });
  
  return true;
}

// ============================================================================
// API UTILITIES
// ============================================================================

/**
 * Enhanced fetch wrapper with better error handling
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  context: string = 'API Request'
): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      throw new ApplicationError(
        `HTTP ${response.status}: ${response.statusText}`,
        `Failed to ${context.toLowerCase()}. Please check your internet connection and try again.`,
        'API_ERROR',
        { status: response.status, statusText: response.statusText, url }
      );
    }
    
    const data = await response.json();
    return data as T;
    
  } catch (error) {
    if (error instanceof ApplicationError) {
      throw error;
    }
    
    if (error instanceof TypeError) {
      throw new ApplicationError(
        `Network error: ${error.message}`,
        'Unable to connect to the server. Please check your internet connection.',
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    }
    
    throw new ApplicationError(
      `Request failed: ${error}`,
      `Failed to ${context.toLowerCase()}. Please try again.`,
      'REQUEST_FAILED',
      { originalError: error }
    );
  }
}

// ============================================================================
// FILE UTILITIES
// ============================================================================

/**
 * Safe file download with error handling
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    showUserNotification(`File "${filename}" downloaded successfully`, 'success');
  } catch (error) {
    handleError(
      new ApplicationError(
        `Failed to download file: ${error}`,
        'Unable to download file. Please try again.',
        'DOWNLOAD_ERROR',
        { filename, mimeType }
      ),
      'File Download'
    );
  }
}

/**
 * Safe file reading with validation
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new ApplicationError(
          'File reading resulted in null',
          'Unable to read the selected file',
          'FILE_READ_ERROR'
        ));
      }
    };
    
    reader.onerror = () => {
      reject(new ApplicationError(
        `FileReader error: ${reader.error}`,
        'Error reading file. Please try selecting the file again.',
        'FILE_READ_ERROR',
        { fileName: file.name, fileSize: file.size }
      ));
    };
    
    reader.readAsText(file);
  });
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for performance-critical operations
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Performance monitoring wrapper
 */
export function measurePerformance<T>(
  name: string,
  func: () => T
): T {
  const start = performance.now();
  const result = func();
  const end = performance.now();
  
  console.log(`⚡ ${name} took ${(end - start).toFixed(2)}ms`);
  return result;
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

/**
 * Safe localStorage operations with error handling
 */
export const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      handleError(
        new ApplicationError(
          `Failed to read from localStorage: ${error}`,
          'Unable to access saved settings',
          'STORAGE_READ_ERROR',
          { key }
        ),
        'Storage Access'
      );
      return null;
    }
  },
  
  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      handleError(
        new ApplicationError(
          `Failed to write to localStorage: ${error}`,
          'Unable to save settings. Storage may be full.',
          'STORAGE_WRITE_ERROR',
          { key, valueLength: value.length }
        ),
        'Storage Access'
      );
      return false;
    }
  },
  
  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      handleError(
        new ApplicationError(
          `Failed to remove from localStorage: ${error}`,
          'Unable to clear saved settings',
          'STORAGE_REMOVE_ERROR',
          { key }
        ),
        'Storage Access'
      );
      return false;
    }
  }
};

// ============================================================================
// MATHEMATICAL UTILITIES
// ============================================================================

/**
 * Calculate distance between two geographic points using Haversine formula
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLng = (point2.lng - point1.lng) * Math.PI / 180;
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Calculate bearing between two geographic points
 */
export function calculateBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180;
  const lat1 = from.lat * Math.PI / 180;
  const lat2 = to.lat * Math.PI / 180;
  
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  
  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360; // Normalize to 0-360 degrees
}

/**
 * Format time duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Format distance in human-readable format
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  } else {
    return `${meters.toFixed(0)} m`;
  }
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}