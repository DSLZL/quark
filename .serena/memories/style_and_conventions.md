# 代码风格与约定

- 语言：JavaScript（ES2022）+ React 19；组件使用 PascalCase，变量/函数使用 camelCase。
- 目录：继续使用 Next.js Pages Router，API 路由均位于 `pages/api/*`。
- 样式：Tailwind v4 + HeroUI 主题；尽量使用原子类，减少自定义 CSS 覆盖；中文注释。
- API 约定：
  - 成功统一返回 `{ status: 200, message: 'OK', data: {...} }` 或直接返回数据（由 `withApiHandler` 包装 200 输出）。
  - 失败统一通过 `withApiHandler` 捕获，生产环境隐藏堆栈，开发环境返回 `details` 便于调试。
- 错误类型：`BadRequestError`/`UnauthorizedError`/`UpstreamError`，或自定义 `err.status`。
- 数据库访问：
  - Prisma 单例（开发态复用 `global`）。
  - 高频 upsert 避免大事务，降低锁竞争。
- 搜索：FlexSearch（PostgreSQL 挂载）+ 数据库过滤（整棵子树），保持相关性排序。
- 命名：
  - 文件/目录小写短横线或驼峰；组件文件 PascalCase；工具库放在 `utils/*`。
  - 环境变量：`DATABASE_URL`、`QUARK_COOKIE`、`CRON_SECRET` 等。
- 日志：使用 `utils/logger.js`（可平滑替换为专业日志库）。
