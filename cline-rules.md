# Cline 自动化规则文档

本文档记录了项目中配置的 Cline 自动化规则，旨在提高开发效率和保持一致性。

---

### 规则 1: 项目概览 (Project Overview)

*   **功能**: 提供项目的高层次概览。
*   **触发方式**: 当您询问“介绍一下这个项目”或“tell me about this project”时触发。
*   **预期行为**: Cline 将会回复一段关于项目目的、技术栈（Next.js）和关键目录（如 `pages/` 和 `pages/api/`）的介绍。

---

### 规则 2: 解释 Prisma 工具 (Explain Prisma Util)

*   **功能**: 解释 `utils/prisma.js` 文件的作用。
*   **触发方式**: 当您询问“解释一下 'utils/prisma.js' 的作用”或类似问题时触发。
*   **预期行为**: Cline 将会解释该文件是用于创建和管理 Prisma Client 的单例，以确保数据库连接的效率，并会一并展示该文件的完整内容。

---

### 规则 3: 获取当前日期 (Dynamic Date Example)

*   **功能**: 动态获取并返回当前日期。
*   **触发方式**: 当您询问“今天的日期是什么？”或“what's the date today?”时触发。
*   **预期行为**: Cline 将会回复当前的日期，格式为“今天是 YYYY年M月D日。”。

---

### 规则 4: 列出 API 路由 (List API Routes)

*   **功能**: 动态扫描并列出项目中的所有主要 API 路由。
*   **触发方式**: 当您询问“列出所有的 API 路由”或“list all API routes”时触发。
*   **预期行为**: Cline 将会执行一个命令来查找 `pages/api` 目录下的所有 `.js` 文件（不包括 cron 任务），并以列表形式返回所有找到的 API 端点。
