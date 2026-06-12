import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { DATA_DIR } from '../constants.js'
import { formatDateTime } from '../utils/formatters.js'

const CONFIG_FILE = path.join(DATA_DIR, 'backup-config.json')
const HISTORY_FILE = path.join(DATA_DIR, 'backup-history.json')
const LOCAL_BACKUP_DIR = path.join(DATA_DIR, 'snapshots')

// 默认配置
const DEFAULT_CONFIG = {
  autoMonitorEnabled: true,
  usbBackupEnabled: true,
  scheduleEnabled: false,
  scheduleTime: '02:00',
  maxBackupCount: 30,
  lastBackupTime: null,
  lastBackupStatus: null,
  lastBackupDrive: null,
}

// 运行时状态
let config = { ...DEFAULT_CONFIG }
let monitorInterval = null
let knownDrives = new Set()
let backupInProgress = false

// ========== 配置管理 ==========

export function readConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      config = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) }
    } else {
      saveConfig(config)
    }
  } catch {
    config = { ...DEFAULT_CONFIG }
  }
  return { ...config }
}

export function saveConfig(newConfig) {
  const oldAutoMonitor = config.autoMonitorEnabled
  config = { ...config, ...newConfig }
  try {
    if (!fs.existsSync(path.dirname(CONFIG_FILE))) {
      fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true })
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
  } catch (e) {
    console.error('[备份] 保存配置失败:', e.message)
  }
  // 如果 autoMonitorEnabled 改变，重启监控
  if (newConfig.autoMonitorEnabled !== undefined && newConfig.autoMonitorEnabled !== oldAutoMonitor) {
    restartUsbMonitor()
  }
  return { ...config }
}

export function getConfig() {
  return { ...config }
}

// ========== USB 检测（两级） ==========

/** 第一级：轻量扫描可用盘符（fs.accessSync，零开销，< 3ms） */
function scanDriveLetters() {
  const drives = []
  for (let letter = 68; letter <= 90; letter++) {
    const drivePath = `${String.fromCharCode(letter)}:\\`
    try {
      fs.accessSync(drivePath, fs.constants.F_OK)
      drives.push({ DeviceID: drivePath, VolumeName: '', SizeGB: 0, FreeGB: 0 })
    } catch { /* 盘符不存在 */ }
  }
  return drives
}

/** 第二级：PowerShell 查询单个盘符的详细信息（仅在需要时调用） */
function getDriveDetail(driveLetter) {
  try {
    const cmd = `powershell -NoProfile -Command "Get-CimInstance Win32_LogicalDisk | Where-Object { $_.DeviceID -eq '${driveLetter}' } | Select-Object DeviceID, VolumeName, @{N='SizeGB';E={[math]::Round($_.Size/1GB,2)}}, @{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,2)}} | ConvertTo-Json"`
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 5000, windowsHide: true }).trim()
    if (!output) return null
    const parsed = JSON.parse(output)
    // 如果是数组（奇怪的情况），取第一个
    return Array.isArray(parsed) ? parsed[0] : parsed
  } catch {
    return null
  }
}

/** 刷新 knownDrives：轻量扫描 + 对新盘符执行 PowerShell 获取详情 */
function refreshKnownDrives() {
  const scanned = scanDriveLetters()
  const scannedIds = new Set(scanned.map((d) => d.DeviceID))
  const driveMap = new Map()

  for (const drive of scanned) {
    if (knownDrives.has(drive.DeviceID)) {
      // 已知盘符，保留已有详情
      driveMap.set(drive.DeviceID, { DeviceID: drive.DeviceID, VolumeName: '', SizeGB: 0, FreeGB: 0 })
    } else {
      // 新盘符 → 用 PowerShell 获取详情
      const detail = getDriveDetail(drive.DeviceID)
      if (detail) {
        driveMap.set(drive.DeviceID, detail)
        console.log(`[备份] 检测到 U 盘插入: ${detail.DeviceID} (${detail.VolumeName || '未命名'}, ${detail.SizeGB}GB)`)
        onUsbMounted(detail)
      }
    }
  }

  // 检测移除
  for (const id of knownDrives) {
    if (!scannedIds.has(id)) {
      console.log(`[备份] U 盘已移除: ${id}`)
    }
  }

  knownDrives = scannedIds
}

