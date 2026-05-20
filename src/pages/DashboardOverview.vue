<template>
  <div class="dashboard-overview">
    <!-- 顶部核心数据卡片 -->
    <section class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card revenue" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">💰</div>
              <div class="stat-info">
                <div class="stat-label">今日营收</div>
                <div class="stat-value">¥{{ todayRevenue.toFixed(2) }}</div>
                <div
                  class="stat-trend"
                  :class="revenueTrend >= 0 ? 'up' : 'down'"
                >
                  {{ revenueTrend >= 0 ? "↑" : "↓" }}
                  {{ Math.abs(revenueTrend) }}%
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card orders" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">📋</div>
              <div class="stat-info">
                <div class="stat-label">今日订单</div>
                <div class="stat-value">{{ todayOrders }}</div>
                <div class="stat-sub">
                  较昨日 {{ orderTrend >= 0 ? "+" : "" }}{{ orderTrend }}
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card tables" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">🎯</div>
              <div class="stat-info">
                <div class="stat-label">在座桌台</div>
                <div class="stat-value">
                  {{ activeTables }}/{{ totalTables }}
                </div>
                <div class="stat-sub">利用率 {{ utilizationRate }}%</div>
              </div>
            </div>
          </el-card>
        </el-col>

        <el-col :xs="24" :sm="12" :md="6">
          <el-card class="stat-card members" shadow="hover">
            <div class="stat-content">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-label">今日会员</div>
                <div class="stat-value">{{ newMembers }}</div>
                <div class="stat-sub">新增 {{ newMemberToday }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 中部区域：桌台状态墙 + 实时动态 -->
    <section class="middle-section">
      <el-row :gutter="20">
        <!-- 左侧：桌台状态墙 -->
        <el-col :xs="24" :lg="16">
          <el-card class="tables-wall-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <span class="icon">🎮</span>
                  桌台状态墙
                </span>
                <el-button
                  type="primary"
                  size="small"
                  @click="$router.push('/home/dashboard')"
                >
                  查看全部
                </el-button>
              </div>
            </template>

            <div class="tables-grid">
              <div
                v-for="table in tables"
                :key="table.id"
                class="table-mini-card"
                :class="{
                  'table-idle':
                    !table.isInUse && !table.isBooked && !table.isDisabled,
                  'table-in-use': table.isInUse,
                  'table-booked': table.isBooked && !table.isInUse,
                  'table-disabled': table.isDisabled,
                }"
                @click="handleTableClick(table)"
              >
                <div class="table-code">{{ table.id }}</div>
                <div class="table-status">
                  <el-tag v-if="table.isDisabled" type="info" size="small">
                    禁用
                  </el-tag>
                  <el-tag v-else-if="table.isInUse" type="danger" size="small">
                    使用中
                  </el-tag>
                  <el-tag
                    v-else-if="table.isBooked"
                    type="warning"
                    size="small"
                  >
                    已预约
                  </el-tag>
                  <el-tag v-else type="success" size="small"> 空闲 </el-tag>
                </div>
                <div class="table-info" v-if="table.isInUse">
                  <div class="info-item">
                    <span class="label">人数：</span>
                    <span class="value">{{ table.currentUsers }}人</span>
                  </div>
                  <div class="info-item">
                    <span class="label">时长：</span>
                    <span class="value">{{
                      formatElapsedTime(table.startTimestamp)
                    }}</span>
                  </div>
                </div>
                <div
                  class="table-info"
                  v-else-if="table.isBooked && table.bookingInfo"
                >
                  <div class="info-item">
                    <span class="label">预约：</span>
                    <span class="value"
                      >{{ table.bookingInfo.bookingUsers }}人</span
                    >
                  </div>
                  <div class="info-item">
                    <span class="label">时间：</span>
                    <span class="value">{{
                      formatBookingTime(table.bookingInfo.bookingTime)
                    }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：今日营收明细 -->
        <el-col :xs="24" :lg="8">
          <el-card class="revenue-detail-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <span class="icon"></span>
                  今日营收明细
                </span>
                <el-tag type="success" size="small">
                  ¥{{ todayTotalRevenue.toFixed(2) }}
                </el-tag>
              </div>
            </template>

            <div class="revenue-list">
              <!-- 桌台收入 -->
              <div class="revenue-item table-revenue">
                <div class="revenue-icon">🎮</div>
                <div class="revenue-content">
                  <div class="revenue-label">桌台收入</div>
                  <div class="revenue-amount">¥{{ tableRevenue.toFixed(2) }}</div>
                  <div class="revenue-detail">{{ tableOrderCount }}笔订单</div>
                </div>
              </div>

              <!-- 零食收入 -->
              <div class="revenue-item snack-revenue">
                <div class="revenue-icon">🍿</div>
                <div class="revenue-content">
                  <div class="revenue-label">零食收入</div>
                  <div class="revenue-amount">¥{{ snackRevenue.toFixed(2) }}</div>
                  <div class="revenue-detail">{{ snackOrderCount }}笔销售</div>
                </div>
              </div>

              <!-- 会员充值 -->
              <div class="revenue-item recharge-revenue">
                <div class="revenue-icon">💳</div>
                <div class="revenue-content">
                  <div class="revenue-label">会员充值</div>
                  <div class="revenue-amount">¥{{ rechargeAmount.toFixed(2) }}</div>
                  <div class="revenue-detail">{{ rechargeCount }}笔充值</div>
                </div>
              </div>

              <!-- 按娱乐类型细分 -->
              <div v-if="entertainmentBreakdown.length > 0" class="revenue-breakdown">
                <div class="breakdown-title">收入构成</div>
                <div
                  v-for="(item, index) in entertainmentBreakdown"
                  :key="index"
                  class="breakdown-item"
                >
                  <div class="breakdown-info">
                    <el-tag :type="getEntertainmentTagType(item.name)" size="small">
                      {{ item.name }}
                    </el-tag>
                    <span class="breakdown-count">{{ item.count }}次</span>
                  </div>
                  <div class="breakdown-amount">¥{{ item.revenue.toFixed(2) }}</div>
                </div>
              </div>

              <el-empty
                v-if="!hasTodayRevenue"
                description="今日暂无营收数据"
                :image-size="80"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 底部区域：数据图表 + 快捷操作 -->
    <section class="bottom-section">
      <el-row :gutter="20">
        <!-- 本周营收趋势 -->
        <el-col :xs="24" :md="12">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <span class="icon">📊</span>
                  本周营收趋势
                </span>
              </div>
            </template>
            <div class="chart-placeholder">
              <div class="chart-bars">
                <div
                  v-for="(day, index) in weekData"
                  :key="index"
                  class="chart-bar-item"
                >
                  <div
                    class="bar"
                    :style="{ height: (day.value / maxWeekValue) * 100 + '%' }"
                  ></div>
                  <div class="bar-label">{{ day.label }}</div>
                  <div class="bar-value">¥{{ day.value }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 热门项目排行 -->
        <el-col :xs="24" :md="12">
          <el-card class="ranking-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <span class="header-title">
                  <span class="icon">🏆</span>
                  热门项目排行
                </span>
              </div>
            </template>
            <div class="ranking-list">
              <div
                v-for="(item, index) in topEntertainments"
                :key="index"
                class="ranking-item"
              >
                <div class="rank-number" :class="'rank-' + (index + 1)">
                  {{ index + 1 }}
                </div>
                <div class="rank-info">
                  <div class="rank-name">{{ item.name }}</div>
                  <div class="rank-meta">
                    <span class="count">{{ item.count }}次</span>
                    <span class="revenue">营收 ¥{{ item.revenue }}</span>
                  </div>
                </div>
                <div class="rank-progress">
                  <el-progress
                    :percentage="Math.round((item.count / maxCount) * 100)"
                    :show-text="false"
                    :stroke-width="8"
                  />
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- 快捷操作按钮组 -->
    <section class="quick-actions-section">
      <el-card shadow="hover">
        <div class="quick-actions">
          <el-button
            type="primary"
            size="large"
            @click="$router.push('/home/dashboard')"
          >
            <span class="action-icon">🎯</span>
            <span class="action-text">桌台管理</span>
          </el-button>

          <el-button
            type="success"
            size="large"
            @click="$router.push('/home/member')"
          >
            <span class="action-icon">👥</span>
            <span class="action-text">客户管理</span>
          </el-button>

          <el-button
            type="warning"
            size="large"
            @click="$router.push('/home/order')"
          >
            <span class="action-icon">📋</span>
            <span class="action-text">订单管理</span>
          </el-button>

          <el-button
            type="info"
            size="large"
            @click="$router.push('/home/recharge')"
          >
            <span class="action-icon">💰</span>
            <span class="action-text">充值记录</span>
          </el-button>

          <el-button
            type="danger"
            size="large"
            @click="$router.push('/home/consumption')"
          >
            <span class="action-icon">🛒</span>
            <span class="action-text">消费记录</span>
          </el-button>

          <el-button size="large" @click="$router.push('/home/snack')">
            <span class="action-icon">🍿</span>
            <span class="action-text">零食管理</span>
          </el-button>
        </div>
      </el-card>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"

const router = useRouter()

// 核心统计数据
const todayRevenue = ref(0)
const todayOrders = ref(0)
const activeTables = ref(0)
const totalTables = ref(0)
const newMembers = ref(0)
const newMemberToday = ref(0)
const revenueTrend = ref(0)
const orderTrend = ref(0)
const utilizationRate = ref(0)

// 今日营收明细相关数据
const tableRevenue = ref(0) // 桌台收入
const snackRevenue = ref(0) // 零食收入
const rechargeAmount = ref(0) // 会员充值金额
const tableOrderCount = ref(0) // 桌台订单数
const snackOrderCount = ref(0) // 零食销售笔数
const rechargeCount = ref(0) // 充值笔数
const entertainmentBreakdown = ref<Array<{ name: string; count: number; revenue: number }>>([]) // 按娱乐类型细分

// 计算今日总收入
const todayTotalRevenue = computed(() => {
  return tableRevenue.value + snackRevenue.value + rechargeAmount.value
})

// 判断是否有今日营收数据
const hasTodayRevenue = computed(() => {
  return todayTotalRevenue.value > 0 || entertainmentBreakdown.value.length > 0
})

// 桌台数据
const tables = ref<any[]>([])

// 最近动态
interface Activity {
  type: "order" | "member" | "recharge" | "system"
  text: string
  time: string
}

const recentActivities = ref<Activity[]>([])

// 本周营收数据
const weekData = ref<Array<{ label: string; value: number }>>([])

const maxWeekValue = computed(() => {
  if (weekData.value.length === 0) return 1
  return Math.max(...weekData.value.map((d) => d.value), 1) // 至少为1，避免除以0
})

// 热门娱乐项目
interface EntertainmentItem {
  name: string
  count: number
  revenue: number
}

const topEntertainments = ref<EntertainmentItem[]>([])

const maxCount = computed(() => {
  if (topEntertainments.value.length === 0) return 1
  return Math.max(...topEntertainments.value.map((t) => t.count), 1)
})

// 格式化 elapsed time
const formatElapsedTime = (timestamp: number | null) => {
  if (!timestamp) return "-"
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}小时${minutes}分`
}

// 格式化预约时间
const formatBookingTime = (time: string) => {
  if (!time) return "-"
  return time.substring(11, 16) // 提取 HH:mm
}

// 获取活动图标
const getActivityIcon = (type: string) => {
  const icons: Record<string, string> = {
    order: "🎮",
    member: "",
    recharge: "💳",
    system: "⚙️",
  }
  return icons[type] || ""
}

// 根据娱乐类型返回标签颜色
const getEntertainmentTagType = (entertainment: string): "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<string, "success" | "warning" | "danger" | "info"> = {
    桌游: "success", // 绿色
    PS5: "warning", // 橙色
    拼豆: "danger", // 红色
  }
  return typeMap[entertainment] || "info"
}

// 处理桌台点击
const handleTableClick = (table: any) => {
  router.push("/home/dashboard")
}

// 加载数据
const loadData = async () => {
  try {
    // 调用统计API获取所有数据
    const statsResponse = await fetch(
      "http://localhost:3000/api/statistics/overview",
    )
    const statsResult = await statsResponse.json()

    if (statsResult.success) {
      const stats = statsResult.data

      // 更新核心统计数据
      todayRevenue.value = stats.todayRevenue
      todayOrders.value = stats.todayOrders
      activeTables.value = stats.activeTables
      totalTables.value = stats.totalTables
      utilizationRate.value = stats.utilizationRate
      newMembers.value = stats.newMembers
      newMemberToday.value = stats.newMemberToday
      revenueTrend.value = stats.revenueTrend
      orderTrend.value = stats.orderTrend

      // 更新本周营收数据
      weekData.value = stats.weekData.map((item: any) => ({
        label: item.label,
        value: item.value,
      }))

      // 更新热门娱乐项目
      topEntertainments.value = stats.topEntertainments || []
    }

    // 加载桌台数据（用于桌台状态墙）
    const tablesResponse = await fetch("http://localhost:3000/api/tables")
    const tablesResult = await tablesResponse.json()
    if (tablesResult.success) {
      tables.value = tablesResult.data
    }

    // 加载最近动态（从订单和会员记录中获取）
    await loadRecentActivities()
  } catch (error) {
    console.error("加载首页数据失败:", error)
    ElMessage.warning("部分数据加载失败，请检查后端服务")
  }
}

// 加载今日营收明细
const loadTodayRevenueDetail = async () => {
  try {
    // 重置数据
    tableRevenue.value = 0
    snackRevenue.value = 0
    rechargeAmount.value = 0
    tableOrderCount.value = 0
    snackOrderCount.value = 0
    rechargeCount.value = 0
    entertainmentBreakdown.value = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStart = today.getTime()

    // 1. 获取今日订单数据
    const ordersResponse = await fetch("http://localhost:3000/api/orders")
    const ordersResult = await ordersResponse.json()
    
    if (ordersResult.success) {
      const todayOrders = ordersResult.data.filter((order: any) => {
        const orderTime = new Date(order.createTime).getTime()
        return orderTime >= todayStart && order.status === "completed"
      })

      // 统计桌台收入和零食收入
      let entertainmentStats: Record<string, { count: number; revenue: number }> = {}

      todayOrders.forEach((order: any) => {
        // 桌台收入（总金额 - 零食金额）
        const tableAmount = (order.amount || 0) - (order.snackTotal || 0)
        tableRevenue.value += tableAmount
        tableOrderCount.value++

        // 零食收入
        if (order.snackTotal && order.snackTotal > 0) {
          snackRevenue.value += order.snackTotal
          snackOrderCount.value++
        }

        // 按娱乐类型统计
        const entertainment = order.entertainment || "其他"
        if (!entertainmentStats[entertainment]) {
          entertainmentStats[entertainment] = { count: 0, revenue: 0 }
        }
        entertainmentStats[entertainment].count++
        entertainmentStats[entertainment].revenue += order.amount || 0
      })

      // 转换为数组格式
      entertainmentBreakdown.value = Object.entries(entertainmentStats)
        .map(([name, stats]) => ({
          name,
          count: stats.count,
          revenue: stats.revenue
        }))
        .sort((a, b) => b.revenue - a.revenue) // 按收入降序排列
    }

    // 2. 获取今日充值记录
    const rechargeResponse = await fetch("http://localhost:3000/api/recharge-records")
    const rechargeResult = await rechargeResponse.json()
    
    if (rechargeResult.success) {
      const todayRecharges = rechargeResult.data.filter((record: any) => {
        const recordDate = new Date(record.date).getTime()
        return recordDate >= todayStart
      })

      rechargeCount.value = todayRecharges.length
      rechargeAmount.value = todayRecharges.reduce(
        (sum: number, record: any) => sum + (record.receiveAmount || 0),
        0
      )
    }

    console.log("今日营收明细加载完成:", {
      tableRevenue: tableRevenue.value,
      snackRevenue: snackRevenue.value,
      rechargeAmount: rechargeAmount.value,
      total: todayTotalRevenue.value
    })
  } catch (error) {
    console.error("加载今日营收明细失败:", error)
  }
}

const loadRecentActivities = async () => {
  try {
    const activities: Activity[] = []

    // 获取最近的订单
    const ordersResponse = await fetch("http://localhost:3000/api/orders")
    const ordersResult = await ordersResponse.json()
    if (ordersResult.success && ordersResult.data.length > 0) {
      // 取最近5条订单
      const recentOrders = ordersResult.data
        .sort(
          (a: any, b: any) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
        )
        .slice(0, 5)

      recentOrders.forEach((order: any) => {
        const timeStr = formatActivityTime(order.createTime)
        if (order.status === "completed") {
          activities.push({
            type: "order",
            text: `${order.tableId} 结束订单（${order.entertainment}，${formatDuration(order.duration)}）`,
            time: timeStr,
          })
        } else {
          activities.push({
            type: "order",
            text: `${order.tableId} 开始计时（${order.entertainment}，${order.users}人）`,
            time: timeStr,
          })
        }
      })
    }

    // 获取最近的充值记录
    const rechargeResponse = await fetch(
      "http://localhost:3000/api/recharge-records",
    )
    const rechargeResult = await rechargeResponse.json()
    if (rechargeResult.success && rechargeResult.data.length > 0) {
      const recentRecharges = rechargeResult.data
        .sort(
          (a: any, b: any) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 3)

      recentRecharges.forEach((record: any) => {
        const timeStr = formatActivityTime(record.date)
        activities.push({
          type: "recharge",
          text: `会员充值：${record.memberName || record.memberPhone || ""} 充值¥${record.receiveAmount}`,
          time: timeStr,
        })
      })
    }

    // 获取最近的会员记录
    const membersResponse = await fetch("http://localhost:3000/api/members")
    const membersResult = await membersResponse.json()
    if (membersResult.success && membersResult.data.length > 0) {
      const recentMembers = membersResult.data
        .sort(
          (a: any, b: any) =>
            new Date(b.createTime).getTime() - new Date(a.createTime).getTime(),
        )
        .slice(0, 2)

      recentMembers.forEach((member: any) => {
        const timeStr = formatActivityTime(member.createTime)
        activities.push({
          type: "member",
          text: `新会员办理：${member.name}（${maskPhone(member.phone)}）`,
          time: timeStr,
        })
      })
    }

    // 检查低库存零食
    const snacksResponse = await fetch("http://localhost:3000/api/snacks")
    const snacksResult = await snacksResponse.json()
    if (snacksResult.success) {
      const lowStockSnacks = snacksResult.data.filter(
        (snack: any) => snack.stock < 20,
      )
      if (lowStockSnacks.length > 0) {
        activities.push({
          type: "system",
          text: `系统提醒：${lowStockSnacks[0].name}库存不足（剩余${lowStockSnacks[0].stock}${lowStockSnacks[0].unit}）`,
          time: "刚刚",
        })
      }
    }

    // 按时间排序，取最近10条
    recentActivities.value = activities.slice(0, 10)
  } catch (error) {
    console.error("加载最近动态失败:", error)
  }
}

// 格式化活动时间
const formatActivityTime = (timeStr: string) => {
  if (!timeStr) return "未知"

  const activityTime = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - activityTime.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  return activityTime.toLocaleDateString("zh-CN")
}

// 格式化时长
const formatDuration = (minutes: number) => {
  if (!minutes) return "-"
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + "分" : ""}`
  }
  return `${mins}分钟`
}

