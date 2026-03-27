import { useEffect, useRef } from 'react'
import type { Viewer } from 'cesium'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'

/**
 * 渲染同步 Hook
 * 监听 Zustand store 变化，将航路数据同步到 Cesium 场景
 */
export function useCesiumSync(
    viewer: Viewer | null,
    visualizer: FlightRouteVisualizer | null
): void {
    const prevSelectedRef = useRef<string | null>(null)

    useEffect(() => {
        if (!viewer || !visualizer) return

        const state = useFlightRouteStore.getState()
        const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
        
        if (currentRoute) {
            visualizer.syncAll(currentRoute.waypoints, currentRoute.color, currentRoute.lineWidth)
        }

        const unsubscribe = useFlightRouteStore.subscribe((state, prevState) => {
            const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
            const prevRoute = prevState.routes.find(r => r.id === prevState.currentRouteId)

            if (
                currentRoute &&
                (currentRoute.waypoints !== prevRoute?.waypoints ||
                currentRoute.color !== prevRoute?.color ||
                currentRoute.lineWidth !== prevRoute?.lineWidth)
            ) {
                if (!state.isDragging) {
                    visualizer.syncAll(
                        currentRoute.waypoints,
                        currentRoute.color,
                        currentRoute.lineWidth
                    )
                }
            }

            if (state.selectedWaypointId !== prevState.selectedWaypointId) {
                if (prevSelectedRef.current) {
                    visualizer.unhighlightWaypoint(prevSelectedRef.current)
                }
                if (state.selectedWaypointId) {
                    visualizer.highlightWaypoint(state.selectedWaypointId)
                }
                prevSelectedRef.current = state.selectedWaypointId
            }
        })

        return () => {
            unsubscribe()
        }
    }, [viewer, visualizer])
}
