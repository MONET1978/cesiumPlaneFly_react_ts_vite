/**
 * Event system types for CesiumPlaneFly
 * @packageDocumentation
 */

import type { Waypoint } from './waypoint'
import type { FlightRoute } from './route'
import type { FlightAnimationState } from './animation'

/**
 * Event types emitted by the system
 */
export interface FlightRouteEvents {
  /** Route loaded or updated */
  'route-changed': (route: FlightRoute) => void
  /** Waypoint added */
  'waypoint-added': (waypoint: Waypoint, index: number) => void
  /** Waypoint updated */
  'waypoint-updated': (waypoint: Waypoint) => void
  /** Waypoint removed */
  'waypoint-removed': (waypointId: string) => void
  /** Waypoint selected */
  'waypoint-selected': (waypointId: string | null) => void
  /** Route configuration changed */
  'route-config-changed': (config: Partial<RouteConfig>) => void
  /** Flight animation state changed */
  'flight-state-changed': (state: FlightAnimationState) => void
  /** Flight progress updated (0-1) */
  'flight-progress': (progress: number) => void
  /** Error occurred */
  'error': (error: Error, context: string) => void
}

/**
 * Event listener function type
 */
export type EventListener<T extends keyof FlightRouteEvents> = FlightRouteEvents[T]

/**
 * Event subscription handle
 */
export interface EventSubscription {
  unsubscribe: () => void
}

/**
 * Route configuration type (re-export for convenience)
 */
export interface RouteConfig {
  name?: string
  color?: string
  lineWidth?: number
}
