import { Router } from 'express'
import { readData, writeData } from '../services/fileStore.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: readData('snacks') })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取零食列表失败' })
  }
})

router.post('/', (req, res) => {
  try {
    writeData('snacks', req.body)
    res.json({ success: true, data: req.body })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存零食数据失败' })
  }
})

router.post('/create', (req, res) => {
  try {
    const snacks = readData('snacks')
    if (snacks.find((s) => s.id === req.body.id)) {
      return res.status(400).json({ success: false, message: '零食ID已存在' })
    }
    snacks.push(req.body)
    writeData('snacks', snacks)
    res.json({ success: true, data: req.body })
  } catch (error) {
    console.error('创建零食失败:', error)
    res.status(500).json({ success: false, message: '创建零食失败' })
  }
})

router.put('/:snackId', (req, res) => {
  try {
    const snacks = readData('snacks')
    const index = snacks.findIndex((s) => s.id === req.params.snackId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: '零食不存在' })
    }
    snacks[index] = { ...snacks[index], ...req.body }
    writeData('snacks', snacks)
    res.json({ success: true, data: snacks[index] })
  } catch (error) {
    console.error('更新零食失败:', error)
    res.status(500).json({ success: false, message: '更新零食失败' })
  }
})

router.delete('/:snackId', (req, res) => {
  try {
    const snacks = readData('snacks')
    const index = snacks.findIndex((s) => s.id === req.params.snackId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: '零食不存在' })
    }
    snacks.splice(index, 1)
    writeData('snacks', snacks)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除零食失败:', error)
    res.status(500).json({ success: false, message: '删除零食失败' })
  }
})

export default router
