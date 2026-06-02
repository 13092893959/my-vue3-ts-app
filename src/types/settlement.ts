import type { SnackItem } from './snack'

/** 拆单结算分组 */
export interface SettleGroup {
  id: string
  label: string
  users: number
  memberId: number | null
  selectedPackageIds: string[]
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  assignedSnacks: Record<number, number>
}

/** 开始计时 emit 数据 */
export interface StartTimerData {
  entertainment: string
  currentUsers: number
  startTimestamp: number
}

/** 整桌结算 emit 数据 */
export interface SettleData {
  totalAmount: number
  discount: number
  finalAmount: number
  memberId?: number | null
  paymentMethod?: string
  selectedPackageIds?: string[]
  snacks?: SnackItem[]
  snackTotal?: number
}

/** 中途结算 emit 数据 */
export interface MidSettleData {
  sessionId: string
  leavingUsers: number
  memberId: number | null
  selectedPackageIds: string[]
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  assignedSnacks: Record<number, number>
  deferPayment?: boolean // 挂账（暂不支付，合并到最后结算）
}

/** 加人 emit 数据 */
export interface AddPersonData {
  users: number
  startTimestamp: number
}