/** 启动 USB 监控（轻量轮询，仅在 autoMonitorEnabled 时生效） */
export function startUsbMonitor() {
  readConfig()

  if (monitorInterval) clearInterval(monitorInterval)
  if (!config.autoMonitorEnabled) {
    console.log('[备份] USB 自动监测已关闭（仅支持手动刷新）')
    return { knownDrives: [...knownDrives] }
  }

  // 首次扫描
  refreshKnownDrives()
  console.log(`[备份] USB 轻量监控已启动，当前设备: ${[...knownDrives].join(', ') || '无'}`)

  monitorInterval = setInterval(() => {
    if (backupInProgress) return
    try {
      refreshKnownDrives()
    } catch (e) {
      console.error('[备份] USB 监控异常:', e.message)
    }
  }, 3000)

  return { knownDrives: [...knownDrives] }
}

export function stopUsbMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval)
    monitorInterval = null
    console.log('[备份] USB 监控已停止')
  }
}

/** 根据 autoMonitorEnabled 配置重启监控 */
export function restartUsbMonitor() {
  stopUsbMonitor()
  startUsbMonitor()
}

/** 主动获取 U 盘列表（两级扫描：轻量扫盘符 + PowerShell 获取详情） */
export function getUsbDrives() {
  const scanned = scanDriveLetters()
  const result = []
  for (const drive of scanned) {
    const detail = getDriveDetail(drive.DeviceID)
    if (detail) result.push(detail)
  }
  return result
}

function onUsbMounted(drive) {
  if (config.usbBackupEnabled) {
    setTimeout(() => {
      backupToUsb(drive.DeviceID, drive.VolumeName || '未命名')
    }, 1000)
  }
}

// ========== 备份执行 ==========

/** 备份到 U 盘 */
export async function backupToUsb(driveLetter, driveLabel) {
  if (backupInProgress) return { success: false, message: '备份正在进行中，请稍后再试' }
  backupInProgress = true

  const timestamp = formatDateTime().replace(/:/g, '-').replace(/ /g, '-')
  const backupDir = path.join(driveLetter + '/', 'baiwancheli-backup', timestamp)
  const startTime = Date.now()
  let fileCount = 0
  let totalSize = 0

  try {
    // 确保 U 盘可写
    if (!fs.existsSync(driveLetter + '/')) {
      const record = createRecord('usb', 'failed', driveLetter, driveLabel, '', 0, 0, 'U 盘不可访问')
      appendHistory(record)
      return { success: false, message: 'U 盘不可访问' }
    }

    // 创建备份目录
    fs.mkdirSync(backupDir, { recursive: true })

    // 复制数据文件
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('backup-'))
    for (const file of files) {
      const src = path.join(DATA_DIR, file)
      const dest = path.join(backupDir, file)
      fs.copyFileSync(src, dest)
      const stat = fs.statSync(src)
      fileCount++
      totalSize += stat.size
    }

    const duration = Date.now() - startTime
    const record = createRecord('usb', 'success', driveLetter, driveLabel, backupDir, fileCount, totalSize, null, duration)
    appendHistory(record)

    // 保存最后备份信息到配置
    saveConfig({
      lastBackupTime: formatDateTime(),
      lastBackupStatus: 'success',
      lastBackupDrive: `${driveLetter} (${driveLabel})`,
    })

    // 清理旧备份
    pruneOldUsbBackups(driveLetter)

    console.log(`[备份] USB 备份完成: ${backupDir} (${fileCount} 个文件, ${(totalSize / 1024).toFixed(1)}KB, ${duration}ms)`)
    return { success: true, message: 'USB 备份完成', record }
  } catch (e) {
    const record = createRecord('usb', 'failed', driveLetter, driveLabel, backupDir, 0, 0, e.message)
    appendHistory(record)
    saveConfig({ lastBackupTime: formatDateTime(), lastBackupStatus: 'failed', lastBackupDrive: driveLetter })
    console.error('[备份] USB 备份失败:', e.message)
    return { success: false, message: e.message }
  } finally {
    backupInProgress = false
  }
}

