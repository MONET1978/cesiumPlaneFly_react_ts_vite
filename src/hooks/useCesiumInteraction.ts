import { useEffect, useRef } from 'react'
import {
    Cartesian2,
    Cartographic,
    Color,
    Math as CesiumMath,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    defined,
    type Viewer
} from 'cesium'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'

/**
 * Cesium 交互层 Hook
 * 处理用户在地图上的点击、右键、拖拽等交互操作
 */
export function useCesiumInteraction(
    viewer: Viewer | null,
    visualizer: FlightRouteVisualizer | null
): void {
    const dragStateRef = useRef<{
        isDragging: boolean
        draggedWaypointId: string | null
        originalHeight: number
    }>({
        isDragging: false,
        draggedWaypointId: null,
        originalHeight: 0
    })

    const isSelectingMode = useFlightRouteStore((s) => s.isSelectingMode)

    useEffect(() => {
        if (!viewer) return
        const canvasElement = viewer.canvas as HTMLCanvasElement
        const originalCursor = canvasElement.style.cursor
        const newCursor = isSelectingMode ? 'crosshair' : 'default'
        canvasElement.style.cursor = newCursor
        return () => {
            canvasElement.style.cursor = originalCursor || 'default'
        }
    }, [viewer, isSelectingMode])

    useEffect(() => {
        console.log('[useCesiumInteraction] Initialized:', !!viewer, !!visualizer)
        if (!viewer || !visualizer) return

        const handler = new ScreenSpaceEventHandler(viewer.scene.canvas)
        const store = useFlightRouteStore

        handler.setInputAction((movement: { position: Cartesian2 }) => {
            console.log('[LEFT_CLICK] Click detected, isSelectingMode:', store.getState().isSelectingMode)
            if (dragStateRef.current.isDragging) return

            const picked = viewer.scene.pick(movement.position)
            const state = store.getState()

            if (defined(picked) && picked.id) {
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    console.log('[LEFT_CLICK] Selected waypoint:', waypointId)
                    store.getState().selectWaypoint(waypointId)
                }
            } else if (state.isSelectingMode) {
                const cartesian = viewer.camera.pickEllipsoid(
                    movement.position,
                    viewer.scene.globe.ellipsoid
                )
                if (cartesian) {
                    const cartographic = Cartographic.fromCartesian(cartesian)
                    const longitude = CesiumMath.toDegrees(cartographic.longitude)
                    const latitude = CesiumMath.toDegrees(cartographic.latitude)
                    const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
                    const waypointCount = currentRoute?.waypoints.length ?? 0
                    console.log('[LEFT_CLICK] Adding waypoint at:', longitude, latitude)
                    state.addWaypoint({
                        longitude,
                        latitude,
                        height: state.defaultHeight,
                        name: `航路点${waypointCount + 1}`,
                    })
                } else {
                    console.warn('[LEFT_CLICK] Failed to pick ellipsoid')
                }
            }
        }, ScreenSpaceEventType.LEFT_CLICK)

        handler.setInputAction((movement: { position: Cartesian2 }) => {
            const picked = viewer.scene.pick(movement.position)
            if (defined(picked) && picked.id) {
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    store.getState().deleteWaypoint(waypointId)
                }
            }
        }, ScreenSpaceEventType.RIGHT_CLICK)

        handler.setInputAction((movement: { position: Cartesian2 }) => {
            const picked = viewer.scene.pick(movement.position)
            if (defined(picked) && picked.id) {
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    const state = store.getState()
                    const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
                    const waypoint = currentRoute?.waypoints.find((wp) => wp.id === waypointId)
                    if (!waypoint) return

                    dragStateRef.current = {
                        isDragging: true,
                        draggedWaypointId: waypointId,
                        originalHeight: waypoint.height,
                    }

                    store.getState().setDragging(true)

                    viewer.scene.screenSpaceCameraController.enableRotate = false
                    viewer.scene.screenSpaceCameraController.enableTranslate = false
                    viewer.scene.screenSpaceCameraController.enableZoom = false
                    viewer.scene.screenSpaceCameraController.enableTilt = false
                    viewer.scene.screenSpaceCameraController.enableLook = false
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN)

        handler.setInputAction((movement: { endPosition: Cartesian2 }) => {
            const drag = dragStateRef.current
            if (!drag.isDragging || !drag.draggedWaypointId) return

            const cartesian = viewer.camera.pickEllipsoid(
                movement.endPosition,
                viewer.scene.globe.ellipsoid
            )
            if (!cartesian) return

            const cartographic = Cartographic.fromCartesian(cartesian)
            const longitude = CesiumMath.toDegrees(cartographic.longitude)
            const latitude = CesiumMath.toDegrees(cartographic.latitude)

            visualizer.updateWaypointPosition(drag.draggedWaypointId, {
                longitude,
                latitude,
                height: drag.originalHeight,
            })

            const state = store.getState()
            const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
            if (currentRoute) {
                const updatedWaypoints = currentRoute.waypoints.map((wp) =>
                    wp.id === drag.draggedWaypointId
                        ? { ...wp, longitude, latitude }
                        : wp
                )
                const routeColor = currentRoute.color
                    ? Color.fromCssColorString(currentRoute.color)
                    : Color.YELLOW
                visualizer.updatePolyline(updatedWaypoints, routeColor, currentRoute.lineWidth)
            }
        }, ScreenSpaceEventType.MOUSE_MOVE)

        handler.setInputAction(() => {
            const drag = dragStateRef.current
            if (!drag.isDragging || !drag.draggedWaypointId) return

            const entity = visualizer.getEntityById(drag.draggedWaypointId)
            if (entity?.position) {
                const cartesian = entity.position.getValue(viewer.clock.currentTime)
                if (cartesian) {
                    const cartographic = Cartographic.fromCartesian(cartesian)
                    const longitude = CesiumMath.toDegrees(cartographic.longitude)
                    const latitude = CesiumMath.toDegrees(cartographic.latitude)

                    store.getState().updateWaypoint(drag.draggedWaypointId, {
                        longitude,
                        latitude,
                    })
                }
            }

            dragStateRef.current = {
                isDragging: false,
                draggedWaypointId: null,
                originalHeight: 0,
            }
            store.getState().setDragging(false)

            viewer.scene.screenSpaceCameraController.enableRotate = true
            viewer.scene.screenSpaceCameraController.enableTranslate = true
            viewer.scene.screenSpaceCameraController.enableZoom = true
            viewer.scene.screenSpaceCameraController.enableTilt = true
            viewer.scene.screenSpaceCameraController.enableLook = true
        }, ScreenSpaceEventType.LEFT_UP)

        return () => {
            handler.destroy()

            if (!viewer.isDestroyed()) {
                viewer.scene.screenSpaceCameraController.enableRotate = true
                viewer.scene.screenSpaceCameraController.enableTranslate = true
                viewer.scene.screenSpaceCameraController.enableZoom = true
                viewer.scene.screenSpaceCameraController.enableTilt = true
                viewer.scene.screenSpaceCameraController.enableLook = true
            }
        }
    }, [viewer, visualizer])
}
