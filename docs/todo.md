MVP TODO（依据 docs/spec-mvp.md）

一、项目与基础设施
- [x] 初始化 Electron + React + Vite + TypeScript 脚手架
- [x] 配置 `electron-builder` 打包（macOS，启用 `asar`）
- [x] 配置 ESLint / Prettier / tsconfig
- [ ] 定义应用路径与日志（`app.getPath('userData')`、日志滚动策略）

二、数据库（Drizzle + SQLite + better-sqlite3）
- [ ] 安装依赖：`drizzle-orm`、`drizzle-kit`、`better-sqlite3`
- [x] 在主进程初始化数据库连接（`userData/app.db`）
- [x] 定义 `src/main/db/schema.ts`（BLOB + 预览）
- [ ] 配置 `drizzle.config.ts` 并生成首版迁移
- [ ] 启动时执行/同步迁移；创建必要索引（`images.sha256` 唯一等）
- [ ] 提供“清空数据”方法（谨慎确认）

三、主进程 IPC 接口（受控白名单、校验参数）
- [x] `image.upload(items) -> Image[]`（读取为 Buffer、sha256 去重、写 BLOB、生成预览占位）
- [x] `image.list() -> Image[]`（按创建时间倒序）
- [x] `style.seed(defaults)`（应用启动时默认风格写入）
- [x] `style.list()`（预设风格读取）
- [x] `job.create({ imageId, styleId?, aspectRatio }) -> Job`（入队、置 queued）
- [x] `job.listByImage(imageId) -> Job[]`
- [x] `result.listByImage(imageId) | result.listByJob(jobId) -> Result[]`（两者已实现）
- [x] `file.download(resultId, targetPath)`（从 BLOB 写磁盘）
- [ ] `db.clear(confirmToken)`（清空数据）
- [ ] 错误码与错误信息统一（如 E_VALIDATION、E_DUPLICATE、E_IO 等）

四、生成任务与调度
- [x] 任务队列与并发限制（单并发占位实现）
- [x] Job 状态流转：queued -> processing -> done（失败分支待补）
- [x] 生成服务抽象（Mock）：复制原图写入 `results.data_blob`、`preview_base64`
- [ ] 进度/完成事件通过 IPC 通知渲染进程

五、渲染进程 UI（React + shadcn/ui）
- [x] Tailwind 配置与全局样式
- [x] 三栏布局：左（待处理列表+上传区）、中（配置区）、右（结果预览区）
- [x] 上传区（点选上传，多选）
- [x] 左侧：缩略图列表（使用 `preview_base64`）与选中态
- [x] 中间：风格预设按钮组、尺寸比例选择、“开始生成”
- [x] 右侧：结果卡片（原图 vs 生成图）、单张下载
- [ ] 空状态、错误提示与重试按钮
- [ ] 集成 shadcn/ui 组件库（安装依赖与生成组件）

六、样式与体验
- [ ] 主题与基础色、统一按钮/卡片组件
- [ ] 拖拽高亮、禁用态/加载态、错误态
- [ ] 快捷键（可选）：删除、重新生成、打开下载目录

七、性能与稳定性
- [ ] 预览图生成（固定较小宽度，压缩到 `preview_base64`）
- [ ] 大图 BLOB 读取采用按需策略（仅在下载或预览原图时读取）
- [ ] 文件/数据库 I/O 超时与重试策略

八、安全与隔离
- [ ] 启用 `contextIsolation`、`sandbox`，严格限制 `preload` 暴露 API
- [ ] IPC 参数校验与来源校验，禁用任意通道

九、打包与分发
- [ ] `electron-builder` 配置应用 ID、图标、签名（如需）
- [ ] 构建产物测试（首次安装、覆盖安装、权限提示）

十、质量与文档
- [ ] 手工验收清单：上传/去重、生成、预览、下载、清空数据
- [ ] 边界测试：超限文件、非图片格式、磁盘不足、DB 被占用
- [ ] README：安装运行、已知限制（BLOB 存储、大小限制）、隐私与本地化说明

后续可选（非 MVP）
- [ ] 改为“磁盘存文件 + DB 存路径/元数据”的混合方案
- [ ] 多任务并发/优先级队列、暂停/恢复
- [ ] 自定义风格编辑器与更多尺寸比例
- [ ] 批量导出 ZIP、历史项目管理
