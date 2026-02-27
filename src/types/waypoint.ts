/**
 * 航路点数据接口
 * 定义单个航路点的地理坐标和元数据
 */
export interface Waypoint {
  /** 经度（-180 到 180） */
  longitude: number
  /** 纬度（-90 到 90） */
  latitude: number
  /** 高度（米） */
  height: number
  /** 航路点名称 */
  name?: string
  /** 航路点描述 */
  description?: string
}

/**
 * 航路配置接口
 * 定义整条航路的属性
 */
export interface FlightRoute {
  /** 航路名称 */
  name: string
  /** 航路点列表 */
  waypoints: Waypoint[]
  /** 航路颜色（CSS 颜色字符串） */
  color?: string
  /** 航路线宽 */
  lineWidth?: number
}

/**
 * 验证航路点数据的有效性
 * @param waypoint - 待验证的航路点
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateWaypoint(waypoint: Waypoint): { 
  valid: boolean
  errors: string[] 
} {
  const errors: string[] = []

  if (typeof waypoint.longitude !== 'number' || isNaN(waypoint.longitude)) {
    errors.push('经度必须是有效数字')
  } else if (waypoint.longitude < -180 || waypoint.longitude > 180) {
    errors.push('经度必须在 -180 到 180 之间')
  }

  if (typeof waypoint.latitude !== 'number' || isNaN(waypoint.latitude)) {
    errors.push('纬度必须是有效数字')
  } else if (waypoint.latitude < -90 || waypoint.latitude > 90) {
    errors.push('纬度必须在 -90 到 90 之间')
  }

  if (typeof waypoint.height !== 'number' || isNaN(waypoint.height)) {
    errors.push('高度必须是有效数字')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 验证航路数据的有效性
 * @param route - 待验证的航路
 * @returns 验证结果，包含是否有效和错误信息
 */
export function validateFlightRoute(route: FlightRoute): { 
  valid: boolean
  errors: string[] 
} {
  const errors: string[] = []

  if (!route.name || route.name.trim() === '') {
    errors.push('航路名称不能为空')
  }

  if (!Array.isArray(route.waypoints)) {
    errors.push('航路点列表必须是数组')
  } else if (route.waypoints.length === 0) {
    errors.push('航路点列表不能为空')
  } else {
    route.waypoints.forEach((waypoint, index) => {
      const result = validateWaypoint(waypoint)
      if (!result.valid) {
        errors.push(`航路点 ${index + 1}: ${result.errors.join(', ')}`)
      }
    })
  }

  if (route.color) {
    const colorRegex = /^#([0-9A-Fa-f]{3}){1,2}$|^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$|^rgba\(\d{1,3},\s*\d{1,3},\s*\d{1,3},\s*(0|1|0?\.\d+)\)$/
    if (!colorRegex.test(route.color)) {
      errors.push('航路颜色格式无效')
    }
  }

  if (route.lineWidth !== undefined) {
    if (typeof route.lineWidth !== 'number' || route.lineWidth <= 0) {
      errors.push('航路线宽必须是大于 0 的数字')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
