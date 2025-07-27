// utils/config.js

const quarkConfig = {
  // 是否启用排序功能
  enableSorting: true,

  // 是否启用分享检测功能
  enableShareDetection: true,

  // 是否启用调试日志
  enableDebugLogging: false,

  // API 请求分页大小
  apiPageSize: 50,

  // 分享检测最大重试次数
  shareCheckMaxRetries: 10,

  // 分享检测轮询间隔（毫秒）
  shareCheckPollInterval: 500,

  // API 请求的 User-Agent
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

export default quarkConfig;
