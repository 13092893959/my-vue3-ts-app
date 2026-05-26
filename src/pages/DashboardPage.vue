<template>
  <div class="dashboard-page">
    <main class="content-area">
      <div class="content-header">
        <div class="header-actions">
          <el-button type="primary" @click="addCard" size="large">
            新增桌台
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
                @add-person="addPersonToCard"
                @mid-settle="settleCardMidway"
                @share="shareCard"
                @orders="viewOrders"
                @settle="settleCard"
                @settle-multi="settleCardMulti"
                @booking="bookingTable"
                @cancel-booking="cancelBooking"
                @edit="editCard"
                @disable="disableCard"
                @enable="enableCard"
                @update-remark="updateCardRemark"
                @update-snacks="updateCardSnacks"
              />
            </div>
          </div>
        </div>
      </div>

      <el-dialog
        v-model="showForm"
        :title="isEditMode ? '编辑桌台' : '新增桌台'"
        width="500px"
        append-to-body
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

const loadCards = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/tables")
    const result = await response.json()

    if (
      result.success &&
      Array.isArray(result.data) &&
      result.data.length > 0
    ) {
      cards.value = result.data
    } else {
      // 如果API返回空数据，创建默认桌台并保存
      cards.value = createDefaultCards()
      await saveCards()
    }
  } catch (error) {
    console.error("加载桌台数据失败:", error)
    ElMessage.error("加载桌台数据失败，请检查后端服务是否启动")
    // 降级方案：使用localStorage或创建默认桌台
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
  }
}

const saveCards = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cards.value),
    })

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "保存失败")
    }
  } catch (error) {
    console.error("保存桌台数据失败:", error)
    ElMessage.error("保存桌台数据失败")
    // 降级方案：保存到localStorage
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.value))
  }
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
    currentOrderRemark: "",
    currentOrderSnacks: [],
    timerSessions: [],
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
          const cardIndex = cards.value.findIndex(
            (c) => c.id === originalTableCode.value,
          )

          if (cardIndex !== -1) {
            // 如果编号被修改了，检查新编号是否与其他卡片冲突
            if (formData.value.tableCode !== originalTableCode.value) {
              const duplicateCard = cards.value.find(
                (card) => card.id === formData.value.tableCode,
              )
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
          if (
            cards.value.some((card) => card.id === formData.value.tableCode)
          ) {
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
            timerSessions: [],
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

const startCardTimer = (
  id: string,
  data: { entertainment: string; currentUsers: number; startTimestamp: number },
) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.isInUse = true
    card.isBooked = false
    card.bookingInfo = null
    card.status = "使用中"
    card.currentEntertainment = data.entertainment
    card.currentUsers = data.currentUsers
    card.startTimestamp = data.startTimestamp
    // 创建第一个 timer session
    card.timerSessions = [{
      id: `session-${Date.now()}`,
      users: data.currentUsers,
      startTimestamp: data.startTimestamp,
      label: `批次 1 (${data.currentUsers}人)`,
    }]
    ElMessage.success(
      `卡片 ${id} 开始计时，娱乐类型：${data.entertainment}，人数：${data.currentUsers}`,
    )
  }
}

const addPersonToCard = (
  id: string,
  data: { users: number; startTimestamp: number },
) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    const sessions = card.timerSessions || []
    const sessionIdx = sessions.length + 1
    sessions.push({
      id: `session-${Date.now()}`,
      users: data.users,
      startTimestamp: data.startTimestamp,
      label: `批次 ${sessionIdx} (${data.users}人)`,
    })
    card.timerSessions = sessions
    card.currentUsers += data.users
    // 如果加人时间早于最早计时，更新 startTimestamp
    if (data.startTimestamp < card.startTimestamp!) {
      card.startTimestamp = data.startTimestamp
    }
    ElMessage.success(
      `桌台 ${id} 加人 ${data.users} 人，当前共 ${card.currentUsers} 人`,
    )
  }
}

