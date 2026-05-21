<template>
  <div class="order-page">
    <!-- 查询条件 -->
    <div class="search-panel">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </el-form-item>
        <el-form-item label="桌台编号">
          <el-input
            v-model="searchForm.tableId"
            placeholder="请输入桌台编号"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="订单状态">
          <el-select
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
            style="width: 120px"
          >
            <el-option label="已完成" value="completed" />
            <el-option label="进行中" value="in_progress" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
          <el-button type="primary" @click="refreshOrders">
            刷新
          </el-button>
          <el-button type="success" @click="exportOrders">
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 统计信息 -->
    <div class="statistics-panel">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">总订单数</div>
            <div class="stat-value">{{ statistics.totalCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">充值卡订单金额</div>
            <div class="stat-value">
              ¥{{ statistics.rechargeCardAmount.toFixed(2) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">次卡订单数</div>
            <div class="stat-value">{{ statistics.timesCardOrders }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">平均时长</div>
            <div class="stat-value">{{ statistics.avgDuration }}分钟</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 订单列表 -->
    <div class="table-container">
      <el-table
        :data="filteredOrders"
        stripe
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="订单ID" min-width="180" />
        <el-table-column prop="tableId" label="桌台编号" min-width="120" />
        <el-table-column prop="entertainment" label="娱乐类型" min-width="150" />
        <el-table-column prop="users" label="人数" width="80" align="center" />
        <el-table-column label="会员信息" min-width="150">
          <template #default="{ row }">
            <span v-if="row.memberName" class="member-info">
              {{ row.memberName }}
              <el-tag size="small" type="info" style="margin-left: 4px">
                {{ row.cardType === '充值卡' ? '充值卡' : '次卡' }}
              </el-tag>
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.paymentMethod" :type="getPaymentMethodType(row.paymentMethod)" size="small">
              {{ getPaymentMethodName(row.paymentMethod) }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" min-width="180">
          <template #default="{ row }">
            {{ row.endTime ? formatDateTime(row.endTime) : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="duration"
          label="时长(分钟)"
          width="120"
          align="center"
        />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.paymentMethod === 'member_balance' && row.cardType === '次卡'" class="times-card-text">
              次卡消费
            </span>
            <span v-else-if="row.amount" class="amount-text">
              ¥{{ row.amount.toFixed(2) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'completed' ? 'success' : 'warning'">
              {{ row.status === "completed" ? "已完成" : "进行中" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" min-width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="零食" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.snacks && row.snacks.length > 0">
              <el-tag size="small" type="success">
                {{ row.snacks.length }}种
              </el-tag>
              <span class="snack-total-inline">
                ¥{{ (row.snackTotal || calculateSnackTotal(row.snacks)).toFixed(2) }}
              </span>
            </div>
            <span v-else class="no-snack">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="viewOrderDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredOrders.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 订单详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="订单详情"
      width="900px"
      append-to-body
    >
      <div v-if="currentOrder" class="order-detail">
        <!-- 基本信息 -->
        <div class="detail-section">
          <h3 class="section-title">基本信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="订单ID">{{ currentOrder.id }}</el-descriptions-item>
            <el-descriptions-item label="桌台编号">{{ currentOrder.tableId }}</el-descriptions-item>
            <el-descriptions-item label="娱乐类型">{{ currentOrder.entertainment || '-' }}</el-descriptions-item>
            <el-descriptions-item label="人数">{{ currentOrder.users }}人</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDateTime(currentOrder.startTime) }}</el-descriptions-item>
            <el-descriptions-item label="结束时间">{{ currentOrder.endTime ? formatDateTime(currentOrder.endTime) : '-' }}</el-descriptions-item>
            <el-descriptions-item label="时长">{{ currentOrder.duration }}分钟</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentOrder.status === 'completed' ? 'success' : 'warning'">
                {{ currentOrder.status === 'completed' ? '已完成' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 会员信息 -->
        <div v-if="currentOrder.memberName" class="detail-section">
          <h3 class="section-title">会员信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="会员姓名">{{ currentOrder.memberName }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentOrder.memberPhone || '-' }}</el-descriptions-item>
            <el-descriptions-item label="卡类型">
              <el-tag size="small" :type="currentOrder.cardType === '充值卡' ? '' : 'success'">
                {{ currentOrder.cardType }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="支付方式">
              <el-tag size="small" :type="getPaymentMethodType(currentOrder.paymentMethod)">
                {{ getPaymentMethodName(currentOrder.paymentMethod) }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 费用信息 -->
        <div class="detail-section">
          <h3 class="section-title">费用明细</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="单价">{{ currentOrder.pricePerHour || '-' }}元/小时</el-descriptions-item>
            <el-descriptions-item label="折扣">{{ currentOrder.discount || 100 }}%</el-descriptions-item>
            <el-descriptions-item label="桌台费用">
              <span class="amount-text">¥{{ calculateTableAmount(currentOrder).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="零食费用">
              <span class="snack-amount">¥{{ (currentOrder.snackTotal || 0).toFixed(2) }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="总金额" :span="2">
              <span class="total-amount">
                ¥{{ (currentOrder.amount || 0).toFixed(2) }}
              </span>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 零食明细 -->
        <div v-if="currentOrder.snacks && currentOrder.snacks.length > 0" class="detail-section">
          <h3 class="section-title">
            🍿 零食明细
            <el-tag size="small" type="success" style="margin-left: 8px">
              {{ currentOrder.snacks.length }}种
            </el-tag>
          </h3>
          <el-table :data="currentOrder.snacks" stripe border size="small" style="width: 100%">
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="price" label="单价" width="120" align="right">
              <template #default="{ row }">
                ¥{{ row.price.toFixed(2) }}/{{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="100" align="center" />
            <el-table-column prop="unit" label="单位" width="80" align="center" />
            <el-table-column label="小计" min-width="120" align="right">
              <template #default="{ row }">
                <span class="subtotal">¥{{ (row.price * row.quantity).toFixed(2) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="snack-summary">
            <span>零食总计：</span>
            <span class="snack-total-price">¥{{ (currentOrder.snackTotal || 0).toFixed(2) }}</span>
          </div>
        </div>

        <!-- 备注信息 -->
        <div v-if="currentOrder.remark" class="detail-section">
          <h3 class="section-title">备注</h3>
          <div class="remark-content">{{ currentOrder.remark }}</div>
        </div>

        <!-- 创建时间 -->
        <div class="detail-section">
          <el-descriptions :column="1" border>
            <el-descriptions-item label="创建时间">{{ formatDateTime(currentOrder.createTime) }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"

interface Order {
  id: string
  tableId: string
  entertainment: string
  users: number
  startTime: number
  endTime: number | null
  duration: number
  amount: number | null
  status: "completed" | "in_progress"
  createTime: string
  // 新增会员关联字段
  memberPhone?: string
  memberName?: string
  paymentMethod?: string
  cardType?: string
  // 零食相关字段
  snacks?: any[]
  snackTotal?: number
  pricePerHour?: number
  discount?: number
  remark?: string
}

interface SearchForm {
  dateRange: [string, string] | null
  tableId: string
  status: string
}

const loading = ref(false)
const orders = ref<Order[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

// 详情对话框状态
const showDetailDialog = ref(false)
const currentOrder = ref<Order | null>(null)

const searchForm = ref<SearchForm>({
  dateRange: null,
  tableId: "",
  status: "",
})

// 获取所有订单
const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await fetch("http://localhost:3000/api/orders")

    if (!response.ok) {
      throw new Error("网络响应错误")
    }

    const result = await response.json()

    if (result.success) {
      // 按创建时间降序排列，最新的数据在前面
      orders.value = result.data.sort((a: any, b: any) => {
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      })
      ElMessage.success(`成功加载 ${result.data.length} 条订单`)
    } else {
      ElMessage.error(result.message || "获取订单失败")
    }
  } catch (error) {
    console.error("获取订单失败:", error)
    ElMessage.warning("后端服务未启动或网络连接失败，请稍后重试")
  } finally {
    loading.value = false
  }
}

// 刷新订单
const refreshOrders = () => {
  fetchOrders()
}

// 导出订单（简化版）
const exportOrders = () => {
  if (filteredOrders.value.length === 0) {
    ElMessage.warning("没有可导出的订单数据")
    return
  }

  // 创建CSV内容
  const headers = [
    "订单ID",
    "桌台编号",
    "娱乐类型",
    "人数",
    "会员姓名",
    "支付方式",
    "开始时间",
    "结束时间",
    "时长(分钟)",
    "金额",
    "状态",
    "创建时间",
  ]
  const rows = filteredOrders.value.map((order) => [
    order.id,
    order.tableId,
    order.entertainment,
    order.users,
    order.memberName || '-',
    getPaymentMethodName(order.paymentMethod || ''),
    formatDateTime(order.startTime),
    order.endTime ? formatDateTime(order.endTime) : "-",
    order.duration,
    order.paymentMethod === 'member_balance' && order.cardType === '次卡' ? '次卡消费' : (order.amount ? `¥${order.amount.toFixed(2)}` : '-'),
    order.status === "completed" ? "已完成" : "进行中",
    formatDateTime(order.createTime),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  // 下载文件
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `订单列表_${new Date().toISOString().split("T")[0]}.csv`
  link.click()

  ElMessage.success("订单导出成功")
}

// 格式化日期时间
const formatDateTime = (timestamp: number | string) => {
  if (!timestamp) return "-"
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 过滤后的订单
const filteredOrders = computed(() => {
  let result = [...orders.value]

  // 按时间范围过滤
  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.value.dateRange
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000 // 包含结束日期当天

    result = result.filter((order) => {
      const orderTime = new Date(order.createTime).getTime()
      return orderTime >= start && orderTime < end
    })
  }

  // 按桌台编号过滤
  if (searchForm.value.tableId) {
    result = result.filter((order) =>
      order.tableId
        .toLowerCase()
        .includes(searchForm.value.tableId.toLowerCase()),
    )
  }

  // 按状态过滤
  if (searchForm.value.status) {
    result = result.filter((order) => order.status === searchForm.value.status)
  }

  return result
})

// 统计信息
const statistics = computed(() => {
  const completedOrders = filteredOrders.value.filter(
    (o) => o.status === "completed",
  )
  const totalCount = completedOrders.length
  const rechargeCardAmount = completedOrders.reduce(
    (sum, o) => sum + (o.cardType === '充值卡' ? (o.amount || 0) : 0),
    0,
  )
  const timesCardOrders = completedOrders.filter(o => o.cardType === '次卡').length
  const avgDuration =
    totalCount > 0
      ? Math.round(
          completedOrders.reduce((sum, o) => sum + o.duration, 0) / totalCount,
        )
      : 0

  return {
    totalCount,
    rechargeCardAmount,
    timesCardOrders,
    avgDuration,
  }
})

// 搜索
const handleSearch = () => {
  currentPage.value = 1
  ElMessage.info("查询完成")
}

// 重置
const handleReset = () => {
  searchForm.value = {
    dateRange: null,
    tableId: "",
    status: "",
  }
  currentPage.value = 1
  ElMessage.success("已重置查询条件")
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 获取支付方式名称
const getPaymentMethodName = (method: string) => {
  const methodMap: Record<string, string> = {
    member_balance: '会员余额',
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金'
  }
  return methodMap[method] || method
}

// 获取支付方式标签类型
const getPaymentMethodType = (method: string) => {
  const typeMap: Record<string, any> = {
    member_balance: 'primary',
    wechat: 'success',
    alipay: 'warning',
    cash: 'info'
  }
  return typeMap[method] || 'info'
}

// 查看订单详情
const viewOrderDetail = (order: Order) => {
  currentOrder.value = order
  showDetailDialog.value = true
}

// 计算订单的零食总价
const calculateSnackTotal = (snacks: any[]) => {
  if (!snacks || snacks.length === 0) return 0
  return snacks.reduce((total, item) => {
    return total + (item.price * item.quantity)
  }, 0)
}

// 计算桌台费用（不含零食）
const calculateTableAmount = (order: Order) => {
  if (!order.amount) return 0
  const snackTotal = order.snackTotal || 0
  return order.amount - snackTotal
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.order-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: var(--app-bg-secondary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: var(--app-gradient-primary);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-panel {
  background: var(--app-bg-elevated);
  padding: 20px 24px;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.statistics-panel {
  margin-bottom: 20px;
}

.stat-card {
  background: var(--app-gradient-primary);
  padding: 20px;
  border-radius: 12px;
  color: #ffffff;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.3);
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.table-container {
  flex: 1;
  background: var(--app-bg-elevated);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.amount-text {
  color: var(--app-danger-color);
  font-weight: 600;
}

.times-card-text {
  color: var(--app-warning-color);
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 订单详情对话框样式 */
.order-detail {
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--app-text-strong);
  margin: 0 0 12px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.remark-content {
  padding: 12px;
  background: var(--app-bg-secondary);
  border-radius: 4px;
  color: var(--app-main-text);
  line-height: 1.6;
  white-space: pre-wrap;
}

.snack-amount {
  color: var(--app-warning-color);
  font-weight: 600;
}

.total-amount {
  color: var(--app-danger-color);
  font-weight: 700;
  font-size: 18px;
}

.subtotal {
  color: var(--app-main-text);
  font-weight: 600;
}

.snack-summary {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: var(--app-main-text);
  padding: 12px;
  background: var(--app-bg-secondary);
  border-radius: 4px;
}

.snack-total-price {
  color: var(--app-danger-color);
  font-weight: 700;
  font-size: 16px;
  margin-left: 8px;
}

.snack-total-inline {
  margin-left: 8px;
  color: var(--app-danger-color);
  font-weight: 600;
  font-size: 12px;
}

.no-snack {
  color: var(--app-text-muted);
}
</style>
