import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

// 在生产环境下提供前端静态文件
const isProduction = process.env.NODE_ENV === 'production'
if (isProduction) {
  const frontendPath = path.join(__dirname, '..', 'frontend', 'dist')
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath))
    
    // 所有非API请求都返回index.html（支持Vue Router的history模式）
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(frontendPath, 'index.html'))
      }
    })
  }
}

// 数据文件路径配置
const DATA_DIR = 'D:/data/baiwancheli'
const DATA_FILES = {
  members: path.join(DATA_DIR, 'members.json'),
  rechargeRecords: path.join(DATA_DIR, 'recharge-records.json'),
  consumptionRecords: path.join(DATA_DIR, 'consumption-records.json'),
  tables: path.join(DATA_DIR, 'tables.json'),
  orders: path.join(DATA_DIR, 'orders.json'),
  snacks: path.join(DATA_DIR, 'snacks.json'),
  packages: path.join(DATA_DIR, 'packages.json')
}

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 默认数据
const defaultData = {
  members: [],
  rechargeRecords: [],
  consumptionRecords: [],
  tables: [],
  orders: [],
  snacks: [],
  packages: []
}

// 读取指定类型的数据文件
const readData = (type) => {
  try {
    const filePath = DATA_FILES[type]
    if (!filePath) {
      console.error(`未知数据类型: ${type}`)
      return []
    }
    
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(data)
    }
    // 如果文件不存在，创建空数组
    writeData(type, [])
    return []
  } catch (error) {
    console.error(`读取${type}数据文件失败:`, error)
    return []
  }
}

// 写入指定类型的数据文件
const writeData = (type, data) => {
  try {
    const filePath = DATA_FILES[type]
    if (!filePath) {
      console.error(`未知数据类型: ${type}`)
      return
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error(`写入${type}数据文件失败:`, error)
    throw error
  }
}

// 读取所有数据（用于初始化）
const readAllData = () => {
  return {
    members: readData('members'),
    rechargeRecords: readData('rechargeRecords'),
    consumptionRecords: readData('consumptionRecords'),
    tables: readData('tables'),
    orders: readData('orders'),
    snacks: readData('snacks'),
    packages: readData('packages')
  }
}

// ========== 登录接口 ==========
const validUser = {
  username: 'admin',
  password: '123456',
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body

  if (username === validUser.username && password === validUser.password) {
    return res.json({ success: true })
  }

  return res.status(401).json({ success: false, message: '用户名或密码错误' })
})

// ========== 会员管理接口 ==========

// 获取所有会员
app.get('/api/members', (req, res) => {
  try {
    const members = readData('members')
    res.json({ success: true, data: members })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取会员列表失败' })
  }
})

// 添加会员
app.post('/api/members', (req, res) => {
  try {
    const members = readData('members')
    const newMember = req.body
    
    // 检查手机号是否已存在
    const existingMember = members.find(m => m.phone === newMember.phone)
    if (existingMember) {
      return res.status(400).json({ success: false, message: '该手机号已办理会员卡' })
    }
    
    // 生成唯一ID
    newMember.id = Date.now()
    newMember.createTime = new Date().toISOString().replace('T', ' ').split('.')[0]
    
    members.push(newMember)
    writeData('members', members)
    
    res.json({ success: true, data: newMember })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加会员失败' })
  }
})

// 更新会员
app.put('/api/members/:phone', (req, res) => {
  try {
    const members = readData('members')
    const { phone } = req.params
    const updates = req.body
    
    const memberIndex = members.findIndex(m => m.phone === phone)
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: '会员不存在' })
    }
    
    // 更新会员信息
    members[memberIndex] = {
      ...members[memberIndex],
      ...updates,
      phone // 保持手机号不变
    }
    
    writeData('members', members)
    res.json({ success: true, data: members[memberIndex] })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新会员失败' })
  }
})