const settleCardMidway = async (
  id: string,
  data: {
    sessionId: string
    leavingUsers: number
    memberId: number | null
    selectedPackageIds: string[]
    totalAmount: number
    discount: number
    finalAmount: number
    paymentMethod: string
    assignedSnacks: Record<number, number>
  },
) => {
  const card = cards.value.find((c) => c.id === id)
  if (!card || !card.startTimestamp) return

  const sessions: any[] = card.timerSessions || []
  const sessionIdx = sessions.findIndex((s: any) => s.id === data.sessionId)
  if (sessionIdx === -1) return
  const session = sessions[sessionIdx]

  const endTime = Date.now()
  const durationSeconds = Math.round((endTime - session.startTimestamp) / 1000)
  const durationMinutes = Math.ceil(durationSeconds / 60)

  // Load member info
  let memberInfo: any = null
  if (data.memberId) {
    try {
      const res = await fetch("http://localhost:3000/api/members")
      const result = await res.json()
      if (result.success) {
        memberInfo = result.data.find((m: any) => m.id === data.memberId) || null
      }
    } catch (e) { console.error("加载会员信息失败:", e) }
  }

  // Load package info
  let packageInfos: any[] = []
  if (data.selectedPackageIds?.length > 0) {
    try {
      const res = await fetch("http://localhost:3000/api/packages")
      const result = await res.json()
      if (result.success) {
        packageInfos = data.selectedPackageIds
          .map((pid: string) => result.data.find((p: any) => p.id === pid))
          .filter(Boolean)
      }
    } catch (e) { console.error("加载套餐信息失败:", e) }
  }

  // Build allocated snacks
  const allTableSnacks: any[] = card.currentOrderSnacks || []
  const leavingSnacks: any[] = []
  Object.entries(data.assignedSnacks).forEach(([idxStr, qty]) => {
    const idx = parseInt(idxStr)
    const snack = allTableSnacks[idx]
    if (snack && qty > 0) {
      leavingSnacks.push({ ...snack, quantity: qty })
    }
  })
  const snackTotal = leavingSnacks.reduce((sum: number, s: any) => sum + s.price * s.quantity, 0)

  const orderData: any = {
    tableId: card.id,
    tableCode: card.id,
    entertainment: card.currentEntertainment || "",
    users: data.leavingUsers,
    startTime: session.startTimestamp,
    endTime,
    duration: durationMinutes,
    amount: data.finalAmount,
    totalAmount: data.totalAmount,
    discount: data.discount,
    memberId: data.memberId || null,
    memberPhone: memberInfo?.phone || null,
    memberName: memberInfo?.name || null,
    paymentMethod: data.paymentMethod || "cash",
    cardType: memberInfo?.cardType || null,
    packageIds: data.selectedPackageIds || [],
    packageNames: packageInfos.map((p: any) => p.name).join(", "),
    packageTotal: data.totalAmount,
    remark: card.currentOrderRemark || "",
    snacks: leavingSnacks,
    snackTotal,
    isMidwaySettlement: true,
    parentSessionId: session.id,
    parentSessionLabel: session.label,
  }

  try {
    const orderRes = await fetch("http://localhost:3000/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
    if (!orderRes.ok) throw new Error("网络响应错误")
    const orderResult = await orderRes.json()
    if (!orderResult.success) throw new Error(orderResult.message || "创建订单失败")

    // Process member payment
    if (data.paymentMethod === "member_balance" && memberInfo) {
      await processMemberPayment(memberInfo, data.finalAmount, card.currentEntertainment || "", durationMinutes)
    }

    // Update snack stock for leaving snacks
    if (leavingSnacks.length > 0) {
      await updateSnackStock(leavingSnacks)
    }

    // Deduct snacks from table
    Object.entries(data.assignedSnacks).forEach(([idxStr, qty]) => {
      const idx = parseInt(idxStr)
      if (allTableSnacks[idx]) {
        allTableSnacks[idx].quantity -= qty
      }
    })
    // Remove zero-quantity snacks (reverse order to avoid index shift)
    for (let i = allTableSnacks.length - 1; i >= 0; i--) {
      if (allTableSnacks[i].quantity <= 0) {
        allTableSnacks.splice(i, 1)
      }
    }
    card.currentOrderSnacks = allTableSnacks

    // Reduce session user count
    session.users -= data.leavingUsers
    card.currentUsers -= data.leavingUsers

    if (session.users <= 0) {
      card.timerSessions = sessions.filter((s: any) => s.id !== session.id)
    } else {
      // Re-label remaining sessions
      const remainingSessions = card.timerSessions || []
      remainingSessions.forEach((s: any, i: number) => {
        s.label = `批次 ${i + 1} (${s.users}人)`
      })
    }

    // If all sessions empty, full settle
    if (!card.timerSessions || card.timerSessions.length === 0 || card.currentUsers <= 0) {
      card.isInUse = false
      card.isBooked = false
      card.bookingInfo = null
      card.status = "空闲"
      card.currentUsers = 0
      card.currentEntertainment = undefined
      card.startTimestamp = null
      card.initialMinutes = undefined
      card.currentOrderRemark = ""
      card.currentOrderSnacks = []
      card.timerSessions = []
    }

    saveCards()
    ElMessage.success(`中途结算完成，${data.leavingUsers}人已离场`)
  } catch (error) {
    console.error("中途结算失败:", error)
    ElMessage.error(error instanceof Error ? error.message : "中途结算失败")
  }
}

const settleCard = async (
  id: string,
  settleData: {
    totalAmount: number
    discount: number
    finalAmount: number
    memberId?: number | null
    paymentMethod?: string
    selectedPackageIds?: string[]
    snacks?: any[]
    snackTotal?: number
  },
) => {
  const card = cards.value.find((c) => c.id === id)
  if (card && card.startTimestamp) {
    const endTime = Date.now()
    const duration = Math.round((endTime - card.startTimestamp) / 1000) // 秒
    const groupDurationMinutes = Math.ceil(duration / 60) // 分钟，向上取整

    // 查找会员信息
    let memberInfo = null
    if (settleData.memberId) {
      try {
        const membersResponse = await fetch("http://localhost:3000/api/members")
        const membersResult = await membersResponse.json()
        if (membersResult.success) {
          memberInfo = membersResult.data.find(
            (m: any) => m.id === settleData.memberId,
          )
        }
      } catch (error) {
        console.error("加载会员信息失败:", error)
      }
    }

    // 查找套餐信息
    let packageInfos: any[] = []
    if (settleData.selectedPackageIds && settleData.selectedPackageIds.length > 0) {
      try {
        const packagesResponse = await fetch("http://localhost:3000/api/packages")
        const packagesResult = await packagesResponse.json()
        if (packagesResult.success) {
          packageInfos = settleData.selectedPackageIds.map(id => 
            packagesResult.data.find((p: any) => p.id === id)
          ).filter(Boolean)
        }
      } catch (error) {
        console.error("加载套餐信息失败:", error)
      }
    }

    // 构建订单数据
    const orderData: any = {
      tableId: card.id,
      tableCode: card.id,
      entertainment: card.currentEntertainment || "",
      users: card.currentUsers,
      startTime: card.startTimestamp,
      endTime: endTime,
      duration: groupDurationMinutes,
      amount: settleData.finalAmount,
      totalAmount: settleData.totalAmount,
      discount: settleData.discount,
      // 新增会员关联信息
      memberId: settleData.memberId || null,
      memberPhone: memberInfo?.phone || null,
      memberName: memberInfo?.name || null,
      paymentMethod: settleData.paymentMethod || "cash",
      cardType: memberInfo?.cardType || null,
      // 新增套餐关联信息（支持多选）
      packageIds: settleData.selectedPackageIds || [],
      packageNames: packageInfos.map(p => p.name).join(", "),
      packageTotal: settleData.totalAmount,
      // 添加订单备注（从桌台数据中获取）
      remark: card.currentOrderRemark || "",
      // 添加零食信息
      snacks: settleData.snacks || [],
      snackTotal: settleData.snackTotal || 0,
    }

    try {
      // 1. 创建订单
      const orderResponse = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (!orderResponse.ok) {
        throw new Error("网络响应错误")
      }

      const orderResult = await orderResponse.json()

      if (!orderResult.success) {
        throw new Error(orderResult.message || "创建订单失败")
      }

      // 2. 更新零食库存
      if (orderData.snacks && orderData.snacks.length > 0) {
        await updateSnackStock(orderData.snacks)
      }

      // 3. 如果使用会员余额支付，需要扣减余额/次数并创建消费记录
      if (settleData.paymentMethod === "member_balance" && memberInfo) {
        await processMemberPayment(
          memberInfo,
          settleData.finalAmount,
          card.currentEntertainment || "",
          groupDurationMinutes,
        )
      }

      // 4. 重置桌台状态
      card.isInUse = false
      card.isBooked = false
      card.bookingInfo = null
      card.status = "空闲"
      card.currentUsers = 0
      card.currentEntertainment = undefined
      card.startTimestamp = null
      card.initialMinutes = undefined
      card.currentOrderRemark = "" // 清除订单备注
      card.currentOrderSnacks = []
      card.timerSessions = []
      saveCards()

      ElMessage.success(
        `卡片 ${id} 已结算，订单金额：¥${settleData.finalAmount.toFixed(2)}`,
      )
    } catch (error) {
      console.error("结算失败:", error)
      ElMessage.error(error instanceof Error ? error.message : "结算失败")
    }
  }
}

// 拆单结算：创建多笔订单
interface SettleGroup {
  id: string
  label: string
  users: number
  memberId: number | null
  selectedPackageIds: string[]
  totalAmount: number
  discount: number
  finalAmount: number
  paymentMethod: string
  assignedSnacks: Record<number, number>  // snackIndex → allocated quantity
}

const settleCardMulti = async (id: string, groups: SettleGroup[]) => {
  const card = cards.value.find((c) => c.id === id)
  if (!card || !card.startTimestamp) return

  const endTime = Date.now()
  const batchId = `BATCH-${Date.now()}`
  const allTableSnacks = card.currentOrderSnacks || []
  const sessions = card.timerSessions || []

  // 收集所有分组分配的零食（用于统一扣库存）
  const allAssignedSnacks: any[] = []

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]
    // 按分组索引匹配 timer session，获取该批次的开始时间
    const session = sessions[gi]
    const groupStartTime = session ? session.startTimestamp : card.startTimestamp!
    const groupDuration = Math.round((endTime - groupStartTime) / 1000)
    const groupDurationMinutes = Math.ceil(groupDuration / 60)
    // 查找该分组的会员信息
    let memberInfo = null
    if (group.memberId) {
      try {
        const membersResponse = await fetch("http://localhost:3000/api/members")
        const membersResult = await membersResponse.json()
        if (membersResult.success) {
          memberInfo = membersResult.data.find(
            (m: any) => m.id === group.memberId,
          )
        }
      } catch (error) {
        console.error("加载会员信息失败:", error)
      }
    }

    // 查找该分组的套餐信息
    let packageInfos: any[] = []
    if (group.selectedPackageIds && group.selectedPackageIds.length > 0) {
      try {
        const packagesResponse = await fetch("http://localhost:3000/api/packages")
        const packagesResult = await packagesResponse.json()
        if (packagesResult.success) {
          packageInfos = group.selectedPackageIds
            .map((pid) => packagesResult.data.find((p: any) => p.id === pid))
            .filter(Boolean)
        }
      } catch (error) {
        console.error("加载套餐信息失败:", error)
      }
    }

    // 该分组的零食（按分配数量拆分）
    const groupSnacks: any[] = []
    Object.entries(group.assignedSnacks).forEach(([idxStr, qty]) => {
      const idx = parseInt(idxStr)
      const snack = allTableSnacks[idx]
      if (snack && qty > 0) {
        groupSnacks.push({ ...snack, quantity: qty })
      }
    })

    const orderData: any = {
      tableId: card.id,
      tableCode: card.id,
      entertainment: card.currentEntertainment || "",
      users: group.users,
      startTime: groupStartTime,
      endTime: endTime,
      duration: groupDurationMinutes,
      amount: group.finalAmount,
      totalAmount: group.totalAmount,
      discount: group.discount,
      memberId: group.memberId || null,
      memberPhone: memberInfo?.phone || null,
      memberName: memberInfo?.name || null,
      paymentMethod: group.paymentMethod || "cash",
      cardType: memberInfo?.cardType || null,
      packageIds: group.selectedPackageIds || [],
      packageNames: packageInfos.map((p) => p.name).join(", "),
      packageTotal: group.totalAmount,
      remark: card.currentOrderRemark || "",
      snacks: groupSnacks,
      snackTotal: groupSnacks.reduce(
        (sum: number, s: any) => sum + s.price * s.quantity,
        0,
      ),
      // 拆单标识字段
      groupLabel: group.label,
      groupId: group.id,
      settlementBatchId: batchId,
      totalUsersAtTable: card.currentUsers,
    }

    try {
      const orderResponse = await fetch("http://localhost:3000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      })

      if (!orderResponse.ok) {
        throw new Error("网络响应错误")
      }

      const orderResult = await orderResponse.json()
      if (!orderResult.success) {
        throw new Error(orderResult.message || "创建订单失败")
      }

      // 处理该分组的会员支付
      if (group.paymentMethod === "member_balance" && memberInfo) {
        await processMemberPayment(
          memberInfo,
          group.finalAmount,
          card.currentEntertainment || "",
          groupDurationMinutes,
        )
      }

      // 收集零食用于统一扣库存
      if (groupSnacks.length > 0) {
        allAssignedSnacks.push(...groupSnacks)
      }
    } catch (error) {
      console.error(`分组 ${group.label} 结算失败:`, error)
      ElMessage.error(
        error instanceof Error ? error.message : `分组 ${group.label} 结算失败`,
      )
    }
  }

  // 统一更新零食库存
  if (allAssignedSnacks.length > 0) {
    await updateSnackStock(allAssignedSnacks)
  }

  // 重置桌台状态
  card.isInUse = false
  card.isBooked = false
  card.bookingInfo = null
  card.status = "空闲"
  card.currentUsers = 0
  card.currentEntertainment = undefined
  card.startTimestamp = null
  card.initialMinutes = undefined
  card.currentOrderRemark = ""
  card.currentOrderSnacks = []
  saveCards()

  ElMessage.success(
    `拆单结算完成，共创建 ${groups.length} 笔订单`,
  )
}

