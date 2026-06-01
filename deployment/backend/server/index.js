import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { DATA_DIR, DATA_FILES } from './constants.js'
import { requestLogger } from './middleware/requestLogger.js'
import { errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.routes.js'
import memberRoutes from './routes/members.routes.js'
import recordRoutes from './routes/records.routes.js'
import tableRoutes from './routes/tables.routes.js'
import orderRoutes from './routes/orders.routes.js'
import snackRoutes from './routes/snacks.routes.js'
import packageRoutes from './routes/packages.routes.js'
import statisticsRoutes from './routes/statistics.routes.js'
import healthRoutes from './routes/health.routes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// 全局中间件
app.use(cors())
app.use(express.json())
app.use(requestLogger)

// 提供前端静态文件
const frontendPath = path.join(__dirname, 'dist')
// 非 API 请求：先尝试匹配静态文件，找不到则返回 index.html（SPA 回退）
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next()
  const filePath = path.join(frontendPath, req.path === '/' ? 'index.html' : req.path)
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase()
      const mimeTypes = {
        '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
        '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff': 'font/woff',
        '.woff2': 'font/woff2',
      }
      res.type(mimeTypes[ext] || 'application/octet-stream').send(fs.readFileSync(filePath))
      return
    }
  } catch {}
  res.type('html').send(fs.readFileSync(path.join(frontendPath, 'index.html'), 'utf-8'))
})

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 挂载路由
app.use('/api', authRoutes)
app.use('/api/members', memberRoutes)
app.use('/api', recordRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/snacks', snackRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/statistics', statisticsRoutes)
app.use('/api/health', healthRoutes)

// 全局错误处理（必须在所有路由之后）
app.use(errorHandler)

// 启动服务
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
  console.log('\n数据文件路径:')
  Object.entries(DATA_FILES).forEach(([key, filePath]) => {
    console.log(`  ${key}: ${filePath}`)
  })
})
