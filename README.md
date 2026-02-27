# ✈️ Cesium Flight Route Visualizer

<div align="center">

![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-7.3.1-646CFF?style=flat-square&logo=vite)
![Cesium](https://img.shields.io/badge/Cesium-1.138.0-6CADDF?style=flat-square&logo=cesium)

**A modern 3D flight route visualization tool built with Cesium, React, TypeScript and Vite**

[在线演示](#) | [快速开始](#-快速开始) | [功能特性](#-功能特性) | [技术架构](#-技术架构)

</div>

---

## 📖 项目简介

Cesium Flight Route Visualizer 是一个基于 **CesiumJS** 的 3D 航路可视化工具，专为航空领域设计。它能够直观地展示飞行航线、航路点信息，并支持相机自动跟随飞行功能，为航空数据分析、飞行计划展示等场景提供专业的可视化解决方案。

![项目截图](./docs/screenshot.png)

## ✨ 功能特性

### 🗺️ 航路可视化
- **航路点标记** - 在 3D 地球上精确标记航路点位置
- **航线绑制** - 自动连接航路点形成完整航线
- **自定义样式** - 支持自定义航路颜色、线宽等样式

### 🚀 自动飞行
- **相机跟随** - 相机自动跟随飞机沿航线移动
- **速度控制** - 支持调整飞行速度倍率
- **暂停/继续** - 随时控制飞行状态

### 🎯 交互体验
- **平滑动画** - 流畅的相机过渡和飞行动画
- **信息展示** - 点击航路点查看详细信息
- **响应式设计** - 适配不同屏幕尺寸

## 🛠️ 技术架构

| 技术 | 版本 | 说明 |
|------|------|------|
| [React](https://react.dev/) | 19.2.0 | 前端 UI 框架 |
| [TypeScript](https://www.typescriptlang.org/) | 5.9.3 | 类型安全的 JavaScript |
| [Vite](https://vitejs.dev/) | 7.3.1 | 下一代前端构建工具 |
| [CesiumJS](https://cesium.com/cesiumjs/) | 1.138.0 | 3D 地球和地图可视化库 |

## 📦 项目结构

```
cesiumPlaneFly_react_ts_vite/
├── 📁 src/
│   ├── 📁 components/          # React 组件
│   │   ├── CesiumViewer.tsx    # Cesium 主视图组件
│   │   └── RouteVisualizerApp.tsx  # 航路数据配置
│   ├── 📁 types/               # TypeScript 类型定义
│   │   └── waypoint.ts         # 航路点类型和验证
│   ├── 📁 utils/               # 工具函数
│   │   └── flightRouteVisualizer.ts  # 航路可视化核心逻辑
│   ├── App.tsx                 # 主应用组件
│   └── main.tsx                # 入口文件
├── 📁 public/                  # 静态资源
├── package.json                # 项目配置
├── tsconfig.json               # TypeScript 配置
└── vite.config.ts              # Vite 配置
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/MONET1978/cesiumPlaneFly_react_ts_vite.git

# 进入项目目录
cd cesiumPlaneFly_react_ts_vite

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建生产版本

```bash
# 类型检查 + 构建
npm run build

# 预览构建结果
npm run preview
```

## 📝 使用示例

### 创建航路点

```typescript
import type { FlightRoute } from './types/waypoint'

const myFlightRoute: FlightRoute = {
  name: '我的航线',
  waypoints: [
    { longitude: 116.4074, latitude: 39.9042, height: 1000, name: '北京' },
    { longitude: 121.4737, latitude: 31.2304, height: 1500, name: '上海' },
    { longitude: 113.2644, latitude: 23.1291, height: 2000, name: '广州' },
  ],
  color: '#00FF00',
  lineWidth: 3
}
```

### 启动自动飞行

```typescript
// 创建可视化实例
const visualizer = new FlightRouteVisualizer(viewer)

// 启动自动飞行（速度: 100米/秒，跟踪模式）
visualizer.startAutoFlight(myFlightRoute, 100, 'track')

// 控制飞行
visualizer.pauseAutoFlight(true)   // 暂停
visualizer.setFlightSpeed(2)       // 2倍速
visualizer.stopAutoFlight()        // 停止
```

## 🎨 自定义配置

### Cesium Ion Token

在 `CesiumViewer.tsx` 中配置您的 Cesium Ion 访问令牌：

```typescript
Ion.defaultAccessToken = 'YOUR_CESIUM_ION_TOKEN'
```

获取免费令牌：[https://ion.cesium.com/tokens](https://ion.cesium.com/tokens)

### 相机视角

```typescript
viewer.camera.flyTo({
  destination: Cartesian3.fromDegrees(longitude, latitude, height),
  orientation: {
    heading: CesiumMath.toRadians(0),    // 航向角
    pitch: CesiumMath.toRadians(-45),    // 俯仰角
  },
  duration: 3  // 飞行时间（秒）
})
```

## 🔧 开发指南

### 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（热更新） |
| `npm run build` | 构建生产版本 |
| `npm run preview` | 预览构建结果 |
| `npm run lint` | 运行 ESLint 检查 |

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 规则
- 组件使用函数式写法 + Hooks
- 所有函数添加 JSDoc 注释

## 🤝 贡献指南

欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

- [CesiumJS](https://cesium.com/cesiumjs/) - 强大的 3D 地球可视化引擎
- [React](https://react.dev/) - 声明式 UI 库
- [Vite](https://vitejs.dev/) - 极速构建工具

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给一个 Star！⭐**

Made with ❤️ by [MONET1978](https://github.com/MONET1978)

</div>
