<template>
  <div class="member-page">
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="handleAddMember">
          <el-icon><Plus /></el-icon>
          办理会员卡
        </el-button>
        <el-button type="success" @click="handleViewAllRechargeRecords">充值记录</el-button>
        <el-button type="info" @click="handleViewAllConsumptionRecords">消费记录</el-button>
      </div>
    </div>

    <div class="table-container">
      <el-table :data="members" stripe style="width: 100%" border>
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column prop="cardType" label="卡类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.cardType" type="primary" size="small">{{ row.cardType }}</el-tag>
            <span v-else class="no-card">未办卡</span>
          </template>
        </el-table-column>
        <el-table-column label="到期时间/余额" width="180" align="center">
          <template #default="{ row }">
            <span v-if="row.cardType === '储值卡'" class="balance-info">
              余额：{{ row.balance?.toFixed(2) || '0.00' }}元
            </span>
            <span v-else-if="row.cardType" class="expiry-info">
              到期：{{ formatDate(row.expiryDate) }}
            </span>
            <span v-else class="no-card">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="会员等级" width="110" align="center" />
        <el-table-column prop="totalConsumption" label="总消费金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.totalConsumption.toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column prop="playTime" label="游玩时长" width="110" align="center">
          <template #default="{ row }">
            {{ row.playTime }}分钟
          </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEditMember(row)">编辑</el-button>
            <el-button size="small" type="success" @click="handleRecharge(row)">充值</el-button>
            <el-button size="small" type="warning" v-if="isTimeCard(row.cardType)" @click="handleRenewCard(row)">续卡</el-button>
            <el-button size="small" type="info" @click="handleViewMemberRechargeRecords(row)">充值记录</el-button>
            <el-button size="small" @click="handleViewMemberRecords(row)">消费记录</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 办理会员卡对话框 -->
    <el-dialog v-model="showAddDialog" :title="currentMember ? '编辑会员' : '办理会员卡'" width="600px">
      <el-form :model="memberForm" :rules="memberRules" ref="memberFormRef" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入会员姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="memberForm.phone" placeholder="请输入手机号" :disabled="!!currentMember" />
        </el-form-item>
        <el-form-item label="卡类型" prop="cardType">
          <el-select v-model="memberForm.cardType" placeholder="请选择卡类型" style="width: 100%">
            <el-option label="年卡" value="年卡" />
            <el-option label="季卡" value="季卡" />
            <el-option label="月卡" value="月卡" />
            <el-option label="储值卡" value="储值卡" />
          </el-select>
        </el-form-item>
        <el-form-item label="充值金额" prop="amount" v-if="memberForm.cardType">
          <el-input-number v-model="memberForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitMemberForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 查看会员详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="会员详情" width="700px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="姓名">{{ currentMember?.name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentMember?.phone }}</el-descriptions-item>
        <el-descriptions-item label="卡类型">
          <el-tag v-if="currentMember?.cardType" type="primary" size="small">
            {{ currentMember?.cardType }}
          </el-tag>
          <span v-else>未办卡</span>
        </el-descriptions-item>
        <el-descriptions-item label="到期时间/余额">
          <span v-if="currentMember?.cardType === '储值卡'">
            余额：{{ currentMember?.balance?.toFixed(2) || '0.00' }}元
          </span>
          <span v-else-if="currentMember?.cardType">
            到期：{{ formatDate(currentMember?.expiryDate) }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="会员等级">{{ currentMember?.level }}</el-descriptions-item>
        <el-descriptions-item label="总消费金额">{{ currentMember?.totalConsumption.toFixed(2) }}元</el-descriptions-item>
        <el-descriptions-item label="游玩时长">{{ currentMember?.playTime }}分钟</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 充值对话框 -->
    <el-dialog v-model="showRechargeDialog" title="会员充值" width="500px">
      <el-form :model="rechargeForm" label-width="100px">
        <el-form-item label="会员姓名">
          <el-input :value="currentMember?.name" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="currentMember?.phone" disabled />
        </el-form-item>
        <el-form-item label="充值金额" prop="amount">
          <el-input-number v-model="rechargeForm.amount" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="充值方式" prop="type">
          <el-select v-model="rechargeForm.type" placeholder="请选择充值方式" style="width: 100%">
            <el-option label="微信支付" value="微信支付" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="现金" value="现金" />
            <el-option label="银行卡" value="银行卡" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRecharge">确定充值</el-button>
      </template>
    </el-dialog>

    <!-- 续卡对话框 -->
    <el-dialog v-model="showRenewDialog" title="会员续卡" width="500px">
      <el-form :model="renewForm" label-width="100px">
        <el-form-item label="会员姓名">
          <el-input :value="currentMember?.name" disabled />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input :value="currentMember?.phone" disabled />
        </el-form-item>
        <el-form-item label="当前卡类型">
          <el-input :value="currentMember?.cardType" disabled />
        </el-form-item>
        <el-form-item label="到期时间">
          <el-input :value="formatDate(currentMember?.expiryDate)" disabled />
        </el-form-item>
        <el-form-item label="续卡类型" prop="renewType">
          <el-select v-model="renewForm.renewType" placeholder="请选择续卡类型" style="width: 100%">
            <el-option label="年卡" value="年卡" />
            <el-option label="季卡" value="季卡" />
            <el-option label="月卡" value="月卡" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRenew">确定续卡</el-button>
      </template>
    </el-dialog>

    <!-- 充值记录对话框 -->
    <el-dialog v-model="showRechargeRecordsDialog" title="充值记录" width="800px">
      <el-table :data="rechargeRecords" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="date" label="充值时间" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="amount" label="充值金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.amount.toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column prop="type" label="充值方式" width="120" align="center" />
      </el-table>
    </el-dialog>

    <!-- 消费记录对话框 -->
    <el-dialog v-model="showConsumptionRecordsDialog" title="消费记录" width="800px">
      <el-table :data="consumptionRecords" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="date" label="消费时间" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="amount" label="消费金额" width="120" align="center">
          <template #default="{ row }">
            {{ row.amount.toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column prop="item" label="消费项目" min-width="150" />
        <el-table-column prop="duration" label="游玩时长" width="120" align="center">
          <template #default="{ row }">
            {{ row.duration }}分钟
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const API_BASE = 'http://localhost:3000/api'

interface Member {
  id: number
  name: string
  phone: string
  cardType?: string // 年卡、季卡、月卡、储值卡
  expiryDate?: string // 到期时间（年卡、季卡、月卡）
  balance?: number // 余额（储值卡）
  level: string
  totalConsumption: number
  playTime: number
  createTime: string
}

interface RechargeRecord {
  id: number
  date: string
  phone: string
  name: string
  amount: number
  type: string
}

interface ConsumptionRecord {
  id: number
  date: string
  phone: string
  name: string
  amount: number
  item: string
  duration: number
}

const members = ref<Member[]>([])

const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showRechargeDialog = ref(false)
const showRenewDialog = ref(false)
const showRechargeRecordsDialog = ref(false)
const showConsumptionRecordsDialog = ref(false)

const currentMember = ref<Member | null>(null)
const memberFormRef = ref<FormInstance>()

const memberForm = reactive({
  name: '',
  phone: '',
  cardType: '',
  amount: 0
})

const rechargeForm = reactive({
  amount: 0,
  type: ''
})

const renewForm = reactive({
  renewType: ''
})

const rechargeRecords = ref<RechargeRecord[]>([])
const consumptionRecords = ref<ConsumptionRecord[]>([])

// ========== API调用 ==========

// 加载会员列表
const loadMembers = async () => {
  try {
    const response = await fetch(`${API_BASE}/members`)
    const result = await response.json()
    if (result.success) {
      members.value = result.data
    } else {
      ElMessage.error('加载会员列表失败')
    }
  } catch (error) {
    console.error('加载会员列表失败:', error)
    ElMessage.error('网络连接失败')
  }
}

// 添加会员
const addMember = async (member: any) => {
  try {
    const response = await fetch(`${API_BASE}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('添加会员失败:', error)
    return { success: false, message: '网络连接失败' }
  }
}

// 更新会员
const updateMember = async (phone: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/members/${phone}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('更新会员失败:', error)
    return { success: false, message: '网络连接失败' }
  }
}

// 添加充值记录
const addRechargeRecord = async (record: any) => {
  try {
    const response = await fetch(`${API_BASE}/recharge-records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error('添加充值记录失败:', error)
    return { success: false, message: '网络连接失败' }
  }
}

// 加载充值记录
const loadRechargeRecords = async () => {
  try {
    const response = await fetch(`${API_BASE}/recharge-records`)
    const result = await response.json()
    if (result.success) {
      return result.data
    }
    return []
  } catch (error) {
    console.error('加载充值记录失败:', error)
    return []
  }
}

// 加载消费记录
const loadConsumptionRecords = async () => {
  try {
    const response = await fetch(`${API_BASE}/consumption-records`)
    const result = await response.json()
    if (result.success) {
      return result.data
    }
    return []
  } catch (error) {
    console.error('加载消费记录失败:', error)
    return []
  }
}

// ========== 事件处理 ==========

const memberRules: FormRules = {
  name: [{ required: true, message: '请输入会员姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  cardType: [{ required: true, message: '请选择卡类型', trigger: 'change' }],
  amount: [{ required: true, message: '请输入充值金额', trigger: 'blur' }]
}

// 判断是否为时间卡
const isTimeCard = (cardType?: string) => {
  return cardType === '年卡' || cardType === '季卡' || cardType === '月卡'
}

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return '-'
  return date
}

const handleAddMember = () => {
  currentMember.value = null
  resetMemberForm()
  showAddDialog.value = true
}

const handleViewAllRechargeRecords = async () => {
  rechargeRecords.value = await loadRechargeRecords()
  showRechargeRecordsDialog.value = true
}

const handleViewAllConsumptionRecords = async () => {
  consumptionRecords.value = await loadConsumptionRecords()
  showConsumptionRecordsDialog.value = true
}

const handleViewDetail = (row: Member) => {
  currentMember.value = row
  showDetailDialog.value = true
}

const handleEditMember = (row: Member) => {
  currentMember.value = row
  memberForm.name = row.name
  memberForm.phone = row.phone
  memberForm.cardType = row.cardType || ''
  memberForm.amount = row.cardType === '储值卡' ? (row.balance || 0) : 0
  showAddDialog.value = true
}

const handleRecharge = (row: Member) => {
  currentMember.value = row
  rechargeForm.amount = 0
  rechargeForm.type = ''
  showRechargeDialog.value = true
}

const handleRenewCard = (row: Member) => {
  currentMember.value = row
  renewForm.renewType = row.cardType || ''
  showRenewDialog.value = true
}

const handleViewMemberRecords = async (row: Member) => {
  currentMember.value = row
  // 从后端加载所有消费记录，然后过滤出该会员的记录
  const allRecords = await loadConsumptionRecords()
  consumptionRecords.value = allRecords.filter((r: ConsumptionRecord) => r.phone === row.phone)
  showConsumptionRecordsDialog.value = true
}

const handleViewMemberRechargeRecords = async (row: Member) => {
  currentMember.value = row
  // 从后端加载所有充值记录，然后过滤出该会员的记录
  const allRecords = await loadRechargeRecords()
  rechargeRecords.value = allRecords.filter((r: RechargeRecord) => r.phone === row.phone)
  showRechargeRecordsDialog.value = true
}

const submitMemberForm = async () => {
  if (!memberFormRef.value) return
  
  await memberFormRef.value.validate(async (valid) => {
    if (valid) {
      const memberData: any = {
        name: memberForm.name,
        phone: memberForm.phone,
        cardType: memberForm.cardType,
        level: '青铜会员',
        totalConsumption: 0,
        playTime: 0
      }
      
      if (memberForm.cardType === '储值卡') {
        memberData.balance = memberForm.amount
      } else {
        // 时间卡，计算到期时间
        const now = new Date()
        let months = 0
        if (memberForm.cardType === '年卡') months = 12
        else if (memberForm.cardType === '季卡') months = 3
        else if (memberForm.cardType === '月卡') months = 1
        
        const expiryDate = new Date(now.setMonth(now.getMonth() + months))
        memberData.expiryDate = expiryDate.toISOString().split('T')[0]
      }
      
      let result
      if (currentMember.value) {
        // 编辑模式
        result = await updateMember(currentMember.value.phone, memberData)
      } else {
        // 新增模式
        result = await addMember(memberData)
      }
      
      if (result.success) {
        ElMessage.success(currentMember.value ? '会员信息已更新' : '会员办理成功')
        showAddDialog.value = false
        resetMemberForm()
        await loadMembers()
      } else {
        ElMessage.error(result.message || '操作失败')
      }
    }
  })
}

const submitRecharge = async () => {
  if (!currentMember.value || !rechargeForm.type) {
    ElMessage.warning('请填写完整的充值信息')
    return
  }
  
  if (rechargeForm.amount <= 0) {
    ElMessage.warning('充值金额必须大于0')
    return
  }
  
  // 更新会员余额或到期时间
  const updates: any = {}
  if (currentMember.value.cardType === '储值卡') {
    updates.balance = (currentMember.value.balance || 0) + rechargeForm.amount
  } else {
    // 时间卡续充，延长到期时间
    const currentExpiry = currentMember.value.expiryDate ? new Date(currentMember.value.expiryDate) : new Date()
    let months = 0
    if (currentMember.value.cardType === '年卡') months = 12
    else if (currentMember.value.cardType === '季卡') months = 3
    else if (currentMember.value.cardType === '月卡') months = 1
    
    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + months))
    updates.expiryDate = newExpiry.toISOString().split('T')[0]
  }
  
  // 更新会员信息
  const updateResult = await updateMember(currentMember.value.phone, updates)
  if (!updateResult.success) {
    ElMessage.error('更新会员信息失败')
    return
  }
  
  // 添加充值记录
  const rechargeRecord: RechargeRecord = {
    id: 0,
    date: '',
    phone: currentMember.value.phone,
    name: currentMember.value.name,
    amount: rechargeForm.amount,
    type: rechargeForm.type
  }
  
  const recordResult = await addRechargeRecord(rechargeRecord)
  if (recordResult.success) {
    ElMessage.success('充值成功')
    showRechargeDialog.value = false
    await loadMembers()
  } else {
    ElMessage.error('充值失败')
  }
}

const submitRenew = async () => {
  if (!currentMember.value || !renewForm.renewType) {
    ElMessage.warning('请选择续卡类型')
    return
  }
  
  // 更新卡类型和到期时间
  const now = new Date()
  let months = 0
  if (renewForm.renewType === '年卡') months = 12
  else if (renewForm.renewType === '季卡') months = 3
  else if (renewForm.renewType === '月卡') months = 1
  
  const expiryDate = new Date(now.setMonth(now.getMonth() + months))
  
  const updates = {
    cardType: renewForm.renewType,
    expiryDate: expiryDate.toISOString().split('T')[0]
  }
  
  const result = await updateMember(currentMember.value.phone, updates)
  if (result.success) {
    ElMessage.success('续卡成功')
    showRenewDialog.value = false
    await loadMembers()
  } else {
    ElMessage.error(result.message || '续卡失败')
  }
}

const resetMemberForm = () => {
  memberForm.name = ''
  memberForm.phone = ''
  memberForm.cardType = ''
  memberForm.amount = 0
  currentMember.value = null
}

// 页面加载时获取数据
onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
.member-page {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: flex-start;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.table-container {
  flex: 1;
  overflow: auto;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.no-card {
  color: #909399;
  font-size: 13px;
}

.balance-info {
  color: #67c23a;
  font-weight: 600;
}

.expiry-info {
  color: #e6a23c;
  font-weight: 500;
}

:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table .cell) {
  padding: 8px 0;
}

:deep(.el-table th) {
  background: #f5f7fa;
  color: #606266;
  font-weight: 600;
}
</style>