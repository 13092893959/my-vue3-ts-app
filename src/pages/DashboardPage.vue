<template>
  <div class="dashboard-page">
    <main class="content-area">
      <div class="content-header">
        <div class="header-actions">
          <el-button type="primary" @click="addCard" icon="Plus">
            新增桌台
          </el-button>
          <el-button type="danger" @click="logout" icon="SwitchButton">
            退出登录
          </el-button>
        </div>
      </div>

      <div class="content-card">
        <div class="cards-area">
          <div class="cards-grid">
            <div v-for="card in cards" :key="card.id" class="card-col">
              <CardComponent 
                :card="card" 
                @start="startCardTimer" 
                @share="shareTable" 
                @orders="viewOrders"
                @booking="bookingTable"
                @edit="editCard"
                @disable="disableCard"
                @enable="enableCard"
              />
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        v-model="showForm"
        :title="isEditMode ? '编辑桌台' : '新增桌台'"
        width="500px"
        @close="resetForm"
        @opened="handleDialogOpened"
      >
        <el-form
          ref="formRef"
          :model="formData"
          :rules="rules"
          label-width="100px"
        >
          <el-form-item label="桌台编号" prop="tableCode">
            <el-input 
              v-model="formData.tableCode" 
              autocomplete="off" 
              :placeholder="'请输入桌台编号'"
            />
          </el-form-item>
          <el-form-item label="娱乐类型" prop="entertainment">
            <el-checkbox-group v-model="formData.entertainment">
              <el-checkbox label="桌游">桌游</el-checkbox>
              <el-checkbox label="PS5">PS5</el-checkbox>
              <el-checkbox label="拼豆">拼豆</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="桌台类型" prop="type">
            <el-select v-model="formData.type" placeholder="请选择桌台类型">
              <el-option label="大厅" value="大厅" />
              <el-option label="包间" value="包间" />
            </el-select>
          </el-form-item>
          <el-form-item label="楼层" prop="level">
            <el-input-number
              v-model="formData.level"
              :min="1"
              :max="10"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="容纳人数" prop="capacity">
            <el-input-number
              v-model="formData.capacity"
              :min="1"
              :max="20"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="最小预约" prop="minBooking">
            <el-input-number
              v-model="formData.minBooking"
              :min="1"
              :max="20"
              controls-position="right"
            />
          </el-form-item>
          <el-form-item label="开启拼桌" prop="isShared">
            <el-switch v-model="formData.isShared" />
          </el-form-item>
          <el-form-item label="允许预约" prop="allowBooking">
            <el-switch v-model="formData.allowBooking" />
          </el-form-item>
          <el-form-item label="描述" prop="description">
            <el-input
              type="textarea"
              v-model="formData.description"
              :rows="3"
              placeholder="请输入桌台描述（可选）"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showForm = false">取消</el-button>
            <el-button type="primary" @click="submitForm" :loading="loading">
              保存
            </el-button>
          </span>
        </template>
      </el-dialog>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue"
import { useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import type { FormInstance } from "element-plus"
// @ts-ignore: Vue component imports may not be typed correctly in this workspace
import CardComponent from "../components/CardComponent.vue"

const router = useRouter()
const STORAGE_KEY = "card-manager-cards"
const cards = ref<any[]>([])
const showForm = ref(false)
const loading = ref(false)
const isEditMode = ref(false) // 是否为编辑模式
const originalTableCode = ref("") // 记录原始桌台编号
const formRef = ref<FormInstance>()
const formData = ref({
  tableCode: "",
  entertainment: ["桌游"] as string[],
  type: "大厅",
  level: 1,
  capacity: 4,
  minBooking: 1,
  isShared: false,
  allowBooking: true,
  description: "",
})

const rules = {
  tableCode: [{ required: true, message: "请输入桌台编号", trigger: "blur" }],
  entertainment: [
    {
      required: true,
      type: "array",
      min: 1,
      message: "请选择娱乐类型",
      trigger: "change",
    },
  ],
  type: [{ required: true, message: "请选择桌台类型", trigger: "change" }],
  level: [
    { required: true, message: "请输入楼层", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 10,
      message: "楼层应在 1-10 之间",
      trigger: "blur",
    },
  ],
  capacity: [
    { required: true, message: "请输入容纳人数", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 20,
      message: "容纳人数应在 1-20 之间",
      trigger: "blur",
    },
  ],
  minBooking: [
    { required: true, message: "请输入最小预约人数", trigger: "blur" },
    {
      validator: (rule: any, value: number, callback: any) => {
        if (!value || value < 1) {
          return callback(new Error("最小预约人数至少为 1"))
        }
        if (value > formData.value.capacity) {
          return callback(new Error("最小预约人数不能超过容纳人数"))
        }
        callback()
      },
      trigger: "blur",
    },
  ],
}

const loadCards = () => {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        cards.value = parsed
        return
      }
    } catch {
      // ignore malformed storage and fallback to defaults
    }
  }

  cards.value = createDefaultCards()
  saveCards()
}

const saveCards = () => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.value))
}

const addCard = () => {
  showForm.value = true
}

const generateCardId = () => {
  return `F${Date.now().toString().slice(-6)}`
}

const createDefaultCards = () => {
  const baseId = Date.now().toString().slice(-6)
  return Array.from({ length: 6 }, (_, index) => ({
    id: `F${baseId}${index}`,
    status: "空闲",
    type: "大厅",
    entertainments: ["桌游"],
    level: 1,
    capacity: 4,
    minBooking: 1,
    isShared: false,
    allowBooking: true,
    description: "",
    currentUsers: 0,
    isInUse: false,
    isBooked: false,
    bookingInfo: null,
    isDisabled: false,
  }))
}