// 更新零食库存
const updateSnackStock = async (snacks: any[]) => {
  try {
    // 获取所有零食
    const response = await fetch("http://localhost:3000/api/snacks")
    if (!response.ok) {
      throw new Error("获取零食列表失败")
    }
    
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || "获取零食列表失败")
    }
    
    const allSnacks = result.data
    
    // 更新每个零食的库存
    for (const snack of snacks) {
      const snackIndex = allSnacks.findIndex((s: any) => s.id === snack.snackId)
      if (snackIndex !== -1) {
        const currentStock = allSnacks[snackIndex].stock || 0
        const quantity = snack.quantity || 0
        
        if (currentStock < quantity) {
          console.warn(`零食 ${snack.name} 库存不足：当前${currentStock}，需要${quantity}`)
          continue
        }
        
        // 减少库存
        allSnacks[snackIndex].stock = currentStock - quantity
        
        // 保存更新后的零食数据
        const updateResponse = await fetch(
          `http://localhost:3000/api/snacks/${snack.snackId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(allSnacks[snackIndex]),
          }
        )
        
        if (!updateResponse.ok) {
          console.error(`更新零食 ${snack.name} 库存失败`)
        }
      }
    }
    
    console.log(`已更新 ${snacks.length} 种零食的库存`)
  } catch (error) {
    console.error("更新零食库存失败:", error)
    // 不抛出错误，避免影响结算流程
  }
}

// 处理会员支付（扣减余额/次数 + 创建消费记录）
const processMemberPayment = async (
  member: any,
  amount: number,
  item: string,
  duration: number,
) => {
  const updates: any = {}

  if (member.cardType === "充值卡") {
    // 充值卡：扣减余额
    if ((member.balance || 0) < amount) {
      throw new Error("会员余额不足")
    }
    updates.balance = member.balance - amount
    // 累计总消费金额（仅充值卡）
    updates.totalConsumption = (member.totalConsumption || 0) + amount
  } else if (member.cardType === "次卡") {
    // 次卡：扣减1次
    if ((member.remainingTimes || 0) <= 0) {
      throw new Error("次卡次数已用完")
    }
    updates.remainingTimes = member.remainingTimes - 1
    // 累计次卡使用次数（不计入总消费金额）
    updates.timesCardUsed = (member.timesCardUsed || 0) + 1
  }

  // 更新游玩时长（两种卡都累计）
  updates.playTime = (member.playTime || 0) + duration

  // 1. 更新会员信息
  const updateResponse = await fetch(
    `http://localhost:3000/api/members/${member.id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    },
  )

  const updateResult = await updateResponse.json()
  if (!updateResult.success) {
    throw new Error("更新会员信息失败")
  }

  // 2. 创建消费记录
  const consumptionRecord = {
    memberId: member.id,
    phone: member.phone,
    name: member.name,
    amount: member.cardType === "次卡" ? 0 : amount, // 次卡不计金额
    item: member.cardType === "次卡" ? "次卡消费1次" : item, // 次卡显示特殊项目
    duration: duration,
    cardType: member.cardType, // 记录卡类型，便于区分
  }

  const recordResponse = await fetch(
    "http://localhost:3000/api/consumption-records",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(consumptionRecord),
    },
  )

  const recordResult = await recordResponse.json()
  if (!recordResult.success) {
    throw new Error("创建消费记录失败")
  }
}

