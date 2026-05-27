/** 会员 */
export interface Member {
  id: number
  name: string
  phone: string
  isMember?: boolean
  cardType?: string // 充值卡、次卡
  balance?: number
  remainingTimes?: number
  level: string
  totalConsumption: number
  timesCardUsed?: number
  playTime: number
  createTime: string
}

/** 充值记录 */
export interface RechargeRecord {
  id: number
  date: string
  memberId?: number
  phone: string
  name: string
  receiveAmount: number
  rechargeAmount: number
  type: string
}

/** 消费记录 */
export interface ConsumptionRecord {
  id: number
  date: string
  memberId?: number
  phone: string
  name: string
  amount: number
  item: string
  duration: number
  cardType?: string
}
