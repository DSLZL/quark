# Quark Browser (Next.js)

基于 Next.js + Prisma + PostgreSQL + FlexSearch 的夸克网盘文件浏览器。

## 快速开始（pnpm）

1) 安装依赖

```bash
pnpm install
```

2) 配置环境变量（复制 .env.example → .env）

- 必填：`DATABASE_URL`、`QUARK_COOKIE`、`CRON_SECRET`

3) 初始化数据库（如需）

```bash
pnpm prisma migrate deploy
# 或开发环境：pnpm prisma migrate dev
```

4) 本地开发

```bash
pnpm dev
```

## 部署与运维

- Vercel：保留 `vercel.json` 的 `crons`，周期触发 `/api/cron/re-index`，请求头需 `Authorization: Bearer ${CRON_SECRET}`。
- 后台索引：`/api/indexer?pdir_fid=...` 支持并发互斥（Postgres 顾问锁 + 进程内锁），日志包含页数/文件数/耗时。

## TODO

- [X] 添加网站样式
  - [ ] 继续美化
- [X] 排序功能
- [X] 搜索功能
  - [X] 搜索缓存
  - [X] 搜索速度优化（前缀优先、LRU+TTL 缓存）
- [X] 排序按钮的样式优化
- [ ] 分享链接能力（读取/创建/复用）
