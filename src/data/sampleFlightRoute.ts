import type { FlightRoute } from '../types/waypoint'

/**
 * 示例航路数据
 * 旧金山机场起飞的示例航路
 */
const sampleFlightRoute: FlightRoute = {
    name: '旧金山机场起飞航路',
    waypoints: [
        { longitude: -122.38985, latitude: 37.61864, height: 50, name: '起飞点', description: '旧金山国际机场' },
        { longitude: -122.39500, latitude: 37.62500, height: 200, name: '航路点1', description: '爬升阶段' },
        { longitude: -122.40500, latitude: 37.63500, height: 500, name: '航路点2', description: '继续爬升' },
        { longitude: -122.41000, latitude: 37.64500, height: 800, name: '航路点3', description: '巡航高度' },
        { longitude: -122.41750, latitude: 37.65500, height: 1000, name: '航路点4', description: '巡航阶段' },
    ],
    color: '#FFD700',
    lineWidth: 3
}

export default sampleFlightRoute