/** 备份到本地 */
export async function backupToLocal() {
  if (backupInProgress) return { success: false, message: '备份正在进行中，请稍后再试' }
  backupInProgress = true

  const timestamp = formatDateTime().replace(/:/g, '-').replace(/ /g, '-')
  const backupDir = path.join(LOCAL_BACKUP_DIR, timestamp)
  const startTime = Date.now()
  let fileCount = 0
  let totalSize = 0

  try {
    if (!fs.existsSync(LOCAL_BACKUP_DIR)) {
      fs.mkdirSync(LOCAL_BACKUP_DIR, { recursive: true })
    }
    fs.mkdirSync(backupDir, { recursive: true })

    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('backup-'))
    for (const file of files) {
      const src = path.join(DATA_DIR, file)
      const dest = path.join(backupDir, file)
      fs.copyFileSync(src, dest)
      const stat = fs.statSync(src)
      fileCount++
      totalSize += stat.size
    }

    const duration = Date.now() - startTime
    const record = createRecord('local', 'success', null, null, backupDir, fileCount, totalSize, null, duration)
    appendHistory(record)
    saveConfig({ lastBackupTime: formatDateTime(), lastBackupStatus: 'success', lastBackupDrive: 'local' })

    console.log(`[备份] 本地备份完成: ${backupDir} (${fileCount} 个文件, ${(totalSize / 1024).toFixed(1)}KB, ${duration}ms)`)
    return { success: true, message: '本地备份完成', record }
  } catch (e) {
    const record = createRecord('local', 'failed', null, null, backupDir, 0, 0, e.message)
    appendHistory(record)
    console.error('[备份] 本地备份失败:', e.message)
    return { success: false, message: e.message }
  } finally {
    backupInProgress = false
  }
}

// ========== 数据还原 ==========

/** 列出所有可还原的备份点（本地 + USB） */
export function listRestorePoints() {
  const points = []

  // 本地备份
  try {
    if (fs.existsSync(LOCAL_BACKUP_DIR)) {
      const dirs = fs.readdirSync(LOCAL_BACKUP_DIR)
      for (const dir of dirs) {
        const fullPath = path.join(LOCAL_BACKUP_DIR, dir)
        try {
          const stat = fs.statSync(fullPath)
          if (!stat.isDirectory()) continue
          const files = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'))
          let totalSize = 0
          for (const f of files) totalSize += fs.statSync(path.join(fullPath, f)).size
          points.push({
            type: 'local',
            path: fullPath,
            timestamp: dir,
            fileCount: files.length,
            totalSize,
          })
        } catch {}
      }
    }
  } catch {}

  // USB 备份
  try {
    const usbDrives = getUsbDrives()
    for (const drive of usbDrives) {
      const usbBackupRoot = path.join(drive.DeviceID + '/', 'baiwancheli-backup')
      try {
        if (!fs.existsSync(usbBackupRoot)) continue
        const dirs = fs.readdirSync(usbBackupRoot)
        for (const dir of dirs) {
          const fullPath = path.join(usbBackupRoot, dir)
          try {
            const stat = fs.statSync(fullPath)
            if (!stat.isDirectory()) continue
            const files = fs.readdirSync(fullPath).filter((f) => f.endsWith('.json'))
            let totalSize = 0
            for (const f of files) totalSize += fs.statSync(path.join(fullPath, f)).size
            points.push({
              type: 'usb',
              path: fullPath,
              drive: `${drive.DeviceID} (${drive.VolumeName || '未命名'})`,
              timestamp: dir,
              fileCount: files.length,
              totalSize,
            })
          } catch {}
        }
      } catch {}
    }
  } catch {}

  // 按时间倒序
  points.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
  return points
}

/** 预览备份内容（文件列表） */
export function previewBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, message: '备份目录不存在' }
    }
    const files = fs.readdirSync(backupPath)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const stat = fs.statSync(path.join(backupPath, f))
        return { name: f, size: stat.size }
      })
    return { success: true, files }
  } catch (e) {
    return { success: false, message: e.message }
  }
}