const submitForm = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        if (isEditMode.value) {
          // 编辑模式：更新现有卡片
          const cardIndex = cards.value.findIndex(c => c.id === originalTableCode.value)
          
          if (cardIndex !== -1) {
            // 如果编号被修改了，检查新编号是否与其他卡片冲突
            if (formData.value.tableCode !== originalTableCode.value) {
              const duplicateCard = cards.value.find(card => card.id === formData.value.tableCode)
              if (duplicateCard) {
                ElMessage.error("桌台编号已存在，请修改后重试")
                return
              }
            }
            
            // 更新卡片信息（包括可能的新编号）
            cards.value[cardIndex] = {
              ...cards.value[cardIndex],
              id: formData.value.tableCode,
              type: formData.value.type,
              entertainments: formData.value.entertainment,
              level: formData.value.level,
              capacity: formData.value.capacity,
              minBooking: formData.value.minBooking,
              isShared: formData.value.isShared,
              allowBooking: formData.value.allowBooking,
              description: formData.value.description,
            }
            
            ElMessage.success("桌台信息已更新")
          }
        } else {
          // 新增模式：检查编号是否存在
          if (cards.value.some((card) => card.id === formData.value.tableCode)) {
            ElMessage.error("桌台编号已存在，请修改后重试")
            return
          }

          cards.value.push({
            id: formData.value.tableCode,
            status: "空闲",
            type: formData.value.type,
            entertainments: formData.value.entertainment,
            level: formData.value.level,
            capacity: formData.value.capacity,
            minBooking: formData.value.minBooking,
            isShared: formData.value.isShared,
            allowBooking: formData.value.allowBooking,
            description: formData.value.description,
            currentUsers: 0,
            isInUse: false,
            isBooked: false,
            bookingInfo: null,
            isDisabled: false,
          })
          ElMessage.success("桌台添加成功")
        }
        showForm.value = false
        resetForm()
      } finally {
        loading.value = false
      }
    }
  })
}

const resetForm = () => {
  isEditMode.value = false // 重置编辑模式
  originalTableCode.value = "" // 重置原始桌台编号
  formData.value = {
    tableCode: "",
    entertainment: ["桌游"],
    type: "大厅",
    level: 1,
    capacity: 4,
    minBooking: 1,
    isShared: false,
    allowBooking: true,
    description: "",
  }
  formRef.value?.clearValidate()
}

const handleDialogOpened = () => {
  // 对话框打开时的处理
  if (!isEditMode.value) {
    // 新增模式，确保表单是干净的
    resetForm()
  }
}

const removeCard = (id: string) => {
  cards.value = cards.value.filter((card) => card.id !== id)
}

const startCardTimer = (id: string, minutes: number) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    card.isInUse = true
    card.isBooked = false
    card.bookingInfo = null
    card.status = "使用中"
    card.currentUsers = 1
    card.endTimestamp = Date.now() + minutes * 60 * 1000
    card.initialMinutes = minutes
    ElMessage.success(`卡片 ${id} 开始计时，时长 ${minutes} 分钟`)
  }
}

const settleCard = (id: string) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    card.isInUse = false
    card.isBooked = false
    card.bookingInfo = null
    card.status = "空闲"
    card.currentUsers = 0
    card.endTimestamp = undefined
    card.initialMinutes = undefined
    ElMessage.success(`卡片 ${id} 已结算`)
  }
}

const shareTable = (id: string) => {
  ElMessage.info(`卡片 ${id} 拼桌功能`)
}

const viewOrders = (id: string) => {
  ElMessage.info(`卡片 ${id} 订单功能`)
}

const bookingTable = (id: string, bookingData: any) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    card.isBooked = true
    card.bookingInfo = {
      bookingUsers: bookingData.bookingUsers,
      bookingTime: bookingData.bookingTime,
      phone: bookingData.phone,
    }
    ElMessage.success(`预约成功！桌台 ${id}，人数 ${bookingData.bookingUsers} 人`)
  }
}

const editCard = (id: string) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    isEditMode.value = true // 设置为编辑模式
    originalTableCode.value = card.id // 记录原始桌台编号
    formData.value = {
      tableCode: card.id,
      entertainment: [...card.entertainments],
      type: card.type,
      level: card.level,
      capacity: card.capacity,
      minBooking: card.minBooking,
      isShared: card.isShared,
      allowBooking: card.allowBooking,
      description: card.description || "",
    }
    showForm.value = true
  }
}

const disableCard = (id: string) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    card.isDisabled = true
    ElMessage.warning(`卡片 ${id} 已禁用`)
  }
}

const enableCard = (id: string) => {
  const card = cards.value.find(c => c.id === id)
  if (card) {
    card.isDisabled = false
    ElMessage.success(`卡片 ${id} 已启用`)
  }
}

const logout = () => {
  window.localStorage.removeItem("card-manager-logged-in")
  router.push("/login")
}

onMounted(loadCards)
watch(cards, saveCards, { deep: true })
</script>

<style scoped>
.dashboard-page {
  height: 100%;
  background: #f6f7fb;
  overflow: hidden;
}

.content-area {
  width: 100%;
  height: 100%;
  padding: 20px 24px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: transparent;
  box-shadow: none;
  overflow: hidden;
}

.content-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  flex: 0 0 auto;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.content-card {
  flex: 1 1 auto;
  min-height: 0;
  padding: 16px;
  background: transparent;
  border-radius: 24px;
  box-shadow: none;
  overflow: auto;
}

.cards-area {
  position: relative;
  min-height: 0;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  justify-content: start;
  gap: 24px;
  align-items: stretch;
}

.card-col {
  display: flex;
  align-items: stretch;
}

.unit {
  margin-left: 8px;
  color: #909399;
}

.dialog-footer {
  text-align: right;
}
</style>
