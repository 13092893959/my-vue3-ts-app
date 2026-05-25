# 百万撤离管理系统 - 部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [详细部署步骤](#详细部署步骤)
- [配置说明](#配置说明)
- [常见问题](#常见问题)
- [技术支持](#技术支持)

---

## 系统要求

### 硬件要求

- CPU: 1核及以上
- 内存: 512MB及以上
- 硬盘: 100MB可用空间（不含数据文件）

### 软件要求

- **Node.js**: v18.0.0 或更高版本
- **操作系统**: Windows 10/11, macOS, Linux

### 网络要求

- 端口: 3000（默认，可自定义）
- 如需局域网访问，需配置防火墙

---

## 快速开始

### 1. 解压部署包

将 `baiwancheli-deployment.zip` 解压到任意目录，例如：

```
D:\baiwancheli\
```

解压后的目录结构：

```
baiwancheli/
├── backend/           # 后端服务
│   ├── server/
│   │   ├── index.js
│   │   └── init-data.js
│   └── package.json
├── frontend/          # 前端静态文件
│   └── dist/
└── README_DEPLOY.md   # 本文件
```

### 2. 安装Node.js

如果尚未安装Node.js，请访问 [https://nodejs.org/](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装：

```bash
node -v
npm -v
```

### 3. 初始化数据

打开命令行（Windows PowerShell 或 CMD），进入backend目录：

```bash
cd D:\baiwancheli\backend
npm run init
```

这将在 `D:/data/baiwancheli/` 创建初始数据文件。

### 4. 启动服务

```bash
npm start
```

看到以下提示表示启动成功：

```
服务器运行在 http://localhost:3000
```

### 5. 访问系统

打开浏览器访问：

```
http://localhost:3000
```

默认登录账号：

- 用户名：`admin`
- 密码：`123456`

---

## 详细部署步骤

### 步骤1：环境准备

#### 1.1 检查Node.js版本

```bash
node -v
```

如果版本低于v18，请升级到最新版本。

#### 1.2 创建数据目录（可选）

系统默认将数据存储在 `D:/data/baiwancheli/`，你可以：

- 保持默认路径（推荐）
- 或自定义路径（见[配置说明](#配置说明)）

### 步骤2：安装依赖

进入backend目录：

```bash
cd D:\baiwancheli\backend
```

安装生产依赖：

```bash
npm install --production
```

这会安装必要的依赖包（express、cors等）。

### 步骤3：初始化数据

首次运行需要初始化数据文件：

```bash
npm run init
```

这将创建以下文件：

- `D:/data/baiwancheli/members.json` - 会员数据
- `D:/data/baiwancheli/recharge-records.json` - 充值记录
- `D:/data/baiwancheli/consumption-records.json` - 消费记录
- `D:/data/baiwancheli/tables.json` - 桌台数据
- `D:/data/baiwancheli/orders.json` - 订单数据

### 步骤4：启动服务

```bash
npm start
```

服务启动后，你将看到：

```
✓ 服务器运行在 http://localhost:3000
✓ 数据目录: D:/data/baiwancheli
```

### 步骤5：验证部署

1. 打开浏览器访问 `http://localhost:3000`
2. 使用默认账号登录
3. 尝试以下操作：
   - 查看桌台管理页面
   - 办理会员卡
   - 创建充值记录
   - 结算桌台

如果所有功能正常，部署成功！

---

## 配置说明

### 环境变量

系统支持以下环境变量配置：

| 变量名     | 说明         | 默认值                | 示例                      |
| ---------- | ------------ | --------------------- | ------------------------- |
| `PORT`     | 服务端口     | `3000`                | `set PORT=3001`           |
| `DATA_DIR` | 数据存储目录 | `D:/data/baiwancheli` | `set DATA_DIR=E:\my-data` |
| `NODE_ENV` | 运行环境     | `production`          | 无需设置                  |

### 修改端口

如果3000端口被占用，可以修改端口：

**Windows:**

```bash
set PORT=3001 && npm start
```

**Linux/Mac:**

```bash
PORT=3001 npm start
```

### 修改数据目录

**Windows:**

```bash
set DATA_DIR=E:\my-data && npm start
```

**Linux/Mac:**

```bash
DATA_DIR=/home/user/data npm start
```

注意：修改数据目录后，需要重新运行 `npm run init` 初始化数据。

### 开机自启动（Windows）

#### 方法1：使用任务计划程序

1. 打开"任务计划程序"
2. 点击"创建基本任务"
3. 名称：`百万撤离管理系统`
4. 触发器：选择"当用户登录时"
5. 操作：选择"启动程序"
   - 程序或脚本：`cmd.exe`
   - 添加参数：`/c "cd D:\baiwancheli\backend && npm start"`
   - 起始于：`D:\baiwancheli\backend`
6. 完成向导

#### 方法2：创建启动脚本

创建 `start.bat` 文件：

```batch
@echo off
cd /d D:\baiwancheli\backend
npm start
```

将此快捷方式放入"启动"文件夹：

```
C:\Users\你的用户名\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup
```

---

## 常见问题

### Q1: 启动时提示"端口已被占用"

**解决方案：**

1. 查找占用端口的进程：

```bash
netstat -ano | findstr :3000
```

2. 结束该进程（假设PID为12345）：

```bash
taskkill /F /PID 12345
```

3. 或者修改端口：

```bash
set PORT=3001 && npm start
```

### Q2: 提示"找不到模块 'express'"

**解决方案：**

重新安装依赖：

```bash
cd D:\baiwancheli\backend
npm install --production
```

### Q3: 数据文件在哪里？

默认位置：`D:/data/baiwancheli/`

包含以下JSON文件：

- `members.json` - 会员数据
- `recharge-records.json` - 充值记录
- `consumption-records.json` - 消费记录
- `tables.json` - 桌台数据
- `orders.json` - 订单数据

**备份建议：** 定期复制整个数据目录进行备份。

### Q4: 如何备份数据？

**手动备份：**

```bash
# 复制数据目录
xcopy D:\data\baiwancheli D:\backup\baiwancheli_%date:~0,4%%date:~5,2%%date:~8,2% /E /I
```

**自动备份脚本：** 创建 `backup.bat`：

```batch
@echo off
set BACKUP_DIR=D:\backup\baiwancheli_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
xcopy D:\data\baiwancheli %BACKUP_DIR% /E /I
echo 备份完成：%BACKUP_DIR%
pause
```

### Q5: 如何在局域网内访问？

1. 查看本机IP地址：

```bash
ipconfig
```

2. 找到IPv4地址，例如：`192.168.1.100`

3. 其他设备访问：

```
http://192.168.1.100:3000
```

4. 如果无法访问，检查Windows防火墙：
   - 打开"Windows Defender 防火墙"
   - 点击"高级设置"
   - 添加入站规则，允许TCP端口3000

### Q6: 如何更新系统？

1. 停止当前服务（Ctrl+C）
2. 备份数据目录
3. 替换新的部署包
4. 重新启动服务

**注意：** 更新前务必备份数据！

### Q7: 忘记密码怎么办？

目前密码存储在代码中，如需重置：

1. 联系系统管理员
2. 或修改源码中的密码配置

（未来版本将支持密码重置功能）

### Q8: 数据丢失了怎么办？

如果有备份：

1. 停止服务
2. 用备份文件覆盖 `D:/data/baiwancheli/` 目录
3. 重新启动服务

如果没有备份：

- 很遗憾，数据无法恢复
- 建议立即建立定期备份机制

---

## 技术支持

### 日志查看

服务运行时，控制台会输出日志信息。如遇问题，请记录错误信息。

### 常见问题排查

1. **服务无法启动**
   - 检查Node.js是否安装
   - 检查端口是否被占用
   - 查看控制台错误信息

2. **页面无法访问**
   - 确认服务已启动
   - 检查防火墙设置
   - 尝试访问 `http://localhost:3000`

3. **数据保存失败**
   - 检查数据目录权限
   - 确认磁盘空间充足
   - 查看控制台错误信息

### 联系方式

如有技术问题，请提供：

- 操作系统版本
- Node.js版本
- 错误信息截图
- 操作步骤描述

---

## 附录

### A. 目录结构说明

```
baiwancheli/
├── backend/              # 后端服务目录
│   ├── server/
│   │   ├── index.js      # 主服务文件
│   │   └── init-data.js  # 数据初始化脚本
│   ├── node_modules/     # 依赖包（自动生成）
│   ├── package.json      # 项目配置
│   └── package-lock.json # 依赖锁定文件
├── frontend/             # 前端静态文件
│   └── dist/             # 构建产物
│       ├── index.html
│       ├── assets/
│       └── ...
└── README_DEPLOY.md      # 部署文档
```

### B. API接口列表

系统提供以下API接口：

| 接口                       | 方法 | 说明         |
| -------------------------- | ---- | ------------ |
| `/api/members`             | GET  | 获取会员列表 |
| `/api/members`             | POST | 创建会员     |
| `/api/members/:phone`      | PUT  | 更新会员     |
| `/api/tables`              | GET  | 获取桌台列表 |
| `/api/tables`              | POST | 保存桌台数据 |
| `/api/recharge-records`    | GET  | 获取充值记录 |
| `/api/recharge-records`    | POST | 创建充值记录 |
| `/api/consumption-records` | GET  | 获取消费记录 |
| `/api/consumption-records` | POST | 创建消费记录 |
| `/api/orders`              | GET  | 获取订单列表 |
| `/api/orders`              | POST | 创建订单     |

### C. 性能优化建议

1. **定期清理数据**
   - 删除过期的测试数据
   - 归档历史订单

2. **监控系统资源**
   - 监控CPU和内存使用
   - 定期检查磁盘空间

3. **网络优化**
   - 使用HTTPS（生产环境推荐）
   - 启用Gzip压缩

### D. 安全建议

1. **修改默认密码**
   - 首次使用后修改默认密码

2. **限制访问**
   - 仅在必要时开放局域网访问
   - 使用防火墙限制IP范围

3. **定期备份**
   - 每天备份数据
   - 保留至少7天的备份

4. **更新系统**
   - 及时应用安全补丁
   - 关注Node.js安全公告

---

## 版本信息

- **系统版本**: v1.0.0
- **部署日期**: 2026-05-17
- **Node.js要求**: v18.0.0+
- **最后更新**: 2026-05-17

---

**祝您使用愉快！** 🎉
