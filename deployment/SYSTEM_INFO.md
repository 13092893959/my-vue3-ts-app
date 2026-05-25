# 百万撤离管理系统 - 系统信息

## 版本信息

- **系统名称**: 百万车厘子桌台管理系统
- **版本号**: v1.0.0
- **发布日期**: 2026-05-17
- **部署类型**: 生产环境部署

## 技术栈

### 前端

- **框架**: Vue 3.5.34
- **语言**: TypeScript 6.0.2
- **UI库**: Element Plus 2.14.0
- **构建工具**: Vite 8.0.12
- **路由**: Vue Router 4.6.4

### 后端

- **运行时**: Node.js (v18+)
- **框架**: Express 5.2.1
- **跨域**: CORS 2.8.6
- **数据存储**: JSON文件

## 系统架构

```
┌─────────────────────────────────────┐
│         浏览器客户端                  │
│     (Vue3 + Element Plus)            │
└──────────────┬──────────────────────┘
               │ HTTP/HTTPS
               ▼
┌─────────────────────────────────────┐
│      Express 后端服务                │
│      (端口: 3000)                    │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  API 路由层                   │  │
│  │  - /api/members              │  │
│  │  - /api/tables               │  │
│  │  - /api/orders               │  │
│  │  - /api/recharge-records     │  │
│  │  - /api/consumption-records  │  │
│  └──────────────────────────────┘  │
│                                      │
│  ┌──────────────────────────────┐  │
│  │  静态文件服务                  │  │
│  │  (生产模式)                   │  │
│  └──────────────────────────────┘  │
└──────────────┬──────────────────────┘
               │ 文件系统
               ▼
┌─────────────────────────────────────┐
│      JSON数据文件                    │
│  D:/data/baiwancheli/               │
│  - members.json                     │
│  - tables.json                      │
│  - orders.json                      │
│  - recharge-records.json            │
│  - consumption-records.json         │
└─────────────────────────────────────┘
```

## 功能模块

### 1. 桌台管理

- 桌台状态实时监控
- 计时功能（正计时）
- 预约管理
- 拼桌功能
- 桌台配置（类型、容量、娱乐项目等）

### 2. 会员管理

- 会员卡办理（充值卡/次卡）
- 会员充值/续卡
- 会员信息查询
- 消费统计
- 数据导出

### 3. 订单管理

- 订单创建与结算
- 支付方式（现金/会员余额）
- 订单查询与筛选
- 数据统计
- CSV导出

### 4. 财务管理

- 充值记录管理
- 消费记录管理
- 收入统计
- 报表导出

## 数据模型

### 会员 (Member)

```typescript
interface Member {
  phone: string // 手机号（唯一标识）
  name: string // 姓名
  cardType: string // 卡类型：充值卡/次卡
  balance?: number // 余额（充值卡）
  remainingTimes?: number // 剩余次数（次卡）
  totalConsumption: number // 累计消费金额
  timesCardUsed?: number // 次卡使用次数
  playTime: number // 总游玩时长（分钟）
  level: string // 会员等级
  createTime: string // 创建时间
}
```

### 桌台 (Table)

```typescript
interface Table {
  id: string // 桌台编号
  type: string // 桌台类型：大厅/包间
  entertainments: string[] // 娱乐项目
  capacity: number // 容纳人数
  minBooking: number // 最小预约人数
  isShared: boolean // 是否允许拼桌
  allowBooking: boolean // 是否允许预约
  description: string // 描述
  isInUse: boolean // 是否使用中
  isBooked: boolean // 是否已预约
  isDisabled: boolean // 是否禁用
  currentUsers: number // 当前人数
  startTimestamp?: number // 开始时间戳
  bookingInfo?: object // 预约信息
}
```

### 订单 (Order)

```typescript
interface Order {
  id: string // 订单ID
  tableId: string // 桌台ID
  entertainment: string // 娱乐项目
  users: number // 人数
  memberPhone?: string // 会员手机号
  memberName?: string // 会员姓名
  paymentMethod: string // 支付方式
  cardType?: string // 卡类型
  amount?: number // 金额
  startTime: string // 开始时间
  endTime?: string // 结束时间
  duration: number // 时长（分钟）
  status: string // 状态：completed/active
  createTime: string // 创建时间
}
```

## API接口文档

### 会员接口

#### GET /api/members

获取会员列表

**响应：**

```json
{
  "success": true,
  "data": [...]
}
```

#### POST /api/members

创建或更新会员

**请求体：**

```json
{
  "phone": "13800138000",
  "name": "张三",
  "cardType": "充值卡",
  "balance": 1000
}
```

#### PUT /api/members/:phone

更新会员信息

### 桌台接口

#### GET /api/tables

获取桌台列表

#### POST /api/tables

保存桌台数据（全量更新）

**请求体：**

```json
[
  { "id": "大厅1", "type": "大厅", ... },
  ...
]
```

### 订单接口

#### GET /api/orders

获取订单列表

#### POST /api/orders

创建订单

### 充值记录接口

#### GET /api/recharge-records

获取充值记录

#### POST /api/recharge-records

创建充值记录

### 消费记录接口

#### GET /api/consumption-records

获取消费记录

#### POST /api/consumption-records

创建消费记录

## 配置说明

### 环境变量

| 变量     | 默认值              | 说明     |
| -------- | ------------------- | -------- |
| PORT     | 3000                | 服务端口 |
| DATA_DIR | D:/data/baiwancheli | 数据目录 |
| NODE_ENV | production          | 运行环境 |

### 数据文件位置

默认：`D:/data/baiwancheli/`

可通过 `DATA_DIR` 环境变量修改。

## 性能指标

- **启动时间**: < 2秒
- **API响应**: < 100ms（本地）
- **内存占用**: ~50MB
- **并发支持**: 10+ 用户

## 安全建议

1. **修改默认密码**
   - 首次使用后修改admin密码

2. **限制访问**
   - 生产环境建议使用HTTPS
   - 配置防火墙规则

3. **定期备份**
   - 每日自动备份数据
   - 保留至少7天备份

4. **日志监控**
   - 定期检查服务日志
   - 关注异常访问

## 维护指南

### 日常维护

- 每日检查服务运行状态
- 每日备份数据
- 每周清理测试数据

### 定期维护

- 每月检查磁盘空间
- 每季度更新Node.js
- 每半年全面检查系统

### 故障处理

1. 查看错误日志
2. 检查数据文件完整性
3. 重启服务
4. 联系技术支持

## 更新日志

### v1.0.0 (2026-05-17)

- ✨ 初始版本发布
- ✅ 桌台管理功能
- ✅ 会员管理系统
- ✅ 订单结算功能
- ✅ 财务记录管理
- ✅ 数据导出功能
- ✅ 统计报表功能

## 许可证

本系统仅供内部使用，未经授权不得外传。

---

**技术支持联系方式**

如有问题，请提供：

- 系统版本
- 错误信息
- 操作步骤
- 截图（如有）
