# 会员管理系统 - 后端服务

## 数据存储服务

后端服务使用 Node.js + Express 构建，通过 `fs` 模块将数据以 JSON 格式保存在本地文件中。

### 数据存储路径

**数据目录**: `D:/data/baiwancheli/`

**数据文件**（按类型分离）:
- `members.json` - 会员数据
- `recharge-records.json` - 充值记录
- `consumption-records.json` - 消费记录

### 启动服务

#### 1. 初始化数据（首次运行或重置数据）
```bash
npm run init:data
```
这会创建初始的会员数据、充值记录和消费记录到对应的JSON文件中。

#### 2. 启动API服务
```bash
npm run serve:api
```
服务将在 `http://localhost:3000` 启动。

### API接口

#### 会员管理
- `GET /api/members` - 获取所有会员
- `POST /api/members` - 添加新会员
- `PUT /api/members/:phone` - 更新会员信息（使用手机号作为唯一标识）
- `DELETE /api/members/:phone` - 删除会员

#### 充值记录
- `GET /api/recharge-records` - 获取所有充值记录
- `POST /api/recharge-records` - 添加充值记录

#### 消费记录
- `GET /api/consumption-records` - 获取所有消费记录
- `POST /api/consumption-records` - 添加消费记录

#### 其他
- `POST /api/login` - 用户登录
- `GET /api/health` - 健康检查

### 数据结构

#### 会员数据 (members.json)
```json
[
  {
    "id": 1,
    "name": "会员姓名",
    "phone": "手机号（唯一标识）",
    "cardType": "年卡/季卡/月卡/储值卡",
    "expiryDate": "到期时间（时间卡）",
    "balance": 余额（储值卡）,
    "level": "会员等级",
    "totalConsumption": 总消费金额,
    "playTime": 游玩时长,
    "createTime": "创建时间"
  }
]
```

#### 充值记录 (recharge-records.json)
```json
[
  {
    "id": 1,
    "date": "充值时间",
    "phone": "会员手机号",
    "name": "会员姓名",
    "amount": 充值金额,
    "type": "充值方式（微信/支付宝/现金/银行卡）"
  }
]
```

#### 消费记录 (consumption-records.json)
```json
[
  {
    "id": 1,
    "date": "消费时间",
    "phone": "会员手机号",
    "name": "会员姓名",
    "amount": 消费金额,
    "item": "消费项目",
    "duration": 游玩时长（分钟）
  }
]
```

### 数据关联

所有数据通过 `phone`（手机号）字段关联：
- **会员数据**: 主数据，`phone` 为唯一标识
- **充值记录**: 通过 `phone` 关联到对应会员
- **消费记录**: 通过 `phone` 关联到对应会员

### 特性

✅ **数据分离**: 不同类型数据存储在不同文件，便于查看和管理  
✅ **无需数据库**: 使用本地JSON文件存储数据  
✅ **持久化存储**: 数据保存在 `D:/data/baiwancheli/` 目录  
✅ **自动创建**: 首次运行自动创建数据文件和目录  
✅ **RESTful API**: 标准的REST API接口  
✅ **跨域支持**: 已配置CORS，支持前端跨域访问  
✅ **错误处理**: 完善的错误处理和数据验证  

### 注意事项

1. 确保 `D:/data/baiwancheli/` 目录有写入权限
2. 数据文件为JSON格式，可以手动编辑（需重启服务）
3. 手机号作为会员的唯一标识，不允许重复
4. 所有数据操作都会实时写入对应的JSON文件
5. 充值记录和消费记录通过 `phone` 字段与会员数据关联

### 文件结构

```
D:/data/baiwancheli/
├── members.json              # 会员主数据
├── recharge-records.json     # 充值记录（关联phone）
└── consumption-records.json  # 消费记录（关联phone）
```
