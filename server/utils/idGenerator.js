import { randomUUID } from 'crypto'

let counter = 0

/** 生成唯一 ID，格式: 时间戳-随机数-计数器 */
export function generateId(prefix = '') {
  counter++
  return `${prefix}${Date.now()}-${randomUUID().slice(0, 8)}-${counter}`
}

/** 简单数字 ID */
export function generateNumericId() {
  return Date.now()
}
