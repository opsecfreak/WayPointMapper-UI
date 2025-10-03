/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * This is the main entry point for the application.
 * It sets up the LitElement-based MapApp component which serves as the
 * mission planner interface.
 */

import {MapApp} from './map_app';

document.addEventListener('DOMContentLoaded', () => {
  const rootElement = document.querySelector('#root')! as HTMLElement;
  const mapApp = new MapApp();
  // FIX: Cast to HTMLElement to resolve "not assignable to type 'Node'" error.
  // `MapApp` is an HTMLElement, but TypeScript can fail to infer this.
  rootElement.appendChild(mapApp as HTMLElement);
});