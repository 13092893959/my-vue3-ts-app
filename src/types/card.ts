/** 计时批次 */
export interface TimerSession {
  id: string
  users: number
  startTimestamp: number
  label: string
}

/** 桌台卡片完整数据结构 */
export interface CardData {
  id: string
  status: string
  type: string
  entertainments: string[]
  level: number
  capacity: number
  minBooking: number
  isShared: boolean
  allowBooking: boolean
  description: string
  currentUsers: number
  isInUse?: boolean
  isBooked?: boolean
  isDisabled?: boolean
  endTimestamp?: number
  initialMinutes?: number
  bookingInfo?: unknown
  startTimestamp?: number | null
  currentEntertainment?: string
  currentOrderRemark?: string
  currentOrderSnacks?: unknown[]
  timerSessions?: TimerSession[]
}

/** CardComponent 的 props 类型 */
export interface CardProps {
  card: CardData
}
