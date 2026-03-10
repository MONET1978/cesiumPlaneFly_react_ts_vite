---
name: flight-animation
description: 飞机航路飞行动画技能,用于实现 Cesium 3D 场景中飞机沿预设航路平滑飞行、飞行控制面板、相机跟随等功能。当用户需要实现飞行动画、轨迹可视化、相机跟随等 3D 飞行相关功能时使用此技能。
---

# Flight Animation Skill

## 概述

此技能为 Cesium + React + TypeScript 项目提供完整的飞机航路飞行动画解决方案。实现飞机模型加载、沿航路点平滑飞行、飞行控制面板、相机跟随等核心功能。

## 使用场景

在以下情况下使用此技能:

- 实现 3D 场景中飞机沿航路点飞行
- 需要飞行控制面板(速度调节、开始/停止、进度显示)
- 实现相机跟随飞机功能
- 需要平滑的飞行轨迹动画

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │WaypointPanel│  │FlightControlPanel│  │ CesiumViewer │   │
│  │ (航路管理)   │  │  (飞行控制)       │  │  (3D视图)    │   │
│  └─────────────┘  └──────────────────┘  └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                useFlightRouteStore (Zustand)                │
│  ┌──────────────┐  ┌──────────────────────┐                │
│  │ 航路状态(现有) │  │ 飞行状态(新增)        │                │
│  └──────────────┘  └──────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   FlightAnimator (新增)                     │
│  模型加载 │ 轨迹插值计算 │ 动画控制 │ 相机跟随               │
└─────────────────────────────────────────────────────────────┘
```

## 实施步骤

### 前置检查

执行以下检查:

1. 确认 `src/types/waypoint.ts` 已包含 `FlightStatus` 和 `FlightAnimationState` 类型
2. 确认 `src/store/useFlightRouteStore.ts` 已包含飞行动画状态和方法
3. 检查飞机模型文件是否存在于 `public/models/` 或 `module/` 目录

### 步骤 1: 实现 FlightAnimator 核心类

创建 `src/utils/flightAnimator.ts`:

**核心职责:**

- 加载飞机模型 (GLB 格式)
- 计算飞行轨迹插值
- 控制动画播放/暂停/停止
- 实现相机跟随逻辑

**关键算法:**

1. **飞行路径插值**

使用 Cesium 的 `SampledPositionProperty` + `VelocityOrientationProperty`:

```typescript
// 计算航段距离
const distance = Cesium.Cartesian3.distance(p1, p2)
// 计算飞行时间(秒)
const segmentTime = distance / (speed / 3.6)
// 创建位置采样
positionProperty.addSample(time, position)
// 自动朝向
orientation = new Cesium.VelocityOrientationProperty(positionProperty)
```

2. **相机跟随**

```typescript
// 启用跟随
viewer.camera.lookAt(position, new Cesium.HeadingPitchRange(heading, pitch, distance))
// 禁用跟随
viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
```

**相机配置:**

- 距离: 500 米
- 俯仰角: -30 度(向下看)
- 航向角: 0(跟随飞机方向)

### 步骤 2: 实现 useFlightAnimation Hook

创建 `src/hooks/useFlightAnimation.ts`:

**核心职责:**

- 连接 Store 和 FlightAnimator
- 管理动画生命周期
- 响应 Store 状态变化

**生命周期:**

```typescript
useEffect(() => {
  const animator = new FlightAnimator(viewer, store)
  return () => animator.destroy()
}, [viewer])
```

### 步骤 3: 创建飞行控制面板 UI

创建 `src/components/FlightControlPanel.tsx` 和 `src/styles/FlightControlPanel.css`:

**UI 布局:**

```
┌─────────────────────────────────────┐
│ < 飞行控制面板              [折叠]  │
├─────────────────────────────────────┤
│ 状态: ● 飞行中                      │
├─────────────────────────────────────┤
│ 飞行速度                            │
│ [========●========] 500 km/h        │
├─────────────────────────────────────┤
│ 飞行进度                            │
│ [============●........] 60%         │
│ 航路点: 3/5   时间: 00:45 / 01:15   │
├─────────────────────────────────────┤
│ [▶ 开始]  [⏸ 暂停]  [⏹ 停止]       │
├─────────────────────────────────────┤
│ 📷 相机跟随 [Toggle Switch]         │
└─────────────────────────────────────┘
```

**状态颜色映射:**

- idle: 灰色
- ready: 绿色
- flying: 蓝色
- paused: 黄色
- completed: 紫色

**按钮状态:**

- idle/ready: 启用"开始"按钮
- flying: 启用"暂停"和"停止"按钮
- paused: 启用"恢复"和"停止"按钮
- completed: 启用"重置"按钮

### 步骤 4: 集成到 CesiumViewer

修改 `src/components/CesiumViewer.tsx`:

```typescript
import { useFlightAnimation } from '../hooks/useFlightAnimation'

