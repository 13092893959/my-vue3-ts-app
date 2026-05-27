import type { SnackItem } from './snack'

/** 订单 */
export interface Order {
  id: string
  tableId: string
  entertainment: string
  users: number
  startTime: number
  endTime: number | null
  duration: number
  amount: number | null
  status: 'completed' | 'in_progress'
  createTime: string
  memberId?: number
  memberPhone?: string
  memberName?: string
  paymentMethod?: string
  cardType?: string
  snacks?: SnackItem[]
  snackTotal?: number
  pricePerHour?: number
  discount?: number
  remark?: string
  groupLabel?: string
  groupId?: string
  settlementBatchId?: string
  totalUsersAtTable?: number
  isMidwaySettlement?: boolean
  parentSessionId?: string
  parentSessionLabel?: string
}
