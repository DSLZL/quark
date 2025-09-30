// 统一的 API 错误包装与响应格式
import { logError } from './logger';

export class BadRequestError extends Error {
  constructor(message = 'Bad Request') { super(message); this.name = 'BadRequestError'; this.status = 400; }
}
export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') { super(message); this.name = 'UnauthorizedError'; this.status = 401; }
}
export class UpstreamError extends Error {
  constructor(message = 'Upstream Error') { super(message); this.name = 'UpstreamError'; this.status = 502; }
}

export function withApiHandler(handler) {
  return async function wrapped(req, res) {
    try {
      const result = await handler(req, res);
      // 允许 handler 自行写入响应；若未写入且有返回值，则统一 JSON 输出
      if (!res.headersSent && result !== undefined) {
        res.status(200).json(result);
      }
    } catch (err) {
      const status = Number(err?.status) || inferStatus(err);
      const payload = {
        error: err?.message || 'An unexpected server error occurred.',
      };
      if (process.env.NODE_ENV !== 'production') {
        payload.details = err?.stack || String(err);
      }
      logError('API Error', { path: req.url, status, name: err?.name, message: err?.message });
      if (!res.headersSent) {
        res.status(status).json(payload);
      }
    }
  };
}

function inferStatus(err) {
  if (!err) return 500;
  const name = String(err.name || '').toLowerCase();
  if (name.includes('unauthorized')) return 401;
  if (name.includes('forbidden')) return 403;
  if (name.includes('notfound')) return 404;
  if (name.includes('upstream')) return 502;
  if (name.includes('bad') || name.includes('request')) return 400;
  return 500;
}

