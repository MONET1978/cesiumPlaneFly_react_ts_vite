import { create } from 'zustand'
import type { Waypoint, WaypointInput, FlightRoute } from '../types/waypoint'
import { validateFlightRoute } from '../types/waypoint'
import { generateId } from '../utils/idGenerator'
import sampleFlightRoute from '../data/sampleFlightRoute'

/**
 * 航路状态接口
 */
interface FlightRouteState {
    routeName: string
    waypoints: Waypoint[]
    routeColor: string
    routeLineWidth: number
    selectedWaypointId: string | null
    defaultHeight: number
    isDragging: boolean
    isSelectingMode: boolean
}

/**
 * 航路操作接口
 */
interface FlightRouteActions {
    addWaypoint: (wp: WaypointInput, index?: number) => void
    updateWaypoint: (id: string, partial: Partial<WaypointInput>) => void
    deleteWaypoint: (id: string) => void
    selectWaypoint: (id: string | null) => void
    setDragging: (dragging: boolean) => void
    setSelectingMode: (selecting: boolean) => void
    loadRoute: (route: FlightRoute) => void
    clearRoute: () => void
    setRouteConfig: (config: { name?: string; color?: string; lineWidth?: number }) => void
    importFromJSON: (json: string) => { success: boolean; errors: string[] }
    exportToJSON: () => string
}

type FlightRouteStore = FlightRouteState & FlightRouteActions

/**
 * 将 WaypointInput 转换为带 id 的 Waypoint
 */
function toWaypoint(input: WaypointInput): Waypoint {
    return { ...input, id: generateId() }
}

/**
 * 初始化样例数据
 */
function loadSampleWaypoints(): Waypoint[] {
    return sampleFlightRoute.waypoints.map(toWaypoint)
}

/**
 * Zustand 航路数据 Store
 * 作为整个系统的单一事实源（Single Source of Truth）
 */
export const useFlightRouteStore = create<FlightRouteStore>((set, get) => ({
    routeName: sampleFlightRoute.name,
    waypoints: loadSampleWaypoints(),
    routeColor: sampleFlightRoute.color ?? '#FFD700',
    routeLineWidth: sampleFlightRoute.lineWidth ?? 3,
    selectedWaypointId: null,
    defaultHeight: 100,
    isDragging: false,
    isSelectingMode: false,

    addWaypoint: (wp, index) => set((state) => {
        const newWaypoint = toWaypoint(wp)
        const waypoints = [...state.waypoints]
        if (index !== undefined && index >= 0 && index <= waypoints.length) {
            waypoints.splice(index, 0, newWaypoint)
        } else {
            waypoints.push(newWaypoint)
        }
        return { waypoints }
    }),

    updateWaypoint: (id, partial) => set((state) => ({
        waypoints: state.waypoints.map((wp) =>
            wp.id === id ? { ...wp, ...partial } : wp
        )
    })),

    deleteWaypoint: (id) => set((state) => ({
        waypoints: state.waypoints.filter((wp) => wp.id !== id),
        selectedWaypointId: state.selectedWaypointId === id ? null : state.selectedWaypointId
    })),

    selectWaypoint: (id) => set({ selectedWaypointId: id }),

    setDragging: (dragging) => set({ isDragging: dragging }),

    setSelectingMode: (selecting) => set({ isSelectingMode: selecting }),

    loadRoute: (route) => set({
        routeName: route.name,
        waypoints: route.waypoints.map(toWaypoint),
        routeColor: route.color ?? '#FFD700',
        routeLineWidth: route.lineWidth ?? 3,
        selectedWaypointId: null,
    }),

    clearRoute: () => set({
        waypoints: [],
        selectedWaypointId: null,
    }),

    setRouteConfig: (config) => set((state) => ({
        routeName: config.name ?? state.routeName,
        routeColor: config.color ?? state.routeColor,
        routeLineWidth: config.lineWidth ?? state.routeLineWidth,
    })),

    importFromJSON: (json) => {
        try {
            const parsed = JSON.parse(json) as FlightRoute
            const result = validateFlightRoute(parsed)
            if (!result.valid) {
                return { success: false, errors: result.errors }
            }
            get().loadRoute(parsed)
            return { success: true, errors: [] }
        } catch {
            return { success: false, errors: ['JSON 解析失败'] }
        }
    },

    exportToJSON: () => {
        const state = get()
        const route: FlightRoute = {
            name: state.routeName,
            waypoints: state.waypoints.map((w) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id: _id, ...rest } = w
                return rest
            }),
            color: state.routeColor,
            lineWidth: state.routeLineWidth,
        }
        return JSON.stringify(route, null, 2)
    },
}))
