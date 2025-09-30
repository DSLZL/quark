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

## 重构说明（2025-09）

- 统一 API 错误处理与日志：新增 `utils/api-handler.js`、`utils/logger.js`，所有 API 路由使用包装器处理异常并给出一致响应。
- 抽离目录子树遍历：新增 `utils/subtree.js`，`/api/search` 与 `/api/suggestions` 统一使用批量广度优先遍历以过滤“整棵子树”。
- 稳定性优化：`utils/quark-api.js` 增加参数规范化、超时与上游错误识别；`/api/indexer` 保留顾问锁 + 进程锁并接入错误包装。
- 前端结构精简：图标组件抽离到 `components/Icons.jsx`，便于统一维护与复用；保留原有交互与样式。
- 功能保持不变：浏览/排序/搜索/建议/无限滚动/主题切换/定时重建索引均与原行为一致。
