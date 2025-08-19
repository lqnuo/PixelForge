电商图片批量扩展 Web App (MVP 需求)
1. MVP 目标
快速上线一个核心功能可用的产品版本，以验证市场需求和核心工作流程。此版本专注于**“多图上传 -> 单图选择风格 -> 批量扩展 -> 统一预览下载”**的核心路径。

2. MVP 核心用户流程
访问页面：用户直接进入主操作界面，无需登录或项目管理。

上传图片：用户一次性上传多张商品图片。

配置与生成：

用户在图片列表中选择一张图片。

为这张选中的图片选择一个预设的背景风格。

点击“生成”按钮。

对下一张图片重复此操作。

预览与下载：

在结果区域，查看所有已生成图片的原图与效果图对比。

对满意的结果进行单张下载。

3. MVP 功能范围 (Scope)
模块一：图片上传区 (简化)
功能：

支持拖拽或点击上传文件。

支持一次性上传多张图片（MVP 阶段可限制为最多 10 张）。

支持 JPG, PNG 格式。

上传后，图片以缩略图列表的形式显示在左侧“待处理”区域。

模块二：配置与生成区 (核心)
界面布局：采用三栏布局：左边是“待处理图片列表”，中间是“当前配置区”，右边是“结果预览区”。

核心功能：

选择图片：用户从左侧列表中点击一张图片，该图片会加载到中间的配置区。

模式固定：MVP 版本**只实现“智能背景扩展”**功能，无需提供模式切换选项。

风格选择 (Style Selection)：

提供一组预设的背景风格按钮供用户选择，例如：“简约家居”、“户外自然光”、“大理石台面”、“木质背景”。用户直接点击按钮即可应用该风格。

参数设置 (简化)：

图片尺寸 (Aspect Ratio)：提供 1:1 和 3:4 两个最常用的电商尺寸选项。

操作按钮：

一个清晰的**“开始生成”**按钮。点击后，该图片进入处理中状态（在左侧列表和右侧结果区显示 loading 状态），并将结果显示在右侧。

模块三：结果展示与下载区 (简化)
功能：

结果列表：每当一张图片处理完成，就在此区域生成一个结果卡片。

对比视图：每个卡片内并排展示**“原图”和“生成效果图”**。

进度提示：正在生成的任务显示加载动画或“生成中...”文字提示。

图片操作：

预览：点击效果图可以放大查看。

单张下载：每张效果图下方提供一个“下载”按钮。

4. 技术方案（Electron + React + Drizzle）

- 技术栈：
  - Electron（主进程负责本地数据库、文件/系统能力、任务调度；渲染进程负责 UI）
  - React 18 + Vite + TypeScript（前端渲染层）
  - Drizzle ORM + SQLite（本地持久化，驱动建议使用 better-sqlite3）
- 程序结构：
  - 主进程：初始化数据库、暴露受控的 IPC 服务（如 `image.upload`、`job.create`、`result.list`）、负责生成任务调度与状态更新。
  - 渲染进程（React）：上传图片、选择风格与参数、触发生成、展示结果；仅通过 IPC 调用主进程的数据与任务接口。
- 数据持久化：
  - SQLite 库文件放置在 `app.getPath('userData')/app.db`。
  - 按需使用 Drizzle 的迁移（drizzle-kit）管理表结构演进。
  - 存储策略：所有“上传的图片”和“生成的图片”均以 SQLite BLOB 列存储；可选额外保存小图 `preview_base64`（TEXT）用于列表/卡片快速展示。
- 性能与容量：
  - BLOB 无额外编码膨胀，读写更快；MVP 限制每次最多 10 张、单图不超过 5MB（原图）。
  - 提供“清空数据”功能和“批量删除结果”以释放磁盘空间。
  - 如后续需要处理大批量与大图，建议改为“磁盘存文件 + DB 存路径/元数据”的混合方案（非本次 MVP 范围）。
- 打包与更新：
  - 首版可仅支持 macOS；使用 electron-builder 出包，开启 `asar`。

5. 数据表设计（Drizzle + SQLite）

目标：满足“多图上传 -> 逐图选择风格 -> 生成 -> 预览下载”的核心链路；两类图片（上传、生成）以 BLOB 持久化，必要时额外保存预览 base64 以加速 UI。

