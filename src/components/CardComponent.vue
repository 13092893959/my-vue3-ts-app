<template>
  <el-card 
    class="card" 
    :class="{ 
      'card-idle': !card.isInUse && !card.isBooked && !card.isDisabled, 
      'card-in-use': card.isInUse,
      'card-booked': card.isBooked && !card.isInUse,
      'card-disabled': card.isDisabled
    }"
    shadow="hover"
    @click="handleCardClick"
  >
    <!-- 头部：编号 + 状态标签 -->
    <template #header>
      <div class="card-header">
        <span class="card-code">{{ card.id }}</span>
        <el-tag 
          v-if="card.isDisabled"
          type="info" 
          size="small" 
          effect="light"
        >
          已禁用
        </el-tag>
        <el-tag 
          v-else-if="card.isInUse" 
          type="danger" 
          size="small" 
          effect="light"
        >
          使用中
        </el-tag>
        <el-tag 
          v-else-if="card.isBooked" 
          type="warning" 
          size="small" 
          effect="light"
        >
          已预约
        </el-tag>
        <el-tag 
          v-else 
          type="success" 
          size="small" 
          effect="light"
        >
          空桌
        </el-tag>
      </div>
    </template>

    <!-- 禁用遮罩层 -->
    <div v-if="card.isDisabled" class="disabled-overlay">
      <div class="disabled-icon">
        <el-icon :size="48"><Lock /></el-icon>
      </div>
      <div class="disabled-text">已禁用</div>
    </div>

    <!-- 预约标识 -->
    <div v-if="card.isBooked && !card.isInUse" class="booking-badge">
      <el-icon><Bell /></el-icon>
      <span>预约</span>
    </div>

    <!-- 使用中模式：显示计时器 -->
    <div v-if="card.isInUse" class="timer-banner">
      <div class="timer-title">计时中</div>
      <div class="timer-value">{{ formatTime(Math.abs(remainingTime)) }}</div>
      <div class="timer-sub">{{ card.currentUsers }}人</div>
    </div>

    <!-- 预约信息展示 -->
    <div v-if="card.isBooked && !card.isInUse && card.bookingInfo" class="booking-info">
      <div class="booking-info-item">
        <span class="info-label">预约人数</span>
        <span class="info-value">{{ card.bookingInfo.bookingUsers }}人</span>
      </div>
      <div class="booking-info-item">
        <span class="info-label">预约时间</span>
        <span class="info-value">{{ formatDate(card.bookingInfo.bookingTime) }}</span>
      </div>
      <div class="booking-info-item">
        <span class="info-label">联系电话</span>
        <span class="info-value">{{ card.bookingInfo.phone }}</span>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="card-info">
      <div class="info-item">
        <span class="info-label">楼层</span>
        <span class="info-value">{{ card.level }}楼F</span>
      </div>
      <div class="info-item">
        <span class="info-label">类型</span>
        <span class="info-value">{{ card.type }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">娱乐</span>
        <span class="info-value">
          <el-tag v-for="item in card.entertainments" :key="item" size="small" type="primary" effect="light">
            {{ item }}
          </el-tag>
        </span>
      </div>
      <div class="info-item">
        <span class="info-label">容量</span>
        <span class="info-value">{{ card.capacity }}人</span>
      </div>
    </div>

    <!-- 底部操作按钮 -->
    <template #footer>
      <!-- 空闲模式：开始计时按钮 -->
      <div v-if="!card.isInUse" class="action-row-idle">
        <el-button type="primary" size="large" @click.stop="showTimerDialog = true" class="btn-start">
          开始计时
        </el-button>
      </div>
      
      <!-- 使用中模式：拼桌和订单按钮 -->
      <div v-else class="action-row-in-use">
        <el-button type="success" size="default" @click.stop="shareTable">
          拼桌
        </el-button>
        <el-button type="info" size="default" @click.stop="viewOrders">
          订单
        </el-button>
      </div>
    </template>
  </el-card>

  <!-- 开始计时对话框 -->
  <el-dialog
    v-model="showTimerDialog"
    title="设置计时时间"
    width="400px"
    @close="resetTimerForm"
  >
    <el-form :model="timerForm" label-width="100px">
      <el-form-item label="计时时长">
        <el-input-number
          v-model="timerForm.hours"
          :min="0"
          :max="23"
          controls-position="right"
          style="width: 120px"
        />
        <span style="margin: 0 8px">小时</span>
        <el-input-number
          v-model="timerForm.minutes"
          :min="0"
          :max="59"
          controls-position="right"
          style="width: 120px"
        />
        <span style="margin: 0 8px">分钟</span>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showTimerDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmStartTimer">确认开始</el-button>
    </template>
  </el-dialog>

  <!-- 桌台详情对话框 -->
  <el-dialog
    v-model="showDetailDialog"
    title="桌台详情"
    width="700px"
  >
    <div class="detail-header">
      <h2 class="detail-title">{{ card.level }}楼F-{{ card.id }}</h2>
      <el-tag :type="card.isInUse ? 'danger' : (card.isBooked ? 'warning' : 'success')" size="large" effect="light">
        {{ card.isInUse ? "使用中" : (card.isBooked ? "已预约" : "空桌") }}
      </el-tag>
    </div>

    <!-- 桌台信息 -->
    <div class="detail-table-info">
      <h3 class="detail-info-title">桌台信息</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="桌台类型">
          {{ card.type }}
        </el-descriptions-item>
        <el-descriptions-item label="楼层">
          {{ card.level }}楼F
        </el-descriptions-item>
        <el-descriptions-item label="最大人数">
          {{ card.capacity }}人
        </el-descriptions-item>
        <el-descriptions-item label="最小预约">
          {{ card.minBooking }}人
        </el-descriptions-item>
        <el-descriptions-item label="开启拼桌">
          <el-tag :type="card.isShared ? 'success' : 'info'" size="small">
            {{ card.isShared ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="允许预约">
          <el-tag :type="card.allowBooking ? 'success' : 'info'" size="small">
            {{ card.allowBooking ? "是" : "否" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="娱乐类型" :span="2">
          <el-space wrap>
            <el-tag v-for="item in card.entertainments" :key="item" size="small">
              {{ item }}
            </el-tag>
          </el-space>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ card.description || "暂无描述" }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 预约信息展示 -->
    <div v-if="card.isBooked && card.bookingInfo" class="detail-booking-info">
      <h3 class="detail-booking-title">预约信息</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="预约人数">
          {{ card.bookingInfo.bookingUsers }}人
        </el-descriptions-item>
        <el-descriptions-item label="预约时间">
          {{ formatDate(card.bookingInfo.bookingTime) }}
        </el-descriptions-item>
        <el-descriptions-item label="联系电话">
          {{ card.bookingInfo.phone }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <div class="detail-actions">
      <el-button v-if="!card.isInUse && !card.isDisabled" type="primary" @click="handleStartFromDetail">开始计时</el-button>
      <el-button v-if="!card.isDisabled" type="warning" @click="handleBooking">预约</el-button>
      <el-button v-if="!card.isDisabled" type="edit" @click="handleEdit">编辑</el-button>
      <el-button v-if="!card.isDisabled" type="danger" @click="handleDisable">禁用</el-button>
      <el-button v-if="card.isDisabled" type="success" @click="handleEnable">启用</el-button>
    </div>
  </el-dialog>

  <!-- 预约对话框 -->
  <el-dialog
    v-model="showBookingDialog"
    title="预约桌台"
    width="500px"
    @close="resetBookingForm"
  >
    <el-form
      ref="bookingFormRef"
      :model="bookingForm"
      :rules="bookingRules"
      label-width="100px"
    >
      <el-form-item label="桌台编号">
        <el-input v-model="bookingForm.tableCode" disabled />
      </el-form-item>
      <el-form-item label="预约人数" prop="bookingUsers">
        <el-input-number
          v-model="bookingForm.bookingUsers"
          :min="1"
          :max="card.capacity"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="预约时间" prop="bookingTime">
        <el-date-picker
          v-model="bookingForm.bookingTime"
          type="datetime"
          placeholder="选择预约时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>
      <el-form-item label="预留手机号" prop="phone">
        <el-input
          v-model="bookingForm.phone"
          placeholder="请输入预留手机号"
          maxlength="11"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showBookingDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmBooking">确认预约</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onUnmounted, watch } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import { Bell, Lock } from '@element-plus/icons-vue'

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
    isInUse?: boolean
    isBooked?: boolean
    isDisabled?: boolean
    endTimestamp?: number
    initialMinutes?: number
    bookingInfo?: any
  }
}

const props = defineProps<CardProps>()
const emit = defineEmits<{ 
  (e: "start", id: string, minutes: number): void
  (e: "share", id: string): void
  (e: "orders", id: string): void
  (e: "settle", id: string): void
  (e: "booking", id: string, bookingData: any): void
  (e: "edit", id: string): void
  (e: "disable", id: string): void
  (e: "enable", id: string): void
}>()

const remainingTime = ref(0)
let timer: number | null = null

// 对话框状态
const showTimerDialog = ref(false)
const showDetailDialog = ref(false)
const showBookingDialog = ref(false)

// 计时表单
const timerForm = ref({
  hours: 0,
  minutes: 60,
})

// 预约表单
const bookingFormRef = ref<FormInstance>()
const bookingForm = ref({
  tableCode: "",
  bookingUsers: 1,
  bookingTime: null as Date | null,
  phone: "",
})

const bookingRules = ref<FormRules>({
  bookingUsers: [
    { required: true, message: "请输入预约人数", trigger: "blur" },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (value < props.card.minBooking) {
          callback(new Error(`预约人数不能少于${props.card.minBooking}人`))
        } else if (value > props.card.capacity) {
          callback(new Error(`预约人数不能超过${props.card.capacity}人`))
        } else {
          callback()
        }
      },
      trigger: "blur",
    },
  ],
  bookingTime: [
    { required: true, message: "请选择预约时间", trigger: "change" },
  ],
  phone: [
    { required: true, message: "请输入预留手机号", trigger: "blur" },
    { pattern: /^1[3-9]\d{9}$/, message: "请输入正确的手机号", trigger: "blur" },
  ],
})

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

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 监听 isInUse 和 endTimestamp 变化以启动/停止计时器
watch(
  () => [props.card.isInUse, props.card.endTimestamp],
  ([isInUse]) => {
    if (isInUse) {
      initTimer()
    } else {
      stopTimer()
      remainingTime.value = 0
    }
  },
  { immediate: true }
)

// 点击卡片显示详情
const handleCardClick = () => {
  if (props.card.isDisabled) return // 禁用的卡片不允许点击
  showDetailDialog.value = true
}

const resetTimerForm = () => {
  timerForm.value = {
    hours: 0,
    minutes: 60,
  }
}

const confirmStartTimer = () => {
  const totalMinutes = timerForm.value.hours * 60 + timerForm.value.minutes
  if (totalMinutes === 0) {
    ElMessage.warning("请设置计时时间")
    return
  }
  emit("start", props.card.id, totalMinutes)
  showTimerDialog.value = false
  resetTimerForm()
}

const shareTable = () => {
  emit("share", props.card.id)
}

const viewOrders = () => {
  emit("orders", props.card.id)
}

const handleStartFromDetail = () => {
  showDetailDialog.value = false
  showTimerDialog.value = true
}

const handleBooking = () => {
  // 初始化预约表单
  bookingForm.value = {
    tableCode: props.card.id,
    bookingUsers: props.card.minBooking,
    bookingTime: null,
    phone: "",
  }
  showDetailDialog.value = false
  showBookingDialog.value = true
}

const resetBookingForm = () => {
  bookingFormRef.value?.clearValidate()
  bookingForm.value = {
    tableCode: "",
    bookingUsers: 1,
    bookingTime: null,
    phone: "",
  }
}

const confirmBooking = async () => {
  if (!bookingFormRef.value) return
  
  await bookingFormRef.value.validate((valid) => {
    if (valid) {
      emit("booking", props.card.id, { ...bookingForm.value })
      showBookingDialog.value = false
      ElMessage.success(`预约成功！桌台 ${props.card.id}`)
    }
  })
}

const handleEdit = () => {
  emit("edit", props.card.id)
  showDetailDialog.value = false
}

const handleDisable = async () => {
  try {
    await ElMessageBox.confirm("确定要禁用此桌台吗？", "确认禁用", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    })
    emit("disable", props.card.id)
    showDetailDialog.value = false
  } catch {
    // 用户取消
  }
}

