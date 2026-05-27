/** 统一 API 响应格式 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
}

/** 统计概览数据 */
export interface StatisticsOverview {
  todayRevenue: number
  todayOrders: number
  activeTables: number
  totalTables: number
  utilizationRate: number
  newMembers: number
  newMemberToday: number
  revenueTrend: number
  orderTrend: number
  weekData: Array<{ label: string; value: number; date: string }>
  topEntertainments: Array<{ name: string; count: number; revenue: number }>
}
