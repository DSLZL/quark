// 轻量日志封装：方便后续替换为更专业的日志库（如 pino/winston）

export function logInfo(message, meta) {
  try {
    if (meta) console.info(`[INFO] ${message}`, meta);
    else console.info(`[INFO] ${message}`);
  } catch {}
}

export function logWarn(message, meta) {
  try {
    if (meta) console.warn(`[WARN] ${message}`, meta);
    else console.warn(`[WARN] ${message}`);
  } catch {}
}

export function logError(message, meta) {
  try {
    if (meta) console.error(`[ERROR] ${message}`, meta);
    else console.error(`[ERROR] ${message}`);
  } catch {}
}

