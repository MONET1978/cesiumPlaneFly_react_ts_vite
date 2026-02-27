import { useEffect, useRef } from 'react'
import {
    Cartesian3,
    Ion,
    Math as CesiumMath,
    Terrain,
    Viewer
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import type { FlightRoute } from '../types/waypoint'

/**
 * Cesium Viewer 组件属性接口
 */
interface CesiumViewerProps {
    containerId?: string
    flightRoute?: FlightRoute
    showRoute?: boolean
}

/**
 * Cesium Viewer 组件
 * 用于初始化和显示 Cesium 3D 地球视图
 * 
 * @param props - 组件属性
 * @param props.containerId - Cesium 容器 DOM 元素的 ID，默认为 'cesiumContainer'
 * @param props.flightRoute - 航路数据，可选
 * @param props.showRoute - 是否显示航路，默认为 true
 */
const CesiumViewer: React.FC<CesiumViewerProps> = ({ 
    containerId = 'cesiumContainer',
    flightRoute,
    showRoute = true 
}) => {
    const viewerRef = useRef<Viewer | null>(null)
    const visualizerRef = useRef<FlightRouteVisualizer | null>(null)

    useEffect(() => {
        /**
         * 初始化 Cesium Viewer
         */
        const initCesium = async (): Promise<void> => {
            // 设置 Cesium Ion 访问令牌（从环境变量读取）
            const cesiumToken = import.meta.env.VITE_CESIUM_ION_TOKEN
            if (!cesiumToken) {
                console.error('请在 .env 文件中配置 VITE_CESIUM_ION_TOKEN')
                return
            }
            Ion.defaultAccessToken = cesiumToken
            
            // 初始化 Cesium Viewer
            viewerRef.current = new Viewer(containerId, {
                terrain: Terrain.fromWorldTerrain(),
            })

            // 初始化航路可视化工具
            visualizerRef.current = new FlightRouteVisualizer(viewerRef.current)

            // 如果提供了航路数据且需要显示
            if (flightRoute && showRoute) {
                visualizerRef.current.addFlightRoute(flightRoute)
                
                // 飞行到第一个航路点
                if (flightRoute.waypoints.length > 0) {
                    const firstWaypoint = flightRoute.waypoints[0]
                    viewerRef.current.camera.flyTo({
                        destination: Cartesian3.fromDegrees(
                            firstWaypoint.longitude,
                            firstWaypoint.latitude,
                            firstWaypoint.height + 1000
                        ),
                        orientation: {
                            heading: CesiumMath.toRadians(0.0),
                            pitch: CesiumMath.toRadians(-45.0),
                        },
                        duration: 3
                    })
                }
            } else {
                // 默认飞行到旧金山
                viewerRef.current.camera.flyTo({
                    destination: Cartesian3.fromDegrees(-122.4175, 37.655, 400),
                    orientation: {
                        heading: CesiumMath.toRadians(0.0),
                        pitch: CesiumMath.toRadians(-15.0),
                    }
                })
            }
        }

        initCesium()

        // 清理函数：组件卸载时销毁 Viewer
        return () => {
            if (viewerRef.current) {
                viewerRef.current.destroy()
                viewerRef.current = null
            }
        }
    }, [containerId, flightRoute, showRoute])

    return (
        <div
            id={containerId}
            style={{ width: '100%', height: '100vh' }}
        />
    )
}

export default CesiumViewer
