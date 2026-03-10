import { useState } from 'react'
import type { Waypoint } from '../types/waypoint'
import { useFlightRouteStore } from '../store/useFlightRouteStore'

interface WaypointListItemProps {
    waypoint: Waypoint
    index: number
    isSelected: boolean
    onSelect: () => void
    onDelete: () => void
    onFlyTo: () => void
}

/**
 * 单个航路点列表项组件
 */
const WaypointListItem: React.FC<WaypointListItemProps> = ({
    waypoint,
    index,
    isSelected,
    onSelect,
    onDelete,
    onFlyTo,
}) => {
    const updateWaypoint = useFlightRouteStore((s) => s.updateWaypoint)

    const [localValues, setLocalValues] = useState({
        name: waypoint.name ?? '',
        longitude: String(waypoint.longitude),
        latitude: String(waypoint.latitude),
        height: String(waypoint.height),
    })

    const handleBlur = (field: 'name' | 'longitude' | 'latitude' | 'height') => {
        if (field === 'name') {
            if (localValues.name !== (waypoint.name ?? '')) {
                updateWaypoint(waypoint.id, { name: localValues.name || undefined })
            }
            return
        }

        const numValue = parseFloat(localValues[field])
        if (isNaN(numValue)) {
            // 恢复原值
            setLocalValues((prev) => ({
                ...prev,
                [field]: String(waypoint[field]),
            }))
            return
        }

        if (numValue !== waypoint[field]) {
            updateWaypoint(waypoint.id, { [field]: numValue })
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent, field: 'name' | 'longitude' | 'latitude' | 'height') => {
        if (e.key === 'Enter') {
            handleBlur(field)
            ;(e.target as HTMLInputElement).blur()
        }
    }

    return (
        <div
            className={`waypoint-item ${isSelected ? 'selected' : ''}`}
            onClick={onSelect}
        >
            <div className="waypoint-item-header">
                <span className="waypoint-item-title">
                    {index + 1}. {waypoint.name || `航路点${index + 1}`}
                </span>
                <div className="waypoint-item-actions">
                    <button onClick={(e) => { e.stopPropagation(); onFlyTo() }}>
                        定位
                    </button>
                    <button
                        className="delete-btn"
                        onClick={(e) => { e.stopPropagation(); onDelete() }}
                    >
                        删除
                    </button>
                </div>
            </div>
            <div className="waypoint-fields">
                <div className="waypoint-field full-width">
                    <label>名称</label>
                    <input
                        type="text"
                        value={localValues.name}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, name: e.target.value }))}
                        onBlur={() => handleBlur('name')}
                        onKeyDown={(e) => handleKeyDown(e, 'name')}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="waypoint-field">
                    <label>经度</label>
                    <input
                        type="text"
                        value={localValues.longitude}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, longitude: e.target.value }))}
                        onBlur={() => handleBlur('longitude')}
                        onKeyDown={(e) => handleKeyDown(e, 'longitude')}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="waypoint-field">
                    <label>纬度</label>
                    <input
                        type="text"
                        value={localValues.latitude}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, latitude: e.target.value }))}
                        onBlur={() => handleBlur('latitude')}
                        onKeyDown={(e) => handleKeyDown(e, 'latitude')}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
                <div className="waypoint-field">
                    <label>高度</label>
                    <input
                        type="text"
                        value={localValues.height}
                        onChange={(e) => setLocalValues((prev) => ({ ...prev, height: e.target.value }))}
                        onBlur={() => handleBlur('height')}
                        onKeyDown={(e) => handleKeyDown(e, 'height')}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            </div>
        </div>
    )
}

export default WaypointListItem