const handleEnable = async () => {
  try {
    await ElMessageBox.confirm("确定要启用此桌台吗？", "确认启用", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "info",
    })
    emit("enable", props.card.id)
    showDetailDialog.value = false
  } catch {
    // 用户取消
  }
}

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

const formatDate = (date: Date | null) => {
  if (!date) return '-'
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

onUnmounted(() => {
  stopTimer()
})
</script>

<style scoped>
.card {
  width: 100%;
  max-width: 300px;
  min-width: 240px;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  background: #ffffff;
  box-sizing: border-box;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-idle {
  border: 2px solid #67c23a;
}

.card-idle:hover {
  box-shadow: 0 8px 24px rgba(103, 194, 58, 0.2);
}

.card-in-use {
  border: 2px solid #f56c6c;
}

.card-in-use:hover {
  box-shadow: 0 8px 24px rgba(245, 108, 108, 0.2);
}

.card-booked {
  border: 2px solid #e6a23c;
}

.card-booked:hover {
  box-shadow: 0 8px 24px rgba(230, 162, 60, 0.2);
}

.card-disabled {
  border: 2px solid #dcdfe6;
  opacity: 0.6;
  filter: grayscale(100%);
  pointer-events: none;
}

.card-disabled:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 0;
}

.card-code {
  font-size: 24px;
  font-weight: 800;
  color: #303133;
}

.disabled-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 12px;
}

