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

    // 订阅选点模式状态，用于改变光标样式
    const isSelectingMode = useFlightRouteStore((s) => s.isSelectingMode)

    // 选点模式下改变鼠标光标样式
    useEffect(() => {
        if (!viewer) return
        // 提取 canvas 元素，修改光标样式是 DOM 操作，不影响 viewer 内部状态
        const canvasElement = viewer.canvas as HTMLCanvasElement
        const originalCursor = canvasElement.style.cursor
        const newCursor = isSelectingMode ? 'crosshair' : 'default'
        // eslint-disable-next-line react-hooks/immutability -- DOM 操作，不影响 viewer 状态
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

        // LEFT_CLICK: 点击空白处添加航路点（仅选点模式），点击已有航路点选中
        handler.setInputAction((movement: { position: Cartesian2 }) => {
            console.log('[LEFT_CLICK] Click detected, isSelectingMode:', store.getState().isSelectingMode)
            // 如果正在拖拽，忽略点击
            if (dragStateRef.current.isDragging) return

            const picked = viewer.scene.pick(movement.position)
            const state = store.getState()

            if (defined(picked) && picked.id) {
                // 点击了已有实体 → 选中
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    console.log('[LEFT_CLICK] Selected waypoint:', waypointId)
                    store.getState().selectWaypoint(waypointId)
                }
            } else if (state.isSelectingMode) {
                // 仅在选点模式下，点击地球空白处 → 添加航路点
                const cartesian = viewer.camera.pickEllipsoid(
                    movement.position,
                    viewer.scene.globe.ellipsoid
                )
                if (cartesian) {
                    const cartographic = Cartographic.fromCartesian(cartesian)
                    const longitude = CesiumMath.toDegrees(cartographic.longitude)
                    const latitude = CesiumMath.toDegrees(cartographic.latitude)
                    const waypointCount = state.waypoints.length
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

        // RIGHT_CLICK: 右键删除航路点
        handler.setInputAction((movement: { position: Cartesian2 }) => {
            const picked = viewer.scene.pick(movement.position)
            if (defined(picked) && picked.id) {
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    store.getState().deleteWaypoint(waypointId)
                }
            }
        }, ScreenSpaceEventType.RIGHT_CLICK)

        // LEFT_DOWN: 开始拖拽
        handler.setInputAction((movement: { position: Cartesian2 }) => {
            const picked = viewer.scene.pick(movement.position)
            if (defined(picked) && picked.id) {
                const waypointId = visualizer.findWaypointIdByEntity(picked.id)
                if (waypointId) {
                    const state = store.getState()
                    const waypoint = state.waypoints.find((wp) => wp.id === waypointId)
                    if (!waypoint) return

                    dragStateRef.current = {
                        isDragging: true,
                        draggedWaypointId: waypointId,
                        originalHeight: waypoint.height,
                    }

                    store.getState().setDragging(true)

                    // 禁用相机控制
                    viewer.scene.screenSpaceCameraController.enableRotate = false
                    viewer.scene.screenSpaceCameraController.enableTranslate = false
                    viewer.scene.screenSpaceCameraController.enableZoom = false
                    viewer.scene.screenSpaceCameraController.enableTilt = false
                    viewer.scene.screenSpaceCameraController.enableLook = false
                }
            }
        }, ScreenSpaceEventType.LEFT_DOWN)

        // MOUSE_MOVE: 拖拽中移动航路点
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

            // 拖拽期间直接操作 Entity（绕过 store，确保流畅性）
            visualizer.updateWaypointPosition(drag.draggedWaypointId, {
                longitude,
                latitude,
                height: drag.originalHeight,
            })

            // 同时更新 polyline
            const state = store.getState()
            const updatedWaypoints = state.waypoints.map((wp) =>
                wp.id === drag.draggedWaypointId
                    ? { ...wp, longitude, latitude }
                    : wp
            )
            const routeColor = state.routeColor
                ? Color.fromCssColorString(state.routeColor)
                : Color.YELLOW
            visualizer.updatePolyline(updatedWaypoints, routeColor, state.routeLineWidth)
        }, ScreenSpaceEventType.MOUSE_MOVE)

        // LEFT_UP: 结束拖拽
        handler.setInputAction(() => {
            const drag = dragStateRef.current
            if (!drag.isDragging || !drag.draggedWaypointId) return

            // 获取被拖拽 entity 的最终位置
            const entity = visualizer.getEntityById(drag.draggedWaypointId)
            if (entity?.position) {
                const cartesian = entity.position.getValue(viewer.clock.currentTime)
                if (cartesian) {
                    const cartographic = Cartographic.fromCartesian(cartesian)
                    const longitude = CesiumMath.toDegrees(cartographic.longitude)
                    const latitude = CesiumMath.toDegrees(cartographic.latitude)

                    // 最终位置写入 store
                    store.getState().updateWaypoint(drag.draggedWaypointId, {
                        longitude,
                        latitude,
                    })
                }
            }

            // 重置拖拽状态
            dragStateRef.current = {
                isDragging: false,
                draggedWaypointId: null,
                originalHeight: 0,
            }
            store.getState().setDragging(false)

            // 恢复相机控制
            viewer.scene.screenSpaceCameraController.enableRotate = true
            viewer.scene.screenSpaceCameraController.enableTranslate = true
            viewer.scene.screenSpaceCameraController.enableZoom = true
            viewer.scene.screenSpaceCameraController.enableTilt = true
            viewer.scene.screenSpaceCameraController.enableLook = true
        }, ScreenSpaceEventType.LEFT_UP)

        return () => {
            handler.destroy()

            // 确保相机控制恢复
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
