import fs from 'fs'
import path from 'path'
import { DATA_DIR, DATA_FILES, DATA_TYPES } from '../constants.js'
import { formatDateTime } from '../utils/formatters.js'

const BACKUP_DIR = path.join(DATA_DIR, 'backups')
const MAX_BACKUPS = 50

// 内存缓存
const cache = new Map()

// 写锁：每个数据类型的 Promise 队列，防止并发写覆盖
const writeQueues = Object.fromEntries(DATA_TYPES.map((t) => [t, Promise.resolve()]))

// 确保备份目录存在
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

/** 清理旧备份，保留最近 MAX_BACKUPS 个 */
function cleanOldBackups(type) {
  try {
    const prefix = `${type}-`
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith(prefix) && f.endsWith('.json'))
      .sort()
    while (files.length > MAX_BACKUPS) {
      fs.unlinkSync(path.join(BACKUP_DIR, files.shift()))
    }
  } catch {
    // 备份清理失败不影响主流程
  }
}

/** 读取数据（优先从缓存） */
export function readData(type) {
  if (!DATA_FILES[type]) {
    console.error(`未知数据类型: ${type}`)
    return []
  }

  // 有缓存直接返回（深拷贝防止外部修改污染缓存）
  if (cache.has(type)) {
    try {
      return JSON.parse(JSON.stringify(cache.get(type)))
    } catch {
      cache.delete(type)
    }
  }

  try {
    const filePath = DATA_FILES[type]
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      cache.set(type, data)
      return JSON.parse(JSON.stringify(data))
    }
    writeDataSync(type, [])
    return []
  } catch (error) {
    console.error(`读取${type}数据文件失败:`, error)
    return []
  }
}

/** 同步写入（内部使用，不加锁） */
function writeDataSync(type, data) {
  const filePath = DATA_FILES[type]
  if (!filePath) {
    console.error(`未知数据类型: ${type}`)
    return
  }
  try {
    // 事务性写入：先写临时文件，成功后再 rename
    const tmpPath = filePath + '.tmp'
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmpPath, filePath)
    cache.set(type, data)
  } catch (error) {
    console.error(`写入${type}数据文件失败:`, error)
    throw error
  }
}

/** 写入数据（加写锁，自动备份） */
export function writeData(type, data) {
  if (!DATA_FILES[type]) {
    console.error(`未知数据类型: ${type}`)
    return
  }

  // 排队写入：每个 type 串行执行，不同 type 可并行
  const task = writeQueues[type].then(() => {
    try {
      // 备份旧文件
      const filePath = DATA_FILES[type]
      if (fs.existsSync(filePath)) {
        const backupName = `${type}-${formatDateTime().replace(/:/g, '-')}.json`
        fs.copyFileSync(filePath, path.join(BACKUP_DIR, backupName))
        cleanOldBackups(type)
      }
      writeDataSync(type, data)
    } catch (error) {
      console.error(`写入${type}数据文件失败:`, error)
      throw error
    }
  })

  writeQueues[type] = task.catch(() => {})
  return task
}

/** 读取所有数据 */
export function readAllData() {
  const result = {}
  for (const type of DATA_TYPES) {
    result[type] = readData(type)
  }
  return result
}

/** 清除缓存（用于测试或强制刷新） */
export function clearCache(type) {
  if (type) {
    cache.delete(type)
  } else {
    cache.clear()
  }
}

/** 从缓存读取（不触发文件 I/O，用于高频读取） */
export function readDataFromCache(type) {
  return cache.has(type) ? JSON.parse(JSON.stringify(cache.get(type))) : readData(type)
}
