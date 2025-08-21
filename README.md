# 千问图像管理后台

基于 Electron + Vue 3 的图像处理与管理应用，支持图像上传、AI 风格处理、任务管理等功能。

## 功能特性

- 📁 **素材管理**: 图像上传、预览、批量操作，支持拖拽上传
- 🎨 **AI 图像处理**: 集成千问图像编辑，支持不同风格和尺寸的图像生成  
- 📋 **任务管理**: 任务队列、状态监控、批量重试，实时状态更新
- 💾 **本地存储**: SQLite 数据库存储，支持离线使用
- 🎯 **现代化界面**: shadcn-vue 组件库，响应式设计

## 技术栈

### 前端技术
- **框架**: Vue 3 + TypeScript (`<script setup lang="ts">`)
- **样式**: Tailwind CSS v4
- **UI 组件**: shadcn-vue (基于 Reka UI) + lucide-vue-next 图标
- **构建**: Vite + electron-vite

### 后端技术  
- **桌面框架**: Electron
- **数据库**: SQLite + Drizzle ORM
- **图像处理**: 千问图像编辑 API
- **任务队列**: p-queue (并发控制，最大2个任务)

## 项目结构

```
src/
├── main/           # Electron 主进程
│   ├── index.ts    # 主进程入口
│   ├── ipc.ts      # IPC 通信处理
│   ├── db/         # 数据库模块 (schema, migrations)
│   ├── jobs/       # 任务处理模块 (worker, provider-qwen)
│   └── utils/      # 工具函数 (log, retry)
├── preload/        # 预加载脚本 (安全桥接 window.api)
└── renderer/       # Vue 渲染进程
    └── src/
        ├── components/ui/  # shadcn-vue UI 组件
        ├── pages/         # 页面组件 (uploads, jobs)
        ├── types/         # TypeScript 类型定义
        └── main.ts        # 渲染进程入口
```

## 开发环境设置

### 环境要求
- Node.js 18+
- pnpm 8+

### 安装依赖
```bash
pnpm install
```

### 开发命令

```bash
# 开发模式 (热重载)
pnpm dev

# 预览构建后的应用
pnpm start

# 类型检查
pnpm typecheck

# 代码检查与格式化
pnpm lint
pnpm format

# 构建应用
pnpm build

# 平台特定构建
pnpm build:mac    # macOS
pnpm build:win    # Windows  
pnpm build:linux  # Linux
```

### 数据库操作

```bash
# 生成数据库迁移
pnpm db:generate

# 执行数据库迁移  
pnpm db:migrate

# 推送 schema 变更
pnpm db:push

# 数据库可视化工具
pnpm db:studio
```

## 应用界面

### 主界面结构
- **左侧导航栏**: 素材管理、任务管理
- **右侧内容区**: 对应页面内容，包含工具栏和可滚动主体

### 素材管理页面
- 网格布局展示图像素材，支持拖拽上传
- 批量选择，批量操作：删除、批量生成任务
- 分页浏览，性能优化

### 任务管理页面  
- 表格形式展示任务列表
- 任务状态筛选：排队中、处理中、已完成、失败
- 支持任务重试、批量操作，实时状态更新

## 核心功能

### 任务队列系统
- 使用 p-queue 实现并发控制 (最大 2 个并发)
- 支持任务优先级和自动重试
- 实时状态广播和 UI 更新

### 图像处理流程
1. 用户上传图像到素材库
2. 选择风格和尺寸，批量创建任务  
3. 任务队列异步处理，调用千问 API
4. 处理完成后自动生成预览和结果文件
5. 用户可预览、下载处理结果

## 代码规范

### 命名规范
- 组件: PascalCase (如 `ImageGrid.vue`)
- 变量/函数: camelCase (如 `fetchJobs`)
- 文件/目录: kebab-case (如 `jobs-page.vue`)

### Vue 组件规范
- 使用 `<script setup lang="ts">` 语法
- 组件名使用 PascalCase，Props 和 Emits 类型化

### 样式规范
- 优先使用 Tailwind CSS 类名
- 组件样式使用 scoped，通用样式定义在 `globals.css`

## 数据存储

数据库文件位置 (Electron `userData` 目录):

- **macOS**: `~/Library/Application Support/PixelForge/app.db`
- **Windows**: `%APPDATA%\\PixelForge\\app.db`  
- **Linux**: `~/.config/PixelForge/app.db`

- 图像二进制数据存储在 SQLite BLOB 字段
- 支持事务和并发访问，WAL 模式提升稳定性
- 可通过 `window.api.db.clear('CONFIRM_CLEAR')` 清除数据

## 推荐开发工具

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

更多技术细节请参考 `AGENTS.md` 文件。
