import { create } from 'zustand'
import type { Waypoint, WaypointInput, FlightRoute } from '../types/waypoint'
import { validateFlightRoute } from '../types/waypoint'
import { generateId } from '../utils/idGenerator'
import sampleFlightRoute from '../data/sampleFlightRoute'

/**
 * 单条航线数据结构
 */
export interface RouteData {
    id: string
    name: string
    waypoints: Waypoint[]
    color: string
    lineWidth: number
}

/**
 * 航路状态接口
 */
interface FlightRouteState {
    routes: RouteData[]
    currentRouteId: string | null
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
    addRoute: (name?: string) => string
    deleteRoute: (id: string) => void
    selectRoute: (id: string) => void
    getCurrentRoute: () => RouteData | undefined
}

type FlightRouteStore = FlightRouteState & FlightRouteActions

/**
 * 将 WaypointInput 转换为带 id 的 Waypoint
 */
function toWaypoint(input: WaypointInput): Waypoint {
    return { ...input, id: generateId() }
}

/**
 * 初始化样例航线
 */
function createSampleRoute(): RouteData {
    const id = generateId()
    return {
        id,
        name: sampleFlightRoute.name,
        waypoints: sampleFlightRoute.waypoints.map(toWaypoint),
        color: sampleFlightRoute.color ?? '#FFD700',
        lineWidth: sampleFlightRoute.lineWidth ?? 3
    }
}

const initialRoute = createSampleRoute()

/**
 * Zustand 航路数据 Store
 * 作为整个系统的单一事实源（Single Source of Truth）
 */
export const useFlightRouteStore = create<FlightRouteStore>((set, get) => ({
    routes: [initialRoute],
    currentRouteId: initialRoute.id,
    selectedWaypointId: null,
    defaultHeight: 100,
    isDragging: false,
    isSelectingMode: false,

    getCurrentRoute: () => {
        const state = get()
        return state.routes.find(r => r.id === state.currentRouteId)
    },

    addRoute: (name = '新航线') => {
        const id = generateId()
        set((state) => ({
            routes: [...state.routes, {
                id,
                name,
                waypoints: [],
                color: '#FFD700',
                lineWidth: 3
            }],
            currentRouteId: id,
            selectedWaypointId: null
        }))
        return id
    },

    deleteRoute: (id) => set((state) => {
        const routes = state.routes.filter(r => r.id !== id)
        let newCurrentId = state.currentRouteId
        
        if (state.currentRouteId === id) {
            newCurrentId = routes.length > 0 ? routes[0].id : null
        }
        
        return {
            routes,
            currentRouteId: newCurrentId,
            selectedWaypointId: null
        }
    }),

    selectRoute: (id) => set({
        currentRouteId: id,
        selectedWaypointId: null
    }),

    addWaypoint: (wp, index) => set((state) => {
        const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
        if (!currentRoute) return state

        const newWaypoint = toWaypoint(wp)
        const waypoints = [...currentRoute.waypoints]
        if (index !== undefined && index >= 0 && index <= waypoints.length) {
            waypoints.splice(index, 0, newWaypoint)
        } else {
            waypoints.push(newWaypoint)
        }

        return {
            routes: state.routes.map(r =>
                r.id === state.currentRouteId ? { ...r, waypoints } : r
            )
        }
    }),

    updateWaypoint: (id, partial) => set((state) => ({
        routes: state.routes.map(r => {
            if (r.id !== state.currentRouteId) return r
            return {
                ...r,
                waypoints: r.waypoints.map((wp) =>
                    wp.id === id ? { ...wp, ...partial } : wp
                )
            }
        })
    })),

    deleteWaypoint: (id) => set((state) => ({
        routes: state.routes.map(r => {
            if (r.id !== state.currentRouteId) return r
            return {
                ...r,
                waypoints: r.waypoints.filter((wp) => wp.id !== id)
            }
        }),
        selectedWaypointId: state.selectedWaypointId === id ? null : state.selectedWaypointId
    })),

    selectWaypoint: (id) => set({ selectedWaypointId: id }),

    setDragging: (dragging) => set({ isDragging: dragging }),

    setSelectingMode: (selecting) => set({ isSelectingMode: selecting }),

    loadRoute: (route) => set((state) => {
        const id = generateId()
        return {
            routes: [...state.routes, {
                id,
                name: route.name,
                waypoints: route.waypoints.map(toWaypoint),
                color: route.color ?? '#FFD700',
                lineWidth: route.lineWidth ?? 3
            }],
            currentRouteId: id,
            selectedWaypointId: null
        }
    }),

    clearRoute: () => set((state) => ({
        routes: state.routes.map(r => {
            if (r.id !== state.currentRouteId) return r
            return { ...r, waypoints: [] }
        }),
        selectedWaypointId: null
    })),

    setRouteConfig: (config) => set((state) => ({
        routes: state.routes.map(r => {
            if (r.id !== state.currentRouteId) return r
            return {
                ...r,
                name: config.name ?? r.name,
                color: config.color ?? r.color,
                lineWidth: config.lineWidth ?? r.lineWidth
            }
        })
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
        const currentRoute = state.routes.find(r => r.id === state.currentRouteId)
        if (!currentRoute) return '{}'
        
        const route: FlightRoute = {
            name: currentRoute.name,
            waypoints: currentRoute.waypoints.map((w) => {
                const {  ...rest } = w
                return rest
            }),
            color: currentRoute.color,
            lineWidth: currentRoute.lineWidth,
        }
        return JSON.stringify(route, null, 2)
    },
}))
