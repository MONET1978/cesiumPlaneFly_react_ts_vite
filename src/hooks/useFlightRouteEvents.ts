/**
 * Flight Route Events Hook
 * Subscribes to flight route events and syncs with React state
 */

import { useEffect, useState } from 'react'
import type { EventSubscription, FlightRouteEvents, FlightRoute } from '../types'

/**
 * Event listener hook for CesiumPlaneFly events
 * @param events - Event emitter instance
 * @returns Current state and event handlers
 */
export function useFlightRouteEvents(events: {
  on: <T extends keyof FlightRouteEvents>(
    event: T,
    listener: FlightRouteEvents[T]
  ) => EventSubscription
} | null) {
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null)
  const [currentRoute, setCurrentRoute] = useState<FlightRoute | null>(null)
  const [flightState, setFlightState] = useState<'idle' | 'playing' | 'paused'>('idle')
  const [flightProgress, setFlightProgress] = useState<number>(0)

  useEffect(() => {
    if (!events) return

    const subscriptions: EventSubscription[] = []

    // Subscribe to waypoint selected events
    subscriptions.push(
      events.on('waypoint-selected', (id) => {
        setSelectedWaypointId(id)
      })
    )

    // Subscribe to route changed events
    subscriptions.push(
      events.on('route-changed', (route) => {
        setCurrentRoute(route)
      })
    )

    // Subscribe to flight state changed events
    subscriptions.push(
      events.on('flight-state-changed', (state) => {
        setFlightState(state)
      })
    )

    // Subscribe to flight progress events
    subscriptions.push(
      events.on('flight-progress', (progress) => {
        setFlightProgress(progress)
      })
    )

    // Subscribe to error events
    subscriptions.push(
      events.on('error', (error, context) => {
        console.error(`[FlightRouteEvent] Error in ${context}:`, error)
      })
    )

    return () => {
      subscriptions.forEach((sub) => sub.unsubscribe())
    }
  }, [events])

  return {
    selectedWaypointId,
    currentRoute,
    flightState,
    flightProgress
  }
}

/**
 * Hook to subscribe to a single event
 * @param events - Event emitter instance
 * @param event - Event name
 * @param handler - Event handler callback
 */
export function useFlightRouteEvent<T extends keyof FlightRouteEvents>(
  events: {
    on: <E extends keyof FlightRouteEvents>(
      event: E,
      listener: FlightRouteEvents[E]
    ) => EventSubscription
  } | null,
  event: T,
  handler: FlightRouteEvents[T]
): void {
  useEffect(() => {
    if (!events) return

    const subscription = events.on(event, handler)
    return () => {
      subscription.unsubscribe()
    }
  }, [events, event, handler])
}

/**
 * Hook to get waypoint selection state
 * @param events - Event emitter instance
 */
export function useSelectedWaypoint(events: {
  on: <T extends keyof FlightRouteEvents>(
    event: T,
    listener: FlightRouteEvents[T]
  ) => EventSubscription
} | null): string | null {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (!events) return

    const subscription = events.on('waypoint-selected', (id) => {
      setSelectedId(id)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [events])

  return selectedId
}

/**
 * Hook to get current route state
 * @param events - Event emitter instance
 */
export function useCurrentRoute(events: {
  on: <T extends keyof FlightRouteEvents>(
    event: T,
    listener: FlightRouteEvents[T]
  ) => EventSubscription
} | null): FlightRoute | null {
  const [route, setRoute] = useState<FlightRoute | null>(null)

  useEffect(() => {
    if (!events) return

    const subscription = events.on('route-changed', (newRoute) => {
      setRoute(newRoute)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [events])

  return route
}
