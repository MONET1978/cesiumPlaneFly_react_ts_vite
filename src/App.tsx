import { useState } from 'react'
import CesiumViewer from './components/CesiumViewer'
import BottomControlPanel from './components/BottomControlPanel'
import FlightStatusPanel from './components/FlightStatusPanel'
import RouteSettingsPanel from './components/RouteSettingsPanel'
import type { FlightRouteVisualizer } from './utils/flightRouteVisualizer'
import { useFlightRouteStore } from './store/useFlightRouteStore'
import './App.css'

/**
 * 主应用组件
 * 集成Cesium 3D地球视图、底部控制面板、飞行状态面板、航线设置面板
 */
function App() {
    const [visualizer, setVisualizer] = useState<FlightRouteVisualizer | null>(null)
    const [showFlightPanel, setShowFlightPanel] = useState(false)
    const [showRouteSettings, setShowRouteSettings] = useState(false)
    const [settingsRouteId, setSettingsRouteId] = useState<string | null>(null)
    const [isNewRoute, setIsNewRoute] = useState(false)

    const addRoute = useFlightRouteStore((s) => s.addRoute)

    const handleOpenRouteSettings = (routeId: string) => {
        setSettingsRouteId(routeId)
        setIsNewRoute(false)
        setShowRouteSettings(true)
    }

    const handleAddRoute = () => {
        const newId = addRoute('新航线')
        setSettingsRouteId(newId)
        setIsNewRoute(true)
        setShowRouteSettings(true)
    }

    const handleCloseRouteSettings = () => {
        setShowRouteSettings(false)
        setSettingsRouteId(null)
        setIsNewRoute(false)
    }

    const handleFlightToggle = (isFlying: boolean) => {
        setShowFlightPanel(isFlying)
    }

    return (
        <div className="app-container">
            <div className="cesium-wrapper">
                <CesiumViewer onVisualizerReady={setVisualizer} />
            </div>

            <BottomControlPanel
                visualizer={visualizer}
                onOpenRouteSettings={handleOpenRouteSettings}
                onAddRoute={handleAddRoute}
                onFlightToggle={handleFlightToggle}
            />

            <FlightStatusPanel
                visualizer={visualizer}
                isVisible={showFlightPanel}
                onClose={() => setShowFlightPanel(false)}
            />

            {showRouteSettings && (
                <RouteSettingsPanel
                    visualizer={visualizer}
                    routeId={settingsRouteId}
                    isNewRoute={isNewRoute}
                    onClose={handleCloseRouteSettings}
                />
            )}
        </div>
    )
}

export default App
