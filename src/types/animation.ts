/**
 * Animation-related types for CesiumPlaneFly
 * @packageDocumentation
 */

/**
 * Flight animation state
 */
export type FlightAnimationState = 'idle' | 'playing' | 'paused'

/**
 * Flight animation configuration
 */
export interface FlightAnimationConfig {
  /** Time interval between each waypoint (seconds) */
  timeStepPerWaypoint: number
  /** Animation playback speed multiplier */
  playbackSpeed: number
  /** Airplane model asset ID */
  modelAssetId: number
  /** Path line width */
  pathWidth: number
}

/**
 * Flight animation control interface
 */
export interface FlightAnimationControl {
  /** Current animation state */
  state: FlightAnimationState
  /** Playback speed multiplier */
  playbackSpeed: number
  /** Start flight */
  startFlight: () => Promise<void>
  /** Pause flight */
  pauseFlight: () => void
  /** Resume flight */
  resumeFlight: () => void
  /** Stop flight */
  stopFlight: () => void
  /** Set playback speed */
  setPlaybackSpeed: (speed: number) => void
  /** Is currently flying */
  isFlying: boolean
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: FlightAnimationConfig = {
  timeStepPerWaypoint: 30,
  playbackSpeed: 5,
  modelAssetId: 4332518,
  pathWidth: 3
}
