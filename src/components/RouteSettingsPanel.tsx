import { useState, useRef, useEffect } from 'react'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import type { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import sampleFlightRoute from '../data/sampleFlightRoute'
import WaypointListItem from './WaypointListItem'
import './RouteSettingsPanel.css'

interface RouteSettingsPanelProps {
    visualizer: FlightRouteVisualizer | null
    routeId: string | null
    isNewRoute?: boolean
    onClose: () => void
}

/**
 * 航线设置侧边面板组件
 * 可展开/收起的侧边栏，用于编辑航线属性和航路点
 */
const RouteSettingsPanel: React.FC<RouteSettingsPanelProps> = ({
    visualizer,
    routeId,
    isNewRoute = false,
    onClose
}) => {
    const routes = useFlightRouteStore((s) => s.routes)
    const currentRouteId = useFlightRouteStore((s) => s.currentRouteId)
    const selectedWaypointId = useFlightRouteStore((s) => s.selectedWaypointId)
    const defaultHeight = useFlightRouteStore((s) => s.defaultHeight)
    const isSelectingMode = useFlightRouteStore((s) => s.isSelectingMode)
    
    const selectWaypoint = useFlightRouteStore((s) => s.selectWaypoint)
    const deleteWaypoint = useFlightRouteStore((s) => s.deleteWaypoint)
    const loadRoute = useFlightRouteStore((s) => s.loadRoute)
    const clearRoute = useFlightRouteStore((s) => s.clearRoute)
    const setRouteConfig = useFlightRouteStore((s) => s.setRouteConfig)
    const setSelectingMode = useFlightRouteStore((s) => s.setSelectingMode)
    const importFromJSON = useFlightRouteStore((s) => s.importFromJSON)
    const exportToJSON = useFlightRouteStore((s) => s.exportToJSON)
    const selectRoute = useFlightRouteStore((s) => s.selectRoute)
    
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isCollapsed, setIsCollapsed] = useState(false)
    
    useEffect(() => {
        if (routeId && routeId !== currentRouteId) {
            selectRoute(routeId)
        }
    }, [routeId, currentRouteId, selectRoute])
    
    const currentRoute = routes.find(r => r.id === currentRouteId)
    const waypoints = currentRoute?.waypoints ?? []
    const routeName = currentRoute?.name ?? '新航线'
    const routeColor = currentRoute?.color ?? '#FFD700'
    const routeLineWidth = currentRoute?.lineWidth ?? 3

    const handleExport = () => {
        const json = exportToJSON()
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${routeName || 'flight-route'}.json`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleImport = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const content = event.target?.result as string
            const result = importFromJSON(content)
            if (!result.success) {
                alert(`导入失败:\n${result.errors.join('\n')}`)
            }
        }
        reader.readAsText(file)
        e.target.value = ''
    }

    const handleFlyTo = (waypointId: string) => {
        const wp = waypoints.find((w) => w.id === waypointId)
        if (wp && visualizer) {
            visualizer.flyToWaypoint(wp)
        }
    }

    const handleDefaultHeightChange = (value: string) => {
        const num = parseFloat(value)
        if (!isNaN(num) && num >= 0) {
            useFlightRouteStore.setState({ defaultHeight: num })
        }
    }

    return (
        <div className={`route-settings-panel ${isCollapsed ? 'collapsed' : ''}`}>
            <button 
                className="panel-toggle-btn"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {isCollapsed ? '◀' : '▶ 收起'}
            </button>

            {!isCollapsed && (
                <div className="settings-content">
                    <div className="settings-header">
                        <h3>{isNewRoute ? '添加航线' : '航线设置'}</h3>
                        <button className="close-settings-btn" onClick={onClose}>✕</button>
                    </div>

                    <div className="settings-scroll">
                        <div className="selecting-mode-section">
                            <button
                                className={`selecting-mode-btn ${isSelectingMode ? 'active' : ''}`}
                                onClick={() => setSelectingMode(!isSelectingMode)}
                            >
                                {isSelectingMode ? '🛑 停止选点' : '📍 开始选点'}
                            </button>
                            {isSelectingMode && (
                                <div className="selecting-hint">
                                    点击地图添加航路点
                                </div>
                            )}
                        </div>

                        <div className="route-config">
                            <div className="config-row">
                                <label>航线名称</label>
                                <input
                                    type="text"
                                    value={routeName}
                                    onChange={(e) => setRouteConfig({ name: e.target.value })}
                                />
                            </div>
                            <div className="config-row">
                                <label>航线颜色</label>
                                <input
                                    type="color"
                                    value={routeColor}
                                    onChange={(e) => setRouteConfig({ color: e.target.value })}
                                />
                            </div>
                            <div className="config-row">
                                <label>线条宽度</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    step="1"
                                    value={routeLineWidth}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value)
                                        if (!isNaN(v) && v > 0) setRouteConfig({ lineWidth: v })
                                    }}
                                />
                            </div>
                        </div>

                        <div className="waypoint-list-header">
                            航路点列表 ({waypoints.length} 个)
                        </div>
                        <div className="waypoint-list">
                            {waypoints.length === 0 ? (
                                <div className="empty-list">
                                    暂无航路点，点击"开始选点"后在地图上添加
                                </div>
                            ) : (
                                waypoints.map((wp, index) => (
                                    <WaypointListItem
                                        key={wp.id}
                                        waypoint={wp}
                                        index={index}
                                        isSelected={selectedWaypointId === wp.id}
                                        onSelect={() => selectWaypoint(wp.id)}
                                        onDelete={() => deleteWaypoint(wp.id)}
                                        onFlyTo={() => handleFlyTo(wp.id)}
                                    />
                                ))
                            )}
                        </div>

                        <div className="panel-footer">
                            <div className="default-height-row">
                                <label>默认高度</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    value={defaultHeight}
                                    onChange={(e) => handleDefaultHeightChange(e.target.value)}
                                />
                                <span>m</span>
                            </div>
                            <div className="footer-row">
                                <button className="danger" onClick={clearRoute}>
                                    清空航路
                                </button>
                                <button className="primary" onClick={() => loadRoute(sampleFlightRoute)}>
                                    加载样例
                                </button>
                            </div>
                            <div className="footer-row">
                                <button onClick={handleImport}>
                                    导入
                                </button>
                                <button onClick={handleExport}>
                                    导出JSON
                                </button>
                            </div>
                        </div>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
            )}
        </div>
    )
}

export default RouteSettingsPanel
