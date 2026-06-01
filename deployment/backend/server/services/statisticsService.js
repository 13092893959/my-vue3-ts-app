import { readData } from './fileStore.js'

export function getOverview() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStart = today.getTime()

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStart = yesterday.getTime()

  const orders = readData('orders')
  const members = readData('members')
  const tables = readData('tables')

  // 今日订单
  const todayOrders = orders.filter((o) => new Date(o.createTime).getTime() >= todayStart)
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

  // 昨日订单
  const yesterdayOrders = orders.filter((o) => {
    const t = new Date(o.createTime).getTime()
    return t >= yesterdayStart && t < todayStart
  })
  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

  // 营收趋势
  let revenueTrend = 0
  if (yesterdayRevenue > 0) {
    revenueTrend = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
  } else if (todayRevenue > 0) {
    revenueTrend = 100
  }

  // 桌台利用率
  const activeTables = tables.filter((t) => t.isInUse).length
  const totalTables = tables.length
  const utilizationRate = totalTables > 0 ? Math.round((activeTables / totalTables) * 100) : 0

  // 今日新增会员
  const newMemberToday = members.filter((m) => new Date(m.createTime).getTime() >= todayStart).length

  // 本周营收
  const weekData = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    const dayStart = date.getTime()
    const dayEnd = dayStart + 24 * 60 * 60 * 1000

    const dayOrders = orders.filter((o) => {
      const t = new Date(o.createTime).getTime()
      return t >= dayStart && t < dayEnd
    })
    const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0)

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    weekData.push({
      label: weekDays[date.getDay()],
      value: dayRevenue,
      date: date.toISOString().split('T')[0],
    })
  }

  // 热门娱乐项目
  const entertainmentStats = {}
  orders.forEach((o) => {
    if (o.entertainment) {
      if (!entertainmentStats[o.entertainment]) {
        entertainmentStats[o.entertainment] = { name: o.entertainment, count: 0, revenue: 0 }
      }
      entertainmentStats[o.entertainment].count++
      entertainmentStats[o.entertainment].revenue += o.amount || 0
    }
  })
  const topEntertainments = Object.values(entertainmentStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    todayRevenue,
    todayOrders: todayOrders.length,
    activeTables,
    totalTables,
    utilizationRate,
    newMembers: members.length,
    newMemberToday,
    revenueTrend: Math.round(revenueTrend * 10) / 10,
    orderTrend: todayOrders.length - yesterdayOrders.length,
    weekData,
    topEntertainments,
  }
}