// 删除会员
app.delete('/api/members/:phone', (req, res) => {
  try {
    const members = readData('members')
    const { phone } = req.params
    
    const memberIndex = members.findIndex(m => m.phone === phone)
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, message: '会员不存在' })
    }
    
    members.splice(memberIndex, 1)
    writeData('members', members)
    
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '删除会员失败' })
  }
})

// ========== 充值记录接口 ==========

// 获取充值记录
app.get('/api/recharge-records', (req, res) => {
  try {
    const records = readData('rechargeRecords')
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取充值记录失败' })
  }
})

// 添加充值记录
app.post('/api/recharge-records', (req, res) => {
  try {
    const records = readData('rechargeRecords')
    const newRecord = req.body
    
    newRecord.id = Date.now()
    newRecord.date = new Date().toISOString().replace('T', ' ').split('.')[0]
    
    records.push(newRecord)
    writeData('rechargeRecords', records)
    
    res.json({ success: true, data: newRecord })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加充值记录失败' })
  }
})

// ========== 消费记录接口 ==========

// 获取消费记录
app.get('/api/consumption-records', (req, res) => {
  try {
    const records = readData('consumptionRecords')
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取消费记录失败' })
  }
})

// 添加消费记录
app.post('/api/consumption-records', (req, res) => {
  try {
    const records = readData('consumptionRecords')
    const newRecord = req.body
    
    newRecord.id = Date.now()
    newRecord.date = new Date().toISOString().replace('T', ' ').split('.')[0]
    
    records.push(newRecord)
    writeData('consumptionRecords', records)
    
    res.json({ success: true, data: newRecord })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加消费记录失败' })
  }
})

// ========== 桌台管理接口 ==========

// 获取所有桌台
app.get('/api/tables', (req, res) => {
  try {
    const tables = readData('tables')
    res.json({ success: true, data: tables })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取桌台列表失败' })
  }
})

// 保存所有桌台（用于批量更新）
app.post('/api/tables', (req, res) => {
  try {
    const tables = req.body
    writeData('tables', tables)
    res.json({ success: true, data: tables })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存桌台数据失败' })
  }
})

// ========== 订单管理接口 ==========

// 获取所有订单
app.get('/api/orders', (req, res) => {
  try {
    const orders = readData('orders')
    res.json({ success: true, data: orders })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取订单列表失败' })
  }
})

// 获取指定桌台的订单
app.get('/api/orders/table/:tableId', (req, res) => {
  try {
    const { tableId } = req.params
    const orders = readData('orders')
    const tableOrders = orders.filter(order => order.tableId === tableId)
    res.json({ success: true, data: tableOrders })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取桌台订单失败' })
  }
})

// 创建订单
app.post('/api/orders', (req, res) => {
  try {
    const newOrder = req.body
    const orders = readData('orders')
    
    // 添加订单ID和创建时间
    const order = {
      ...newOrder,
      id: `ORD${Date.now()}`,
      createTime: new Date().toISOString(),
      status: 'completed'
    }
    
    orders.push(order)
    writeData('orders', orders)
    
    res.json({ success: true, data: order })
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ success: false, message: '创建订单失败' })
  }
})

// 更新订单备注
app.put('/api/orders/:orderId/remark', (req, res) => {
  try {
    const { orderId } = req.params
    const { remark } = req.body
    const orders = readData('orders')
    
    const orderIndex = orders.findIndex(o => o.id === orderId)
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    orders[orderIndex].remark = remark || ''
    writeData('orders', orders)
    
    res.json({ success: true, data: orders[orderIndex] })
  } catch (error) {
    console.error('更新订单备注失败:', error)
    res.status(500).json({ success: false, message: '更新订单备注失败' })
  }
})

// ========== 零食管理接口 ==========

// 获取所有零食
app.get('/api/snacks', (req, res) => {
  try {
    const snacks = readData('snacks')
    res.json({ success: true, data: snacks })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取零食列表失败' })
  }
})

// 保存所有零食（用于批量更新）
app.post('/api/snacks', (req, res) => {
  try {
    const snacks = req.body
    writeData('snacks', snacks)
    res.json({ success: true, data: snacks })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存零食数据失败' })
  }
})

