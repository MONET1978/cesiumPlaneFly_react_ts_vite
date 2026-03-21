import {
    Cartesian3,
    Color,
    ConstantPositionProperty,
    ConstantProperty,
    Entity,
    Viewer
} from 'cesium'
import type { Waypoint, WaypointInput } from '../types/waypoint'
import { FlightAnimator, type FlightAnimationConfig, type FlightAnimationState } from './flightAnimator'

/**
 * 渲染模式常量
 */
export const RenderMode = {
    /** 自动渲染（默认） */
    AUTO: 'auto',
    /** 手动触发渲染 */
    MANUAL: 'manual'
} as const

type RenderModeType = typeof RenderMode[keyof typeof RenderMode]

/**
 * 航路可视化工具类
 * 提供航路点标记和航线绑制功能，支持通过 id 管理单个实体
 */
export class FlightRouteVisualizer {
    private viewer: Viewer
    private entityMap: Map<string, Entity> = new Map()
    private polylineEntity: Entity | null = null
    private renderMode: RenderModeType = RenderMode.AUTO
    private flightAnimator: FlightAnimator | null = null

    /**
     * 构造函数对Viewer对象初始化
     * @param viewer - Cesium Viewer 实例
     */
    constructor(viewer: Viewer) {
        this.viewer = viewer
    }

    /**
     * 设置渲染模式
     * @param mode - 渲染模式
     */
    setRenderMode(mode: RenderModeType): void {
        this.renderMode = mode
    }

    /**
     * 手动触发渲染
     * 根据技术报告，在修改数据源后手动触发渲染可以避免渲染器宽度错误
     */
    private requestRender(): void {
        try {
            if (this.renderMode === RenderMode.MANUAL) {
                this.viewer.scene.requestRender()
            }
        } catch (error) {
            console.warn('手动触发渲染失败:', error)
        }
    }

    /**
     * 安全执行数据源操作
     * 添加try-catch错误处理机制，防止应用崩溃
     */
    private safeOperation<T>(operation: () => T, operationName: string): T | null {
        try {
            const result = operation()
            // 操作完成后手动触发渲染
            this.requestRender()
            return result
        } catch (error) {
            console.error(`数据源操作失败 (${operationName}):`, error)
            return null
        }
    }