.disabled-icon {
  color: #909399;
  margin-bottom: 8px;
}

.disabled-text {
  font-size: 16px;
  font-weight: 600;
  color: #909399;
}

.booking-badge {
  position: absolute;
  top: -8px;
  right: 50px;
  background: linear-gradient(135deg, #ffd666, #ffa940);
  color: #fff;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 3px;
  box-shadow: 0 2px 6px rgba(255, 169, 64, 0.3);
}

.booking-badge .el-icon {
  font-size: 12px;
}

.timer-banner {
  margin: 12px 16px 0;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff7875, #ff4d4f);
  color: #fff;
  padding: 18px 14px;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
}

.timer-title {
  font-size: 13px;
  opacity: 0.95;
  margin-bottom: 6px;
  line-height: 1;
}

.timer-value {
  font-size: 30px;
  letter-spacing: 0.12em;
  font-weight: 700;
  font-family: 'Courier New', monospace;
  line-height: 1.2;
  white-space: nowrap;
}

.timer-sub {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.9;
  line-height: 1;
}

.card-info {
  padding: 16px 16px 0;
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 13px;
}

.info-label {
  color: #909399;
  font-weight: 500;
}

.info-value {
  color: #303133;
  font-weight: 600;
}

.booking-info {
  padding: 12px 16px 0;
  margin-top: 6px;
  border-top: 1px dashed #dcdfe6;
  flex-shrink: 0;
}

.booking-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 12px;
}

.booking-info-item:last-child {
  margin-bottom: 0;
}

.booking-info .info-label {
  color: #e6a23c;
  font-weight: 500;
}

.booking-info .info-value {
  color: #e6a23c;
  font-weight: 600;
}

.action-row-idle {
  padding: 0 16px 16px;
  margin-top: auto;
}

.btn-start {
  width: 100%;
  height: 36px;
  font-size: 15px;
}

.action-row-in-use {
  display: flex;
  gap: 10px;
  padding: 0 16px 16px;
  margin-top: auto;
}

.action-row-in-use .el-button {
  flex: 1;
  height: 34px;
  font-size: 13px;
}

.el-card__body {
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-title {
  font-size: 28px;
  font-weight: 700;
  margin: 0;
  color: #303133;
}

.detail-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.detail-actions .el-button {
  min-width: 100px;
}

.detail-booking-info {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.detail-booking-title {
  font-size: 16px;
  font-weight: 600;
  color: #e6a23c;
  margin: 0 0 16px 0;
}

.detail-table-info {
  margin-bottom: 24px;
}

.detail-info-title {
  font-size: 16px;
  font-weight: 600;
  color: #409eff;
  margin: 0 0 16px 0;
}
</style>
