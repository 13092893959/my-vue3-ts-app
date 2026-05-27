/** 全局错误处理中间件 */
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500
  const message = err.message || '服务器内部错误'

  console.error(`[ERROR] ${req.method} ${req.path} — ${status}: ${message}`)
  if (status === 500) {
    console.error(err.stack)
  }

  res.status(status).json({ success: false, message })
}