// 手机号脱敏
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone
  return phone.substring(0, 3) + "****" + phone.substring(7)
}

// 定时刷新数据
let refreshTimer: number | null = null

onMounted(() => {
  loadData()
  
  // 加载今日营收明细
  loadTodayRevenueDetail()

  // 每30秒刷新一次数据
  refreshTimer = window.setInterval(() => {
    loadData()
    loadTodayRevenueDetail() // 同时刷新营收明细
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.dashboard-overview {
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  min-height: calc(100vh - 120px);
}

/* 核心数据卡片 */
.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.revenue {
  border-left: 4px solid #67c23a;
}

.stat-card.orders {
  border-left: 4px solid #409eff;
}

.stat-card.tables {
  border-left: 4px solid #e6a23c;
}

.stat-card.members {
  border-left: 4px solid #f56c6c;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 48px;
  line-height: 1;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.up {
  color: #67c23a;
}

.stat-trend.down {
  color: #f56c6c;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
}

/* 中部区域 */
.middle-section {
  margin-bottom: 20px;
}

.tables-wall-card,
.activity-card {
  border-radius: 12px;
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-title .icon {
  font-size: 20px;
}

/* 桌台状态墙 */
.tables-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 8px;
}

.table-mini-card {
  background: #fff;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.table-mini-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.table-mini-card.table-idle {
  border-color: #67c23a;
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%);
}

.table-mini-card.table-in-use {
  border-color: #f56c6c;
  background: linear-gradient(135deg, #fef0f0 0%, #ffebee 100%);
}

.table-mini-card.table-booked {
  border-color: #e6a23c;
  background: linear-gradient(135deg, #fdf6ec 0%, #fff8e1 100%);
}

.table-mini-card.table-disabled {
  border-color: #909399;
  background: #f5f7fa;
  opacity: 0.6;
}

.table-code {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  text-align: center;
}

.table-status {
  margin-bottom: 8px;
  text-align: center;
}

.table-info {
  font-size: 12px;
  color: #606266;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.info-item .label {
  color: #909399;
}

.info-item .value {
  font-weight: 500;
  color: #303133;
}

/* 实时动态 */
.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

/* 今日营收明细 */
.revenue-detail-card {
  border-radius: 12px;
  height: 100%;
}

.revenue-list {
  padding: 8px;
}

.revenue-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.revenue-item:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.revenue-item.table-revenue {
  background: linear-gradient(135deg, #f0f9ff 0%, #e8f5e9 100%);
  border-left: 4px solid #67c23a;
}

.revenue-item.snack-revenue {
  background: linear-gradient(135deg, #fff8e1 0%, #fef3e2 100%);
  border-left: 4px solid #e6a23c;
}

.revenue-item.recharge-revenue {
  background: linear-gradient(135deg, #ecf5ff 0%, #e3f2fd 100%);
  border-left: 4px solid #409eff;
}

.revenue-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.revenue-content {
  flex: 1;
  min-width: 0;
}

.revenue-label {
  font-size: 14px;
  color: #606266;
  margin-bottom: 4px;
}

.revenue-amount {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.revenue-detail {
  font-size: 12px;
  color: #909399;
}

/* 收入构成细分 */
.revenue-breakdown {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.breakdown-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  transition: background 0.2s;
}

.breakdown-item:hover {
  background: #ecf5ff;
}

.breakdown-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.breakdown-count {
  font-size: 12px;
  color: #606266;
}

.breakdown-amount {
  font-size: 14px;
  font-weight: 600;
  color: #f56c6c;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid #ebeef5;
  transition: background 0.2s;
}

.activity-item:hover {
  background: #f5f7fa;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.activity-icon.order {
  background: #ecf5ff;
}

.activity-icon.member {
  background: #f0f9ff;
}

.activity-icon.recharge {
  background: #f0f9ff;
}

.activity-icon.system {
  background: #f4f4f5;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.5;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

/* 底部区域 */
.bottom-section {
  margin-bottom: 20px;
}

.chart-card,
.ranking-card {
  border-radius: 12px;
  height: 100%;
}

.chart-placeholder {
  height: 250px;
  display: flex;
  align-items: flex-end;
  padding: 20px;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  width: 100%;
  height: 100%;
  gap: 12px;
}

.chart-bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.bar {
  width: 100%;
  max-width: 50px;
  background: linear-gradient(180deg, #409eff 0%, #66b1ff 100%);
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  min-height: 20px;
}

.bar:hover {
  background: linear-gradient(180deg, #66b1ff 0%, #409eff 100%);
  transform: scaleY(1.05);
}

.bar-label {
  margin-top: 8px;
  font-size: 12px;
  color: #606266;
}

.bar-value {
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

/* 排行榜 */
.ranking-list {
  padding: 8px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.2s;
}

.ranking-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.rank-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 16px;
  color: #fff;
  flex-shrink: 0;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%);
}

.rank-number:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #909399;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.rank-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.rank-meta .count {
  color: #606266;
}

.rank-meta .revenue {
  color: #f56c6c;
  font-weight: 500;
}

.rank-progress {
  width: 100px;
  flex-shrink: 0;
}

/* 快捷操作 */
.quick-actions-section {
  margin-bottom: 20px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  padding: 8px;
}

.quick-actions .el-button {
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.quick-actions .el-button:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-icon {
  font-size: 28px;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .dashboard-overview {
    padding: 12px;
  }

  .stat-value {
    font-size: 22px;
  }

  .stat-icon {
    font-size: 36px;
  }

  .tables-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }

  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
