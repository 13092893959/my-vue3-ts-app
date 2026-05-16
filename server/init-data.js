import fs from 'fs'
import path from 'path'

const DATA_DIR = 'D:/data/baiwancheli'
const DATA_FILES = {
  members: path.join(DATA_DIR, 'members.json'),
  rechargeRecords: path.join(DATA_DIR, 'recharge-records.json'),
  consumptionRecords: path.join(DATA_DIR, 'consumption-records.json')
}

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

// 初始会员数据
const initialMembers = [
  {
    id: 1,
    name: '盖世老胡',
    phone: '18303090257',
    cardType: '储值卡',
    balance: 1459.00,
    level: '白银会员',
    totalConsumption: 1899.00,
    playTime: 0,
    createTime: '2024-01-10 09:00:00'
  },
  {
    id: 2,
    name: '开心山脉',
    phone: '13080978788',
    cardType: '年卡',
    expiryDate: '2025-01-15',
    level: '青铜会员',
    totalConsumption: 0,
    playTime: 0,
    createTime: '2024-01-15 10:00:00'
  },
  {
    id: 3,
    name: '老板',
    phone: '15800563536',
    cardType: '年卡',
    expiryDate: '2025-03-10',
    level: '青铜会员',
    totalConsumption: 0,
    playTime: 0,
    createTime: '2024-03-10 14:00:00'
  }
]

// 初始充值记录
const initialRechargeRecords = [
  {
    id: 1,
    date: '2024-01-15 10:30:00',
    phone: '18303090257',
    name: '盖世老胡',
    amount: 500,
    type: '微信支付'
  },
  {
    id: 2,
    date: '2024-02-20 14:15:00',
    phone: '18303090257',
    name: '盖世老胡',
    amount: 1000,
    type: '支付宝'
  },
  {
    id: 3,
    date: '2024-03-10 09:45:00',
    phone: '13080978788',
    name: '开心山脉',
    amount: 2000,
    type: '现金'
  }
]

// 初始消费记录
const initialConsumptionRecords = [
  {
    id: 1,
    date: '2024-01-16 15:30:00',
    phone: '18303090257',
    name: '盖世老胡',
    amount: 100,
    item: '桌游游玩',
    duration: 120
  },
  {
    id: 2,
    date: '2024-02-21 18:20:00',
    phone: '18303090257',
    name: '盖世老胡',
    amount: 150,
    item: '剧本杀',
    duration: 180
  }
]

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
  
  console.log('\n初始化完成！')
  console.log('  会员数量:', initialMembers.length)
  console.log('  充值记录数量:', initialRechargeRecords.length)
  console.log('  消费记录数量:', initialConsumptionRecords.length)
} catch (error) {
  console.error('✗ 创建初始数据失败:', error)
}
