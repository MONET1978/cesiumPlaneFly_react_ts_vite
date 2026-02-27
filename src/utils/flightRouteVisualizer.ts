import {
    Cartesian3,
    Color,
    Entity,
    Viewer
} from 'cesium'
import type { Waypoint, FlightRoute } from '../types/waypoint'

/**
 * 航路可视化工具类
 * 提供航路点标记和航线绑制功能
 */
export class FlightRouteVisualizer {
    private viewer: Viewer

    /**
     * 构造函数对Viewer对象初始化
     * @param viewer - Cesium Viewer 实例
     */
    constructor(viewer: Viewer) {
        this.viewer = viewer
    }

    /**
     * 添加单个航路点标记
     * @param waypoint - 航路点数据
     * @param color - 点的颜色（默认红色）
     * @param pixelSize - 点的像素大小（默认 10）
     * @returns 创建的实体对象
     */
    addWaypoint(
        waypoint: Waypoint,
        color: Color = Color.RED,
        pixelSize: number = 10
    ): Entity {
        const entity = this.viewer.entities.add({
            name: waypoint.name || `Waypoint`,
            description: waypoint.description || 
                `航路点位置: (${waypoint.longitude.toFixed(5)}, ${waypoint.latitude.toFixed(5)})`,
            position: Cartesian3.fromDegrees(
                waypoint.longitude,
                waypoint.latitude,
                waypoint.height
            ),
            point: {
                pixelSize: pixelSize,
                color: color,
                outlineColor: Color.WHITE,
                outlineWidth: 2,
                heightReference: 2
            }
        })
        return entity
    }

    /**
     * 批量添加航路点
     * @param waypoints - 航路点数组
     * @param color - 点的颜色
     * @returns 创建的实体数组
     */
    addWaypoints(waypoints: Waypoint[], color: Color = Color.RED): Entity[] {
        return waypoints.map((wp) => this.addWaypoint(wp, color))
    }

    /**
     * 绑制航路线
     * @param waypoints - 航路点数组
     * @param color - 线条颜色
     * @param width - 线条宽度
     * @returns 创建的航线实体
     */
    drawFlightLine(
        waypoints: Waypoint[],
        color: Color = Color.YELLOW,
        width: number = 3
    ): Entity {
        const positions = waypoints.map((wp) =>
            Cartesian3.fromDegrees(wp.longitude, wp.latitude, wp.height)
        )

        const entity = this.viewer.entities.add({
            name: 'Flight Route',
            polyline: {
                positions: positions,
                width: width,
                material: color,
                clampToGround: false
            }
        })
        return entity
    }

    /**
     * 添加完整航路（包含点和线）
     * @param route - 航路配置
     * @returns 创建的实体对象
     */
    addFlightRoute(route: FlightRoute): {
        waypointEntities: Entity[]
        lineEntity: Entity
    } {
        const routeColor = route.color ? 
            Color.fromCssColorString(route.color) : 
            Color.YELLOW

        const waypointEntities = this.addWaypoints(route.waypoints, routeColor)

        const lineEntity = this.drawFlightLine(
            route.waypoints,
            routeColor,
            route.lineWidth || 3
        )

        return { waypointEntities, lineEntity }
    }

    /**
     * 飞行到指定航路点
     * @param waypoint - 目标航路点
     * @param duration - 飞行时间（秒）
     */
    flyToWaypoint(waypoint: Waypoint, duration: number = 2): void {
        this.viewer.camera.flyTo({
            destination: Cartesian3.fromDegrees(
                waypoint.longitude,
                waypoint.latitude,
                waypoint.height + 500
            ),
            orientation: {
                heading: 0,
                pitch: -Math.PI / 4,
                roll: 0
            },
            duration: duration
        })
    }

    /**
     * 清除所有航路实体
     */
    clearAllRoutes(): void {
        this.viewer.entities.removeAll()
    }
}