// 创建单个零食
app.post('/api/snacks/create', (req, res) => {
  try {
    const newSnack = req.body
    const snacks = readData('snacks')
    
    // 检查ID是否已存在
    if (snacks.find(s => s.id === newSnack.id)) {
      return res.status(400).json({ success: false, message: '零食ID已存在' })
    }
    
    snacks.push(newSnack)
    writeData('snacks', snacks)
    
    res.json({ success: true, data: newSnack })
  } catch (error) {
    console.error('创建零食失败:', error)
    res.status(500).json({ success: false, message: '创建零食失败' })
  }
})

// 更新零食
app.put('/api/snacks/:snackId', (req, res) => {
  try {
    const { snackId } = req.params
    const updatedSnack = req.body
    const snacks = readData('snacks')
    
    const snackIndex = snacks.findIndex(s => s.id === snackId)
    if (snackIndex === -1) {
      return res.status(404).json({ success: false, message: '零食不存在' })
    }
    
    snacks[snackIndex] = { ...snacks[snackIndex], ...updatedSnack }
    writeData('snacks', snacks)
    
    res.json({ success: true, data: snacks[snackIndex] })
  } catch (error) {
    console.error('更新零食失败:', error)
    res.status(500).json({ success: false, message: '更新零食失败' })
  }
})

// 删除零食
app.delete('/api/snacks/:snackId', (req, res) => {
  try {
    const { snackId } = req.params
    const snacks = readData('snacks')
    
    const snackIndex = snacks.findIndex(s => s.id === snackId)
    if (snackIndex === -1) {
      return res.status(404).json({ success: false, message: '零食不存在' })
    }
    
    snacks.splice(snackIndex, 1)
    writeData('snacks', snacks)
    
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除零食失败:', error)
    res.status(500).json({ success: false, message: '删除零食失败' })
  }
})

// ========== 套餐管理接口 ==========

// 获取所有套餐
app.get('/api/packages', (req, res) => {
  try {
    const packages = readData('packages')
    res.json({ success: true, data: packages })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取套餐列表失败' })
  }
})

// 保存所有套餐
app.post('/api/packages', (req, res) => {
  try {
    const packages = req.body
    writeData('packages', packages)
    res.json({ success: true, data: packages })
  } catch (error) {
    res.status(500).json({ success: false, message: '保存套餐数据失败' })
  }
})

// 创建单个套餐
app.post('/api/packages/create', (req, res) => {
  try {
    const newPackage = req.body
    const packages = readData('packages')
    
    if (packages.find(p => p.id === newPackage.id)) {
      return res.status(400).json({ success: false, message: '套餐ID已存在' })
    }
    
    packages.push(newPackage)
    writeData('packages', packages)
    res.json({ success: true, data: newPackage })
  } catch (error) {
    console.error('创建套餐失败:', error)
    res.status(500).json({ success: false, message: '创建套餐失败' })
  }
})

// 更新套餐
app.put('/api/packages/:packageId', (req, res) => {
  try {
    const { packageId } = req.params
    const updatedPackage = req.body
    const packages = readData('packages')
    
    const index = packages.findIndex(p => p.id === packageId)
    if (index === -1) {
      return res.status(404).json({ success: false, message: '套餐不存在' })
    }
    
    packages[index] = { ...packages[index], ...updatedPackage }
    writeData('packages', packages)
    res.json({ success: true, data: packages[index] })
  } catch (error) {
    console.error('更新套餐失败:', error)
    res.status(500).json({ success: false, message: '更新套餐失败' })
  }
})

