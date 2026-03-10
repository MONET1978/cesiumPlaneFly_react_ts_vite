import { useState } from 'react'
import CesiumViewer from './components/CesiumViewer'
import WaypointPanel from './components/WaypointPanel'
import type { FlightRouteVisualizer } from './utils/flightRouteVisualizer'
import './App.css'

/**
 * 主应用组件
 * 左侧航路管理面板 + 右侧 Cesium 3D 地球视图
 */
function App() {
  const [visualizer, setVisualizer] = useState<FlightRouteVisualizer | null>(null)

  return (
    <div className="app-container">
      <div className="left-panels">
        <WaypointPanel visualizer={visualizer} />
      </div>
      <div className="cesium-wrapper">
        <CesiumViewer onVisualizerReady={setVisualizer} />
      </div>
    </div>
  )
}

export default App
