import { execSync } from 'node:child_process'
import { cp, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// [1/2] 前端构建到 deployment/backend/server/dist（后端 index.js 静态托管此目录）
console.log('▶ [1/2] 构建前端 -> deployment/backend/server/dist ...')
execSync('npx vite build --outDir deployment/backend/server/dist --emptyOutDir', {
  cwd: root,
  stdio: 'inherit',
})

// [2/2] 同步后端源码（排除 index.js，保留部署版静态托管逻辑）
console.log('\n▶ [2/2] 同步后端源码 -> deployment/backend/server ...')
const srcServer = path.join(root, 'server')
const destServer = path.join(root, 'deployment', 'backend', 'server')
for (const entry of await readdir(srcServer)) {
  if (entry === 'index.js') continue // 保留部署版 index.js
  await cp(path.join(srcServer, entry), path.join(destServer, entry), {
    recursive: true,
    force: true,
  })
}

console.log('\n✅ 全量部署包构建完成')
