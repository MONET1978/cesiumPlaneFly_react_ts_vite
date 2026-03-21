import { useState, useEffect, useCallback, useRef } from 'react'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import type { FlightAnimationState } from '../utils/flightAnimator'
import type { Waypoint } from '../types/waypoint'

/**
 * 飞行动画控制接口
 */
interface FlightAnimationControl {
    /** 当前动画状态 */
    state: FlightAnimationState
    /** 飞行进度（0-1） */
    progress: number
    /** 播放速度倍率 */
    playbackSpeed: number
    /** 启动飞行 */
    startFlight: () => Promise<void>
    /** 暂停飞行 */
    pauseFlight: () => void
    /** 恢复飞行 */
    resumeFlight: () => void
    /** 停止飞行 */
    stopFlight: () => void
    /** 设置播放速度 */
    setPlaybackSpeed: (speed: number) => void
    /** 是否正在飞行 */
    isFlying: boolean
}

/**
 * 飞行动画 Hook
 * 管理飞行动画的状态和控制
 * @param visualizer - 航路可视化实例
 * @param waypoints - 航路点数组
 * @returns 飞行动画控制接口
 */
export function useFlightAnimation(
    visualizer: FlightRouteVisualizer | null,
    waypoints: Waypoint[]
): FlightAnimationControl {
    const [state, setState] = useState<FlightAnimationState>('idle')
    const [progress, setProgress] = useState(0)
    const [playbackSpeed, setPlaybackSpeed] = useState(5)
    const progressIntervalRef = useRef<number | null>(null)

    /**
     * 清除进度更新定时器
     */
    const clearProgressInterval = useCallback(() => {
        if (progressIntervalRef.current !== null) {
            clearInterval(progressIntervalRef.current)
            progressIntervalRef.current = null
        }
    }, [])

    /**
     * 启动进度更新定时器
     */
    const startProgressInterval = useCallback(() => {
        clearProgressInterval()
        progressIntervalRef.current = window.setInterval(() => {
            if (visualizer) {
                const currentProgress = visualizer.getFlightAnimationProgress()
                setProgress(currentProgress)

                // 检查是否完成
                if (currentProgress >= 1) {
                    setState('idle')
                    clearProgressInterval()
                }
            }
        }, 100)
    }, [visualizer, clearProgressInterval])

    /**
     * 启动飞行
     */
    const startFlight = useCallback(async () => {
        if (!visualizer) {
            console.warn('Visualizer 未初始化')
            return
        }

        if (waypoints.length < 2) {
            console.warn('至少需要2个航路点才能启动飞行')
            return
        }

        try {
            await visualizer.startFlightAnimation(waypoints, { playbackSpeed })
            setState('playing')
            setProgress(0)
            startProgressInterval()
            console.log('飞行动画已启动')
        } catch (error) {
            console.error('启动飞行动画失败:', error)
        }
    }, [visualizer, waypoints, playbackSpeed, startProgressInterval])

    /**
     * 暂停飞行
     */
    const pauseFlight = useCallback(() => {
        if (!visualizer) return
        visualizer.pauseFlightAnimation()
        setState('paused')
        console.log('飞行动画已暂停')
    }, [visualizer])

    /**
     * 恢复飞行
     */
    const resumeFlight = useCallback(() => {
        if (!visualizer) return
        visualizer.resumeFlightAnimation()
        setState('playing')
        console.log('飞行动画已恢复')
    }, [visualizer])

    /**
     * 停止飞行
     */
    const stopFlight = useCallback(() => {
        if (!visualizer) return
        visualizer.stopFlightAnimation()
        setState('idle')
        setProgress(0)
        clearProgressInterval()
        console.log('飞行动画已停止')
    }, [visualizer, clearProgressInterval])

    /**
     * 设置播放速度
     */
    const handleSetPlaybackSpeed = useCallback((speed: number) => {
        if (speed > 0) {
            setPlaybackSpeed(speed)
            if (visualizer && state !== 'idle') {
                visualizer.setFlightAnimationSpeed(speed)
            }
        }
    }, [visualizer, state])

    /**
     * 组件卸载时清理
     */
    useEffect(() => {
        return () => {
            clearProgressInterval()
        }
    }, [clearProgressInterval])

    /**
     * 同步状态
     */
    useEffect(() => {
        if (!visualizer) return

        const syncState = () => {
            const currentState = visualizer.getFlightAnimationState()
            if (currentState !== state) {
                setState(currentState)
            }
        }

        // 定期同步状态
        const interval = window.setInterval(syncState, 500)
        return () => clearInterval(interval)
    }, [visualizer, state])

    return {
        state,
        progress,
        playbackSpeed,
        startFlight,
        pauseFlight,
        resumeFlight,
        stopFlight,
        setPlaybackSpeed: handleSetPlaybackSpeed,
        isFlying: state !== 'idle'
    }
}