- 表：`images`（上传的原始图片）
  - `id` TEXT 主键（UUID）
  - `filename` TEXT（原文件名）
  - `mime_type` TEXT（如 image/jpeg, image/png）
  - `size_bytes` INTEGER（文件字节大小）
  - `width` INTEGER，`height` INTEGER（可选，解析到再写）
  - `sha256` TEXT UNIQUE（去重用）
  - `data_blob` BLOB NOT NULL（实际图片内容，二进制 Buffer）
  - `preview_base64` TEXT（可选，小尺寸预览，便于 UI 秒开）
  - `created_at` INTEGER（Unix 秒级时间戳）

- 表：`styles`（可选的预设风格）
  - `id` TEXT 主键（UUID）
  - `name` TEXT UNIQUE NOT NULL（如“简约家居”、“大理石台面”）
  - `description` TEXT（可选）
  - `preset` TEXT as JSON（Drizzle 在 SQLite 可用 `text(..., { mode: 'json' })` 存储风格参数）
  - `created_at` INTEGER

- 表：`jobs`（生成任务）
  - `id` TEXT 主键（UUID）
  - `source_image_id` TEXT NOT NULL（FK -> images.id）
  - `style_id` TEXT（FK -> styles.id，可为 NULL，表示自定义或默认风格）
  - `aspect_ratio` TEXT NOT NULL（如 "1:1"、"3:4"）
  - `status` TEXT NOT NULL（queued | processing | done | failed）
  - `error` TEXT（失败原因，可空）
  - `created_at` INTEGER，`updated_at` INTEGER

- 表：`results`（生成结果图）
  - `id` TEXT 主键（UUID）
  - `job_id` TEXT NOT NULL（FK -> jobs.id）
  - `source_image_id` TEXT NOT NULL（FK -> images.id，便于直接反查原图）
  - `mime_type` TEXT NOT NULL
  - `width` INTEGER，`height` INTEGER
  - `data_blob` BLOB NOT NULL（生成的图片内容，二进制 Buffer）
  - `preview_base64` TEXT（可选，小尺寸预览）
  - `created_at` INTEGER

- 索引建议：
  - `images.sha256` 唯一索引（去重）
  - `jobs.source_image_id`、`results.job_id` 常用查询索引

6. Drizzle 表定义示例（TypeScript）

```ts
// src/main/db/schema.ts
import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const images = sqliteTable('images', {
  id: text('id').primaryKey(),
  filename: text('filename'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  width: integer('width'),
  height: integer('height'),
  sha256: text('sha256').notNull().unique(),
  dataBlob: blob('data_blob').notNull(),
  previewBase64: text('preview_base64'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
});

export const styles = sqliteTable('styles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  // 在 SQLite 中可使用 JSON 文段存储预设配置
  preset: text('preset', { mode: 'json' }),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
});

export const jobs = sqliteTable('jobs', {
  id: text('id').primaryKey(),
  sourceImageId: text('source_image_id').notNull(),
  styleId: text('style_id'),
  aspectRatio: text('aspect_ratio').notNull(),
  status: text('status').notNull().default('queued'),
  error: text('error'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
  updatedAt: integer('updated_at').notNull().default(sql`(strftime('%s','now'))`),
});

export const results = sqliteTable('results', {
  id: text('id').primaryKey(),
  jobId: text('job_id').notNull(),
  sourceImageId: text('source_image_id').notNull(),
  mimeType: text('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  dataBlob: blob('data_blob').notNull(),
  previewBase64: text('preview_base64'),
  createdAt: integer('created_at').notNull().default(sql`(strftime('%s','now'))`),
});
```

7. 关键流程与约定

- 上传：渲染进程将文件句柄交给主进程读取为 Buffer，写入 `images.data_blob`（BLOB）；可异步生成并保存 `preview_base64`；返回 `image.id`。
- 生成：渲染进程创建 `jobs` 记录并排队；主进程执行生成逻辑，产出图片后写入 `results.data_blob`（BLOB），并更新 `jobs.status = done`。
- 展示：右侧结果区通过 `results.job_id` 或 `results.source_image_id` 拉取结果并渲染。
- 下载：由主进程将 BLOB（Buffer）直接写入文件到磁盘，并触发“显示于访达”；UI 预览需要时可用 `preview_base64` 或将 Buffer 转为 object URL/base64。
