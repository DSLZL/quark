/**
 * @type {import('@cline/cline').Rule[]}
 */
module.exports = [
  {
    // 规则名称，可选，但建议填写以方便调试
    name: 'Project Overview',
    // 匹配用户输入的正则表达式
    prompt: /^(介绍一下这个项目|tell me about this project)$/i,
    // 当 prompt 匹配成功时，Cline 的响应
    response: `这是一个基于 Next.js 的项目，用于提供代码搜索和索引功能。
主要的页面在 'pages/index.js'，API 路由在 'pages/api/' 目录下。
你可以问我关于特定文件的问题，例如 "解释一下 'utils/prisma.js' 的作用"。`,
  },
  {
    name: 'Explain Prisma Util',
    prompt: /^(解释一下|what is|explain) 'utils\/prisma.js' 的作用$/i,
    // 除了 response，还可以提供文件内容作为上下文
    files: {
      // 'key' 是一个标识符，'path' 是相对于项目根目录的文件路径
      prismaUtil: 'utils/prisma.js',
    },
    // 在 response 中，你可以使用 {{files.key}} 来引用文件内容
    response: `
'utils/prisma.js' 文件负责初始化和导出 Prisma Client 的单例。
这是为了确保在整个应用程序中只使用一个 Prisma Client 实例，从而避免创建过多的数据库连接，提高性能和资源利用率。

以下是该文件的内容：
\`\`\`javascript
{{{files.prismaUtil}}}
\`\`\`
`,
  },
  {
    name: 'Dynamic Date Example',
    prompt: /^今天的日期是什么？|what's the date today\?$/i,
    // response 也可以是一个函数，用于动态生成内容
    // 这个函数会在每次匹配成功时执行
    response: () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const day = today.getDate();
      return `今天是 ${year}年${month}月${day}日。`;
    },
  },
  {
    name: 'List API Routes',
    prompt: /^(列出所有的? API (路由|routes))$/i,
    // 使用函数来动态地从文件系统中读取信息并生成响应
    response: async ({ exec }) => {
      try {
        // 注意：在Windows上使用 'dir'，在Linux/macOS上使用 'ls'
        // 这里我们假设是Windows环境，因为初始上下文中有 'C:\\'
        const { stdout } = await exec('dir /b pages\\api');
        // 使用正则表达式来分割换行符，更具鲁棒性
        const files = stdout.split(/\r?\n/).filter(file => file && file.endsWith('.js') && !file.startsWith('cron'));
        
        if (files.length === 0) {
          return '在 pages/api 目录下没有找到主要的 API 路由文件。';
        }

        const fileList = files.map(file => `- /api/${file.replace('.js', '')}`).join('\n');
        
        return `项目中的主要 API 路由如下：\n${fileList}\n\n还有一个定时任务(cron job)在 /api/cron/re-index.`;
      } catch (error) {
        console.error('Error listing API routes:', error);
        return '抱歉，在列出 API 路由时发生了错误。';
      }
    },
  }
];