    /**
     * 添加单个航路点标记（带 id 追踪）
     * @param id - 航路点唯一标识
     * @param waypoint - 航路点数据
     * @param color - 点的颜色（默认红色）
     * @param pixelSize - 点的像素大小（默认 10）
     * @returns 创建的实体对象
     */
    addWaypointById(
        id: string,
        waypoint: WaypointInput,
        color: Color = Color.RED,
        pixelSize: number = 10
    ): Entity | null {
        return this.safeOperation(() => {
            const entity = this.viewer.entities.add({
                name: waypoint.name || 'Waypoint',
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
            this.entityMap.set(id, entity)
            return entity
        }, 'addWaypointById') as Entity | null
    }

    /**
     * 通过 id 移除航路点
     */
    removeWaypointById(id: string): void {
        this.safeOperation(() => {
            const entity = this.entityMap.get(id)
            if (entity) {
                this.viewer.entities.remove(entity)
                this.entityMap.delete(id)
            }
        }, 'removeWaypointById')
    }

    /**
     * 更新航路点位置
     */
    updateWaypointPosition(id: string, waypoint: WaypointInput): void {
        const entity = this.entityMap.get(id)
        if (entity) {
            const newPosition = Cartesian3.fromDegrees(
                waypoint.longitude,
                waypoint.latitude,
                waypoint.height
            )
            entity.position = new ConstantPositionProperty(newPosition)
        }
    }

    /**
     * 更新航线 polyline
     * @param waypoints - 有序航路点数组
     * @param color - 线条颜色
     * @param width - 线条宽度
     */
    updatePolyline(
        waypoints: WaypointInput[],
        color: Color = Color.YELLOW,
        width: number = 3
    ): void {
        this.safeOperation(() => {
            if (this.polylineEntity) {
                this.viewer.entities.remove(this.polylineEntity)
                this.polylineEntity = null
            }
            if (waypoints.length < 2) return

            const positions = waypoints.map((wp) =>
                Cartesian3.fromDegrees(wp.longitude, wp.latitude, wp.height)
            )
            this.polylineEntity = this.viewer.entities.add({
                name: 'Flight Route',
                polyline: {
                    positions: positions,
                    width: width,
                    material: color,
                    clampToGround: false
                }
            })
        }, 'updatePolyline')
    }

    /**
     * 高亮选中航路点
     */
    highlightWaypoint(id: string): void {
        const entity = this.entityMap.get(id)
        if (entity?.point) {
            entity.point.pixelSize = new ConstantProperty(16)
            entity.point.outlineColor = new ConstantProperty(Color.CYAN)
            entity.point.outlineWidth = new ConstantProperty(3)
        }
    }

    /**
     * 取消高亮航路点
     */
    unhighlightWaypoint(id: string): void {
        const entity = this.entityMap.get(id)
        if (entity?.point) {
            entity.point.pixelSize = new ConstantProperty(10)
            entity.point.outlineColor = new ConstantProperty(Color.WHITE)
            entity.point.outlineWidth = new ConstantProperty(2)
        }
    }

    /**
     * 通过 Cesium Entity 反向查找航路点 id
     */
    findWaypointIdByEntity(entity: Entity): string | undefined {
        for (const [id, e] of this.entityMap) {
            if (e === entity) return id
        }
        return undefined
    }

    /**
     * 通过 id 获取 Cesium Entity
     */
    getEntityById(id: string): Entity | undefined {
        return this.entityMap.get(id)
    }

    /**
     * 全量同步：清除所有旧实体，用新的 waypoints 完整重建
     */
    syncAll(
        waypoints: Waypoint[],
        color?: string,
        lineWidth?: number
    ): void {
        this.clearAllRoutes()

        const cesiumColor = color
            ? Color.fromCssColorString(color)
            : Color.YELLOW
        const width = lineWidth ?? 3

        for (const wp of waypoints) {
            this.addWaypointById(wp.id, wp, cesiumColor)
        }
        this.updatePolyline(waypoints, cesiumColor, width)
    }

    /**
     * 飞行到指定航路点
     * @param waypoint - 目标航路点
     * @param duration - 飞行时间（秒）
     */
    flyToWaypoint(waypoint: WaypointInput, duration: number = 2): void {
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
        this.safeOperation(() => {
            this.viewer.entities.removeAll()
            this.entityMap.clear()
            this.polylineEntity = null
        }, 'clearAllRoutes')
    }

    /**
     * 启动飞行动画
     * @param waypoints - 航路点数组
     * @param config - 动画配置（可选）
     */
    async startFlightAnimation(
        waypoints: Waypoint[],
        config?: Partial<FlightAnimationConfig>
    ): Promise<void> {
        if (!this.flightAnimator) {
            this.flightAnimator = new FlightAnimator(this.viewer, config)
        }
        await this.flightAnimator.startFlight(waypoints)
    }

    /**
     * 暂停飞行动画
     */
    pauseFlightAnimation(): void {
        this.flightAnimator?.pause()
    }

    /**
     * 恢复飞行动画
     */
    resumeFlightAnimation(): void {
        this.flightAnimator?.resume()
    }

    /**
     * 停止飞行动画
     */
    stopFlightAnimation(): void {
        this.flightAnimator?.stopFlight()
    }

    /**
     * 获取飞行动画状态
     */
    getFlightAnimationState(): FlightAnimationState {
        return this.flightAnimator?.getState() ?? 'idle'
    }

    /**
     * 设置飞行动画速度
     * @param speed - 速度倍率
     */
    setFlightAnimationSpeed(speed: number): void {
        this.flightAnimator?.setPlaybackSpeed(speed)
    }

    /**
     * 获取飞行动画进度（0-1）
     */
    getFlightAnimationProgress(): number {
        return this.flightAnimator?.getProgress() ?? 0
    }

    /**
     * 检查是否正在飞行
     */
    isFlightAnimating(): boolean {
        return this.flightAnimator?.isFlying() ?? false
    }

    /**
     * 启用性能监控
     * 根据技术报告，使用性能监控工具可以更好地了解渲染性能
     */
    enablePerformanceMonitoring(): void {
        try {
            // 启用帧率显示
            this.viewer.scene.debugShowFramesPerSecond = true
            
            // 监听渲染性能
            this.viewer.scene.preRender.addEventListener(() => {
                // 在渲染前可以添加性能监控逻辑
                // 使用Cesium提供的性能监控API
                console.debug('Performance monitoring enabled')
            })
        } catch (error) {
            console.warn('启用性能监控失败:', error)
        }
    }

    /**
     * 禁用性能监控
     */
    disablePerformanceMonitoring(): void {
        try {
            this.viewer.scene.debugShowFramesPerSecond = false
        } catch (error) {
            console.warn('禁用性能监控失败:', error)
        }
    }
}
