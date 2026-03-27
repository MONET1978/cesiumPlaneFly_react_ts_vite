import { useEffect, useState, useRef } from 'react'
import {
    Cartesian3,
    Ion,
    Math as CesiumMath,
    Terrain,
    Viewer
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'

import { useFlightRouteStore } from '../store/useFlightRouteStore'
import { useCesiumSync } from '../hooks/useCesiumSync'
import { useCesiumInteraction } from '../hooks/useCesiumInteraction'


/**
 * Cesium Viewer 组件属性接口
 */
interface CesiumViewerProps {
    containerId?: string
    onVisualizerReady?: (visualizer: FlightRouteVisualizer) => void
}

/**
 * Cesium Viewer 组件
 * 初始化 Cesium 3D 地球视图，通过 hooks 驱动渲染和交互
 */
const CesiumViewer: React.FC<CesiumViewerProps> = ({
    containerId = 'cesiumContainer',
    onVisualizerReady
}) => {
    const [viewer, setViewer] = useState<Viewer | null>(null)
    const [visualizer, setVisualizer] = useState<FlightRouteVisualizer | null>(null)
    const initRef = useRef(false)

    // 使用 useCallback 包装回调，避免每次渲染创建新函数
    const handleVisualizerReady = useRef((vis: FlightRouteVisualizer) => {
        onVisualizerReady?.(vis)
    })

    // 渲染层：同步 store → Cesium
    useCesiumSync(viewer, visualizer)

    // 交互层：处理地图上的用户交互
    useCesiumInteraction(viewer, visualizer)

    useEffect(() => {
        // 防止 StrictMode 下重复初始化
        if (initRef.current) return
        initRef.current = true

        const initCesium = async (): Promise<void> => {
            const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN
            if (!cesiumToken) {
                console.error('请在 .env 文件中配置 VITE_CESIUM_ION_TOKEN')
                return
            }
            Ion.defaultAccessToken = cesiumToken

            const v = new Viewer(containerId, {
                terrain: Terrain.fromWorldTerrain(),
                // 禁用 requestRenderMode 以避免渲染器宽度错误
                requestRenderMode: false,
                // 启用性能监控
                sceneMode: 3,
                // 设置最大渲染时间避免无限渲染
                maximumRenderTimeChange: Infinity
            })

            const vis = new FlightRouteVisualizer(v)

            setViewer(v)
            setVisualizer(vis)
            handleVisualizerReady.current(vis)

            const state = useFlightRouteStore.getState()
            const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
            const waypoints = currentRoute?.waypoints ?? []
            
            if (waypoints.length > 0) {
                const first = waypoints[0]
                v.camera.flyTo({
                    destination: Cartesian3.fromDegrees(
                        first.longitude,
                        first.latitude,
                        first.height + 1000
                    ),
                    orientation: {
                        heading: CesiumMath.toRadians(0.0),
                        pitch: CesiumMath.toRadians(-45.0),
                    },
                    duration: 3
                })
            } else {
                v.camera.flyTo({
                    destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
                    orientation: {
                        heading: CesiumMath.toRadians(0.0),
                        pitch: CesiumMath.toRadians(-15.0),
                    }
                })
            }
        }

        initCesium()

        return () => {
            // cleanup will be handled by React when component truly unmounts
        }
    }, [containerId])

    // 组件卸载时销毁 Viewer
    useEffect(() => {
        return () => {
            if (viewer) {
                viewer.destroy()
            }
        }
    }, [viewer])

    return (
        <div
            id={containerId}
            style={{ width: '100%', height: '100vh' }}
        />
    )
}

export default CesiumViewer