const shareCard = (id: string) => {
  ElMessage.info(`卡片 ${id} 拼桌功能`)
}

const viewOrders = (id: string) => {
  ElMessage.info(`卡片 ${id} 订单功能`)
}

const bookingTable = (id: string, bookingData: any) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.isBooked = true
    card.bookingInfo = {
      bookingUsers: bookingData.bookingUsers,
      bookingTime: bookingData.bookingTime,
      phone: bookingData.phone,
    }
    ElMessage.success(
      `预约成功！桌台 ${id}，人数 ${bookingData.bookingUsers} 人`,
    )
  }
}

// 取消预约
const cancelBooking = (id: string) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.isBooked = false
    card.bookingInfo = null
    ElMessage.success(`已取消桌台 ${id} 的预约`)
  }
}

const editCard = (id: string) => {
  const card = cards.value.find((c) => c.id === id)
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
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.isDisabled = true
    ElMessage.warning(`卡片 ${id} 已禁用`)
  }
}

const enableCard = (id: string) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.isDisabled = false
    ElMessage.success(`卡片 ${id} 已启用`)
  }
}

// 更新桌台备注
const updateCardRemark = (id: string, remark: string) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.currentOrderRemark = remark
    // watch 会自动触发 saveCards
  }
}

// 更新桌台零食列表
const updateCardSnacks = (id: string, snacks: any[]) => {
  const card = cards.value.find((c) => c.id === id)
  if (card) {
    card.currentOrderSnacks = snacks
    // watch 会自动触发 saveCards
  }
}

const logout = () => {
  window.localStorage.removeItem("card-manager-logged-in")
  router.push("/login")
}

onMounted(async () => {
  await loadCards()
})
watch(cards, saveCards, { deep: true })
</script>

<style scoped>
.dashboard-page {
  height: 100%;
  background: var(--app-bg-secondary);
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

.header-title {
  flex: 1 1 auto;
  font-size: 24px;
  font-weight: 600;
  color: var(--app-text-strong);
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
  color: var(--app-text-muted);
}

.dialog-footer {
  text-align: right;
}
</style>