// 删除套餐
app.delete('/api/packages/:packageId', (req, res) => {
  try {
    const { packageId } = req.params
    const packages = readData('packages')
    
    const index = packages.findIndex(p => p.id === packageId)
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

// ========== 健康检查 ==========
app.get('/api/health', (_, res) => {
  res.json({ 
    ok: true,
    dataFiles: {
      members: DATA_FILES.members,
      rechargeRecords: DATA_FILES.rechargeRecords,
      consumptionRecords: DATA_FILES.consumptionRecords,
      tables: DATA_FILES.tables,
      orders: DATA_FILES.orders,
      snacks: DATA_FILES.snacks,
      packages: DATA_FILES.packages
    }
  })
})

// 获取首页统计数据
app.get('/api/statistics/overview', (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStart = yesterday.getTime()
    
    // 读取所有数据
    const orders = readData('orders')
    const members = readData('members')
    const rechargeRecords = readData('rechargeRecords')
    const consumptionRecords = readData('consumptionRecords')
    const tables = readData('tables')
    
    // 今日订单统计
    const todayOrders = orders.filter(order => {
      const orderDate = new Date(order.createTime)
      return orderDate.getTime() >= todayStart
    })
    
    const todayRevenue = todayOrders.reduce((sum, order) => {
      return sum + (order.amount || 0)
    }, 0)
    
    // 昨日订单统计（用于计算趋势）
    const yesterdayOrders = orders.filter(order => {
      const orderDate = new Date(order.createTime)
      return orderDate.getTime() >= yesterdayStart && orderDate.getTime() < todayStart
    })
    
    const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => {
      return sum + (order.amount || 0)
    }, 0)
    
    // 计算营收趋势
    let revenueTrend = 0
    if (yesterdayRevenue > 0) {
      revenueTrend = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    } else if (todayRevenue > 0) {
      revenueTrend = 100 // 昨日为0，今日有收入，增长100%
    }
    
    // 订单数趋势
    const orderTrend = todayOrders.length - yesterdayOrders.length
    
    // 活跃桌台数
    const activeTables = tables.filter(t => t.isInUse).length
    const totalTables = tables.length
    const utilizationRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0
    
    // 今日新增会员
    const newMemberToday = members.filter(member => {
      const memberDate = new Date(member.createTime)
      return memberDate.getTime() >= todayStart
    }).length
    
    // 本周营收数据（最近7天）
    const weekData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      const dayStart = date.getTime()
      const dayEnd = dayStart + 24 * 60 * 60 * 1000
      
      const dayOrders = orders.filter(order => {
        const orderDate = new Date(order.createTime)
        return orderDate.getTime() >= dayStart && orderDate.getTime() < dayEnd
      })
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0)
      
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      weekData.push({
        label: weekDays[date.getDay()],
        value: dayRevenue,
        date: date.toISOString().split('T')[0]
      })
    }
    
    // 热门娱乐项目排行
    const entertainmentStats = {}
    orders.forEach(order => {
      if (order.entertainment) {
        if (!entertainmentStats[order.entertainment]) {
          entertainmentStats[order.entertainment] = {
            name: order.entertainment,
            count: 0,
            revenue: 0
          }
        }
        entertainmentStats[order.entertainment].count++
        entertainmentStats[order.entertainment].revenue += (order.amount || 0)
      }
    })
    
    const topEntertainments = Object.values(entertainmentStats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // 取前5名
    
    res.json({
      success: true,
      data: {
        todayRevenue,
        todayOrders: todayOrders.length,
        activeTables,
        totalTables,
        utilizationRate,
        newMembers: members.length,
        newMemberToday,
        revenueTrend: Math.round(revenueTrend * 10) / 10, // 保留一位小数
        orderTrend,
        weekData,
        topEntertainments
      }
    })
  } catch (error) {
    console.error('获取统计数据失败:', error)
    res.status(500).json({ success: false, message: '获取统计数据失败' })
  }
})

// 启动服务
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
  console.log('\n数据文件路径:')
  console.log(`  会员数据: ${DATA_FILES.members}`)
  console.log(`  充值记录: ${DATA_FILES.rechargeRecords}`)
  console.log(`  消费记录: ${DATA_FILES.consumptionRecords}`)
  console.log(`  桌台数据: ${DATA_FILES.tables}`)
  console.log(`  订单数据: ${DATA_FILES.orders}`)
  console.log(`  零食数据: ${DATA_FILES.snacks}`)
})
