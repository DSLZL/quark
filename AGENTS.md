# Repository Guidelines

## 项目结构与模块组织
- `pages/`：Next.js 页面与 API 路由。`pages/api/*` 包含文件列表、搜索、建议与定时重建索引（如 `files.js`、`search.js`、`suggestions.js`、`cron/re-index.js`）。
- `utils/`：数据访问与缓存（`prisma.js`、`db-cache.js`、`quark-api.js`、`flexsearch.js`）。
- `prisma/`：Prisma 模型与迁移（`schema.prisma`，数据库为 PostgreSQL，经 `DATABASE_URL` 配置）。
- `styles/`：Tailwind CSS 样式与配置（配合 `tailwind.config.js`、`postcss.config.js`）。
- `flexsearch/`：本地搜索索引缓存（一般无需提交）。生成产物：`.next/`、`.vercel/` 不需修改。

## 构建、测试与本地开发（pnpm）
- `pnpm dev`：本地开发（热更新）。
- `pnpm build`：生产构建（内含 `prisma generate`）。
- `pnpm start`：生产模式启动。
- `pnpm lint`：代码检查（Next.js ESLint）。

环境：复制 `.env.example` 为 `.env`，设置 `DATABASE_URL` 与 `QUARK_COOKIE`。数据库开发命令：`npx prisma migrate dev`、`npx prisma studio`。

## 编码风格与命名规范
- JS/React：组件用 PascalCase；变量/函数用 camelCase；页面文件遵循 Next 约定（如 `_app.js`、`index.js`）。
- 缩进 2 空格；遵循 ESLint/Next 默认规则；Tailwind v4 原子类优先，尽量减少自定义 CSS 覆盖。

## 测试指南
- 当前未内置测试脚本。建议引入 Jest + React Testing Library。
- 约定：`__tests__/**/*.(test|spec).js`；优先覆盖 API 路由与 `utils/` 核心逻辑。
- 待添加 `pnpm test` 后执行本地测试并保证通过。

## 提交与 Pull Request 指南
- 提交信息：采用 Conventional Commits（如 `feat: ...`、`fix: ...`、`chore: ...`）。
- PR 要求：
  - 描述变更与动机，关联 Issue；
  - 列出影响范围与验证步骤；
  - UI 变更请附截图；确保 `pnpm lint` 与构建通过。

## 安全与配置提示（可选）
- 切勿提交 `.env` 或密钥。保持 `.env.example` 同步更新。
- 生产部署遵循 `vercel.json` 与 `next.config.js`。关键变量：`DATABASE_URL`（PostgreSQL）、`QUARK_COOKIE`（夸克网盘 Cookie）。
