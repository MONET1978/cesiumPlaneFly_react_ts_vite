import {
    Cartesian3,
    Entity,
    IonResource,
    JulianDate,
    PathGraphics,
    SampledPositionProperty,
    TimeInterval,
    TimeIntervalCollection,
    VelocityOrientationProperty,
    type Viewer
} from 'cesium'
import type { Waypoint } from '../types/waypoint'

/**
 * 飞行动画状态
 */
export type FlightAnimationState = 'idle' | 'playing' | 'paused'

/**
 * 飞行动画配置
 */
export interface FlightAnimationConfig {
    /** 每个航路点之间的时间间隔（秒） */
    timeStepPerWaypoint: number
    /** 动画播放速度倍率 */
    playbackSpeed: number
    /** 飞机模型资产ID */
    modelAssetId: number
    /** 路径线宽 */
    pathWidth: number
}

/**
 * 默认飞行动画配置
 * 注意：playbackSpeed 已调整为原速度的1/10，使飞机移动更加平滑缓慢
 */
const DEFAULT_CONFIG: FlightAnimationConfig = {
    timeStepPerWaypoint: 30,
    playbackSpeed: 5,
    modelAssetId: 4332518,
    pathWidth: 3
}

/**
 * 飞行动画控制器
 * 实现基于时间的飞机沿航线移动动画
 */
export class FlightAnimator {
    private viewer: Viewer
    private config: FlightAnimationConfig
    private airplaneEntity: Entity | null = null
    private positionProperty: SampledPositionProperty | null = null
    private startTime: JulianDate | null = null
    private stopTime: JulianDate | null = null
    private state: FlightAnimationState = 'idle'
    private originalClockSettings: {
        startTime: JulianDate
        stopTime: JulianDate
        currentTime: JulianDate
        multiplier: number
        shouldAnimate: boolean
    } | null = null

    /**
     * 构造函数
     * @param viewer - Cesium Viewer 实例
     * @param config - 飞行动画配置
     */
    constructor(viewer: Viewer, config: Partial<FlightAnimationConfig> = {}) {
        this.viewer = viewer
        this.config = { ...DEFAULT_CONFIG, ...config }
    }

    /**
     * 获取当前动画状态
     */
    getState(): FlightAnimationState {
        return this.state
    }

    /**
     * 启动飞行动画
     * @param waypoints - 航路点数组
     */
    async startFlight(waypoints: Waypoint[]): Promise<void> {
        if (waypoints.length < 2) {
            console.warn('至少需要2个航路点才能启动飞行')
            return
        }

        // 保存原始时钟设置
        this.saveClockSettings()

        // 清除之前的飞行实体
        this.clearFlightEntity()

        // 初始化时间轴
        this.initializeTimeline(waypoints)

        // 创建位置属性
        this.createPositionProperty(waypoints)

        // 创建飞机实体
        await this.createAirplaneEntity()

        // 设置相机跟踪
        this.viewer.trackedEntity = this.airplaneEntity

        // 开始播放动画
        this.play()

        this.state = 'playing'
        console.log('飞行动画已启动')
    }

    /**
     * 保存原始时钟设置
     */
    private saveClockSettings(): void {
        this.originalClockSettings = {
            startTime: this.viewer.clock.startTime.clone(),
            stopTime: this.viewer.clock.stopTime.clone(),
            currentTime: this.viewer.clock.currentTime.clone(),
            multiplier: this.viewer.clock.multiplier,
            shouldAnimate: this.viewer.clock.shouldAnimate
        }
    }

    /**
     * 恢复原始时钟设置
     */
    private restoreClockSettings(): void {
        if (this.originalClockSettings) {
            this.viewer.clock.startTime = this.originalClockSettings.startTime.clone()
            this.viewer.clock.stopTime = this.originalClockSettings.stopTime.clone()
            this.viewer.clock.currentTime = this.originalClockSettings.currentTime.clone()
            this.viewer.clock.multiplier = this.originalClockSettings.multiplier
            this.viewer.clock.shouldAnimate = this.originalClockSettings.shouldAnimate
        }
    }

    /**
     * 初始化时间轴
     * @param waypoints - 航路点数组
     */
    private initializeTimeline(waypoints: Waypoint[]): void {
        const totalSeconds = this.config.timeStepPerWaypoint * (waypoints.length - 1)
        
        // 使用当前时间作为起始时间
        this.startTime = JulianDate.now()
        this.stopTime = JulianDate.addSeconds(
            this.startTime,
            totalSeconds,
            new JulianDate()
        )

        // 设置时钟
        this.viewer.clock.startTime = this.startTime.clone()
        this.viewer.clock.stopTime = this.stopTime.clone()
        this.viewer.clock.currentTime = this.startTime.clone()
        this.viewer.clock.multiplier = this.config.playbackSpeed
        this.viewer.clock.shouldAnimate = true

        // 设置时间轴范围
        this.viewer.timeline.zoomTo(this.startTime, this.stopTime)
    }

