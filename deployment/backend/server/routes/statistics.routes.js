import { Router } from 'express'
import { getOverview } from '../services/statisticsService.js'

const router = Router()

router.get('/overview', (req, res) => {
  try {
    res.json({ success: true, data: getOverview() })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ success: false, message: '获取统计数据失败' })
  }
})

export default router
