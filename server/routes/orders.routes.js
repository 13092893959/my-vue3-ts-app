import { Router } from 'express'
import * as orderService from '../services/orderService.js'

const router = Router()

router.get('/', (req, res) => {
  try {
    res.json({ success: true, data: orderService.getOrders() })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单列表失败' })
  }
})

router.get('/table/:tableId', (req, res) => {
  try {
    res.json({ success: true, data: orderService.getOrdersByTable(req.params.tableId) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取桌台订单失败' })
  }
})

router.get('/batch/:batchId', (req, res) => {
  try {
    res.json({ success: true, data: orderService.getOrdersByBatch(req.params.batchId) })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取批次订单失败' })
  }
})

router.post('/', (req, res) => {
  try {
    const order = orderService.createOrder(req.body)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ success: false, message: '创建订单失败' })
  }
})

router.put('/:orderId/remark', (req, res) => {
  try {
    const order = orderService.updateOrderRemark(req.params.orderId, req.body)
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('更新订单备注失败:', error)
    res.status(error.status || 500).json({ success: false, message: error.message || '更新订单备注失败' })
  }
})

export default router
