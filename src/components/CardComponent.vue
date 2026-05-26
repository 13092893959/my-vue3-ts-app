<template>
  <el-card
    class="card"
    :class="{
      'card-idle': !card.isInUse && !card.isBooked && !card.isDisabled,
      'card-in-use': card.isInUse,
      'card-booked': card.isBooked && !card.isInUse,
      'card-disabled': card.isDisabled,
    }"
    shadow="hover"
    @click="handleCardClick"
  >
    <!-- 头部：编号 + 状态标签 -->
    <template #header>
      <div class="card-header">
        <span class="card-code">{{ card.id }}</span>
        <el-tag v-if="card.isDisabled" type="info" size="small" effect="light">
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
        <el-tag v-else type="success" size="small" effect="light">
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
    <!-- <div v-if="card.isBooked && !card.isInUse" class="booking-badge">
      <el-icon><Bell /></el-icon>
      <span>预约</span>
    </div> -->

    <!-- 使用中模式：显示计时器 -->
    <div v-if="card.isInUse" class="timer-banner">
      <div class="timer-title">计时中 · {{ card.currentUsers }}人</div>
      <div class="timer-entertainment" v-if="card.currentEntertainment">
        {{ card.currentEntertainment }}
      </div>
      <!-- 多批次计时显示 -->
      <div
        v-if="card.timerSessions && card.timerSessions.length > 0"
        class="timer-sessions"
      >
        <div
          v-for="session in card.timerSessions"
          :key="session.id"
          class="timer-session-row"
        >
          <span class="session-label">{{ session.label }}</span>
          <span class="session-time">{{ formatTime(getSessionElapsed(session)) }}</span>
        </div>
      </div>
      <!-- 向后兼容：无 timerSessions 时显示单计时器 -->
      <div v-else-if="card.startTimestamp" class="timer-single">
        <div class="timer-value">{{ formatTime(elapsedTime) }}</div>
        <div class="timer-start-time">
          开始：{{ formatStartTime(card.startTimestamp) }}
        </div>
      </div>
    </div>

    <!-- 预约信息展示 -->
    <div
      v-if="card.isBooked && !card.isInUse && card.bookingInfo"
      class="booking-info"
    >
      <div class="booking-info-item">
        <span class="info-label">预约人数</span>
        <span class="info-value">{{ card.bookingInfo.bookingUsers }}人</span>
      </div>
      <div class="booking-info-item">
        <span class="info-label">预约时间</span>
        <span class="info-value">{{
          formatDate(card.bookingInfo.bookingTime)
        }}</span>
      </div>
      <div class="booking-info-item">
        <span class="info-label">联系电话</span>
        <span class="info-value">{{ card.bookingInfo.phone }}</span>
      </div>
    </div>

    <!-- 基本信息 -->
    <div class="card-info">
      <div class="info-item">
        <span class="info-label">类型</span>
        <span class="info-value">{{ card.type }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">娱乐</span>
        <span class="info-value">
          <el-tag
            v-for="item in card.entertainments"
            :key="item"
            size="small"
            type="primary"
            effect="light"
          >
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
        <el-button
          type="primary"
          size="large"
          @click.stop="showTimerDialog = true"
          class="btn-start"
        >
          开始计时
        </el-button>
      </div>

      <!-- 使用中模式：操作按钮 2x2 网格 -->
      <div v-else class="action-row-in-use">
        <div class="action-grid">
          <el-button type="success" size="default" @click.stop="openAddPersonDialog">
            加人
          </el-button>
          <el-button type="info" size="default" @click.stop="viewOrders">
            订单
          </el-button>
          <el-button type="warning" size="default" @click.stop="openMidSettleDialog">
            中途结算
          </el-button>
          <el-button type="danger" size="default" @click.stop="openSettleDialog">
            结束计时
          </el-button>
        </div>
      </div>
    </template>
  </el-card>

  <!-- 开始计时对话框 -->
  <el-dialog
    v-model="showTimerDialog"
    title="开始计时"
    width="500px"
    append-to-body
    @close="resetTimerForm"
  >
    <el-form :model="timerForm" label-width="100px">
      <el-form-item label="娱乐类型">
        <el-select
          v-model="timerForm.entertainment"
          placeholder="请选择娱乐类型"
          style="width: 100%"
        >
          <el-option
            v-for="item in card.entertainments"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="人数">
        <el-input-number
          v-model="timerForm.currentUsers"
          :min="1"
          :max="card.capacity"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="开始时间">
        <el-time-picker
          v-model="timerForm.startTime"
          placeholder="选择开始时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showTimerDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmStartTimer">确认开始</el-button>
    </template>
  </el-dialog>

  <!-- 加人对话框 -->
  <el-dialog
    v-model="showAddPersonDialog"
    title="中途加人"
    width="500px"
    append-to-body
    @close="resetAddPersonForm"
  >
    <el-form :model="addPersonForm" label-width="100px">
      <el-form-item label="加人人数">
        <el-input-number
          v-model="addPersonForm.users"
          :min="1"
          :max="card.capacity - card.currentUsers"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="开始时间">
        <el-time-picker
          v-model="addPersonForm.startTime"
          placeholder="默认为当前时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showAddPersonDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmAddPerson">确认加人</el-button>
    </template>
  </el-dialog>

  <!-- 中途结算对话框 -->
  <el-dialog
    v-model="showMidSettleDialog"
    title="中途结算"
    width="600px"
    append-to-body
    @close="showMidSettleDialog = false"
  >
    <div class="settle-info">
      <div class="settle-item">
        <span class="settle-label">桌台编号</span>
        <span class="settle-value">{{ card.id }}</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">当前人数</span>
        <span class="settle-value">{{ card.currentUsers }}人</span>
      </div>
    </div>

    <el-divider>离场信息</el-divider>
    <el-form :model="midSettleForm" label-width="100px" style="margin-top: 16px">
      <el-form-item label="退出批次">
        <el-select
          v-model="midSettleForm.sessionId"
          placeholder="请选择退出的批次"
          style="width: 100%"
          @change="onMidSettleSessionChange"
        >
          <el-option
            v-for="s in card.timerSessions"
            :key="s.id"
            :label="`${s.label}`"
            :value="s.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="离开人数">
        <el-input-number
          v-model="midSettleForm.leavingUsers"
          :min="1"
          :max="midSettleMaxLeaving"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="关联会员">
        <el-select
          v-model="midSettleForm.memberId"
          placeholder="输入手机号或姓名搜索会员（可选）"
          filterable
          clearable
          :filter-method="filterMembers"
          style="width: 100%"
          @change="midSettleHandleMemberSelect"
        >
          <el-option
            v-for="member in filteredMembers"
            :key="member.id"
            :label="`${member.name || '(无名)'} ${member.phone ? '(' + member.phone + ')' : ''}`"
            :value="member.id"
          >
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px">
                <span>{{ member.name }}</span>
                <el-tag v-if="member.isMember === true" type="success" size="small">⭐ 会员</el-tag>
              </div>
              <span style="color: #8492a6; font-size: 13px">
                {{ member.cardType === '充值卡' ? `余额: ¥${(member.balance || 0).toFixed(2)}` : `剩余: ${member.remainingTimes}次` }}
              </span>
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="计算方式">
        <div style="display: flex; align-items: center;">
          <el-switch v-model="midSettleUsePerPerson" @change="onMidSettlePerPersonToggle" />
          <span style="margin-left: 8px; font-size: 12px; color: #909399;">
            {{ midSettleUsePerPerson ? '按人均计算' : '按总金额计算' }}
          </span>
        </div>
      </el-form-item>
      <el-form-item label="团购套餐">
        <el-select
          v-model="midSettleForm.selectedPackageIds"
          multiple
          placeholder="请选择团购套餐（可多选）"
          style="width: 100%"
          @change="midSettleCalcPackages"
        >
          <el-option
            v-for="pkg in availablePackages"
            :key="pkg.id"
            :label="`${pkg.name} - ¥${pkg.price}`"
            :value="pkg.id"
          />
        </el-select>
      </el-form-item>


      <el-form-item v-if="midSettleUsePerPerson" label="每人金额">
        <el-input-number
          v-model="midSettlePerPersonAmount"
          :min="0"
          :precision="2"
          :step="1"
          controls-position="right"
          style="width: 100%"
          @change="onMidSettlePerPersonAmountChange"
        >
          <template #prefix>¥</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="总金额">
        <el-input-number
          v-model="midSettleForm.totalAmount"
          :min="0"
          :precision="2"
          :step="1"
          controls-position="right"
          style="width: 100%"
          :disabled="midSettleUsePerPerson"
          @change="midSettleCalcFinal"
        >
          <template #prefix>¥</template>
        </el-input-number>
        <span v-if="midSettleUsePerPerson" style="font-size: 11px; color: #909399;">
          = ¥{{ midSettlePerPersonAmount || 0 }} x {{ midSettleForm.leavingUsers }}人
        </span>
      </el-form-item>

      <el-form-item label="折扣">
        <el-input-number
          v-model="midSettleForm.discount"
          :min="0"
          :max="100"
          :precision="0"
          :step="5"
          controls-position="right"
          style="width: 100%"
          @change="midSettleCalcFinal"
        >
          <template #append>%</template>
        </el-input-number>
      </el-form-item>

      <el-form-item label="支付方式">
        <el-radio-group v-model="midSettleForm.paymentMethod">
          <el-radio label="member_balance" :disabled="!midSettleSelectedMember">余额支付</el-radio>
          <el-radio label="package">团购套餐</el-radio>
          <el-radio label="cash">现金</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <!-- 零食分配 -->
    <template v-if="getSnacks().length > 0">
      <el-divider>零食分配</el-divider>
      <el-table :data="getSnacks()" border size="small" style="margin-top: 12px">
        <el-table-column prop="name" label="名称" width="120" />
        <el-table-column prop="price" label="单价" width="80">
          <template #default="{ row: r }">¥{{ r.price }}</template>
        </el-table-column>
        <el-table-column label="桌台数量" width="100">
          <template #default="{ row: r }">{{ r.quantity }}{{ r.unit }}</template>
        </el-table-column>
        <el-table-column label="带走数量" min-width="120">
          <template #default="{ row: r, $index: i }">
            <el-input-number
              :model-value="midSettleSnackAssignment[i] || 0"
              :min="0"
              :max="r.quantity"
              size="small"
              controls-position="right"
              style="width: 100%"
              @change="(v) => { midSettleSnackAssignment = { ...midSettleSnackAssignment, [i]: v || 0 }; midSettleCalcFinal(); }"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="80">
          <template #default="{ row: r, $index: i }">
            ¥{{ ((midSettleSnackAssignment[i] || 0) * r.price).toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </template>

    <div style="text-align: right; margin-top: 16px; font-size: 16px; font-weight: bold;">
      应付金额：<span style="color: #f56c6c;">¥{{ midSettleForm.finalAmount.toFixed(2) }}</span>
    </div>

    <template #footer>
      <el-button @click="showMidSettleDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmMidSettle">确认结算</el-button>
    </template>
  </el-dialog>

  <!-- 结算确认对话框 -->
  <el-dialog
    v-model="showSettleDialog"
    :title="useSplitBill ? '结束计时 - 拆单结算' : '结束计时 - 订单结算'"
    :width="useSplitBill ? '850px' : '600px'"
    append-to-body
  >
    <div class="settle-info">
      <div class="settle-item">
        <span class="settle-label">桌台编号</span>
        <span class="settle-value">{{ card.id }}</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">娱乐类型</span>
        <span class="settle-value">{{ card.currentEntertainment || "-" }}</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">人数</span>
        <span class="settle-value">{{ card.currentUsers }}人</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">开始时间</span>
        <span class="settle-value">{{
          formatStartTime(card.startTimestamp)
        }}</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">结束时间</span>
        <span class="settle-value">{{ formatTimeNow() }}</span>
      </div>
      <div class="settle-item highlight">
        <span class="settle-label">总时长</span>
        <span class="settle-value">{{ formatTime(elapsedTime) }}</span>
      </div>
      <div class="settle-item">
        <span class="settle-label">计费时长</span>
        <span class="settle-value">{{ calculateBillableHours() }}小时</span>
      </div>

      <!-- 拆单开关 -->
      <el-divider>结算方式</el-divider>
      <div class="split-toggle-bar">
        <span class="split-toggle-label">拆单结算</span>
        <el-switch v-model="useSplitBill" @change="toggleSplitBill" />
        <span v-if="useSplitBill" class="split-toggle-hint">
          将一桌拆分为多个订单分别结算
        </span>
      </div>

      <!-- ========== 单组结算模式（拆单关闭） ========== -->
      <template v-if="!useSplitBill">
        <el-divider>会员信息</el-divider>
        <el-form :model="settleForm" label-width="100px" style="margin-top: 16px">
          <el-form-item label="关联会员">
            <el-select
              v-model="settleForm.memberId"
              placeholder="输入手机号或姓名搜索会员（可选）"
              filterable
              clearable
              :filter-method="filterMembers"
              style="width: 100%"
              @change="handleMemberSelect"
            >
              <el-option
                v-for="member in filteredMembers"
                :key="member.id"
                :label="`${member.name || '(无名)'} ${member.phone ? '(' + member.phone + ')' : ''}`"
                :value="member.id"
              >
                <div
                  style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                  "
                >
                  <div style="display: flex; align-items: center; gap: 8px">
                    <span>{{ member.name }}</span>
                    <el-tag
                      v-if="member.isMember === true"
                      type="success"
                      size="small"
                    >
                      ⭐ 会员
                    </el-tag>
                  </div>
                  <span style="color: #8492a6; font-size: 13px">
                    {{
                      member.cardType === "充值卡"
                        ? `余额: ¥${(member.balance || 0).toFixed(2)}`
                        : `剩余: ${member.remainingTimes}次`
                    }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>

          <el-alert
            v-if="selectedMember"
            :title="getMemberBalanceInfo()"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />

          <el-alert
            v-if="props.card.currentOrderRemark"
            title="订单备注"
            type="warning"
            :closable="false"
            style="margin-bottom: 16px"
          >
            <template #default>
              <div style="white-space: pre-wrap; word-break: break-all">
                {{ props.card.currentOrderRemark }}
              </div>
            </template>
          </el-alert>

          <el-form-item label="计算方式">
            <div style="display: flex; align-items: center;">
              <el-switch v-model="usePerPersonCalc" @change="onPerPersonToggle" />
              <span style="margin-left: 8px; font-size: 12px; color: #909399;">
                {{ usePerPersonCalc ? '按人均计算' : '按总金额计算' }}
              </span>
            </div>
          </el-form-item>
          <el-form-item label="团购套餐">
            <el-select
              v-model="settleForm.selectedPackageIds"
              multiple
              placeholder="请选择团购套餐（可多选）"
              style="width: 100%"
              @change="calculateTotalAmount"
            >
              <el-option
                v-for="pkg in availablePackages"
                :key="pkg.id"
                :label="`${pkg.name} - ¥${pkg.price}`"
                :value="pkg.id"
              >
                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                  "
                >
                  <span style="flex: 1; text-align: left">{{ pkg.name }}</span>
                  <el-tag
                    size="small"
                    :type="getEntertainmentTagType(pkg.entertainment)"
                    style="margin-left: 8px; min-width: 60px; text-align: center"
                  >
                    {{ pkg.entertainment }}
                  </el-tag>
                  <span
                    style="
                      color: #f56c6c;
                      font-weight: bold;
                      margin-left: 8px;
                      min-width: 60px;
                      text-align: right;
                    "
                    >¥{{ pkg.price }}</span
                  >
                </div>
              </el-option>
            </el-select>
          </el-form-item>


          <el-form-item v-if="usePerPersonCalc" label="每人金额">
            <el-input-number
              v-model="perPersonAmount"
              :min="0"
              :precision="2"
              :step="1"
              controls-position="right"
              style="width: 100%"
              @change="onPerPersonAmountChange"
            >
              <template #prefix>¥</template>
            </el-input-number>
          </el-form-item>

          <el-form-item label="总金额">
            <el-input-number
              v-model="settleForm.totalAmount"
              :min="0"
              :precision="2"
              :step="1"
              controls-position="right"
              style="width: 100%"
              :disabled="usePerPersonCalc"
              @change="calculateFinalAmount"
            >
              <template #prefix>¥</template>
            </el-input-number>
            <span v-if="usePerPersonCalc" style="font-size: 11px; color: #909399;">
              = ¥{{ perPersonAmount || 0 }} x {{ card.currentUsers }}人
            </span>
          </el-form-item>

          <el-form-item label="折扣">
            <el-input-number
              v-model="settleForm.discount"
              :min="0"
              :max="100"
              :precision="0"
              :step="5"
              controls-position="right"
              style="width: 100%"
              @change="calculateFinalAmount"
            >
              <template #append>%</template>
            </el-input-number>
          </el-form-item>
          <el-form-item label="支付方式">
            <el-radio-group v-model="settleForm.paymentMethod">
              <el-radio label="member_balance" :disabled="!canUseMemberBalance">
                余额支付
              </el-radio>
              <el-radio label="package">团购套餐</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </template>

      <!-- ========== 拆单结算模式（拆单开启） ========== -->
      <template v-else>
        <el-divider>结算分组</el-divider>
        <div class="split-groups-area">
          <!-- 分组Tab切换栏 -->
          <div class="group-tabs-bar">
            <div class="group-tabs">
              <el-button
                v-for="group in settleGroups"
                :key="group.id"
                :type="activeGroupId === group.id ? 'primary' : ''"
                size="small"
                @click="activeGroupId = group.id"
              >
                {{ group.label }}
              </el-button>
            </div>
            <el-button type="success" size="small" @click="addGroup" :icon="Plus">
              添加分组
            </el-button>
            <el-button
              v-if="settleGroups.length > 1"
              type="danger"
              size="small"
              @click="removeGroup(activeGroupId)"
              :disabled="settleGroups.length <= 1"
            >
              删除当前分组
            </el-button>
          </div>

          <!-- 人数校验提示 -->
          <el-alert
            :title="`已分配人数：${totalAssignedUsers} / ${props.card.currentUsers} 人`"
            :type="totalAssignedUsers === props.card.currentUsers ? 'success' : 'warning'"
            :closable="false"
            style="margin-bottom: 12px"
          />

          <!-- 当前分组的表单 -->
          <template v-for="group in settleGroups" :key="group.id">
            <div v-show="activeGroupId === group.id" class="group-form-panel">
              <el-form label-width="100px">
                <el-form-item label="分组人数">
                  <el-input-number
                    :model-value="group.users"
                    :min="1"
                    :max="props.card.currentUsers"
                    controls-position="right"
                    style="width: 100%"
                    @change="(v) => updateGroupUsers(group.id, v)"
                  />
                </el-form-item>
                <el-form-item label="关联会员">
                  <el-select
                    :model-value="group.memberId"
                    placeholder="输入手机号或姓名搜索会员（可选）"
                    filterable
                    clearable
                    :filter-method="filterMembers"
                    style="width: 100%"
                    @change="(v) => selectGroupMember(group.id, v)"
                  >
                    <el-option
                      v-for="member in filteredMembers"
                      :key="member.id"
                      :label="`${member.name || '(无名)'} ${member.phone ? '(' + member.phone + ')' : ''}`"
                      :value="member.id"
                    >
                      <div style="display: flex; align-items: center; justify-content: space-between">
                        <div style="display: flex; align-items: center; gap: 8px">
                          <span>{{ member.name }}</span>
                          <el-tag v-if="member.isMember === true" type="success" size="small">⭐ 会员</el-tag>
                        </div>
                        <span style="color: #8492a6; font-size: 13px">
                          {{ member.cardType === '充值卡' ? `余额: ¥${(member.balance || 0).toFixed(2)}` : `剩余: ${member.remainingTimes}次` }}
                        </span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item label="计算方式">
                  <div style="display: flex; align-items: center;">
                    <el-switch
                      :model-value="groupUsePerPerson[group.id] || false"
                      @change="(v) => onGroupPerPersonToggle(group.id, v)"
                    />
                    <span style="margin-left: 8px; font-size: 12px; color: #909399;">
                      {{ groupUsePerPerson[group.id] ? '按人均计算' : '按总金额计算' }}
                    </span>
                  </div>
                </el-form-item>
                <el-form-item label="团购套餐">
                  <el-select
                    :model-value="group.selectedPackageIds"
                    multiple
                    placeholder="请选择团购套餐（可多选）"
                    style="width: 100%"
                    @change="(v) => updateGroupPackages(group.id, v)"
                  >
                    <el-option
                      v-for="pkg in availablePackages"
                      :key="pkg.id"
                      :label="`${pkg.name} - ¥${pkg.price}`"
                      :value="pkg.id"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item v-if="groupUsePerPerson[group.id]" label="每人金额">
                  <el-input-number
                    :model-value="groupPerPersonAmounts[group.id] || 0"
                    :min="0"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    style="width: 100%"
                    @change="(v) => onGroupPerPersonAmountChange(group.id, v)"
                  >
                    <template #prefix>¥</template>
                  </el-input-number>
                </el-form-item>

                <el-form-item label="总金额">
                  <el-input-number
                    :model-value="group.totalAmount"
                    :min="0"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    style="width: 100%"
                    :disabled="groupUsePerPerson[group.id]"
                    @change="(v) => updateGroupAmount(group.id, v)"
                  >
                    <template #prefix>¥</template>
                  </el-input-number>
                  <span v-if="groupUsePerPerson[group.id]" style="font-size: 11px; color: #909399;">
                    = ¥{{ groupPerPersonAmounts[group.id] || 0 }} x {{ group.users }}人
                  </span>
                </el-form-item>
                <el-form-item label="折扣">
                  <el-input-number
                    :model-value="group.discount"
                    :min="0"
                    :max="100"
                    :precision="0"
                    :step="5"
                    controls-position="right"
                    style="width: 100%"
                    @change="(v) => updateGroupDiscount(group.id, v)"
                  >
                    <template #append>%</template>
                  </el-input-number>
                </el-form-item>
                <el-form-item label="支付方式">
                  <el-radio-group
                    :model-value="group.paymentMethod"
                    @change="(v) => updateGroupPayment(group.id, v)"
                  >
                    <el-radio label="member_balance" :disabled="!group.memberId">余额支付</el-radio>
                    <el-radio label="package">团购套餐</el-radio>
                    <el-radio label="cash">现金</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="应付金额">
                  <span class="group-final-amount">¥{{ group.finalAmount.toFixed(2) }}</span>
                </el-form-item>
              </el-form>
            </div>
          </template>
        </div>
      </template>

      <!-- 零食信息区域 -->
      <div
        v-if="getSnacks().length > 0"
        class="snack-settle-section"
      >
        <el-divider>零食明细</el-divider>
        <el-table
          :data="getSnacks()"
          size="small"
          border
          style="width: 100%"
        >
          <el-table-column prop="name" label="名称" min-width="50" />
          <el-table-column prop="price" label="单价" width="80" align="right">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column
            prop="quantity"
            label="数量"
            width="200"
            align="center"
          >
            <template #default="{ row, $index }">
              <el-input-number
                disabled
                v-model="row.quantity"
                :min="1"
                size="small"
                @change="updateSnackQuantity($index, row.quantity)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="unit" label="单位" width="60" align="center" />
          <el-table-column label="小计" width="80" align="right">
            <template #default="{ row }">
              ¥{{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <!-- 拆单模式下显示分组数量分配列 -->
          <el-table-column v-if="useSplitBill" label="分组分配" :min-width="settleGroups.length * 80 + 20" align="center">
            <template #default="{ row, $index }">
              <div class="snack-group-quantities">
                <span
                  v-for="group in settleGroups"
                  :key="group.id"
                  class="snack-qty-item"
                >
                  <span class="snack-qty-label">{{ group.label.split('(')[0] }}</span>
                  <el-input-number
                    :model-value="(snackGroupAssignment[$index] && snackGroupAssignment[$index][group.id]) || 0"
                    :min="0"
                    :max="row.quantity"
                    size="small"
                    controls-position="right"
                    style="width: 60px"
                    @change="(v) => assignSnackToGroup($index, group.id, v || 0)"
                  />
                </span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="80" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeSnackFromOrder($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="snack-settle-total">
          <span>零食总计：</span>
          <span class="total-price"
            >¥{{ calculateSnackTotal().toFixed(2) }}</span
          >
        </div>
      </div>

      <!-- 拆单汇总 -->
      <template v-if="useSplitBill && settleGroups.length > 1">
        <el-divider>结算汇总</el-divider>
        <el-table :data="settleGroups" size="small" border style="width: 100%">
          <el-table-column prop="label" label="分组" width="130" />
          <el-table-column prop="users" label="人数" width="60" align="center" />
          <el-table-column label="会员" min-width="100">
            <template #default="{ row }">
              {{ row.memberId ? (getMemberNameById(row.memberId)) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="金额" width="100" align="right">
            <template #default="{ row }"> ¥{{ row.finalAmount.toFixed(2) }} </template>
          </el-table-column>
          <el-table-column label="支付方式" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.paymentMethod === 'member_balance'" type="success" size="small">余额</el-tag>
              <el-tag v-else-if="row.paymentMethod === 'package'" type="warning" size="small">套餐</el-tag>
              <el-tag v-else type="info" size="small">现金</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="settle-grand-total">
          <span>合计：</span>
          <span class="total-price">¥{{ grandTotal.toFixed(2) }}</span>
        </div>
      </template>

      <div class="settle-item highlight final-price">
        <span class="settle-label">应付金额</span>
        <span class="settle-value price"
          >¥{{
            useSplitBill
              ? grandTotal.toFixed(2)
              : settleForm.finalAmount.toFixed(2)
          }}</span
        >
      </div>
    </div>
    <template #footer>
      <el-button @click="showSettleDialog = false">取消</el-button>
      <el-button type="danger" @click="confirmSettle">确认结算</el-button>
    </template>
  </el-dialog>

  <!-- 桌台详情对话框 -->
  <el-dialog
    v-model="showDetailDialog"
    title="桌台详情"
    width="700px"
    append-to-body
  >
    <div class="detail-header">
      <h2 class="detail-title">{{ card.id }}</h2>
      <el-tag
        :type="card.isInUse ? 'danger' : card.isBooked ? 'warning' : 'success'"
        size="large"
        effect="light"
      >
        {{ card.isInUse ? "使用中" : card.isBooked ? "已预约" : "空桌" }}
      </el-tag>
    </div>

    <!-- 桌台信息 -->
    <div class="detail-table-info">
      <h3 class="detail-info-title">桌台信息</h3>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="桌台类型">
          {{ card.type }}
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
            <el-tag
              v-for="item in card.entertainments"
              :key="item"
              size="small"
            >
              {{ item }}
            </el-tag>
          </el-space>
        </el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">
          {{ card.description || "暂无描述" }}
        </el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 颯约信息展示 -->
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
      <div class="booking-actions">
        <el-button type="danger" size="small" @click="handleCancelBooking">
          <el-icon><Close /></el-icon>
          取消预约
        </el-button>
      </div>
    </div>

    <div class="detail-actions">
      <el-button
        v-if="!card.isInUse && !card.isDisabled"
        type="primary"
        @click="handleStartFromDetail"
        >开始计时</el-button
      >
      <el-button v-if="!card.isDisabled" type="warning" @click="handleBooking"
        >预约</el-button
      >
      <el-button v-if="!card.isDisabled" type="info" @click="viewOrders"
        >查看订单</el-button
      >
      <el-button v-if="!card.isDisabled" type="edit" @click="handleEdit"
        >编辑</el-button
      >
      <!-- <el-button v-if="!card.isDisabled" type="danger" @click="handleDisable"
        >禁用</el-button
      > -->
      <el-button v-if="card.isDisabled" type="success" @click="handleEnable"
        >启用</el-button
      >
    </div>
  </el-dialog>

  <!-- 订单详情对话框 -->
  <el-dialog
    v-model="showOrdersDialog"
    title="订单记录"
    width="900px"
    append-to-body
  >
    <!-- 当前进行中的订单（单独展示） -->
    <div v-if="currentOrder" class="current-order-section">
      <div class="section-title">
        <el-icon><VideoPlay /></el-icon>
        <span>当前进行中订单</span>
      </div>
      <el-card shadow="hover" class="current-order-card">
        <el-descriptions :column="3" border>
          <el-descriptions-item label="桌台编号">
            {{ card.id }}
          </el-descriptions-item>
          <el-descriptions-item label="娱乐类型">
            {{ currentOrder.entertainment }}
          </el-descriptions-item>
          <el-descriptions-item label="人数">
            {{ currentOrder.users }}人
          </el-descriptions-item>
          <el-descriptions-item label="开始时间">
            {{ formatStartTime(currentOrder.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前时长">
            <span class="highlight-text">{{ formatTime(elapsedTime) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="warning" size="small">进行中</el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <!-- 订单备注输入区域 -->
        <div class="order-remark-section">
          <el-input
            v-model="currentOrderRemark"
            type="textarea"
            :rows="3"
            placeholder="请输入当前订单备注信息（可选）"
            maxlength="200"
            show-word-limit
          />
          <el-button
            type="primary"
            size="small"
            @click="saveCurrentOrderRemark"
            style="margin-top: 10px"
          >
            保存备注
          </el-button>
        </div>

        <!-- 零食管理区域 -->
        <div class="order-snack-section">
          <div class="snack-header">
            <span class="snack-title">🍿 已选零食</span>
            <el-button type="success" size="small" @click="showSnackSelector">
              <el-icon><Plus /></el-icon>
              添加零食
            </el-button>
          </div>

          <div
            v-if="currentOrder.snacks && currentOrder.snacks.length > 0"
            class="snack-list"
          >
            <el-table
              :data="currentOrder.snacks"
              size="small"
              border
              style="width: 100%"
            >
              <el-table-column prop="name" label="名称" min-width="120" />
              <el-table-column
                prop="price"
                label="单价"
                width="80"
                align="right"
              >
                <template #default="{ row }">
                  ¥{{ row.price.toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column
                prop="quantity"
                label="数量"
                width="140"
                align="center"
              >
                <template #default="{ row, $index }">
                  <el-input-number
                    v-model="row.quantity"
                    :min="1"
                    size="small"
                    @change="updateSnackQuantity($index, row.quantity)"
                  />
                </template>
              </el-table-column>
              <el-table-column
                prop="unit"
                label="单位"
                width="60"
                align="center"
              />
              <el-table-column label="小计" width="100" align="right">
                <template #default="{ row }">
                  ¥{{ (row.price * row.quantity).toFixed(2) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" min-width="100" align="center">
                <template #default="{ $index }">
                  <el-button
                    type="danger"
                    size="small"
                    @click="removeSnackFromOrder($index)"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="snack-total">
              <span>零食总计：</span>
              <span class="total-price"
                >¥{{ calculateSnackTotal().toFixed(2) }}</span
              >
            </div>
          </div>

          <div v-else class="empty-snack">
            <el-empty description="暂未添加零食" :image-size="60" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 历史订单列表 -->
    <div
      class="history-orders-section"
      :class="{ 'with-current': currentOrder }"
    >
      <div class="section-title">
        <el-icon><Document /></el-icon>
        <span>历史订单记录</span>
        <el-tag
          v-if="historyOrders.length > 0"
          type="info"
          size="small"
          style="margin-left: 8px"
        >
          共 {{ historyOrders.length }} 条
        </el-tag>
      </div>

      <el-table
        :data="historyOrders"
        style="width: 100%"
        max-height="400"
        empty-text="暂无历史订单"
      >
        <el-table-column prop="id" label="订单ID" width="150" />
        <el-table-column prop="entertainment" label="娱乐类型" width="100" />
        <el-table-column prop="users" label="人数" width="60" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === 'completed' ? 'success' : 'warning'"
              size="small"
            >
              {{ row.status === "completed" ? "已完成" : "进行中" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="160">
          <template #default="{ row }">
            {{ formatStartTime(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="结束时间" width="160">
          <template #default="{ row }">
            {{ row.endTime ? formatStartTime(row.endTime) : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="duration"
          label="时长(分钟)"
          width="100"
          align="center"
        />
        <el-table-column label="金额" width="100" align="right">
          <template #default="{ row }">
            <span class="price-text"
              >¥{{ row.amount ? row.amount.toFixed(2) : "-" }}</span
            >
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="零食" width="120" align="center">
          <template #default="{ row }">
            <div v-if="row.snacks && row.snacks.length > 0">
              <el-tag size="small" type="success">
                {{ row.snacks.length }}种
              </el-tag>
              <span class="snack-total-inline">
                ¥{{
                  (
                    row.snackTotal || calculateOrderSnackTotal(row.snacks)
                  ).toFixed(2)
                }}
              </span>
            </div>
            <span v-else class="no-snack">-</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" min-width="150">
          <template #default="{ row }">
            <span v-if="row.remark" class="remark-text">{{ row.remark }}</span>
            <span v-else class="no-remark">-</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <template #footer>
      <el-button @click="showOrdersDialog = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 零食选择对话框 -->
  <el-dialog
    v-model="showSnackDialog"
    title="选择零食"
    width="1200px"
    append-to-body
  >
    <div class="snack-selector-content">
      <!-- 左侧：可选零食列表 -->
      <div class="available-snacks">
        <h4>可选零食</h4>
        <el-table :data="snacks" stripe style="width: 100%" max-height="350">
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="category" label="分类" width="80">
            <template #default="{ row }">
              <el-tag size="small">{{ row.category }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="100">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}/{{ row.unit }}
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="80">
            <template #default="{ row }">
              <span :class="{ 'low-stock': row.stock < 20 }">{{
                row.stock
              }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="addSnackToOrder(row)"
              >
                添加
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 右侧：已选零食 -->
      <div class="selected-snacks">
        <h4>已选零食</h4>
        <div v-if="selectedSnacks.length === 0" class="empty-selected">
          <el-empty description="暂未选择" :image-size="60" />
        </div>
        <el-table
          v-else
          :data="selectedSnacks"
          stripe
          style="width: 100%"
          max-height="150"
        >
          <el-table-column prop="name" label="名称" min-width="100" />
          <el-table-column prop="price" label="单价" width="80">
            <template #default="{ row }">
              ¥{{ row.price.toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="150">
            <template #default="{ row, $index }">
              <el-input-number
                v-model="row.quantity"
                :min="1"
                size="small"
                @change="updateSnackQuantity($index, row.quantity)"
              />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="100" align="right">
            <template #default="{ row }">
              ¥{{ (row.price * row.quantity).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center">
            <template #default="{ $index }">
              <el-button
                type="danger"
                size="small"
                @click="removeSnackFromOrder($index)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div v-if="selectedSnacks.length > 0" class="selected-total">
          <span>总计：</span>
          <span class="total-price"
            >¥{{ calculateSnackTotal().toFixed(2) }}</span
          >
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="showSnackDialog = false">取消</el-button>
      <el-button type="primary" @click="confirmAddSnacks">确认添加</el-button>
    </template>
  </el-dialog>

  <!-- 预约对话框 -->
  <el-dialog
    v-model="showBookingDialog"
    title="预约桌台"
    width="500px"
    append-to-body
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
import { ref, onUnmounted, watch, computed } from "vue"
import { ElMessage, ElMessageBox } from "element-plus"
import type { FormInstance, FormRules } from "element-plus"
import {
  Bell,
  Lock,
  VideoPlay,
  Document,
  Plus,
  Close,
} from "@element-plus/icons-vue"

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
    startTimestamp?: number | null // 开始计时的时间戳
    currentEntertainment?: string // 当前选择的娱乐类型（单选）
    currentOrderRemark?: string // 当前订单备注
    currentOrderSnacks?: any[] // 当前订单零食列表
    timerSessions?: Array<{
      id: string
      users: number
      startTimestamp: number
      label: string
    }>
  }
}

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

const props = defineProps<CardProps>()
const emit = defineEmits<{
  (
    e: "start",
    id: string,
    data: {
      entertainment: string
      currentUsers: number
      startTimestamp: number
    },
  ): void
  (e: "share", id: string): void
  (e: "orders", id: string): void
  (
    e: "settle",
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
  ): void
  (e: "settle-multi", id: string, groups: SettleGroup[]): void
  (e: "add-person", id: string, data: { users: number; startTimestamp: number }): void
  (e: "mid-settle", id: string, data: {
    sessionId: string
    leavingUsers: number
    memberId: number | null
    selectedPackageIds: string[]
    totalAmount: number
    discount: number
    finalAmount: number
    paymentMethod: string
    assignedSnacks: Record<number, number>
  }): void
  (e: "booking", id: string, bookingData: any): void
  (e: "cancel-booking", id: string): void
  (e: "edit", id: string): void
  (e: "disable", id: string): void
  (e: "enable", id: string): void
  (e: "update-remark", id: string, remark: string): void
  (e: "update-snacks", id: string, snacks: any[]): void
}>()

const remainingTime = ref(0)
const elapsedTime = ref(0) // 正计时的 elapsed time
const timerTick = ref(0) // 用于触发多 session 计时器模板重渲染
let timer: number | null = null

const getElapsedSeconds = () => {
  if (props.card.startTimestamp) {
    return Math.round((Date.now() - props.card.startTimestamp) / 1000)
  }
  return 0
}

const updateElapsed = () => {
  elapsedTime.value = getElapsedSeconds()
  timerTick.value++ // 触发模板重渲染，使 getSessionElapsed 重新计算
}

const initTimer = () => {
  updateElapsed()
  if (timer) clearInterval(timer)
  timer = window.setInterval(() => {
    updateElapsed()
  }, 1000)
}

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 监听 isInUse 和 startTimestamp 变化以启动/停止计时器
watch(
  () => [props.card.isInUse, props.card.startTimestamp],
  ([isInUse]) => {
    if (isInUse) {
      initTimer()
    } else {
      stopTimer()
      elapsedTime.value = 0
    }
  },
  { immediate: true },
)

// 对话框状态
const showTimerDialog = ref(false)
const showDetailDialog = ref(false)
const showBookingDialog = ref(false)
const showSettleDialog = ref(false) // 结算确认对话框
const showOrdersDialog = ref(false) // 订单详情对话框
const showAddPersonDialog = ref(false) // 加人对话框

// 加人表单
const addPersonForm = ref({
  users: 1,
  startTime: null as string | null,
})

// 中途结算对话框
const showMidSettleDialog = ref(false)
const midSettleForm = ref({
  sessionId: "",
  leavingUsers: 1,
  memberId: null as number | null,
  selectedPackageIds: [] as string[],
  totalAmount: 0,
  discount: 100,
  finalAmount: 0,
  paymentMethod: "package",
})
const midSettleSelectedMember = ref<any>(null)
const midSettleSnackAssignment = ref<Record<number, number>>({})
const midSettleUsePerPerson = ref(false)
const midSettlePerPersonAmount = ref(0)

// 订单列表
const tableOrders = ref<any[]>([])

// 当前进行中的订单和备注
const currentOrder = ref<any>(null)
const currentOrderRemark = ref("")
const historyOrders = ref<any[]>([])

// 零食相关
const snacks = ref<any[]>([]) // 所有零食列表
const selectedSnacks = ref<any[]>([]) // 已选零食（当前订单）
const showSnackDialog = ref(false) // 零食选择对话框

// 结算表单
const settleForm = ref({
  totalAmount: 0, // 总金额（套餐总价）
  discount: 100, // 默认100%（无折扣）
  finalAmount: 0, // 最终金额（应用折扣后）
  memberId: null as number | null, // 会员ID
  paymentMethod: "package", // 支付方式：member_balance/package
  selectedPackageIds: [] as string[], // 选中的套餐ID列表（多选）
})

// 可用会员列表
const availableMembers = ref<any[]>([])
const selectedMember = ref<any>(null)

// 会员搜索关键字
const memberSearchKeyword = ref("")

// 过滤后的会员列表（根据搜索关键字）
const filteredMembers = computed(() => {
  if (!memberSearchKeyword.value) {
    return availableMembers.value
  }
  
  const keyword = memberSearchKeyword.value.toLowerCase()
  return availableMembers.value.filter(member => 
    member.name.toLowerCase().includes(keyword) || 
    member.phone.includes(keyword)
  )
})

// 会员过滤方法
const filterMembers = (query: string) => {
  memberSearchKeyword.value = query
}

// 可用套餐列表
const availablePackages = ref<any[]>([])

// 拆单结算相关状态
const useSplitBill = ref(false)
const settleGroups = ref<SettleGroup[]>([])
const activeGroupId = ref("")

const totalAssignedUsers = computed(() =>
  settleGroups.value.reduce((sum, g) => sum + g.users, 0),
)

const snackGroupAssignment = ref<Record<number, Record<string, number>>>({}) // snackIndex -> { groupId: quantity }
const settleDialogInitialized = ref(false)

// 按人均计算相关状态
const usePerPersonCalc = ref(false)
const perPersonAmount = ref(0)
const groupUsePerPerson = ref<Record<string, boolean>>({})
const groupPerPersonAmounts = ref<Record<string, number>>({})

// 获取当前零食数据（优先 local ref，fallback 到 prop）
const getSnacks = () => {
  return (currentOrder.value?.snacks && currentOrder.value.snacks.length > 0)
    ? currentOrder.value.snacks
    : (props.card.currentOrderSnacks || [])
}

const getSnackByIndex = (idx: number) => {
  return getSnacks()[idx] || null
}

const createDefaultGroup = (): SettleGroup => {
  const snacks = getSnacks()
  const assigned: Record<number, number> = {}
  snacks.forEach((_: any, i: number) => {
    assigned[i] = snacks[i].quantity
  })
  return {
    id: `group-${Date.now()}`,
    label: `分组 1 (${props.card.currentUsers}人)`,
    users: props.card.currentUsers,
    memberId: null,
    selectedPackageIds: [],
    totalAmount: 0,
    discount: 100,
    finalAmount: 0,
    paymentMethod: "package",
    assignedSnacks: assigned,
  }
}

// 根据娱乐类型返回标签颜色类型
const getEntertainmentTagType = (
  entertainment: string,
): "success" | "warning" | "danger" | "info" => {
  const typeMap: Record<string, "success" | "warning" | "danger" | "info"> = {
    桌游: "success", // 绿色
    PS5: "warning", // 橙色
    拼豆: "danger", // 红色
    其他: "info", // 灰色
  }
  return typeMap[entertainment] || "info"
}

// 加载套餐列表
const loadPackages = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/packages")
    const result = await response.json()
    if (result.success) {
      availablePackages.value = result.data
    }
  } catch (error) {
    console.error("加载套餐列表失败:", error)
  }
}

// 计时表单
const timerForm = ref({
  entertainment: "",
  currentUsers: 1,
  startTime: "",
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
    {
      pattern: /^1[3-9]\d{9}$/,
      message: "请输入正确的手机号",
      trigger: "blur",
    },
  ],
})

// 点击卡片显示详情
const handleCardClick = () => {
  if (props.card.isDisabled) return // 禁用的卡片不允许点击
  showDetailDialog.value = true
}

const resetTimerForm = () => {
  timerForm.value = {
    entertainment: "",
    currentUsers: 1,
    startTime: "",
  }
}

const confirmStartTimer = () => {
  if (!timerForm.value.entertainment) {
    ElMessage.warning("请选择娱乐类型")
    return
  }

  // 计算开始时间的时间戳
  let startTimestamp: number
  if (timerForm.value.startTime) {
    // 如果选择了开始时间，使用选择的时间
    const now = new Date()
    const [hours, minutes, seconds] = timerForm.value.startTime
      .split(":")
      .map(Number)
    now.setHours(hours, minutes, seconds, 0)
    startTimestamp = now.getTime()
  } else {
    // 否则使用当前时间
    startTimestamp = Date.now()
  }

  emit("start", props.card.id, {
    entertainment: timerForm.value.entertainment,
    currentUsers: timerForm.value.currentUsers,
    startTimestamp: startTimestamp,
  })
  showTimerDialog.value = false
  resetTimerForm()
}

const shareTable = () => {
  emit("share", props.card.id)
}

// 加人相关函数
const openAddPersonDialog = () => {
  addPersonForm.value = { users: 1, startTime: null as string | null }
  showAddPersonDialog.value = true
}

const resetAddPersonForm = () => {
  addPersonForm.value = { users: 1, startTime: null as string | null }
}

const confirmAddPerson = () => {
  if (addPersonForm.value.users <= 0) {
    ElMessage.warning("请输入加人人数")
    return
  }
  const remaining =
    props.card.capacity - (props.card.currentUsers || 0)
  if (addPersonForm.value.users > remaining) {
    ElMessage.warning(`桌台最多还能加 ${remaining} 人`)
    return
  }
  let startTimestamp: number
  if (addPersonForm.value.startTime) {
    const now = new Date()
    const [hours, minutes, seconds] = addPersonForm.value.startTime
      .split(":")
      .map(Number)
    now.setHours(hours, minutes, seconds, 0)
    startTimestamp = now.getTime()
  } else {
    startTimestamp = Date.now()
  }
  emit("add-person", props.card.id, {
    users: addPersonForm.value.users,
    startTimestamp,
  })
  showAddPersonDialog.value = false
}

// ---- 中途结算 ----
const midSettleMaxLeaving = computed(() => {
  const session = props.card.timerSessions?.find((s) => s.id === midSettleForm.value.sessionId)
  return session ? session.users : 1
})

const openMidSettleDialog = async () => {
  const firstSession = props.card.timerSessions?.[0]
  midSettleForm.value = {
    sessionId: firstSession?.id || "",
    leavingUsers: 1,
    memberId: null,
    selectedPackageIds: [],
    totalAmount: 0,
    discount: 100,
    finalAmount: 0,
    paymentMethod: "package",
  }
  midSettleSelectedMember.value = null
  midSettleSnackAssignment.value = {}
  midSettleUsePerPerson.value = false
  midSettlePerPersonAmount.value = 0
  await Promise.all([loadMembers(), loadPackages()])
  showMidSettleDialog.value = true
}

const onMidSettleSessionChange = () => {
  if (midSettleForm.value.leavingUsers > midSettleMaxLeaving.value) {
    midSettleForm.value.leavingUsers = midSettleMaxLeaving.value
  }
}

const midSettleHandleMemberSelect = (id: number | null) => {
  midSettleSelectedMember.value = id ? (availableMembers.value.find((m) => m.id === id) || null) : null
  if (midSettleSelectedMember.value?.isMember === true) {
    midSettleForm.value.discount = 88
  } else {
    midSettleForm.value.discount = 100
  }
  // 关联会员后自动切换支付方式
  if (midSettleSelectedMember.value) {
    midSettleForm.value.paymentMethod = "member_balance"
  } else {
    midSettleForm.value.paymentMethod = "package"
  }
  midSettleCalcFinal()
}

const midSettleCalcPackages = () => {
  let packagePerPerson = 0
  midSettleForm.value.selectedPackageIds.forEach((pid) => {
    const pkg = availablePackages.value.find((p) => p.id === pid)
    if (pkg) {
      packagePerPerson += midSettleUsePerPerson.value ? pkg.price : 0
    }
  })
  if (midSettleUsePerPerson.value) {
    const manual = midSettlePerPersonAmount.value
    const totalPerPerson = packagePerPerson + manual
    midSettleForm.value.totalAmount = parseFloat((totalPerPerson * midSettleForm.value.leavingUsers).toFixed(2))
    if (manual === 0 && packagePerPerson > 0) {
      midSettlePerPersonAmount.value = parseFloat(packagePerPerson.toFixed(2))
    }
  } else {
    let total = 0
    midSettleForm.value.selectedPackageIds.forEach((pid) => {
      const pkg = availablePackages.value.find((p) => p.id === pid)
      if (pkg) total += pkg.price
    })
    midSettleForm.value.totalAmount = total
  }
  midSettleCalcFinal()
}

const onMidSettlePerPersonToggle = (val: boolean) => {
  if (val) {
    midSettlePerPersonAmount.value = midSettleForm.value.leavingUsers > 0
      ? parseFloat((midSettleForm.value.totalAmount / midSettleForm.value.leavingUsers).toFixed(2))
      : 0
    onMidSettlePerPersonAmountChange(midSettlePerPersonAmount.value)
  }
}

const onMidSettlePerPersonAmountChange = (val: number) => {
  midSettleForm.value.totalAmount = parseFloat((val * midSettleForm.value.leavingUsers).toFixed(2))
  midSettleCalcFinal()
}

const midSettleCalcFinal = () => {
  const discountRate = midSettleForm.value.discount / 100
  let snackTotal = 0
  Object.entries(midSettleSnackAssignment.value).forEach(([idxStr, qty]) => {
    const snack = getSnackByIndex(parseInt(idxStr))
    if (snack) snackTotal += snack.price * qty
  })
  midSettleForm.value.finalAmount = midSettleForm.value.totalAmount * discountRate + snackTotal
}

const confirmMidSettle = () => {
  if (!midSettleForm.value.sessionId) {
    ElMessage.warning("请选择退出的批次")
    return
  }
  const session = props.card.timerSessions?.find((s) => s.id === midSettleForm.value.sessionId)
  if (!session) {
    ElMessage.warning("未找到对应批次")
    return
  }
  if (midSettleForm.value.leavingUsers > session.users) {
    ElMessage.warning("离开人数不能超过该批次当前人数")
    return
  }
  emit("mid-settle", props.card.id, {
    sessionId: midSettleForm.value.sessionId,
    leavingUsers: midSettleForm.value.leavingUsers,
    memberId: midSettleForm.value.memberId,
    selectedPackageIds: midSettleForm.value.selectedPackageIds,
    totalAmount: midSettleForm.value.totalAmount,
    discount: midSettleForm.value.discount,
    finalAmount: midSettleForm.value.finalAmount,
    paymentMethod: midSettleForm.value.paymentMethod,
    assignedSnacks: { ...midSettleSnackAssignment.value },
  })
  showMidSettleDialog.value = false
}

// 获取某个 session 的已过时间
const getSessionElapsed = (session: { startTimestamp: number }) => {
  void timerTick.value // 建立响应式依赖，每秒重算
  return Math.max(0, Math.round((Date.now() - session.startTimestamp) / 1000))
}

const viewOrders = async () => {
  try {
    // 调用后端API获取桌台的订单列表
    const response = await fetch(
      `http://localhost:3000/api/orders/table/${props.card.id}`,
    )

    if (!response.ok) {
      throw new Error("网络响应错误")
    }

    const result = await response.json()

    if (result.success) {
      // 分离历史订单并按创建时间降序排列（最近的在前）
      historyOrders.value = result.data.sort((a: any, b: any) => {
        return (
          new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
        )
      })

      // 如果当前桌台正在使用中，设置当前进行中的订单
      if (props.card.isInUse && props.card.startTimestamp) {
        currentOrder.value = {
          id: "CURRENT",
          entertainment: props.card.currentEntertainment || "-",
          users: props.card.currentUsers,
          status: "in_progress",
          startTime: props.card.startTimestamp,
          endTime: null,
          duration: Math.ceil(elapsedTime.value / 60),
          amount: null,
          createTime: new Date(props.card.startTimestamp).toISOString(),
          remark: props.card.currentOrderRemark || "", // 从桌台数据中加载备注
          snacks: props.card.currentOrderSnacks || [], // 从桌台数据中加载零食
        }
        currentOrderRemark.value = props.card.currentOrderRemark || ""

        // 同步已选零食到selectedSnacks
        selectedSnacks.value = [...(props.card.currentOrderSnacks || [])]

        // 加载零食列表
        await loadSnacks()
      } else {
        currentOrder.value = null
        currentOrderRemark.value = ""
        selectedSnacks.value = []
      }

      showOrdersDialog.value = true

      const totalOrders =
        historyOrders.value.length + (currentOrder.value ? 1 : 0)
      if (totalOrders === 0) {
        ElMessage.info(`卡片 ${props.card.id} 暂无订单记录`)
      }
    } else {
      ElMessage.error(result.message || "获取订单失败")
    }
  } catch (error) {
    console.error("获取订单失败:", error)
    ElMessage.warning("后端服务未启动或网络连接失败，请稍后重试")
  }
}

// 加载零食列表
const loadSnacks = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/snacks")
    const result = await response.json()

    if (result.success) {
      snacks.value = result.data
    }
  } catch (error) {
    console.error("加载零食列表失败:", error)
  }
}

// 保存当前订单备注
const saveCurrentOrderRemark = () => {
  if (!currentOrder.value) {
    ElMessage.warning("没有进行中的订单")
    return
  }

  // 通过 emit 通知父组件更新桌台备注
  emit("update-remark", props.card.id, currentOrderRemark.value)
  ElMessage.success("备注保存成功")
}

// 打开零食选择对话框
const showSnackSelector = () => {
  if (!currentOrder.value) {
    ElMessage.warning("没有进行中的订单")
    return
  }
  showSnackDialog.value = true
}

// 添加零食到订单
const addSnackToOrder = (snack: any) => {
  const existingItem = selectedSnacks.value.find(
    (item) => item.snackId === snack.id,
  )

  if (existingItem) {
    existingItem.quantity += 1
  } else {
    selectedSnacks.value.push({
      snackId: snack.id,
      name: snack.name,
      price: snack.price,
      unit: snack.unit,
      quantity: 1,
    })
  }

  ElMessage.success(`已添加 ${snack.name}`)
}

// 移除零食
const removeSnackFromOrder = (index: number) => {
  selectedSnacks.value.splice(index, 1)
  // 同步到 currentOrder
  if (currentOrder.value?.snacks) {
    currentOrder.value.snacks.splice(index, 1)
  }
}

// 更新零食数量
const updateSnackQuantity = (index: number, quantity: number) => {
  if (quantity <= 0) {
    selectedSnacks.value.splice(index, 1)
    if (currentOrder.value?.snacks) {
      currentOrder.value.snacks.splice(index, 1)
    }
  } else {
    selectedSnacks.value[index].quantity = quantity
    if (currentOrder.value?.snacks) {
      currentOrder.value.snacks[index].quantity = quantity
    }
  }
}

// 计算零食总价
const calculateSnackTotal = () => {
  return selectedSnacks.value.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
}

// 计算订单的零食总价（用于历史订单显示）
const calculateOrderSnackTotal = (snacks: any[]) => {
  return snacks.reduce((total, item) => {
    return total + item.price * item.quantity
  }, 0)
}

// 确认添加零食
const confirmAddSnacks = () => {
  if (currentOrder.value) {
    currentOrder.value.snacks = [...selectedSnacks.value]

    // 通过emit通知父组件更新桌台的零食数据
    emit("update-snacks", props.card.id, selectedSnacks.value)

    ElMessage.success(`已添加 ${selectedSnacks.value.length} 种零食`)
    showSnackDialog.value = false
  }
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

// 取消预约
const handleCancelBooking = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要取消桌台 ${props.card.id} 的预约吗？`,
      "确认取消预约",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      },
    )

    // 触发取消预约事件，传递桌台ID
    emit("cancel-booking", props.card.id)
    showDetailDialog.value = false
    ElMessage.success(`已取消桌台 ${props.card.id} 的预约`)
  } catch {
    // 用户取消操作
  }
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

const formatStartTime = (timestamp: number | null | undefined) => {
  if (!timestamp) return "-"
  const d = new Date(timestamp)
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  const seconds = String(d.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

const formatDate = (date: Date | null) => {
  if (!date) return "-"
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

const formatTimeNow = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  return `${hours}:${minutes}:${seconds}`
}

const formatDateTime = (dateTime: string) => {
  if (!dateTime) return "-"
  const d = new Date(dateTime)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  const hours = String(d.getHours()).padStart(2, "0")
  const minutes = String(d.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 计算金额（简单计费规则：每小时30元）
const calculateAmount = () => {
  const hours = elapsedTime.value / 3600
  const amount = Math.ceil(hours * 30) // 每小时30元，向上取整
  return amount.toFixed(2)
}

// 计算计费时长（小时），未满一小时按一小时计算
const calculateBillableHours = () => {
  const hours = elapsedTime.value / 3600
  return Math.ceil(hours) // 向上取整
}

// 计算套餐总价
const calculateTotalAmount = () => {
  let packagePerPerson = 0
  settleForm.value.selectedPackageIds.forEach((packageId) => {
    const pkg = availablePackages.value.find((p) => p.id === packageId)
    if (pkg) {
      packagePerPerson += usePerPersonCalc.value ? pkg.price : 0
    }
  })
  const manual = usePerPersonCalc.value ? perPersonAmount.value : 0
  const totalPerPerson = packagePerPerson + manual
  if (usePerPersonCalc.value) {
    settleForm.value.totalAmount = parseFloat((totalPerPerson * props.card.currentUsers).toFixed(2))
    // 当仅选了套餐没有手动输入时，同步显示套餐人均价格
    if (manual === 0 && packagePerPerson > 0) {
      perPersonAmount.value = parseFloat(packagePerPerson.toFixed(2))
    }
  } else {
    let total = 0
    settleForm.value.selectedPackageIds.forEach((packageId) => {
      const pkg = availablePackages.value.find((p) => p.id === packageId)
      if (pkg) total += pkg.price
    })
    settleForm.value.totalAmount = total
  }
  calculateFinalAmount()
}

// 计算最终金额
const calculateFinalAmount = () => {
  const discountRate = settleForm.value.discount / 100
  // 应用折扣到总金额
  const discountedAmount = settleForm.value.totalAmount * discountRate
  // 加上零食费用（零食不参与折扣）
  const snackTotal = calculateSnackTotal()
  settleForm.value.finalAmount = discountedAmount + snackTotal
}

// 打开结算对话框并初始化计算
const openSettleDialog = async () => {
  // 重置单组模式表单（向后兼容）
  settleForm.value.totalAmount = 0
  settleForm.value.discount = 100
  settleForm.value.memberId = null
  settleForm.value.paymentMethod = "package"
  settleForm.value.selectedPackageIds = []
  selectedMember.value = null

  // 重置按人均计算状态
  usePerPersonCalc.value = false
  perPersonAmount.value = 0
  groupUsePerPerson.value = {}
  groupPerPersonAmounts.value = {}

  // 首次打开才初始化分组，之后保留用户已填数据
  if (!settleDialogInitialized.value) {
    useSplitBill.value = false
    snackGroupAssignment.value = {}
    const snacks = getSnacks()

    // 如果有 timerSessions，按批次预填充分组
    if (props.card.timerSessions && props.card.timerSessions.length > 0) {
      const sessions = props.card.timerSessions
      settleGroups.value = sessions.map((s, i) => ({
        id: `group-${Date.now()}-${i}`,
        label: `分组 ${i + 1} (${s.users}人)`,
        users: s.users,
        memberId: null,
        selectedPackageIds: [],
        totalAmount: 0,
        discount: 100,
        finalAmount: 0,
        paymentMethod: "package" as string,
        assignedSnacks: {} as Record<number, number>,
      }))
      // 如果有多个批次，自动开启拆单
      if (sessions.length > 1) {
        useSplitBill.value = true
      }
      // 默认零食全归第一组
      const firstGroupId = settleGroups.value[0].id
      snacks.forEach((s: any, i: number) => {
        snackGroupAssignment.value[i] = { [firstGroupId]: s.quantity }
      })
    } else {
      settleGroups.value = [createDefaultGroup()]
      const firstGroupId = settleGroups.value[0].id
      snacks.forEach((_: any, i: number) => {
        snackGroupAssignment.value[i] = { [firstGroupId]: snacks[i].quantity }
      })
    }
    activeGroupId.value = settleGroups.value[0].id
    settleDialogInitialized.value = true
  }

  // 加载会员列表和套餐列表
  await Promise.all([loadMembers(), loadPackages()])

  // 初始化 currentOrder（确保零食数据可用，无需先点订单）
  if (!currentOrder.value && props.card.isInUse && props.card.startTimestamp) {
    currentOrder.value = {
      id: "CURRENT",
      entertainment: props.card.currentEntertainment || "-",
      users: props.card.currentUsers,
      status: "in_progress",
      startTime: props.card.startTimestamp,
      endTime: null,
      duration: Math.ceil(elapsedTime.value / 60),
      amount: null,
      createTime: new Date(props.card.startTimestamp).toISOString(),
      remark: props.card.currentOrderRemark || "",
      snacks: props.card.currentOrderSnacks || [],
    }
    selectedSnacks.value = [...(props.card.currentOrderSnacks || [])]
  }

  // 打开对话框
  showSettleDialog.value = true
}

// 加载会员列表
const loadMembers = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/members")
    const result = await response.json()
    if (result.success) {
      availableMembers.value = result.data
    }
  } catch (error) {
    console.error("加载会员列表失败:", error)
  }
}

// 会员选择变化
const handleMemberSelect = (id: number) => {
  selectedMember.value =
    availableMembers.value.find((m) => m.id === id) || null

  // 如果选择了会员且有余额/次数，默认使用会员支付
  if (selectedMember.value && canUseMemberBalance.value) {
    settleForm.value.paymentMethod = "member_balance"
  } else {
    settleForm.value.paymentMethod = "package"
  }

  // 如果是会员（isMember为true），自动设置88折优惠
  if (selectedMember.value && selectedMember.value.isMember === true) {
    settleForm.value.discount = 88
    ElMessage.success("会员专享：已自动应用88折优惠")
  } else {
    // 非会员恢复默认折扣
    settleForm.value.discount = 100
  }

  // 重新计算最终金额
  calculateFinalAmount()
}

const getMemberNameById = (id: number) => {
  const m = availableMembers.value.find((member: any) => member.id === id)
  return m?.name || "-"
}

// 获取会员余额信息
const getMemberBalanceInfo = () => {
  if (!selectedMember.value) return ""
  const member = selectedMember.value
  if (member.cardType === "充值卡") {
    return `当前余额：¥${(member.balance || 0).toFixed(2)}`
  } else if (member.cardType === "次卡") {
    return `剩余次数：${member.remainingTimes || 0}次`
  }
  return ""
}

// 是否可以使用会员余额
const canUseMemberBalance = computed(() => {
  if (!selectedMember.value) return false
  const member = selectedMember.value
  if (member.cardType === "充值卡") {
    return (member.balance || 0) >= settleForm.value.finalAmount
  } else if (member.cardType === "次卡") {
    return (member.remainingTimes || 0) > 0
  }
  return false
})

// 拆单分组管理函数
const addGroup = () => {
  const idx = settleGroups.value.length + 1
  const remainingUsers =
    props.card.currentUsers - totalAssignedUsers.value
  const defaultUsers = Math.max(1, remainingUsers > 0 ? remainingUsers : 1)
  const newGroup: SettleGroup = {
    id: `group-${Date.now()}-${idx}`,
    label: `分组 ${idx} (${defaultUsers}人)`,
    users: defaultUsers,
    memberId: null,
    selectedPackageIds: [],
    totalAmount: 0,
    discount: 100,
    finalAmount: 0,
    paymentMethod: "package",
    assignedSnacks: {},
  }
  settleGroups.value.push(newGroup)
  activeGroupId.value = newGroup.id
}

const removeGroup = (groupId: string) => {
  if (settleGroups.value.length <= 1) return
  settleGroups.value = settleGroups.value.filter((g) => g.id !== groupId)
  if (activeGroupId.value === groupId) {
    activeGroupId.value = settleGroups.value[0]?.id || ""
  }
}

const updateGroupUsers = (groupId: string, count: number) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.users = count
    const idx = settleGroups.value.indexOf(group) + 1
    group.label = `分组 ${idx} (${count}人)`
  }
}

const updateGroupLabel = () => {
  settleGroups.value.forEach((g, i) => {
    g.label = `分组 ${i + 1} (${g.users}人)`
  })
}

const selectGroupMember = (groupId: string, memberId: number | null) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (!group) return
  group.memberId = memberId
  const member = memberId
    ? availableMembers.value.find((m: any) => m.id === memberId) || null
    : null
  if (member && member.isMember === true) {
    group.discount = 88
  } else {
    group.discount = 100
  }
  // 关联会员后自动切换支付方式
  if (member) {
    group.paymentMethod = "member_balance"
  } else {
    group.paymentMethod = "package"
  }
  calcGroupFinal(group)
}

const updateGroupPackages = (groupId: string, packageIds: string[]) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (!group) return
  group.selectedPackageIds = packageIds
  let packagePerPerson = 0
  packageIds.forEach((pid) => {
    const pkg = availablePackages.value.find((p: any) => p.id === pid)
    if (pkg) {
      packagePerPerson += groupUsePerPerson.value[groupId] ? pkg.price : 0
    }
  })
  if (groupUsePerPerson.value[groupId]) {
    const manual = groupPerPersonAmounts.value[groupId] || 0
    const totalPerPerson = packagePerPerson + manual
    group.totalAmount = parseFloat((totalPerPerson * group.users).toFixed(2))
    // 仅选了套餐没手动输入时，同步显示套餐人均价格
    if (manual === 0 && packagePerPerson > 0) {
      groupPerPersonAmounts.value = {
        ...groupPerPersonAmounts.value,
        [groupId]: parseFloat(packagePerPerson.toFixed(2)),
      }
    }
  } else {
    let total = 0
    packageIds.forEach((pid) => {
      const pkg = availablePackages.value.find((p: any) => p.id === pid)
      if (pkg) total += pkg.price
    })
    group.totalAmount = total
  }
  calcGroupFinal(group)
}

const toggleSplitBill = (val: boolean) => {
  if (val) {
    // 开启拆单时初始化分组
    if (settleGroups.value.length === 0) {
      settleGroups.value = [createDefaultGroup()]
      activeGroupId.value = settleGroups.value[0].id
    }
    // 初始化零食分配（默认归第一组，全量分配）
    const snacks = getSnacks()
    if (snacks.length > 0) {
      const firstGroupId = settleGroups.value[0].id
      snacks.forEach((snack: any, i: number) => {
        if (!(i in snackGroupAssignment.value)) {
          snackGroupAssignment.value = {
            ...snackGroupAssignment.value,
            [i]: { [firstGroupId]: snack.quantity },
          }
        }
      })
    }
  }
}

const calcGroupFinal = (group: SettleGroup) => {
  const discountRate = group.discount / 100
  let snackTotal = 0
  Object.entries(group.assignedSnacks).forEach(([idxStr, qty]) => {
    const idx = parseInt(idxStr)
    const snack = getSnackByIndex(idx)
    if (snack) {
      snackTotal += snack.price * qty
    }
  })
  group.finalAmount = group.totalAmount * discountRate + snackTotal
}

const updateGroupDiscount = (groupId: string, discount: number) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.discount = discount
    calcGroupFinal(group)
  }
}

const updateGroupAmount = (groupId: string, amount: number) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.totalAmount = amount
    calcGroupFinal(group)
  }
}

const updateGroupPayment = (groupId: string, method: string) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (group) {
    group.paymentMethod = method
  }
}

// ---- 按人均计算 ----
const onPerPersonToggle = (val: boolean) => {
  if (val) {
    perPersonAmount.value = props.card.currentUsers > 0
      ? parseFloat((settleForm.value.totalAmount / props.card.currentUsers).toFixed(2))
      : 0
    onPerPersonAmountChange(perPersonAmount.value)
  }
}

const onPerPersonAmountChange = (val: number) => {
  // perPersonAmount 是总人均价格，直接乘人数得总金额
  settleForm.value.totalAmount = parseFloat((val * props.card.currentUsers).toFixed(2))
  calculateFinalAmount()
}

const onGroupPerPersonToggle = (groupId: string, val: boolean) => {
  groupUsePerPerson.value = { ...groupUsePerPerson.value, [groupId]: val }
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (val && group) {
    groupPerPersonAmounts.value = {
      ...groupPerPersonAmounts.value,
      [groupId]: group.users > 0
        ? parseFloat((group.totalAmount / group.users).toFixed(2))
        : 0,
    }
    onGroupPerPersonAmountChange(groupId, groupPerPersonAmounts.value[groupId])
  }
}

const onGroupPerPersonAmountChange = (groupId: string, val: number) => {
  const group = settleGroups.value.find((g) => g.id === groupId)
  if (!group) return
  groupPerPersonAmounts.value = { ...groupPerPersonAmounts.value, [groupId]: val }
  // perPersonAmount 是总人均价格，直接乘人数
  group.totalAmount = parseFloat((val * group.users).toFixed(2))
  calcGroupFinal(group)
}

const assignSnackToGroup = (snackIndex: number, groupId: string, quantity: number) => {
  const current = { ...(snackGroupAssignment.value[snackIndex] || {}) }
  if (quantity <= 0) {
    delete current[groupId]
  } else {
    current[groupId] = quantity
  }
  snackGroupAssignment.value = {
    ...snackGroupAssignment.value,
    [snackIndex]: current,
  }
  // Recalc all groups since snack assignment changed
  settleGroups.value.forEach((g) => {
    g.assignedSnacks = {}
    Object.entries(snackGroupAssignment.value).forEach(([idxStr, alloc]) => {
      const qty = alloc[g.id]
      if (qty && qty > 0) {
        g.assignedSnacks[parseInt(idxStr)] = qty
      }
    })
    calcGroupFinal(g)
  })
}

const grandTotal = computed(() =>
  settleGroups.value.reduce((sum, g) => sum + g.finalAmount, 0),
)

const confirmSettle = () => {
  if (useSplitBill.value) {
    // 验证人数总和
    if (totalAssignedUsers.value !== props.card.currentUsers) {
      ElMessage.warning(
        `分组人数总和（${totalAssignedUsers.value}人）与桌台人数（${props.card.currentUsers}人）不一致，请调整`,
      )
      return
    }
    emit("settle-multi", props.card.id, settleGroups.value)
  } else {
    // 单组结算，保持向后兼容
    emit("settle", props.card.id, {
      totalAmount: settleForm.value.totalAmount,
      discount: settleForm.value.discount,
      finalAmount: settleForm.value.finalAmount,
      memberId: settleForm.value.memberId,
      paymentMethod: settleForm.value.paymentMethod,
      selectedPackageIds: settleForm.value.selectedPackageIds,
      snacks: currentOrder.value?.snacks || [],
      snackTotal: calculateSnackTotal(),
    })
  }
  showSettleDialog.value = false
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
  font-family: "Courier New", monospace;
  line-height: 1.2;
  white-space: nowrap;
}

.timer-sub {
  margin-top: 6px;
  font-size: 13px;
  opacity: 0.9;
  line-height: 1;
}

.timer-entertainment {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.85;
  line-height: 1;
}

.timer-start-time {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.85;
  line-height: 1;
}

.timer-sessions {
  margin-top: 4px;
}

.timer-session-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
}

.session-label {
  font-size: 11px;
  opacity: 0.85;
}

.session-time {
  font-size: 16px;
  font-weight: 600;
  font-family: "Courier New", monospace;
  letter-spacing: 0.06em;
}

.timer-single {
  margin-top: 4px;
}

.timer-single .timer-value {
  font-size: 30px;
  letter-spacing: 0.12em;
  font-weight: 700;
  font-family: "Courier New", monospace;
  line-height: 1.2;
  white-space: nowrap;
}

/* 结算对话框样式 */
.settle-info {
  padding: 20px 0;
}

.settle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.settle-item:last-child {
  border-bottom: none;
}

.settle-item.highlight {
  background-color: #fff7e6;
  margin: 8px -16px;
  padding: 12px 16px;
  border-radius: 4px;
}

.settle-item.highlight.final-price {
  background-color: #fef0f0;
  margin-top: 16px;
}

.settle-label {
  font-size: 14px;
  color: #666;
}

.settle-value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.settle-value.price {
  font-size: 24px;
  color: #ff4d4f;
  font-weight: 700;
}

.price-text {
  color: #ff4d4f;
  font-weight: 600;
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
  padding: 0 12px 12px;
  margin-top: auto;
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.action-grid .el-button {
  height: 32px;
  font-size: 13px;
  margin-left: 8px;
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

.booking-actions {
  margin-top: 16px;
  text-align: right;
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

/* 订单对话框样式 */
.current-order-section {
  margin-bottom: 24px;
}

.history-orders-section {
  margin-top: 24px;
}

.history-orders-section.with-current {
  border-top: 2px solid #e4e7ed;
  padding-top: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.section-title .el-icon {
  font-size: 20px;
  color: #409eff;
}

.current-order-card {
  background: linear-gradient(135deg, #fff7e6 0%, #ffffff 100%);
  border: 2px solid #ffa940;
}

.highlight-text {
  color: #f56c6c;
  font-weight: 700;
  font-size: 16px;
}

.order-remark-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.remark-text {
  color: #606266;
  font-size: 13px;
}

.no-remark {
  color: #c0c4cc;
}

/* 零食结算区域样式 */
.snack-settle-section {
  margin-top: 16px;
}

.snack-settle-total {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: #606266;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

/* 零食管理样式 */
.order-snack-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #dcdfe6;
}

.snack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.snack-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.snack-list {
  margin-top: 10px;
}

.snack-total {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: #606266;
}

.total-price {
  color: #f56c6c;
  font-weight: 700;
  font-size: 16px;
  margin-left: 8px;
}

.empty-snack {
  padding: 20px 0;
}

/* 零食选择对话框样式 */
.snack-selector-content {
  display: flex;
  gap: 20px;
  min-height: 400px;
}

.available-snacks,
.selected-snacks {
  flex: 1;
  min-width: 0; /* 防止flex子元素溢出 */
  display: flex;
  flex-direction: column;
}

.available-snacks h4,
.selected-snacks h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #303133;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
  flex-shrink: 0; /* 标题不压缩 */
}

.empty-selected {
  padding: 40px 0;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-total {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  color: #606266;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  flex-shrink: 0; /* 总计栏不压缩 */
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}

.snack-total-inline {
  margin-left: 8px;
  color: #f56c6c;
  font-weight: 600;
  font-size: 12px;
}

.no-snack {
  color: #c0c4cc;
}

/* 拆单结算样式 */
.split-toggle-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.split-toggle-label {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.split-toggle-hint {
  font-size: 12px;
  color: #909399;
}

.split-groups-area {
  margin-top: 8px;
}

.group-tabs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.group-tabs {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.group-form-panel {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.group-final-amount {
  font-size: 18px;
  font-weight: 700;
  color: #f56c6c;
}

.settle-grand-total {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  padding: 12px 16px;
  background: #fef0f0;
  border-radius: 4px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
}

.snack-group-quantities {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}

.snack-qty-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.snack-qty-label {
  font-size: 10px;
  color: #909399;
}
</style>
