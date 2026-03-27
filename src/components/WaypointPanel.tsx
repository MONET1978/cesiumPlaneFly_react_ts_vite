import { useState, useRef } from 'react'
import { useFlightRouteStore } from '../store/useFlightRouteStore'
import { FlightRouteVisualizer } from '../utils/flightRouteVisualizer'
import { useFlightAnimation } from '../hooks/useFlightAnimation'
import sampleFlightRoute from '../data/sampleFlightRoute'
import WaypointListItem from './WaypointListItem'
import '../styles/WaypointPanel.css'

interface WaypointPanelProps {
    visualizer: FlightRouteVisualizer | null
}

/**
 * 航路管理侧边栏面板
 */
const WaypointPanel: React.FC<WaypointPanelProps> = ({ visualizer }) => {
    const [collapsed, setCollapsed] = useState(false)

    const routes = useFlightRouteStore((s) => s.routes)
    const currentRouteId = useFlightRouteStore((s) => s.currentRouteId)
    const selectedWaypointId = useFlightRouteStore((s) => s.selectedWaypointId)
    const defaultHeight = useFlightRouteStore((s) => s.defaultHeight)
    const isSelectingMode = useFlightRouteStore((s) => s.isSelectingMode)
    
    const currentRoute = routes.find(r => r.id === currentRouteId)
    const waypoints = currentRoute?.waypoints ?? []
    const routeName = currentRoute?.name ?? ''
    const routeColor = currentRoute?.color ?? '#FFD700'
    const routeLineWidth = currentRoute?.lineWidth ?? 3

    const selectWaypoint = useFlightRouteStore((s) => s.selectWaypoint)
    const deleteWaypoint = useFlightRouteStore((s) => s.deleteWaypoint)
    const loadRoute = useFlightRouteStore((s) => s.loadRoute)
    const clearRoute = useFlightRouteStore((s) => s.clearRoute)
    const setRouteConfig = useFlightRouteStore((s) => s.setRouteConfig)
    const setSelectingMode = useFlightRouteStore((s) => s.setSelectingMode)
    const importFromJSON = useFlightRouteStore((s) => s.importFromJSON)
    const exportToJSON = useFlightRouteStore((s) => s.exportToJSON)

    const fileInputRef = useRef<HTMLInputElement>(null)

    // 使用飞行动画 Hook
    const flightAnimation = useFlightAnimation(visualizer, waypoints)

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
        // 重置 file input 以便再次选择同一文件
        e.target.value = ''
    }

    const handleFlyTo = (waypointId: string) => {
        const wp = waypoints.find((w) => w.id === waypointId)
        if (wp && visualizer) {
            visualizer.flyToWaypoint(wp)
        }
    }

    /**
     * 处理开始飞行按钮点击
     */
    const handleStartFlight = async () => {
        await flightAnimation.startFlight()
    }

    /**
     * 处理暂停/恢复飞行按钮点击
     */
    const handleTogglePause = () => {
        if (flightAnimation.state === 'playing') {
            flightAnimation.pauseFlight()
        } else if (flightAnimation.state === 'paused') {
            flightAnimation.resumeFlight()
        }
    }

    /**
     * 处理停止飞行按钮点击
     */
    const handleStopFlight = () => {
        flightAnimation.stopFlight()
    }

    /**
     * 处理播放速度变更
     */
    const handleSpeedChange = (speed: number) => {
        flightAnimation.setPlaybackSpeed(speed)
    }

    const handleDefaultHeightChange = (value: string) => {
        const num = parseFloat(value)
        if (!isNaN(num) && num >= 0) {
            useFlightRouteStore.setState({ defaultHeight: num })
        }
    }

    return (
        <div className={`waypoint-panel ${collapsed ? 'collapsed' : ''}`}>
            <button className="panel-toggle" onClick={() => setCollapsed(!collapsed)}>
                {collapsed ? '>' : '< 航路管理面板'}
            </button>

            <div className="panel-content">
                {/* 选点模式按钮 */}
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

                {/* 模拟飞行按钮 */}
                <div className="simulate-flight-section">
                    {/* 飞行状态指示器 */}
                    <div className="flight-status-indicator">
                        <span className={`flight-status ${flightAnimation.state}`}>
                            {flightAnimation.state === 'idle' && '待命'}
                            {flightAnimation.state === 'playing' && '飞行中'}
                            {flightAnimation.state === 'paused' && '已暂停'}
                        </span>
                    </div>

                    {/* 飞行控制按钮 */}
                    <div className="flight-control-buttons">
                        {flightAnimation.state === 'idle' ? (
                            <button
                                className="flight-btn start"
                                onClick={handleStartFlight}
                                disabled={waypoints.length < 2}
                            >
                                🛫 开始飞行
                            </button>
                        ) : (
                            <>
                                <button
                                    className={`flight-btn ${flightAnimation.state === 'paused' ? 'resume' : 'pause'}`}
                                    onClick={handleTogglePause}
                                >
                                    {flightAnimation.state === 'paused' ? '▶️ 继续' : '⏸️ 暂停'}
                                </button>
                                <button
                                    className="flight-btn stop"
                                    onClick={handleStopFlight}
                                >
                                    ⏹️ 停止
                                </button>
                            </>
                        )}
                    </div>

                    {/* 进度条（飞行中显示） */}
                    {flightAnimation.isFlying && (
                        <div className="flight-progress-display">
                            <div className="progress-info">
                                <span className="progress-label">飞行进度</span>
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar" 
                                        style={{ width: `${flightAnimation.progress * 100}%` }}
                                    />
                                    <span className="progress-text">
                                        {Math.round(flightAnimation.progress * 100)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 速度控制 */}
                    <div className="flight-speed-control">
                        <label>播放速度</label>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            step="1"
                            value={flightAnimation.playbackSpeed}
                            onChange={(e) => handleSpeedChange(parseInt(e.target.value))}
                        />
                        <span>{flightAnimation.playbackSpeed}x</span>
                    </div>

                    {/* 提示信息 */}
                    {waypoints.length < 2 && flightAnimation.state === 'idle' && (
                        <div className="simulate-flight-hint">
                            至少需要2个航路点才能飞行
                        </div>
                    )}
                </div>

                {/* 航路配置区 */}
                <div className="route-config">
                    <div className="config-row">
                        <label>名称</label>
                        <input
                            type="text"
                            value={routeName}
                            onChange={(e) => setRouteConfig({ name: e.target.value })}
                        />
                    </div>
                    <div className="config-row">
                        <label>颜色</label>
                        <input
                            type="color"
                            value={routeColor}
                            onChange={(e) => setRouteConfig({ color: e.target.value })}
                        />
                        <label>线宽</label>
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
                            style={{ width: 50 }}
                        />
                    </div>
                </div>

                {/* 航路点列表 */}
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

                {/* 底部操作区 */}
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
                            导入 JSON
                        </button>
                        <button onClick={handleExport}>
                            导出 JSON
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
            </div>
        </div>
    )
}

export default WaypointPanel