/** 从备份还原数据（带安全备份） */
export async function restoreFromBackup(backupPath) {
  if (backupInProgress) return { success: false, message: '备份/还原正在进行中，请稍后再试' }
  backupInProgress = true

  let preRestoreRecord = null
  try {
    if (!fs.existsSync(backupPath)) {
      backupInProgress = false
      return { success: false, message: '备份目录不存在' }
    }

    // 安全机制：还原前自动创建备份（暂时解除锁以允许嵌套备份调用）
    console.log('[还原] 正在创建恢复前安全备份...')
    backupInProgress = false
    const safetyResult = await backupToLocal()
    preRestoreRecord = safetyResult.record || null
    backupInProgress = true

    // 执行还原：逐个复制 JSON 文件到 DATA_DIR
    const files = fs.readdirSync(backupPath).filter((f) => f.endsWith('.json') && !f.startsWith('backup-'))
    let restored = 0
    for (const file of files) {
      const src = path.join(backupPath, file)
      const dest = path.join(DATA_DIR, file)
      fs.copyFileSync(src, dest)
      restored++
    }

    // 清除 fileStore 内存缓存，让后续读取重新加载
    try {
      const { clearCache } = await import('./fileStore.js')
      clearCache()
    } catch {}

    const record = createRecord('restore', 'success', null, null, backupPath, restored, 0, null, 0)
    appendHistory(record)

    console.log(`[还原] 数据还原完成: 从 ${backupPath} 恢复了 ${restored} 个文件`)
    return {
      success: true,
      message: `成功恢复 ${restored} 个文件`,
      filesRestored: restored,
      preRestoreBackup: preRestoreRecord,
    }
  } catch (e) {
    console.error('[还原] 数据还原失败:', e.message)
    return { success: false, message: e.message }
  } finally {
    backupInProgress = false
  }
}

// ========== 定时备份 ==========

/** 定时备份（被 scheduler 调用） */
export async function scheduledBackup() {
  console.log('[备份] 执行定时备份...')
  return backupToLocal()
}

let scheduleInterval = null

/** 启动定时备份检查器（每分钟检查一次） */
export function startScheduleChecker() {
  if (scheduleInterval) clearInterval(scheduleInterval)
  scheduleInterval = setInterval(() => {
    const cfg = getConfig()
    if (cfg.scheduleEnabled && cfg.scheduleTime) {
      const now = new Date()
      const [h, m] = cfg.scheduleTime.split(':').map(Number)
      if (now.getHours() === h && now.getMinutes() === m) {
        console.log(`[备份] 定时备份触发 (${cfg.scheduleTime})`)
        scheduledBackup()
      }
    }
  }, 60000)
  console.log('[备份] 定时备份检查器已启动')
}

export function stopScheduleChecker() {
  if (scheduleInterval) {
    clearInterval(scheduleInterval)
    scheduleInterval = null
  }
}

// ========== 备份历史 ==========

function createRecord(type, status, drive, driveLabel, backupPath, fileCount, totalSize, error, duration) {
  return {
    id: `backup-${Date.now()}`,
    type,
    time: formatDateTime(),
    status,
    drive,
    driveLabel,
    path: backupPath,
    fileCount,
    totalSize,
    error,
    duration,
  }
}

export function getBackupHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'))
    }
  } catch {}
  return []
}

function appendHistory(record) {
  const history = getBackupHistory()
  history.unshift(record)
  // 保留最近 100 条记录
  if (history.length > 100) history.length = 100
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8')
  } catch (e) {
    console.error('[备份] 写入历史失败:', e.message)
  }
}

// ========== 清理旧备份 ==========

function pruneOldUsbBackups(driveLetter) {
  const baseDir = path.join(driveLetter + '/', 'baiwancheli-backup')
  try {
    if (!fs.existsSync(baseDir)) return
    const dirs = fs.readdirSync(baseDir)
      .filter((d) => /^\d{4}-\d{2}-\d{2}/.test(d))
      .sort()
      .reverse() // 最新的在前

    const max = config.maxBackupCount || 30
    const toRemove = dirs.slice(max)
    for (const dir of toRemove) {
      fs.rmSync(path.join(baseDir, dir), { recursive: true, force: true })
      console.log(`[备份] 清理旧备份: ${dir}`)
    }
  } catch (e) {
    console.error('[备份] 清理失败:', e.message)
  }
}

// ========== 服务状态 ==========

export function getStatus() {
  return {
    isMonitoring: monitorInterval !== null,
    backupInProgress,
    knownDrives: [...knownDrives],
    config: { ...config },
  }
}

// 初始化时读取配置
readConfig()