    /**
     * 创建位置属性
     * @param waypoints - 航路点数组
     */
    private createPositionProperty(waypoints: Waypoint[]): void {
        this.positionProperty = new SampledPositionProperty()

        for (let i = 0; i < waypoints.length; i++) {
            const waypoint = waypoints[i]
            const time = JulianDate.addSeconds(
                this.startTime!,
                i * this.config.timeStepPerWaypoint,
                new JulianDate()
            )
            const position = Cartesian3.fromDegrees(
                waypoint.longitude,
                waypoint.latitude,
                waypoint.height
            )
            this.positionProperty.addSample(time, position)
        }
    }

    /**
     * 创建飞机实体
     */
    private async createAirplaneEntity(): Promise<void> {
        try {
            // 加载飞机模型
            const airplaneUri = await IonResource.fromAssetId(this.config.modelAssetId)

            // 创建飞机实体
            this.airplaneEntity = this.viewer.entities.add({
                name: 'Flight Airplane',
                availability: new TimeIntervalCollection([
                    new TimeInterval({
                        start: this.startTime!,
                        stop: this.stopTime!
                    })
                ]),
                position: this.positionProperty,
                orientation: new VelocityOrientationProperty(this.positionProperty),
                model: {
                    uri: airplaneUri,
                    minimumPixelSize: 64,
                    maximumScale: 20000
                },
                path: new PathGraphics({
                    width: this.config.pathWidth,
                    leadTime: 0,
                    trailTime: this.config.timeStepPerWaypoint * 10
                })
            })
        } catch (error) {
            console.error('加载飞机模型失败:', error)
            throw error
        }
    }

    /**
     * 播放动画
     */
    play(): void {
        if (this.state === 'idle') {
            console.warn('请先启动飞行')
            return
        }
        this.viewer.clock.shouldAnimate = true
        this.state = 'playing'
        console.log('动画播放中')
    }

    /**
     * 暂停动画
     */
    pause(): void {
        if (this.state !== 'playing') {
            return
        }
        this.viewer.clock.shouldAnimate = false
        this.state = 'paused'
        console.log('动画已暂停')
    }

    /**
     * 恢复动画
     */
    resume(): void {
        if (this.state !== 'paused') {
            return
        }
        this.viewer.clock.shouldAnimate = true
        this.state = 'playing'
        console.log('动画已恢复')
    }

    /**
     * 停止飞行动画
     * 清除飞机实体，恢复用户相机控制
     */
    stopFlight(): void {
        // 停止动画
        this.viewer.clock.shouldAnimate = false

        // 取消相机跟踪
        this.viewer.trackedEntity = undefined

        // 清除飞机实体
        this.clearFlightEntity()

        // 恢复原始时钟设置
        this.restoreClockSettings()

        this.state = 'idle'
        console.log('飞行动画已停止')
    }

    /**
     * 清除飞机实体
     */
    private clearFlightEntity(): void {
        if (this.airplaneEntity) {
            this.viewer.entities.remove(this.airplaneEntity)
            this.airplaneEntity = null
        }
        this.positionProperty = null
        this.startTime = null
        this.stopTime = null
    }

    /**
     * 设置播放速度
     * @param speed - 速度倍率
     */
    setPlaybackSpeed(speed: number): void {
        if (speed > 0) {
            this.config.playbackSpeed = speed
            this.viewer.clock.multiplier = speed
        }
    }

    /**
     * 获取当前播放速度
     */
    getPlaybackSpeed(): number {
        return this.config.playbackSpeed
    }

    /**
     * 获取飞行进度（0-1）
     */
    getProgress(): number {
        if (!this.startTime || !this.stopTime) {
            return 0
        }
        const currentTime = this.viewer.clock.currentTime
        const totalDuration = JulianDate.secondsDifference(this.stopTime, this.startTime)
        const elapsed = JulianDate.secondsDifference(currentTime, this.startTime)
        return Math.max(0, Math.min(1, elapsed / totalDuration))
    }

    /**
     * 检查是否正在飞行
     */
    isFlying(): boolean {
        return this.state !== 'idle'
    }

    /**
     * 销毁动画器
     */
    destroy(): void {
        this.stopFlight()
        this.originalClockSettings = null
    }
}
