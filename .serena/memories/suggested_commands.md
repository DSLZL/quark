# 常用命令（Windows / pnpm）

- 启动开发：`pnpm dev`
- 生产构建：`pnpm build`
- 生产启动：`pnpm start`
- 代码检查：`pnpm lint`

Prisma（数据库）：
- 生成 Client：`pnpm prisma generate`
- 开发迁移：`pnpm prisma migrate dev`
- 部署迁移：`pnpm prisma migrate deploy`
- 数据浏览：`pnpm prisma studio`

环境：
- 复制 `.env.example` → `.env`，配置 `DATABASE_URL`、`QUARK_COOKIE`、`CRON_SECRET`。

自检（建议顺序）：
1) `pnpm lint`
2) `pnpm build`
3) 本地访问：`http://localhost:3000/`
4) 手动触发：`/api/indexer?pdir_fid=<fid>`（先设置 `QUARK_COOKIE`）
5) 搜索/建议联调（必须保证数据库已缓存过对应目录）
