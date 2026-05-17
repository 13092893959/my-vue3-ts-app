<template>
  <div class="consumption-page">
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
        <el-form-item label="消费项目">
          <el-input
            v-model="searchForm.item"
            placeholder="请输入消费项目"
            clearable
            style="width: 150px"
          />
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
            <div class="stat-label">总消费次数</div>
            <div class="stat-value">{{ statistics.totalCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">充值卡消费金额</div>
            <div class="stat-value">
              ¥{{ statistics.rechargeCardAmount.toFixed(2) }}
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">次卡使用次数</div>
            <div class="stat-value">{{ statistics.timesCardUsed }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">总时长</div>
            <div class="stat-value">{{ statistics.totalDuration }}分钟</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 消费记录列表 -->
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
        <el-table-column label="卡类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.cardType" :type="row.cardType === '充值卡' ? 'success' : 'warning'" size="small">
              {{ row.cardType }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="消费金额" min-width="120" align="right">
          <template #default="{ row }">
            <span v-if="row.cardType === '次卡'" class="times-card-text">次卡消费</span>
            <span v-else class="amount-text">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="item" label="消费项目" min-width="150" />
        <el-table-column
          prop="duration"
          label="时长(分钟)"
          min-width="120"
          align="center"
        />
        <el-table-column label="消费日期" min-width="180">
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

interface ConsumptionRecord {
  id: number
  date: string
  phone: string
  name: string
  amount: number
  item: string
  duration: number
  cardType?: string // 卡类型：充值卡/次卡
}

interface SearchForm {
  dateRange: [string, string] | null
  name: string
  phone: string
  item: string
}

const loading = ref(false)
const records = ref<ConsumptionRecord[]>([])
const currentPage = ref(1)
const pageSize = ref(20)

const searchForm = ref<SearchForm>({
  dateRange: null,
  name: "",
  phone: "",
  item: "",
})

// 获取所有消费记录
const fetchRecords = async () => {
  loading.value = true
  try {
    const response = await fetch(
      "http://localhost:3000/api/consumption-records",
    )

    if (!response.ok) {
      throw new Error("网络响应错误")
    }

    const result = await response.json()

    if (result.success) {
      // 按日期降序排列，最新的数据在前面
      records.value = result.data.sort((a: any, b: any) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
      ElMessage.success(`成功加载 ${result.data.length} 条消费记录`)
    } else {
      ElMessage.error(result.message || "获取消费记录失败")
    }
  } catch (error) {
    console.error("获取消费记录失败:", error)
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
    ElMessage.warning("没有可导出的消费记录")
    return
  }

  const headers = [
    "序号",
    "会员姓名",
    "手机号",
    "卡类型",
    "消费金额",
    "消费项目",
    "时长(分钟)",
    "消费日期",
  ]
  const rows = filteredRecords.value.map((record, index) => [
    index + 1,
    record.name,
    record.phone,
    record.cardType || '-',
    record.cardType === '次卡' ? '次卡消费' : `¥${record.amount.toFixed(2)}`,
    record.item,
    record.duration,
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
  link.download = `消费记录_${new Date().toISOString().split("T")[0]}.csv`
  link.click()

  ElMessage.success("消费记录导出成功")
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

  // 按消费项目过滤
  if (searchForm.value.item) {
    result = result.filter((record) =>
      record.item.toLowerCase().includes(searchForm.value.item.toLowerCase()),
    )
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
  // 只统计充值卡的消费金额
  const rechargeCardAmount = filteredRecords.value
    .filter(r => r.cardType === '充值卡')
    .reduce((sum, r) => sum + r.amount, 0)
  // 统计次卡使用次数
  const timesCardUsed = filteredRecords.value
    .filter(r => r.cardType === '次卡')
    .length
  const totalDuration = filteredRecords.value.reduce(
    (sum, r) => sum + r.duration,
    0,
  )

  return {
    totalCount,
    rechargeCardAmount,
    timesCardUsed,
    totalDuration,
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
    item: "",
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
.consumption-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: #f5f7fa;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: #ffffff;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: auto;
}

.amount-text {
  color: #f56c6c;
  font-weight: 600;
}

.times-card-text {
  color: #e6a23c;
  font-weight: 600;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
