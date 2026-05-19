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
      <div class="timer-title">计时中</div>
      <div class="timer-value">{{ formatTime(elapsedTime) }}</div>
      <div class="timer-sub">{{ card.currentUsers }}人</div>
      <div class="timer-entertainment" v-if="card.currentEntertainment">
        {{ card.currentEntertainment }}
      </div>
      <div class="timer-start-time" v-if="card.startTimestamp">
        开始：{{ formatStartTime(card.startTimestamp) }}
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

      <!-- 使用中模式：拼桌、订单和结束计时按钮 -->
      <div v-else class="action-row-in-use">
        <el-button type="success" size="default" @click.stop="shareTable">
          拼桌
        </el-button>
        <el-button type="info" size="default" @click.stop="viewOrders">
          订单
        </el-button>
        <el-button type="danger" size="default" @click.stop="openSettleDialog">
          结束计时
        </el-button>
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

  <!-- 结算确认对话框 -->
  <el-dialog
    v-model="showSettleDialog"
    title="结束计时 - 订单结算"
    width="600px"
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

      <!-- 会员信息区域 -->
      <el-divider>会员信息</el-divider>
      <el-form :model="settleForm" label-width="100px" style="margin-top: 16px">
        <el-form-item label="关联会员">
          <el-select
            v-model="settleForm.memberPhone"
            placeholder="选择会员（可选）"
            filterable
            clearable
            style="width: 100%"
            @change="handleMemberSelect"
          >
            <el-option
              v-for="member in availableMembers"
              :key="member.phone"
              :label="`${member.name} (${member.phone})`"
              :value="member.phone"
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

        <!-- 显示会员余额/次数信息 -->
        <el-alert
          v-if="selectedMember"
          :title="getMemberBalanceInfo()"
          type="info"
          :closable="false"
          style="margin-bottom: 16px"
        />

        <!-- 显示当前订单备注 -->
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

        <!-- 团购套餐选择（多选） -->
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

        <el-form-item label="总金额">
          <el-input-number
            v-model="settleForm.totalAmount"
            :min="0"
            :precision="2"
            :step="1"
            controls-position="right"
            style="width: 100%"
            @change="calculateFinalAmount"
          >
            <template #prefix>¥</template>
          </el-input-number>
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

      <!-- 零食信息区域 -->
      <div
        v-if="
          currentOrder && currentOrder.snacks && currentOrder.snacks.length > 0
        "
        class="snack-settle-section"
      >
        <el-divider>零食明细</el-divider>
        <el-table
          :data="currentOrder.snacks"
          size="small"
          border
          style="width: 100%"
        >
          <el-table-column prop="name" label="名称" min-width="120" />
          <el-table-column prop="price" label="单价" width="80" align="right">
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
          <el-table-column prop="unit" label="单位" width="60" align="center" />
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
        <div class="snack-settle-total">
          <span>零食总计：</span>
          <span class="total-price"
            >¥{{ calculateSnackTotal().toFixed(2) }}</span
          >
        </div>
      </div>

      <div class="settle-item highlight final-price">
        <span class="settle-label">应付金额</span>
        <span class="settle-value price"
          >¥{{ settleForm.finalAmount.toFixed(2) }}</span
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
  }
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
      memberPhone?: string
      paymentMethod?: string
      selectedPackageIds?: string[]
      snacks?: any[]
      snackTotal?: number
    },
  ): void
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
let timer: number | null = null

const getElapsedSeconds = () => {
  if (props.card.startTimestamp) {
    return Math.round((Date.now() - props.card.startTimestamp) / 1000)
  }
  return 0
}

const updateElapsed = () => {
  elapsedTime.value = getElapsedSeconds()
}

const initTimer = () => {
  updateElapsed()
  if (timer) clearInterval(timer)
  timer = window.setInterval(updateElapsed, 1000)
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
  memberPhone: "", // 会员手机号
  paymentMethod: "member_balance", // 支付方式：member_balance/package
  selectedPackageIds: [] as string[], // 选中的套餐ID列表（多选）
})

// 可用会员列表
const availableMembers = ref<any[]>([])
const selectedMember = ref<any>(null)

// 可用套餐列表
const availablePackages = ref<any[]>([])

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
}

// 更新零食数量
const updateSnackQuantity = (index: number, quantity: number) => {
  if (quantity <= 0) {
    selectedSnacks.value.splice(index, 1)
  } else {
    selectedSnacks.value[index].quantity = quantity
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
  let total = 0
  settleForm.value.selectedPackageIds.forEach((packageId) => {
    const pkg = availablePackages.value.find((p) => p.id === packageId)
    if (pkg) {
      total += pkg.price
    }
  })
  settleForm.value.totalAmount = total
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
  // 重置表单为默认值
  settleForm.value.totalAmount = 0
  settleForm.value.discount = 100
  settleForm.value.memberPhone = ""
  settleForm.value.paymentMethod = "member_balance"
  settleForm.value.selectedPackageIds = []
  selectedMember.value = null
  // 加载会员列表和套餐列表
  await Promise.all([loadMembers(), loadPackages()])
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
const handleMemberSelect = (phone: string) => {
  selectedMember.value =
    availableMembers.value.find((m) => m.phone === phone) || null

  // 如果选择了会员且有余额/次数，默认使用会员支付
  if (selectedMember.value && canUseMemberBalance.value) {
    settleForm.value.paymentMethod = "member_balance"
  } else {
    settleForm.value.paymentMethod = "cash"
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

const confirmSettle = () => {
  // 触发父组件进行结算，传递结算信息和零食数据
  emit("settle", props.card.id, {
    totalAmount: settleForm.value.totalAmount,
    discount: settleForm.value.discount,
    finalAmount: settleForm.value.finalAmount,
    memberPhone: settleForm.value.memberPhone,
    paymentMethod: settleForm.value.paymentMethod,
    selectedPackageIds: settleForm.value.selectedPackageIds,
    snacks: currentOrder.value?.snacks || [],
    snackTotal: calculateSnackTotal(),
  })
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
</style>
