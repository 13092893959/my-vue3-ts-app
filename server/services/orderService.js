import { readData, writeData } from './fileStore.js'
import { generateId } from '../utils/idGenerator.js'

export function getOrders() {
  return readData('orders')
}

export function getOrdersByTable(tableId) {
  return readData('orders').filter((o) => o.tableId === tableId)
}

export function getOrdersByBatch(batchId) {
  return readData('orders').filter((o) => o.settlementBatchId === batchId)
}

export function createOrder(data) {
  const orders = readData('orders')
  const order = {
    ...data,
    id: generateId('ORD'),
    createTime: new Date().toISOString(),
    status: data.status || 'completed',
  }
  orders.push(order)
  writeData('orders', orders)
  return order
}

export function updateOrderRemark(orderId, updates) {
  const orders = readData('orders')
  const index = orders.findIndex((o) => o.id === orderId)
  if (index === -1) {
    throw Object.assign(new Error('订单不存在'), { status: 404 })
  }
  if (typeof updates === 'object' && updates !== null) {
    Object.assign(orders[index], updates)
  } else {
    orders[index].remark = updates || ''
  }
  writeData('orders', orders)
  return orders[index]
}
