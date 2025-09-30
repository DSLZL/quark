# 项目结构概览

- `pages/`：Next.js 页面与 API 路由（继续采用 Pages Router）。
  - `pages/index.js`：主界面（面包屑、列表/网格视图、排序、搜索、建议、无限滚动、主题切换）。
  - `pages/api/files.js`：获取目录下文件列表，同时异步写入数据库缓存。
  - `pages/api/search.js`：基于 FlexSearch + 数据库过滤（整棵子树）的搜索。
  - `pages/api/suggestions.js`：前缀优先的搜索建议，包含匹配补齐。
  - `pages/api/indexer.js`：后台递归构建索引（顾问锁 + 进程锁）。
  - `pages/api/cron/re-index.js`：按 CRON 触发批量重建。
- `components/`
  - `ThemeProvider.jsx`：明暗主题切换（HeroUI + Tailwind 变量）。
  - `Icons.jsx`：抽离的图标组件库（列表/网格/压缩包/排序）。
- `utils/`
  - `prisma.js`：Prisma 客户端单例。
  - `db-cache.js`：逐条 upsert，降低高并发下的锁竞争。
  - `quark-api.js`：Quark API 访问（参数规范化、10s 超时、上游错误识别）。
  - `flexsearch.js`：PostgreSQL 挂载的 FlexSearch 单例。
  - `subtree.js`：整棵子树收集（批量广度优先）。
  - `api-handler.js`：API 错误包装与统一响应。
  - `logger.js`：轻量日志封装（可替换为 pino/winston）。
- `prisma/`：Prisma 模型与迁移（PostgreSQL）。
- `styles/`：Tailwind v4 基础样式。
- `next.config.js`、`vercel.json`：Next 与部署配置。

重构要点：抽离通用逻辑（错误处理、子树遍历、图标库），保证功能行为不变的同时提升可维护性与稳定性。