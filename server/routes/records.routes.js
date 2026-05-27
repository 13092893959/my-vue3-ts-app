import { Router } from 'express'
import { readData, writeData } from '../services/fileStore.js'
import { generateId } from '../utils/idGenerator.js'
import { formatDateTime } from '../utils/formatters.js'

const router = Router()

// 充值记录
router.get('/recharge-records', (req, res) => {
  try {
    res.json({ success: true, data: readData('rechargeRecords') })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取充值记录失败' })
  }
})

router.post('/recharge-records', (req, res) => {
  try {
    const records = readData('rechargeRecords')
    const record = { ...req.body, id: generateId(), date: formatDateTime() }
    records.push(record)
    writeData('rechargeRecords', records)
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加充值记录失败' })
  }
})

// 消费记录
router.get('/consumption-records', (req, res) => {
  try {
    res.json({ success: true, data: readData('consumptionRecords') })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取消费记录失败' })
  }
})

router.post('/consumption-records', (req, res) => {
  try {
    const records = readData('consumptionRecords')
    const record = { ...req.body, id: generateId(), date: formatDateTime() }
    records.push(record)
    writeData('consumptionRecords', records)
    res.json({ success: true, data: record })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加消费记录失败' })
  }
})

export default router