function CesiumViewer() {
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  
  // 集成飞行动画 Hook
  useFlightAnimation(viewerRef.current)
  
  // ... 现有代码
}
```

### 步骤 5: 集成到 App 布局

修改 `src/App.tsx`:

```typescript
import FlightControlPanel from './components/FlightControlPanel'

function App() {
  return (
    <div className="app-container">
      <WaypointPanel />
      <FlightControlPanel />  {/* 新增 */}
      <CesiumViewer />
    </div>
  )
}
```

修改 `src/App.css` 添加面板定位样式。

## 文件清单

### 新增文件

| 文件路径 | 说明 |
|---------|------|
| `src/utils/flightAnimator.ts` | 飞行动画核心类 |
| `src/hooks/useFlightAnimation.ts` | 飞行动画 Hook |
| `src/components/FlightControlPanel.tsx` | 飞行控制面板组件 |
| `src/styles/FlightControlPanel.css` | 控制面板样式 |

### 修改文件

| 文件路径 | 变更内容 |
|---------|---------|
| `src/components/CesiumViewer.tsx` | 集成 useFlightAnimation Hook |
| `src/App.tsx` | 添加 FlightControlPanel 组件 |
| `src/App.css` | 添加面板布局样式 |

## 验证方案

完成实现后,执行以下验证:

### 功能验证

1. **模型加载**: 启动项目,确认飞机模型正确加载并显示
2. **飞行控制**: 
   - 点击"开始飞行",飞机沿航路点移动
   - 点击"暂停",动画暂停
   - 点击"恢复",动画继续
   - 点击"停止",飞机返回起点
3. **速度调节**: 拖动速度滑块,飞行速度实时变化
4. **相机跟随**: 
   - 启用跟随,视角锁定飞机
   - 禁用跟随,恢复自由视角
5. **进度显示**: 进度条和航路点索引正确更新

### 技术验证

```bash
# 类型检查
npm run typecheck

# 编译构建
npm run build

# 启动开发服务器
npm run dev
```

## 关键技术点

### 1. 动画时钟控制

使用 Cesium 的 `Clock` 和 `ClockViewModel`:

```typescript
viewer.clock.shouldAnimate = true  // 开始
viewer.clock.shouldAnimate = false // 暂停
viewer.clock.currentTime = startTime // 重置
```

### 2. 模型朝向

使用 `VelocityOrientationProperty` 自动计算飞机朝向:

```typescript
const orientation = new Cesium.VelocityOrientationProperty(positionProperty)
```

### 3. 平滑路径

为每个航路点添加插值采样点,实现平滑过渡:

```typescript
// 确保至少有两个航路点
if (waypoints.length < 2) return

// 为每段航程计算时间并添加采样
let currentTime = startTime
for (let i = 0; i < waypoints.length; i++) {
  positionProperty.addSample(currentTime, position)
  // 计算下一段时间增量
}
```

### 4. 性能优化

- 使用 `requestAnimationFrame` 控制相机更新
- 监听 `clock.onTick` 而非每帧更新
- 及时销毁不再使用的实体和资源

## 样式主题

延续现有项目的暗色主题:

```css
.flight-control-panel {
  background: rgba(26, 26, 26, 0.95);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #e0e0e0;
}
```

## 参考资源

- [Cesium Entity API](https://cesium.com/learn/cesiumjs/ref-doc/Entity.html)
- [Cesium Time Dynamic Properties](https://cesium.com/learn/cesiumjs/ref-doc/TimeDynamicPointCloud.html)
- [VelocityOrientationProperty](https://cesium.com/learn/cesiumjs/ref-doc/VelocityOrientationProperty.html)
