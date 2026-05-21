<template>
  <div class="recharge-page">
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
        <el-form-item label="会员姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入会员姓名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="充值类型">
          <el-select
            v-model="searchForm.type"
            placeholder="请选择类型"
            clearable
            style="width: 120px"
          >
            <el-option label="办卡充值" value="办卡充值" />
            <el-option label="办卡购次" value="办卡购次" />
            <el-option label="手动充值" value="手动充值" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
          <el-button type="primary" @click="refreshRecords">
            刷新
          </el-button>
          <el-button type="success" @click="exportRecords">
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
            <div class="stat-label">总充值次数</div>
            <div class="stat-value">{{ statistics.totalCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">充值总金额</div>
            <div class="stat-value">
              ¥{{ statistics.totalAmount.toFixed(2) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">平均充值金额</div>
            <div class="stat-value">¥{{ statistics.avgAmount.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">今日充值</div>
            <div class="stat-value">
              ¥{{ statistics.todayAmount.toFixed(2) }}
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 充值记录列表 -->
    <div class="table-container">
      <el-table
        :data="paginatedRecords"
        stripe
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="会员姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column label="收款金额" min-width="120" align="right">
          <template #default="{ row }">
            <span class="receive-amount-text">¥{{ (row.receiveAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="充值金额" min-width="120" align="right">
          <template #default="{ row }">
            <span class="recharge-amount-text">¥{{ (row.rechargeAmount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="充值类型"
          min-width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="充值日期" min-width="180">
          <template #default="{ row }">
            {{ formatDate(row.date) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="filteredRecords.length"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import { ElMessage } from "element-plus"

interface RechargeRecord {
  id: number
  date: string
  phone: string
  name: string
  receiveAmount: number    // 收款金额（客户实际支付的金额）
  rechargeAmount: number   // 充值金额（实际到账的金额）
  type: string
}

interface SearchForm {
  dateRange: [string, string] | null
  name: string
  phone: string
  type: string
}

const loading = ref(false)
const records = ref<RechargeRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

const searchForm = ref<SearchForm>({
  dateRange: null,
  name: "",
  phone: "",
  type: "",
})

// 获取所有充值记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const response = await fetch("http://localhost:3000/api/recharge-records")

    if (!response.ok) {
      throw new Error("网络响应错误")
    }

    const result = await response.json()

    if (result.success) {
      // 按日期降序排列，最新的数据在前面
      records.value = result.data.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      ElMessage.success(`成功加载 ${result.data.length} 条充值记录`)
    } else {
      ElMessage.error(result.message || "获取充值记录失败")
    }
  } catch (error) {
    console.error("获取充值记录失败:", error)
    ElMessage.warning("后端服务未启动或网络连接失败，请稍后重试")
  } finally {
    loading.value = false
  }
}

// 刷新记录
const refreshRecords = () => {
  fetchRecords()
}

// 导出记录
const exportRecords = () => {
  if (filteredRecords.value.length === 0) {
    ElMessage.warning("没有可导出的充值记录")
    return
  }

  const headers = [
    "序号",
    "会员姓名",
    "手机号",
    "收款金额",
    "充值金额",
    "充值类型",
    "充值日期",
  ]
  const rows = filteredRecords.value.map((record, index) => [
    index + 1,
    record.name,
    record.phone,
    `¥${(record.receiveAmount || 0).toFixed(2)}`,
    `¥${(record.rechargeAmount || 0).toFixed(2)}`,
    record.type,
    formatDate(record.date),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `充值记录_${new Date().toISOString().split("T")[0]}.csv`
  link.click()

  ElMessage.success("充值记录导出成功")
}

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return "-"
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  const seconds = String(date.getSeconds()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取类型标签颜色
const getTypeTagType = (type: string) => {
  switch (type) {
    case "办卡充值":
      return "success"
    case "办卡购次":
      return "warning"
    case "手动充值":
      return "primary"
    default:
      return "info"
  }
}

// 过滤后的记录
const filteredRecords = computed(() => {
  let result = [...records.value]

  // 按时间范围过滤
  if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
    const [startDate, endDate] = searchForm.value.dateRange
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime() + 24 * 60 * 60 * 1000

    result = result.filter((record) => {
      const recordTime = new Date(record.date).getTime()
      return recordTime >= start && recordTime < end
    })
  }

  // 按会员姓名过滤
  if (searchForm.value.name) {
    result = result.filter((record) =>
      record.name.includes(searchForm.value.name),
    )
  }

  // 按手机号过滤
  if (searchForm.value.phone) {
    result = result.filter((record) =>
      record.phone.includes(searchForm.value.phone),
    )
  }

  // 按充值类型过滤
  if (searchForm.value.type) {
    result = result.filter((record) => record.type === searchForm.value.type)
  }

  return result
})

// 分页后的记录
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredRecords.value.slice(start, end)
})

// 统计信息
const statistics = computed(() => {
  const totalCount = filteredRecords.value.length
  // 统计收款金额
  const totalAmount = filteredRecords.value.reduce(
    (sum, r) => sum + (r.receiveAmount || 0),
    0,
  )
  const avgAmount = totalCount > 0 ? totalAmount / totalCount : 0

  // 今日充值（统计收款金额）
  const today = new Date().toISOString().split("T")[0]
  const todayRecords = filteredRecords.value.filter((r) =>
    r.date.startsWith(today),
  )
  const todayAmount = todayRecords.reduce((sum, r) => sum + (r.receiveAmount || 0), 0)

  return {
    totalCount,
    totalAmount,
    avgAmount,
    todayAmount,
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
    name: "",
    phone: "",
    type: "",
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

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.recharge-page {
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
  color: var(--app-success-color);
  font-weight: 600;
}

.receive-amount-text {
  color: var(--el-color-primary);
  font-weight: 600;
}

.recharge-amount-text {
  color: var(--app-success-color);
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
