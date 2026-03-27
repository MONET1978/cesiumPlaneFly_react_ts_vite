import { useState, useRef, useEffect, useCallback } from 'react'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import { useFlightAnimation } from '../hooks/useFlightAnimation'
import './FlightStatusPanel.css'

interface FlightStatusPanelProps {
    visualizer: FlightRouteVisualizer | null
    isVisible: boolean
    onClose: () => void
}

/**
 * 飞行状态悬浮面板组件
 * 可拖动的悬浮窗，显示飞行控制界面
 */
const FlightStatusPanel: React.FC<FlightStatusPanelProps> = ({
    visualizer,
    isVisible,
    onClose
}) => {
    const routes = useFlightRouteStore((s) => s.routes)
    const currentRouteId = useFlightRouteStore((s) => s.currentRouteId)
    const selectRoute = useFlightRouteStore((s) => s.selectRoute)
    
    const [position, setPosition] = useState({ x: 100, y: 50 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    const panelRef = useRef<HTMLDivElement>(null)
    
    const currentRoute = routes.find(r => r.id === currentRouteId)
    const waypoints = currentRoute?.waypoints ?? []
    
    const flightAnimation = useFlightAnimation(visualizer, waypoints)

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.panel-controls')) return
        setIsDragging(true)
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        })
    }, [position])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y
        })
    }, [isDragging, dragOffset])

    const handleMouseUp = useCallback(() => {
        setIsDragging(false)
    }, [])

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            return () => {
                document.removeEventListener('mousemove', handleMouseMove)
                document.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    const handleStartFlight = async () => {
        await flightAnimation.startFlight()
    }

    const handleTogglePause = () => {
        if (flightAnimation.state === 'playing') {
            flightAnimation.pauseFlight()
        } else if (flightAnimation.state === 'paused') {
            flightAnimation.resumeFlight()
        }
    }

    const handleStopFlight = () => {
        flightAnimation.stopFlight()
        onClose()
    }

    if (!isVisible) return null

    return (
        <div 
            ref={panelRef}
            className={`flight-status-panel ${isDragging ? 'dragging' : ''}`}
            style={{
                left: position.x,
                top: position.y
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="panel-header">
                <span className="panel-title">飞行控制</span>
                <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="panel-content">
                <div className="route-select-section">
                    <label>当前航线</label>
                    <select 
                        value={currentRouteId || ''}
                        onChange={(e) => selectRoute(e.target.value)}
                    >
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>
                                {route.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flight-controls">
                    {flightAnimation.state === 'idle' ? (
                        <button 
                            className="control-btn start"
                            onClick={handleStartFlight}
                            disabled={waypoints.length < 2}
                        >
                            🛫 开始
                        </button>
                    ) : (
                        <>
                            <button 
                                className={`control-btn ${flightAnimation.state === 'paused' ? 'resume' : 'pause'}`}
                                onClick={handleTogglePause}
                            >
                                {flightAnimation.state === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
                            </button>
                            <button 
                                className="control-btn stop"
                                onClick={handleStopFlight}
                            >
                                ⏹️ 停止
                            </button>
                        </>
                    )}
                </div>

                {flightAnimation.isFlying && (
                    <div className="progress-section">
                        <div className="progress-header">
                            <span>飞行进度</span>
                            <span className="progress-value">
                                {Math.round(flightAnimation.progress * 100)}%
                            </span>
                        </div>
                        <div className="progress-bar-container">
                            <div 
                                className="progress-bar"
                                style={{ width: `${flightAnimation.progress * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="speed-section">
                    <div className="speed-header">
                        <span>飞行速度</span>
                        <span className="speed-value">{flightAnimation.playbackSpeed}x</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={flightAnimation.playbackSpeed}
                        onChange={(e) => flightAnimation.setPlaybackSpeed(parseInt(e.target.value))}
                    />
                </div>

                {waypoints.length < 2 && flightAnimation.state === 'idle' && (
                    <div className="hint-message">
                        至少需要2个航路点才能飞行
                    </div>
                )}
            </div>
        </div>
    )
}

export default FlightStatusPanel
