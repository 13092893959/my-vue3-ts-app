# 百万车厘子管理系统 - 部署包清单

## 📦 部署包信息

- **文件名**: baiwancheli-deployment.zip
- **文件大小**: ~400 KB
- **创建日期**: 2026-05-17
- **系统版本**: v1.0.0

---

## 📂 目录结构

```
baiwancheli-deployment/
│
├── backend/                    # 后端服务
│   ├── server/
│   │   ├── index.js           # 主服务文件（含静态文件托管）
│   │   └── init-data.js       # 数据初始化脚本
│   ├── node_modules/          # 依赖包（需运行npm install安装）
│   ├── package.json           # 项目配置
│   ├── start.bat              # Windows快速启动脚本 ⭐
│   └── backup.bat             # Windows数据备份脚本 ⭐
│
├── frontend/                   # 前端静态文件
│   └── dist/                  # Vue3构建产物
│       ├── index.html
│       ├── favicon.svg
│       ├── icons.svg
│       └── assets/
│           ├── index-*.css    # 样式文件
│           └── index-*.js     # JavaScript文件
│
├── QUICK_START.md             # 快速开始指南 ⭐⭐⭐
├── README_DEPLOY.md           # 详细部署文档 ⭐⭐
└── SYSTEM_INFO.md             # 系统技术文档 ⭐
```

**图例：**
- ⭐ 重要文件
- ⭐⭐ 推荐查看
- ⭐⭐⭐ 必读

---

## ✅ 部署前检查清单

接收部署包后，请确认以下内容：

### 1. 文件完整性
- [ ] `backend/server/index.js` 存在
- [ ] `backend/server/init-data.js` 存在
- [ ] `backend/package.json` 存在
- [ ] `backend/start.bat` 存在
- [ ] `backend/backup.bat` 存在
- [ ] `frontend/dist/index.html` 存在
- [ ] `QUICK_START.md` 存在
- [ ] `README_DEPLOY.md` 存在

### 2. 环境准备
- [ ] 已安装 Node.js v18+
- [ ] 可以访问命令行工具
- [ ] 有足够的磁盘空间（至少100MB）

### 3. 网络要求
- [ ] 端口3000未被占用
- [ ] 防火墙允许端口3000（如需局域网访问）

---

## 🚀 快速部署步骤

### 第1步：解压
将 `baiwancheli-deployment.zip` 解压到任意目录，例如：
```
D:\baiwancheli\
```

### 第2步：启动
双击运行 `backend/start.bat`

### 第3步：访问
浏览器打开 `http://localhost:3000`

默认账号：
- 用户名：admin
- 密码：123456

---

## 📋 核心功能验证

部署完成后，请测试以下功能：

### 基础功能
- [ ] 能够正常登录
- [ ] 桌台管理页面正常显示
- [ ] 能够查看6个默认桌台

### 会员功能
- [ ] 能够办理新会员卡
- [ ] 能够查看会员列表
- [ ] 能够为会员充值

### 订单功能
- [ ] 能够启动桌台计时
- [ ] 能够结算订单
- [ ] 能够查看订单记录

### 数据功能
- [ ] 充值记录正常保存
- [ ] 消费记录正常保存
- [ ] 能够导出CSV文件

---

## 🔧 常见问题速查

### Q1: 双击start.bat后闪退
**原因**: 未安装Node.js  
**解决**: 安装Node.js后重新运行

### Q2: 提示"端口已被占用"
**解决**: 
```bash
netstat -ano | findstr :3000
taskkill /F /PID <进程ID>
```

### Q3: 浏览器无法访问
**检查**:
- 服务是否正在运行（查看命令行窗口）
- 地址是否正确（http://localhost:3000）
- 防火墙是否阻止

### Q4: 数据保存在哪里？
**位置**: `D:/data/baiwancheli/`  
**包含**: members.json, tables.json, orders.json等

### Q5: 如何备份数据？
**方法**: 双击运行 `backend/backup.bat`

---

## 📞 获取帮助

### 文档资源
- **快速入门**: 阅读 `QUICK_START.md`
- **详细部署**: 阅读 `README_DEPLOY.md`
- **技术细节**: 阅读 `SYSTEM_INFO.md`

### 技术支持
如遇问题，请提供：
1. 操作系统版本
2. Node.js版本（运行 `node -v`）
3. 错误信息截图
4. 操作步骤描述

---

## ⚠️ 重要提醒

### 数据安全
- ✅ 每天备份数据（使用backup.bat）
- ✅ 定期清理测试数据
- ✅ 保留至少7天备份

### 系统维护
- ✅ 定期检查服务运行状态
- ✅ 监控磁盘空间使用情况
- ✅ 及时应用系统更新

### 安全建议
- ✅ 修改默认密码
- ✅ 限制不必要的网络访问
- ✅ 不要在公共网络部署

---

## 📊 部署包统计

| 项目 | 数量/大小 |
|------|----------|
| 文件总数 | ~20个 |
| 压缩包大小 | ~400 KB |
| 解压后大小 | ~15 MB（含依赖） |
| 数据文件 | 5个JSON文件 |
| 脚本文件 | 2个BAT文件 |
| 文档文件 | 3个MD文件 |

---

## 🎯 下一步

部署成功后：

1. **熟悉系统**: 浏览各个功能模块
2. **创建数据**: 添加真实会员和桌台配置
3. **建立备份**: 设置每日自动备份
4. **培训用户**: 让相关人员了解使用方法
5. **收集反馈**: 记录使用中的问题和建议

---

**祝您部署顺利！** 🎉

如有任何问题，请参考详细文档或联系技术支持。
