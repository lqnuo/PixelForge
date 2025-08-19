MVP TODO（依据 docs/spec-mvp.md）

一、项目与基础设施
- [x] 初始化 Electron + Vue 3 + Vite + TypeScript 脚手架
- [x] 配置 `electron-builder` 打包（macOS，启用 `asar`）
- [x] 配置 ESLint / Prettier / tsconfig
- [x] 定义应用路径（`app.getPath('userData')`）
- [x] 日志与滚动策略（`electron-log`/自定义轮转）
  - [x] 基础日志（`userData/logs/app.log`，5MB 滚动，保留3份）

二、数据库（Drizzle + SQLite + better-sqlite3）
- [x] 安装依赖：`drizzle-orm`、`drizzle-kit`、`better-sqlite3`
- [x] 在主进程初始化数据库连接（`userData/app.db`）
- [x] 定义 `src/main/db/schema.ts`（BLOB + 预览）
- [x] 配置 `drizzle.config.ts` 并生成首版迁移
  - [x] 已添加 `drizzle.config.ts`（生成迁移需安装并执行 `drizzle-kit`）
  - [x] 已生成手写首版迁移：`drizzle/0000_init.sql`
- [x] 启动时执行/同步迁移（内置 DDL 初始化）；创建必要索引（`images.sha256` 唯一等）
- [x] 提供“清空数据”方法（谨慎确认）
  - [x] 已实现 IPC `db.clear(confirmToken)`，令牌为 `CONFIRM_CLEAR`

三、主进程 IPC 接口（受控白名单、校验参数）
- [x] `image.upload(items) -> Image[]`（读取为 Buffer、sha256 去重、写 BLOB、生成预览占位）
- [x] `image.list() -> Image[]`（按创建时间倒序）
- [x] `style.seed(defaults)`（应用启动时默认风格写入）
- [x] `style.list()`（预设风格读取）
- [x] `job.create({ imageId, styleId?, aspectRatio }) -> Job`（入队、置 queued）
- [x] `job.listByImage(imageId) -> Job[]`
- [x] `result.listByImage(imageId) | result.listByJob(jobId) -> Result[]`（两者已实现）
- [x] `file.download(resultId, targetPath)`（从 BLOB 写磁盘）
- [x] `db.clear(confirmToken)`（清空数据）
- [x] 错误码与错误信息统一（如 E_VALIDATION、E_NOT_FOUND、E_IO 等）
  - [x] 基础参数校验与错误返回（不改变成功返回结构）
  - [x] 新增 `job.retry(jobId)`（失败重试）

四、生成任务与调度
- [x] 任务队列与并发限制（单并发占位实现）
- [x] Job 状态流转：queued -> processing -> done（失败分支待补）
- [x] 生成服务抽象（Mock）：复制原图写入 `results.data_blob`、`preview_base64`
- [x] 进度/完成事件通过 IPC 通知渲染进程
  - [x] 已实现：`job.updated` / `result.created` 事件；渲染进程自动刷新

五、渲染进程 UI（Vue 3 + shadcn-vue）
- [x] UnoCSS 配置与全局样式（Vite 插件 + presetWind + directives）
- [x] 三栏布局：左（待处理列表+上传区）、中（配置区）、右（结果预览区）
- [x] 上传区（点选上传，多选）
- [x] 左侧：缩略图列表（使用 `preview_base64`）与选中态
- [x] 中间：风格预设按钮组、尺寸比例选择、“开始生成”
- [x] 右侧：结果卡片（原图 vs 生成图）、单张下载
- [ ] 空状态、错误提示与重试按钮
  - [x] 空状态（无图片/无结果）
  - [x] 错误提示与重试按钮（处理失败的 Job）
- [ ] 集成 shadcn-vue 组件库（安装依赖与生成组件）
  - [x] Button/Card 基础样式占位（本地实现，无外部依赖）
  - [x] 安装依赖并用 CLI 生成（需联网）

六、样式与体验
- [x] 主题与基础色、统一按钮/卡片组件（UnoCSS + presetWind）
- [x] 拖拽高亮、禁用态/加载态、错误态（基础）
- [x] 快捷键（可选）
  - [x] 重新生成（R / Enter）
  - [x] 删除（Delete / Backspace）
  - [x] 打开下载目录（Ctrl/Cmd + J）

七、性能与稳定性
- [x] 预览图生成（固定较小宽度，压缩到 `preview_base64`）
- [x] 大图 BLOB 读取采用按需策略（仅在下载或预览原图时读取）
- [x] 文件/数据库 I/O 超时与重试策略
  - [x] 文件写入重试（下载时 3 次重试）
  - [x] DB 写入/更新操作重试（关键路径）

八、安全与隔离
- [x] 启用 `contextIsolation`、`sandbox`，严格限制 `preload` 暴露 API
  - [x] 已启用：`BrowserWindow.webPreferences.sandbox=true`、`contextIsolation=true`
- [x] IPC 参数基础校验与统一错误返回
- [x] 来源校验（限制 file:// 与 localhost 开发地址）
- [x] 更严格的通道约束（白名单与 Schema 校验）
  - [x] 基于运行时校验（简易 schema）过滤非法 payload

九、打包与分发
- [ ] `electron-builder` 配置
  - [x] 应用 ID 与图标
  - [ ] 签名 / notarize（如需）
- [x] 构建产物测试（首次安装、覆盖安装、权限提示）（见 docs/packaging-tests.md）

十、质量与文档
- [x] 手工验收清单：上传/去重、生成、预览、下载、清空数据（见 docs/qa-checklist.md）
- [x] 边界测试：超限文件、非图片格式、磁盘不足、DB 被占用（见 docs/boundary-tests.md）
- [x] README：安装运行、已知限制（BLOB 存储、大小限制）、隐私与本地化说明（基础）

后续可选（非 MVP）
- [ ] 改为“磁盘存文件 + DB 存路径/元数据”的混合方案
- [ ] 多任务并发/优先级队列、暂停/恢复
- [ ] 自定义风格编辑器与更多尺寸比例
- [ ] 批量导出 ZIP、历史项目管理
