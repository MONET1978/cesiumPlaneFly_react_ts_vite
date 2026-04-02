import { useState, useEffect } from 'react'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import { useFlightAnimation } from '../hooks/useFlightAnimation'
import './BottomControlPanel.css'

interface BottomControlPanelProps {
    visualizer: FlightRouteVisualizer | null
    onOpenRouteSettings: (routeId: string) => void
    onAddRoute: () => void
    onFlightToggle?: (isFlying: boolean) => void
}

/**
 * 底部横向控制面板组件
 * 提供飞行按钮、航线选择列表
 */
const BottomControlPanel: React.FC<BottomControlPanelProps> = ({
    visualizer,
    onOpenRouteSettings,
    onAddRoute,
    onFlightToggle
}) => {
    const routes = useFlightRouteStore((s) => s.routes)
    const currentRouteId = useFlightRouteStore((s) => s.currentRouteId)
    const selectRoute = useFlightRouteStore((s) => s.selectRoute)
    const deleteRoute = useFlightRouteStore((s) => s.deleteRoute)
    
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isFlying, setIsFlying] = useState(false)
    const [deleteConfirmRouteId, setDeleteConfirmRouteId] = useState<string | null>(null)
    
    const currentRoute = routes.find(r => r.id === currentRouteId)
    const waypoints = currentRoute?.waypoints ?? []
    
    const flightAnimation = useFlightAnimation(visualizer, waypoints)

    useEffect(() => {
        setIsFlying(flightAnimation.state !== 'idle')
        onFlightToggle?.(flightAnimation.state !== 'idle')
    }, [flightAnimation.state, onFlightToggle])

    const handleFlightToggle = async () => {
        if (isFlying) {
            flightAnimation.stopFlight()
            setIsFlying(false)
            onFlightToggle?.(false)
        } else {
            if (waypoints.length >= 2) {
                await flightAnimation.startFlight()
                setIsFlying(true)
                onFlightToggle?.(true)
            }
        }
    }

    const handleRouteSelect = (routeId: string) => {
        selectRoute(routeId)
        setIsDropdownOpen(false)
    }

    const handleSettingsClick = (routeId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onOpenRouteSettings(routeId)
    }

    const handleDeleteClick = (routeId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setDeleteConfirmRouteId(routeId)
    }

    const handleConfirmDelete = () => {
        if (deleteConfirmRouteId) {
            deleteRoute(deleteConfirmRouteId)
            setDeleteConfirmRouteId(null)
        }
    }

    const handleCancelDelete = () => {
        setDeleteConfirmRouteId(null)
    }

    return (
        <div className="bottom-control-panel">
            <div className="panel-left">
                <button 
                    className={`flight-button ${isFlying ? 'flying' : ''}`}
                    onClick={handleFlightToggle}
                    disabled={!isFlying && waypoints.length < 2}
                    title={waypoints.length < 2 ? '至少需要2个航路点才能飞行' : ''}
                >
                    {isFlying ? '⏹ 停止飞行' : '✈ 飞行'}
                </button>
                
                <div className="route-selector">
                    <button 
                        className="route-selector-trigger"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="route-name">
                            {currentRoute?.name || '选择航线'}
                        </span>
                        <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    {isDropdownOpen && (
                        <div className="route-dropdown">
                            {routes.map((route, index) => (
                                <div 
                                    key={route.id}
                                    className={`route-item ${route.id === currentRouteId ? 'active' : ''}`}
                                    onClick={() => handleRouteSelect(route.id)}
                                >
                                    <span className="route-index">{index + 1}.</span>
                                    <span className="route-item-name">{route.name}</span>
                                    <div className="route-item-actions">
                                        <button 
                                            className="settings-btn"
                                            onClick={(e) => handleSettingsClick(route.id, e)}
                                            title="航线设置"
                                        >
                                            ⚙
                                        </button>
                                        <button 
                                            className="delete-btn"
                                            onClick={(e) => handleDeleteClick(route.id, e)}
                                            title="删除航线"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div 
                                className="route-item add-route"
                                onClick={() => {
                                    onAddRoute()
                                    setIsDropdownOpen(false)
                                }}
                            >
                                <span className="route-index">+</span>
                                <span className="route-item-name">添加航线</span>
                            </div>
                        </div>
                    )}
                    
                    {deleteConfirmRouteId && (
                        <div className="delete-confirm-overlay" onClick={handleCancelDelete}>
                            <div className="delete-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                                <div className="delete-confirm-title">确认删除</div>
                                <div className="delete-confirm-message">
                                    确定要删除这条航线吗？此操作无法撤销。
                                </div>
                                <div className="delete-confirm-buttons">
                                    <button className="cancel-btn" onClick={handleCancelDelete}>
                                        取消
                                    </button>
                                    <button className="confirm-btn" onClick={handleConfirmDelete}>
                                        删除
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BottomControlPanel
