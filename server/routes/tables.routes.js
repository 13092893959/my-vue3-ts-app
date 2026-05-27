import { Router } from 'express'
import * as tableService from '../services/tableService.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: tableService.getTables() })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取桌台列表失败' })
  }
})

router.post('/', (req, res) => {
  try {
    const data = tableService.saveTables(req.body)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存桌台数据失败' })
  }
})

export default router
