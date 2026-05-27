/** 格式化时间为 yyyy-MM-dd HH:mm:ss */
export function formatDateTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 成功响应 */
export function successResponse(res, data, message = 'ok') {
  return res.json({ success: true, data, message })
}

/** 错误响应 */
export function errorResponse(res, message, status = 500) {
  return res.status(status).json({ success: false, message })
}
