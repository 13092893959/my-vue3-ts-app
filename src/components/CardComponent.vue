<template>
  <el-card class="card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="card-code">{{ card.id }}</span>
        <el-tag :type="remainingTime >= 0 ? 'success' : 'danger'" size="small">
          {{ card.status }}
        </el-tag>
      </div>
    </template>

    <div class="timer-banner">
      <div class="timer-title">
        {{
          card.endTimestamp
            ? remainingTime >= 0
              ? "计时中"
              : "已超时"
            : "空闲中"
        }}
      </div>
      <div class="timer-value">
        {{
          card.endTimestamp ? formatTime(Math.abs(remainingTime)) : "00:00:00"
        }}
      </div>
      <div class="timer-sub">{{ card.currentUsers }}人</div>
      <div v-if="card.endTimestamp && remainingTime < 0" class="overtime-text">
        已超时 {{ formatTime(Math.abs(remainingTime)) }}
      </div>
    </div>

    <el-descriptions :column="1" size="small">
      <el-descriptions-item label="类型">
        {{ card.type }}
      </el-descriptions-item>
      <el-descriptions-item label="娱乐">
        <el-space wrap>
          <el-tag v-for="item in card.entertainments" :key="item" size="small">
            {{ item }}
          </el-tag>
        </el-space>
      </el-descriptions-item>
      <el-descriptions-item label="楼层">
        {{ card.level }}
      </el-descriptions-item>
      <el-descriptions-item label="容纳人数">
        {{ card.capacity }} 人
      </el-descriptions-item>
      <el-descriptions-item label="最小预约">
        {{ card.minBooking }} 人
      </el-descriptions-item>
      <el-descriptions-item label="拼桌">
        {{ card.isShared ? "已开启" : "未开启" }}
      </el-descriptions-item>
      <el-descriptions-item label="允许预约">
        {{ card.allowBooking ? "允许" : "不允许" }}
      </el-descriptions-item>
      <el-descriptions-item label="描述">
        {{ card.description || "无" }}
      </el-descriptions-item>
    </el-descriptions>

    <template #footer>
      <div class="action-row">
        <el-button type="primary" size="small">拼桌</el-button>
        <el-button type="info" size="small">订单</el-button>
        <el-button type="danger" size="small" @click="settleCard"
          >结算</el-button
        >
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"

defineOptions({
  name: "CardComponent",
})

type CardProps = {
  card: {
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
    endTimestamp?: number
    initialMinutes?: number
  }
}

const props = defineProps<CardProps>()
const emit = defineEmits<{ (e: "settle", id: string): void }>()
const remainingTime = ref(0)
let timer: number | null = null

const getRemainingSeconds = () => {
  if (props.card.endTimestamp) {
    return Math.round((props.card.endTimestamp - Date.now()) / 1000)
  }
  if (props.card.initialMinutes) {
    return props.card.initialMinutes * 60
  }
  return 0
}

const updateRemaining = () => {
  remainingTime.value = getRemainingSeconds()
}

const initTimer = () => {
  updateRemaining()
  if (timer) clearInterval(timer)
  timer = window.setInterval(updateRemaining, 1000)
}

const settleCard = async () => {
  try {
    await ElMessageBox.confirm("确定要结算此卡片吗？", "确认结算", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
    emit("settle", props.card.id)
    ElMessage.success("卡片已结算")
  } catch {
    // 用户取消操作
  }
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

if (props.card.endTimestamp || props.card.initialMinutes) {
  initTimer()
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 360px;
  min-width: 280px;
  margin: 0 auto;
  border-radius: 20px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid rgba(255, 85, 85, 0.16);
  box-shadow: 0 16px 40px rgba(245, 54, 54, 0.12);
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px 0;
}

.card-code {
  font-size: 24px;
  font-weight: 800;
  color: #2a2a2a;
}

.timer-banner {
  margin: 16px 20px 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #ff6c6c, #ff3c5e);
  color: #fff;
  padding: 18px 16px;
  position: relative;
}

.timer-title {
  font-size: 14px;
  opacity: 0.95;
  margin-bottom: 12px;
}

.timer-value {
  font-size: 36px;
  letter-spacing: 0.2em;
  font-weight: 700;
}

.timer-sub {
  margin-top: 10px;
  font-size: 14px;
  opacity: 0.9;
}

.overtime-text {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: space-between;
  padding: 0 20px 20px;
}

.action-row .el-button {
  flex: 1 1 90px;
  min-width: 90px;
}

.el-descriptions {
  width: 100%;
}

.el-card__body {
  padding: 0 20px 20px;
}
</style>
