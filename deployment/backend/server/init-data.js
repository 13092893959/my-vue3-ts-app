import fs from 'fs'
import { DATA_DIR, DATA_FILES } from './constants.js'

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 初始会员数据（为空，不设置默认会员）
const initialMembers = []

// 初始充值记录（为空，不设置默认数据）
const initialRechargeRecords = []

// 初始消费记录（为空，不设置默认数据）
const initialConsumptionRecords = []

// 初始桌台数据（大厅1~6）
const initialTables = Array.from({ length: 6 }, (_, index) => ({
  id: `大厅${index + 1}`,
  status: "空闲",
  type: "大厅",
  entertainments: ["桌游"],
  level: 1,
  capacity: 4,
  minBooking: 1,
  isShared: false,
  allowBooking: true,
  description: "",
  currentUsers: 0,
  isInUse: false,
  isBooked: false,
  bookingInfo: null,
  isDisabled: false,
  startTimestamp: null, // 开始计时的时间戳
  currentOrderRemark: "", // 当前订单备注
  currentOrderSnacks: [], // 当前订单零食列表
  timerSessions: [] // 计时批次
}))

// 初始零食数据（为空，不设置默认数据）
const initialSnacks = []

// 初始套餐数据（为空，不设置默认数据）
const initialPackages = []

// 写入各个数据文件
try {
  // 写入会员数据
  fs.writeFileSync(DATA_FILES.members, JSON.stringify(initialMembers, null, 2), 'utf-8')
  console.log('✓ 会员数据已创建:', DATA_FILES.members)
  
  // 写入充值记录
  fs.writeFileSync(DATA_FILES.rechargeRecords, JSON.stringify(initialRechargeRecords, null, 2), 'utf-8')
  console.log('✓ 充值记录已创建:', DATA_FILES.rechargeRecords)
  
  // 写入消费记录
  fs.writeFileSync(DATA_FILES.consumptionRecords, JSON.stringify(initialConsumptionRecords, null, 2), 'utf-8')
  console.log('✓ 消费记录已创建:', DATA_FILES.consumptionRecords)
  
  // 写入桌台数据
  fs.writeFileSync(DATA_FILES.tables, JSON.stringify(initialTables, null, 2), 'utf-8')
  console.log('✓ 桌台数据已创建:', DATA_FILES.tables)
  
  // 写入订单数据（初始为空数组）
  const initialOrders = []
  fs.writeFileSync(DATA_FILES.orders, JSON.stringify(initialOrders, null, 2), 'utf-8')
  console.log('✓ 订单数据已创建:', DATA_FILES.orders)
  
  // 写入零食数据
  fs.writeFileSync(DATA_FILES.snacks, JSON.stringify(initialSnacks, null, 2), 'utf-8')
  console.log('✓ 零食数据已创建:', DATA_FILES.snacks)
  
  // 写入套餐数据
  fs.writeFileSync(DATA_FILES.packages, JSON.stringify(initialPackages, null, 2), 'utf-8')
  console.log('✓ 套餐数据已创建:', DATA_FILES.packages)
  
  console.log('\n初始化完成！')
  console.log('  会员数量:', initialMembers.length)
  console.log('  充值记录数量:', initialRechargeRecords.length)
  console.log('  消费记录数量:', initialConsumptionRecords.length)
  console.log('  桌台数量:', initialTables.length)
  console.log('  订单数量:', initialOrders.length)
  console.log('  零食数量:', initialSnacks.length)
} catch (error) {
  console.error('✗ 创建初始数据失败:', error)
}
