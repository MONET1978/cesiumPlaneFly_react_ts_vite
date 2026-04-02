/**
 * Type definitions for CesiumPlaneFly
 * @packageDocumentation
 */

// Waypoint types
export type {
  Waypoint,
  WaypointInput,
  FlightRoute as LegacyFlightRoute
} from './waypoint'

export {
  validateWaypoint,
  validateFlightRoute
} from './waypoint'

// Route types
export type {
  RouteConfig,
  FlightRoute,
  FlightRouteInput,
  RouteData,
  ImportResult
} from './route'

// Animation types
export type {
  FlightAnimationState,
  FlightAnimationConfig,
  FlightAnimationControl
} from './animation'

export {
  DEFAULT_ANIMATION_CONFIG
} from './animation'

// Event types
export type {
  FlightRouteEvents,
  EventListener,
  EventSubscription,
  RouteConfig as EventRouteConfig
} from './events'
