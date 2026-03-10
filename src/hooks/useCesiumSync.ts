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

        // 首次同步：渲染 store 中的当前数据
        const state = useFlightRouteStore.getState()
        visualizer.syncAll(state.waypoints, state.routeColor, state.routeLineWidth)

        // 订阅后续变化
        const unsubscribe = useFlightRouteStore.subscribe((state, prevState) => {
            // 航路点、颜色或线宽变化 → 全量同步
            if (
                state.waypoints !== prevState.waypoints ||
                state.routeColor !== prevState.routeColor ||
                state.routeLineWidth !== prevState.routeLineWidth
            ) {
                // 拖拽期间由交互层直接操作 Entity，跳过 sync
                if (!state.isDragging) {
                    visualizer.syncAll(
                        state.waypoints,
                        state.routeColor,
                        state.routeLineWidth
                    )
                }
            }

            // 选中状态变化 → 高亮/取消高亮
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
