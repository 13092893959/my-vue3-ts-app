import { Router } from 'express'
import { readData, writeData } from '../services/fileStore.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: readData('packages') })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取套餐列表失败' })
  }
})

router.post('/', (req, res) => {
  try {
    writeData('packages', req.body)
    res.json({ success: true, data: req.body })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存套餐数据失败' })
  }
})

router.post('/create', (req, res) => {
  try {
    const packages = readData('packages')
    if (packages.find((p) => p.id === req.body.id)) {
      return res.status(400).json({ success: false, message: '套餐ID已存在' })
    }
    packages.push(req.body)
    writeData('packages', packages)
    res.json({ success: true, data: req.body })
  } catch (error) {
    console.error('创建套餐失败:', error)
    res.status(500).json({ success: false, message: '创建套餐失败' })
  }
})

router.put('/:packageId', (req, res) => {
  try {
    const packages = readData('packages')
    const index = packages.findIndex((p) => p.id === req.params.packageId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: '套餐不存在' })
    }
    packages[index] = { ...packages[index], ...req.body }
    writeData('packages', packages)
    res.json({ success: true, data: packages[index] })
  } catch (error) {
    console.error('更新套餐失败:', error)
    res.status(500).json({ success: false, message: '更新套餐失败' })
  }
})

router.delete('/:packageId', (req, res) => {
  try {
    const packages = readData('packages')
    const index = packages.findIndex((p) => p.id === req.params.packageId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: '套餐不存在' })
    }
    packages.splice(index, 1)
    writeData('packages', packages)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除套餐失败:', error)
    res.status(500).json({ success: false, message: '删除套餐失败' })
  }
})

export default router
