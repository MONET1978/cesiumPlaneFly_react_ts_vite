import CesiumViewer from './components/CesiumViewer'
import sampleFlightRoute from './components/RouteVisualizerApp'
import './App.css' 
/**
 * 主应用组件
 * 渲染 Cesium 3D 地球视图
 */
function App() {
  return <CesiumViewer flightRoute={sampleFlightRoute} showRoute={true} />
}

export default App
