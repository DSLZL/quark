# 任务完成检查单

- 环境变量：`.env` 中 `DATABASE_URL`、`QUARK_COOKIE`、`CRON_SECRET` 已配置。
- 构建通过：`pnpm build` 无错误。
- Lint 通过：`pnpm lint` 无阻塞错误（可有警告）。
- 首页：能看到“游戏分享”初始面包屑；切换明暗主题生效。
- 列表：分页滚动加载正常，点击文件夹进入子目录，面包屑可回退。
- 排序：能在“文件名/修改日期”间切换升降序，UI 指示正确。
- 搜索：输入搜索词触发 `/api/search`，仅返回当前目录子树内结果；相关性排序合理。
- 建议：输入触发 `/api/suggestions`，前缀优先（不超过 10 条）。
- 索引：进入目录时后台触发 `/api/indexer`；`/api/cron/re-index` 可按 Bearer 鉴权批量触发。
- 稳定性：上游 Cookie 失效时，友好提示；API 发生异常时返回统一错误结构。