import { Router } from 'express'
import {
  getConfig,
  saveConfig,
  getBackupHistory,
  getUsbDrives,
  backupToUsb,
  backupToLocal,
  getStatus,
  listRestorePoints,
  previewBackup,
  restoreFromBackup,
} from '../services/backupService.js'

const router = Router()

// 获取备份配置
router.get('/config', (req, res) => {
  try {
    res.json({ success: true, data: getConfig() })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 更新备份配置
router.post('/config', (req, res) => {
  try {
    const newConfig = saveConfig(req.body)
    res.json({ success: true, data: newConfig })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 获取当前连接的 U 盘（两级检测：轻量扫盘符 + 按需 PowerShell）
router.get('/usb-drives', (req, res) => {
  try {
    const drives = getUsbDrives()
    res.json({ success: true, data: { drives, status: getStatus() } })
  } catch (e) {
    res.json({ success: true, data: { drives: [], status: getStatus(), error: e.message } })
  }
})

// 手动触发备份
router.post('/manual', async (req, res) => {
  try {
    const { target } = req.body
    if (target === 'usb') {
      const drives = getUsbDrives()
      if (drives.length === 0) {
        return res.status(400).json({ success: false, message: '未检测到 U 盘，请插入后再试' })
      }
      const drive = drives[0]
      const result = await backupToUsb(drive.DeviceID, drive.VolumeName || '未命名')
      if (result.success) {
        res.json(result)
      } else {
        res.status(500).json(result)
      }
    } else {
      const result = await backupToLocal()
      if (result.success) {
        res.json(result)
      } else {
        res.status(500).json(result)
      }
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 获取备份历史
router.get('/history', (req, res) => {
  try {
    const history = getBackupHistory()
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 20
    const start = (page - 1) * pageSize
    const paged = history.slice(start, start + pageSize)
    res.json({
      success: true,
      data: { list: paged, total: history.length, page, pageSize },
    })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 获取备份状态
router.get('/status', (req, res) => {
  try {
    res.json({ success: true, data: getStatus() })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 列出所有可还原的备份点
router.get('/restore-points', (req, res) => {
  try {
    const points = listRestorePoints()
    res.json({ success: true, data: points })
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 预览备份内容
router.get('/preview', (req, res) => {
  try {
    const { path: backupPath } = req.query
    if (!backupPath) {
      return res.status(400).json({ success: false, message: '缺少 path 参数' })
    }
    const result = previewBackup(backupPath)
    if (result.success) {
      res.json(result)
    } else {
      res.status(404).json(result)
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

// 从备份还原数据
router.post('/restore', async (req, res) => {
  try {
    const { path: backupPath } = req.body
    if (!backupPath) {
      return res.status(400).json({ success: false, message: '缺少 path 参数' })
    }
    const result = await restoreFromBackup(backupPath)
    if (result.success) {
      res.json(result)
    } else {
      res.status(500).json(result)
    }
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

export default router
