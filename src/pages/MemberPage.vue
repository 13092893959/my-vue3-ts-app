<template>
  <div class="member-page">
    <!-- 查询条件区域 -->
    <div class="search-section">
      <el-form :model="searchForm" inline class="search-form">
        <el-form-item label="姓名">
          <el-input
            v-model="searchForm.name"
            placeholder="请输入姓名"
            clearable
            style="width: 150px"
          />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input
            v-model="searchForm.phone"
            placeholder="请输入手机号"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item label="卡类型">
          <el-select
            v-model="searchForm.cardType"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="充值卡" value="充值卡" />
            <el-option label="次卡" value="次卡" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否会员">
          <el-select
            v-model="searchForm.isMember"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
          <el-button type="success" @click="refreshMembers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button type="warning" @click="exportMembers">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" @click="handleAddMember">
          <el-icon><Plus /></el-icon>
          办理会员卡
        </el-button>
        <el-button type="success" @click="handleViewAllRechargeRecords"
          >充值记录</el-button
        >
        <el-button type="info" @click="handleViewAllConsumptionRecords"
          >消费记录</el-button
        >
      </div>
    </div>

    <div class="table-container">
      <el-table :data="filteredMembers" stripe style="width: 100%" border>
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="name" label="姓名" min-width="120" />
        <el-table-column label="会员标识" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isMember" type="success" size="small">
              <el-icon><Star /></el-icon> 会员
            </el-tag>
            <span v-else class="no-member">普通客户</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" min-width="130" />
        <el-table-column
          prop="cardType"
          label="卡类型"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag v-if="row.cardType" type="primary" size="small">{{
              row.cardType
            }}</el-tag>
            <span v-else class="no-card">未办卡</span>
          </template>
        </el-table-column>
        <el-table-column label="余额/次数" width="200" align="center">
          <template #default="{ row }">
            <span v-if="row.cardType === '充值卡'" class="balance-info">
              余额：{{ row.balance?.toFixed(2) || "0.00" }}元
            </span>
            <span v-else-if="row.cardType === '次卡'" class="times-info">
              剩余：{{ row.remainingTimes || 0 }}次
            </span>
            <span v-else class="no-card">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="level"
          label="会员等级"
          width="110"
          align="center"
        />
        <el-table-column label="总收款金额" width="120" align="center">
          <template #default="{ row }">
            {{ getMemberTotalReceiveAmount(row.phone).toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column label="消费统计" width="150" align="center">
          <template #default="{ row }">
            <div v-if="row.cardType === '充值卡'" class="consumption-info">
              {{ row.totalConsumption.toFixed(2) }}元
            </div>
            <div v-else-if="row.cardType === '次卡'" class="times-used-info">
              已用：{{ row.timesCardUsed || 0 }}次
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="playTime"
          label="游玩时长"
          width="110"
          align="center"
        >
          <template #default="{ row }"> {{ row.playTime }}分钟 </template>
        </el-table-column>
        <el-table-column label="操作" width="400" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleViewDetail(row)"
              >查看</el-button
            >
            <el-button
              size="small"
              type="primary"
              @click="handleEditMember(row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="success"
              v-if="row.cardType === '充值卡'"
              @click="handleRecharge(row)"
              >充值</el-button
            >
            <el-button
              size="small"
              type="warning"
              v-if="row.cardType === '次卡'"
              @click="handleRenewCard(row)"
              >续卡</el-button
            >
            <el-button
              size="small"
              type="info"
              @click="handleViewMemberRechargeRecords(row)"
              >充值记录</el-button
            >
            <el-button size="small" @click="handleViewMemberRecords(row)"
              >消费记录</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="handleDeleteMember(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 办理储值卡对话框 -->
    <el-dialog
      v-model="showAddDialog"
      :title="currentMember ? '编辑客户' : '办理储值卡'"
      width="600px"
    >
      <el-form
        :model="memberForm"
        :rules="memberRules"
        ref="memberFormRef"
        label-width="100px"
      >
        <el-form-item label="姓名" prop="name">
          <el-input v-model="memberForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="memberForm.phone"
            placeholder="请输入手机号"
            :disabled="!!currentMember"
          />
        </el-form-item>
        <el-form-item label="卡类型" prop="cardType" v-if="!currentMember">
          <el-select
            v-model="memberForm.cardType"
            placeholder="请选择卡类型"
            style="width: 100%"
          >
            <el-option label="充值卡" value="充值卡" />
            <el-option label="次卡" value="次卡" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="收款金额"
          prop="receiveAmount"
          v-if="!currentMember && memberForm.cardType === '充值卡'"
        >
          <el-input-number
            v-model="memberForm.receiveAmount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="客户实际支付的金额"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item
          label="赠送金额"
          prop="rechargeAmount"
          v-if="!currentMember && memberForm.cardType === '充值卡'"
        >
          <el-input-number
            v-model="memberForm.rechargeAmount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="额外赠送的金额（可选）"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item
          label="购买次数"
          prop="times"
          v-if="!currentMember && memberForm.cardType === '次卡'"
        >
          <el-select
            v-model="memberForm.times"
            placeholder="请选择购买次数"
            style="width: 100%"
            @change="handleTimesChange"
          >
            <el-option label="5次 - ¥269.9" :value="5" />
            <el-option label="10次 - ¥529.9" :value="10" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="收款金额"
          prop="receiveAmount"
          v-if="!currentMember && memberForm.cardType === '次卡'"
        >
          <el-input-number
            v-model="memberForm.receiveAmount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="客户实际支付的金额"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        
        <!-- 是否会员复选框（移到最下方） -->
        <el-form-item label="是否会员">
          <el-checkbox v-model="memberForm.isMember">
            会员身份（结算时自动享受88折优惠，不勾选则为普通客户）
          </el-checkbox>
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
        <el-descriptions-item label="姓名">{{
          currentMember?.name
        }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{
          currentMember?.phone
        }}</el-descriptions-item>
        <el-descriptions-item label="卡类型">
          <el-tag v-if="currentMember?.cardType" type="primary" size="small">
            {{ currentMember?.cardType }}
          </el-tag>
          <span v-else>未办卡</span>
        </el-descriptions-item>
        <el-descriptions-item label="余额/次数">
          <span v-if="currentMember?.cardType === '充值卡'">
            余额：{{ currentMember?.balance?.toFixed(2) || "0.00" }}元
          </span>
          <span v-else-if="currentMember?.cardType === '次卡'">
            剩余：{{ currentMember?.remainingTimes || 0 }}次
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="会员等级">{{
          currentMember?.level
        }}</el-descriptions-item>
        <el-descriptions-item label="消费统计">
          <span v-if="currentMember?.cardType === '充值卡'">
            {{ currentMember?.totalConsumption.toFixed(2) }}元
          </span>
          <span v-else-if="currentMember?.cardType === '次卡'">
            已用：{{ currentMember?.timesCardUsed || 0 }}次
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="游玩时长"
          >{{ currentMember?.playTime }}分钟</el-descriptions-item
        >
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
        <el-form-item label="收款金额">
          <el-input-number
            v-model="rechargeForm.receiveAmount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="客户实际支付的金额"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="充值金额">
          <el-input-number
            v-model="rechargeForm.rechargeAmount"
            :min="0"
            :precision="2"
            style="width: 100%"
            placeholder="实际入账的金额"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="充值方式">
          <el-select
            v-model="rechargeForm.type"
            placeholder="请选择充值方式"
            style="width: 100%"
          >
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
        <el-form-item label="剩余次数/余额">
          <span v-if="currentMember?.cardType === '次卡'">
            {{ currentMember?.remainingTimes || 0 }}次
          </span>
          <span v-else-if="currentMember?.cardType === '充值卡'">
            {{ currentMember?.balance?.toFixed(2) || "0.00" }}元
          </span>
          <span v-else>-</span>
        </el-form-item>
        <el-form-item
          label="续卡类型"
          prop="renewType"
          v-if="currentMember?.cardType === '次卡'"
        >
          <el-select
            v-model="renewForm.renewType"
            placeholder="请选择续卡次数"
            style="width: 100%"
          >
            <el-option label="5次" :value="5" />
            <el-option label="10次" :value="10" />
            <el-option label="20次" :value="20" />
            <el-option label="30次" :value="30" />
          </el-select>
        </el-form-item>
        <el-form-item
          label="收款金额"
          prop="receiveAmount"
          v-if="currentMember?.cardType === '次卡'"
        >
          <el-input-number
            v-model="renewForm.receiveAmount"
            :min="0"
            :precision="2"
            :step="100"
            style="width: 100%"
            placeholder="客户实际支付的金额"
          />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item
          label="充值金额"
          prop="amount"
          v-if="currentMember?.cardType === '充值卡'"
        >
          <el-input-number
            v-model="renewForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRenewDialog = false">取消</el-button>
        <el-button type="primary" @click="submitRenew">确定续卡</el-button>
      </template>
    </el-dialog>

    <!-- 充值记录对话框 -->
    <el-dialog
      v-model="showRechargeRecordsDialog"
      title="充值记录"
      width="800px"
    >
      <el-table :data="rechargeRecords" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="date" label="充值时间" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column
          prop="receiveAmount"
          label="收款金额"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            {{ (row.receiveAmount || 0).toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column
          label="赠送金额"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <span v-if="(row.rechargeAmount || 0) > (row.receiveAmount || 0)" style="color: #67c23a; font-weight: 600;">
              +{{ ((row.rechargeAmount || 0) - (row.receiveAmount || 0)).toFixed(2) }}元
            </span>
            <span v-else style="color: #909399;">-</span>
          </template>
        </el-table-column>
        <el-table-column
          label="入账总额"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <span style="color: #409eff; font-weight: 600;">
              {{ (row.rechargeAmount || 0).toFixed(2) }}元
            </span>
          </template>
        </el-table-column>
        <el-table-column
          prop="type"
          label="充值方式"
          width="120"
          align="center"
        />
      </el-table>
    </el-dialog>

    <!-- 消费记录对话框 -->
    <el-dialog
      v-model="showConsumptionRecordsDialog"
      title="消费记录"
      width="800px"
    >
      <el-table :data="consumptionRecords" stripe style="width: 100%">
        <el-table-column type="index" label="序号" width="80" align="center" />
        <el-table-column prop="date" label="消费时间" min-width="180" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column
          prop="amount"
          label="消费金额"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            {{ row.amount.toFixed(2) }}元
          </template>
        </el-table-column>
        <el-table-column prop="item" label="消费项目" min-width="150" />
        <el-table-column
          prop="duration"
          label="游玩时长"
          width="120"
          align="center"
        >
          <template #default="{ row }"> {{ row.duration }}分钟 </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue"
import { Plus, Search, Refresh, Download } from "@element-plus/icons-vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"

const API_BASE = "http://localhost:3000/api"

interface Member {
  id: number
  name: string
  phone: string
  isMember?: boolean // 是否为会员
  cardType?: string // 充值卡、次卡
  balance?: number // 余额（充值卡）
  remainingTimes?: number // 剩余次数（次卡）
  level: string
  totalConsumption: number // 总消费金额（仅充值卡）
  timesCardUsed?: number // 次卡使用次数（仅次卡）
  playTime: number
  createTime: string
}

interface RechargeRecord {
  id: number
  date: string
  phone: string
  name: string
  receiveAmount: number // 收款金额（客户实际支付的金额）
  rechargeAmount: number // 入账总额（收款金额 + 赠送金额）
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
const rechargeRecords = ref<RechargeRecord[]>([])

// 查询表单
interface SearchForm {
  name: string
  phone: string
  cardType: string
  isMember: boolean | null // 是否会员（null表示全部）
}

const searchForm = reactive<SearchForm>({
  name: "",
  phone: "",
  cardType: "",
  isMember: null,
})

// 过滤后的会员列表
const filteredMembers = ref<Member[]>([])

const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const showRechargeDialog = ref(false)
const showRenewDialog = ref(false)
const showRechargeRecordsDialog = ref(false)
const showConsumptionRecordsDialog = ref(false)

const currentMember = ref<Member | null>(null)
const memberFormRef = ref<FormInstance>()

const memberForm = reactive({
  name: "",
  phone: "",
  isMember: true, // 默认勾选为会员
  cardType: "",
  receiveAmount: 0, // 收款金额（客户实际支付的金额）
  rechargeAmount: 0, // 充值金额（实际到账的金额，仅充值卡使用）
  times: 0, // 购买次数（仅次卡使用）
})

const rechargeForm = reactive({
  receiveAmount: 0, // 收款金额（客户实际支付的金额）
  rechargeAmount: 0, // 充值金额（实际到账的金额）
  type: "",
})

const renewForm = reactive({
  renewType: 0, // 次卡续费次数
  receiveAmount: 0, // 收款金额（次卡续费用）
  amount: 0, // 充值卡充值金额
})

const consumptionRecords = ref<ConsumptionRecord[]>([])

// 计算会员的总收款金额
const getMemberTotalReceiveAmount = (phone: string): number => {
  return rechargeRecords.value
    .filter((record) => record.phone === phone)
    .reduce((sum, record) => sum + (record.receiveAmount || 0), 0)
}

// ========== API调用 ==========

// 加载会员列表
const loadMembers = async () => {
  try {
    const response = await fetch(`${API_BASE}/members`)
    const result = await response.json()
    if (result.success) {
      // 按创建时间降序排列，最新的数据在前面
      members.value = result.data.sort((a: Member, b: Member) => {
        return (
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        )
      })
      applyFilters()
      // 同时加载充值记录以计算总收款金额
      await loadRechargeRecordsForStats()
    } else {
      ElMessage.error("加载会员列表失败")
    }
  } catch (error) {
    console.error("加载会员列表失败:", error)
    ElMessage.error("网络连接失败")
  }
}

// 应用筛选条件
const applyFilters = () => {
  let filtered = [...members.value]

  if (searchForm.name) {
    filtered = filtered.filter((m) => m.name.includes(searchForm.name))
  }

  if (searchForm.phone) {
    filtered = filtered.filter((m) => m.phone.includes(searchForm.phone))
  }

  if (searchForm.cardType) {
    filtered = filtered.filter((m) => m.cardType === searchForm.cardType)
  }

  // 按是否会员过滤
  if (searchForm.isMember !== null && searchForm.isMember !== undefined) {
    filtered = filtered.filter(
      (m) => (m.isMember === true) === searchForm.isMember,
    )
  }

  filteredMembers.value = filtered
}

// 搜索
const handleSearch = () => {
  applyFilters()
  ElMessage.info(`查询完成，共找到 ${filteredMembers.value.length} 条记录`)
}

// 重置
const handleReset = () => {
  searchForm.name = ""
  searchForm.phone = ""
  searchForm.cardType = ""
  searchForm.isMember = null
  applyFilters()
  ElMessage.success("已重置查询条件")
}

// 刷新会员列表
const refreshMembers = async () => {
  await loadMembers()
  ElMessage.success("刷新成功")
}

// 导出会员列表
const exportMembers = () => {
  if (filteredMembers.value.length === 0) {
    ElMessage.warning("没有可导出的会员数据")
    return
  }

  const headers = [
    "序号",
    "姓名",
    "手机号",
    "卡类型",
    "余额/次数",
    "会员等级",
    "总收款金额",
    "消费统计",
    "游玩时长(分钟)",
    "创建时间",
  ]

  const rows = filteredMembers.value.map((member, index) => {
    const balanceOrTimes =
      member.cardType === "充值卡"
        ? `余额：${(member.balance || 0).toFixed(2)}元`
        : member.cardType === "次卡"
          ? `剩余：${member.remainingTimes || 0}次`
          : "-"

    const consumptionStat =
      member.cardType === "充值卡"
        ? `${member.totalConsumption.toFixed(2)}元`
        : member.cardType === "次卡"
          ? `已用：${member.timesCardUsed || 0}次`
          : "-"

    const totalReceiveAmount = getMemberTotalReceiveAmount(
      member.phone,
    ).toFixed(2)

    return [
      index + 1,
      member.name,
      member.phone,
      member.cardType || "-",
      balanceOrTimes,
      member.level,
      `${totalReceiveAmount}元`,
      consumptionStat,
      member.playTime,
      member.createTime,
    ]
  })

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = `会员列表_${new Date().toISOString().split("T")[0]}.csv`
  link.click()

  ElMessage.success("导出成功")
}

// 加载充值记录用于统计
const loadRechargeRecordsForStats = async () => {
  try {
    const response = await fetch(`${API_BASE}/recharge-records`)
    const result = await response.json()
    if (result.success) {
      rechargeRecords.value = result.data
    }
  } catch (error) {
    console.error("加载充值记录失败:", error)
  }
}

// 添加会员
const addMember = async (member: any) => {
  try {
    const response = await fetch(`${API_BASE}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error("添加会员失败:", error)
    return { success: false, message: "网络连接失败" }
  }
}

// 更新会员
const updateMember = async (phone: string, updates: any) => {
  try {
    const response = await fetch(`${API_BASE}/members/${phone}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error("更新会员失败:", error)
    return { success: false, message: "网络连接失败" }
  }
}

// 添加充值记录
const addRechargeRecord = async (record: any) => {
  try {
    const response = await fetch(`${API_BASE}/recharge-records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    })
    const result = await response.json()
    return result
  } catch (error) {
    console.error("添加充值记录失败:", error)
    return { success: false, message: "网络连接失败" }
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
    console.error("加载充值记录失败:", error)
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
    console.error("加载消费记录失败:", error)
    return []
  }
}

// ========== 事件处理 ==========

const memberRules: FormRules = {
  name: [{ required: true, message: "请输入会员姓名", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
  cardType: [{ required: true, message: "请选择卡类型", trigger: "change" }],
  amount: [{ required: true, message: "请输入充值金额", trigger: "blur" }],
}

// 判断是否为次卡
const isTimeCard = (cardType?: string) => {
  return cardType === "次卡"
}

// 格式化日期
const formatDate = (date?: string) => {
  if (!date) return "-"
  return date
}

// 处理次卡次数选择变化，自动设置收款金额
const handleTimesChange = (times: number) => {
  if (times === 5) {
    memberForm.receiveAmount = 269.9
  } else if (times === 10) {
    memberForm.receiveAmount = 529.9
  }
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
  memberForm.isMember = row.isMember !== false // 默认为会员
  memberForm.cardType = row.cardType || ""
  // 根据卡类型设置金额或次数
  if (row.cardType === "充值卡") {
    memberForm.receiveAmount = row.balance || 0
    memberForm.rechargeAmount = row.balance || 0
    memberForm.times = 0
  } else if (row.cardType === "次卡") {
    memberForm.times = row.remainingTimes || 0
    memberForm.receiveAmount = 0
    memberForm.rechargeAmount = 0
  } else {
    memberForm.receiveAmount = 0
    memberForm.rechargeAmount = 0
    memberForm.times = 0
  }
  showAddDialog.value = true
}

const handleRecharge = (row: Member) => {
  currentMember.value = row
  rechargeForm.receiveAmount = 0
  rechargeForm.rechargeAmount = 0
  rechargeForm.type = ""
  showRechargeDialog.value = true
}

const handleRenewCard = (row: Member) => {
  currentMember.value = row
  if (row.cardType === "次卡") {
    renewForm.renewType = 0
    renewForm.receiveAmount = 0
    renewForm.amount = 0
  } else if (row.cardType === "充值卡") {
    renewForm.renewType = 0
    renewForm.receiveAmount = 0
    renewForm.amount = 0
  }
  showRenewDialog.value = true
}

// 删除会员
const handleDeleteMember = async (row: Member) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除客户"${row.name}"吗？此操作不可恢复！`,
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    )

    const response = await fetch(`http://localhost:3000/api/members/${row.phone}`, {
      method: "DELETE",
    })

    const result = await response.json()
    if (result.success) {
      ElMessage.success("删除成功")
      await loadMembers()
    } else {
      ElMessage.error(result.message || "删除失败")
    }
  } catch (error: any) {
    if (error !== "cancel") {
      console.error("删除会员失败:", error)
      ElMessage.error("删除失败")
    }
  }
}

const handleViewMemberRecords = async (row: Member) => {
  currentMember.value = row
  // 从后端加载所有消费记录，然后过滤出该会员的记录
  const allRecords = await loadConsumptionRecords()
  consumptionRecords.value = allRecords.filter(
    (r: ConsumptionRecord) => r.phone === row.phone,
  )
  showConsumptionRecordsDialog.value = true
}

const handleViewMemberRechargeRecords = async (row: Member) => {
  currentMember.value = row
  // 从后端加载所有充值记录，然后过滤出该会员的记录
  const allRecords = await loadRechargeRecords()
  rechargeRecords.value = allRecords.filter(
    (r: RechargeRecord) => r.phone === row.phone,
  )
  showRechargeRecordsDialog.value = true
}

const submitMemberForm = async () => {
  if (!memberFormRef.value) return

  await memberFormRef.value.validate(async (valid) => {
    if (valid) {
      // 所有客户都创建档案，isMember只影响结算时的折扣
      const memberData: any = {
        name: memberForm.name,
        phone: memberForm.phone,
        isMember: memberForm.isMember, // 保存会员标识（仅用于结算折扣）
      }

      if (currentMember.value) {
        // 编辑模式：保留原有的卡类型、余额、次数等信息
        memberData.cardType = currentMember.value.cardType
        memberData.level = currentMember.value.level || "青铜会员"
        memberData.totalConsumption = currentMember.value.totalConsumption || 0
        memberData.playTime = currentMember.value.playTime || 0
        
        // 保留原有的余额或次数
        if (currentMember.value.cardType === "充值卡") {
          memberData.balance = currentMember.value.balance
          memberData.remainingTimes = null
        } else if (currentMember.value.cardType === "次卡") {
          memberData.remainingTimes = currentMember.value.remainingTimes
          memberData.balance = null
        }
        
        // 更新会员信息
        const result = await updateMember(currentMember.value.phone, memberData)
        if (result.success) {
          ElMessage.success("客户信息已更新")
          showAddDialog.value = false
          resetMemberForm()
          await loadMembers()
        } else {
          ElMessage.error(result.message || "操作失败")
        }
      } else {
        // 新增模式：按原有逻辑处理
        memberData.cardType = memberForm.cardType
        memberData.level = "青铜会员"
        memberData.totalConsumption = 0
        memberData.playTime = 0

        if (memberForm.cardType === "充值卡") {
          // 充值卡：余额 = 收款金额 + 赠送金额
          const giftAmount = memberForm.rechargeAmount || 0 // 赠送金额（默认为0）
          memberData.balance = memberForm.receiveAmount + giftAmount
          memberData.remainingTimes = null
        } else if (memberForm.cardType === "次卡") {
          // 次卡：设置剩余次数
          memberData.remainingTimes = memberForm.times
          memberData.balance = null
        }

        const result = await addMember(memberData)

        // 如果是新增且有充值金额/次数，创建充值记录
        if (result.success && memberForm.receiveAmount > 0) {
          const rechargeAmount =
            memberForm.cardType === "充值卡"
              ? memberForm.receiveAmount + (memberForm.rechargeAmount || 0) // 收款金额 + 赠送金额
              : memberForm.receiveAmount

          const rechargeRecord: RechargeRecord = {
            id: 0,
            date: new Date().toISOString().replace("T", " ").split(".")[0],
            phone: memberForm.phone,
            name: memberForm.name,
            receiveAmount: memberForm.receiveAmount,
            rechargeAmount: rechargeAmount,
            type: memberForm.cardType === "充值卡" ? "办卡充值" : "办卡购次",
          }

          const recordResult = await addRechargeRecord(rechargeRecord)
          if (!recordResult.success) {
            console.error("创建充值记录失败:", recordResult.message)
          }
        }

        if (result.success) {
          ElMessage.success("储值卡办理成功")
          showAddDialog.value = false
          resetMemberForm()
          await loadMembers()
        } else {
          ElMessage.error(result.message || "操作失败")
        }
      }
    }
  })
}

const submitRecharge = async () => {
  if (!currentMember.value || !rechargeForm.type) {
    ElMessage.warning("请填写完整的充值信息")
    return
  }

  if (rechargeForm.receiveAmount <= 0) {
    ElMessage.warning("收款金额必须大于0")
    return
  }

  // 如果未填充值金额，默认等于收款金额
  const rechargeAmount =
    rechargeForm.rechargeAmount > 0
      ? rechargeForm.rechargeAmount
      : rechargeForm.receiveAmount

  if (rechargeAmount <= 0) {
    ElMessage.warning("充值金额必须大于0")
    return
  }

  // 更新会员余额（使用充值金额）
  const updates: any = {}
  if (currentMember.value.cardType === "充值卡") {
    updates.balance = (currentMember.value.balance || 0) + rechargeAmount
  } else {
    ElMessage.warning("次卡不支持充值，请使用续卡功能")
    return
  }

  // 更新会员信息
  const updateResult = await updateMember(currentMember.value.phone, updates)
  if (!updateResult.success) {
    ElMessage.error("更新会员信息失败")
    return
  }

  // 添加充值记录（同时记录收款金额和充值金额）
  const rechargeRecord: RechargeRecord = {
    id: 0,
    date: new Date().toISOString().replace("T", " ").split(".")[0],
    phone: currentMember.value.phone,
    name: currentMember.value.name,
    receiveAmount: rechargeForm.receiveAmount,
    rechargeAmount: rechargeAmount,
    type: rechargeForm.type,
  }

  const recordResult = await addRechargeRecord(rechargeRecord)
  if (recordResult.success) {
    ElMessage.success("充值成功")
    showRechargeDialog.value = false
    await loadMembers()
  } else {
    ElMessage.error("充值失败")
  }
}

const submitRenew = async () => {
  if (!currentMember.value) {
    ElMessage.warning("请选择会员")
    return
  }

  const updates: any = {}

  if (currentMember.value.cardType === "次卡") {
    // 次卡续费
    if (!renewForm.renewType || renewForm.renewType <= 0) {
      ElMessage.warning("请选择续卡次数")
      return
    }

    if (!renewForm.receiveAmount || renewForm.receiveAmount <= 0) {
      ElMessage.warning("请输入收款金额")
      return
    }

    // 增加剩余次数
    updates.remainingTimes =
      (currentMember.value.remainingTimes || 0) + renewForm.renewType

    // 添加充值记录（次卡续卡也需要记录收款金额）
    const rechargeRecord: RechargeRecord = {
      id: 0,
      date: new Date().toISOString().replace("T", " ").split(".")[0],
      phone: currentMember.value.phone,
      name: currentMember.value.name,
      receiveAmount: renewForm.receiveAmount,
      rechargeAmount: renewForm.receiveAmount, // 次卡续卡时，充值金额等于收款金额
      type: "次卡续卡",
    }

    const recordResult = await addRechargeRecord(rechargeRecord)
    if (!recordResult.success) {
      ElMessage.error("创建充值记录失败")
      return
    }
  } else if (currentMember.value.cardType === "充值卡") {
    // 充值卡续费（实际是充值）
    if (!renewForm.amount || renewForm.amount <= 0) {
      ElMessage.warning("请输入充值金额")
      return
    }

    updates.balance = (currentMember.value.balance || 0) + renewForm.amount
  } else {
    ElMessage.warning("该会员未办理会员卡")
    return
  }

  const result = await updateMember(currentMember.value.phone, updates)
  if (result.success) {
    ElMessage.success("续卡成功")
    showRenewDialog.value = false
    await loadMembers()
  } else {
    ElMessage.error(result.message || "续卡失败")
  }
}

const resetMemberForm = () => {
  memberForm.name = ""
  memberForm.phone = ""
  memberForm.isMember = true
  memberForm.cardType = ""
  memberForm.receiveAmount = 0
  memberForm.rechargeAmount = 0
  memberForm.times = 0
  currentMember.value = null
}

const resetRenewForm = () => {
  renewForm.renewType = 0
  renewForm.receiveAmount = 0
  renewForm.amount = 0
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

.search-section {
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
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

.times-info {
  color: #409eff;
  font-weight: 600;
}

.expiry-date {
  color: #909399;
  font-weight: normal;
  font-size: 12px;
}

.form-tip {
  margin-left: 8px;
  color: #909399;
  font-size: 14px;
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

.consumption-info {
  color: #67c23a;
  font-weight: 600;
}

.times-used-info {
  color: #e6a23c;
  font-weight: 600;
}
.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
