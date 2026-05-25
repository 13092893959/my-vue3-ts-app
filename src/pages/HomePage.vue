<template>
  <div class="home-layout">
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-icon">
            <span class="logo-emoji">🎮</span>
          </div>
          <div class="header-title-group">
            <h1>百万撤离主机桌游馆</h1>
            <p class="header-subtitle">Table Game Management System</p>
          </div>
        </div>
        <div class="header-right">
          <div class="header-time">
            <span class="time-icon">🕐</span>
            <span class="time-text">{{ currentTime }}</span>
          </div>
          <div class="user-info">
            <span class="user-avatar"></span>
            <span class="user-name">管理员</span>
          </div>
          <el-button type="danger" @click="logout" size="large" plain>
            退出登录
          </el-button>
        </div>
      </div>
    </header>

    <div class="layout-body">
      <aside class="page-aside">
        <div class="aside-header">
          <div class="aside-title">
            <span class="menu-icon">📋</span>
            <span>功能菜单</span>
          </div>
        </div>
        <el-menu
          class="nav-menu"
          :default-active="activeRoute"
          :router="true"
          unique-opened
          background-color="transparent"
          text-color="var(--app-sidebar-text)"
          active-text-color="var(--app-sidebar-active-text)"
        >
          <el-menu-item index="/home">
            <span class="menu-item-icon">🏠</span>
            <span class="menu-item-text">首页</span>
          </el-menu-item>
          <el-menu-item index="/home/dashboard">
            <span class="menu-item-icon">🎯</span>
            <span class="menu-item-text">桌台管理</span>
          </el-menu-item>
          <el-menu-item index="/home/member">
            <span class="menu-item-icon">👥</span>
            <span class="menu-item-text">客户管理</span>
          </el-menu-item>
          <el-menu-item index="/home/order">
            <span class="menu-item-icon">📋</span>
            <span class="menu-item-text">订单管理</span>
          </el-menu-item>
          <el-menu-item index="/home/recharge">
            <span class="menu-item-icon">💰</span>
            <span class="menu-item-text">充值记录</span>
          </el-menu-item>
          <el-menu-item index="/home/consumption">
            <span class="menu-item-icon">🛒</span>
            <span class="menu-item-text">消费记录</span>
          </el-menu-item>
          <el-menu-item index="/home/snack">
            <span class="menu-item-icon">🍿</span>
            <span class="menu-item-text">零食管理</span>
          </el-menu-item>
          <el-menu-item index="/home/settings">
            <span class="menu-item-icon">⚙️</span>
            <span class="menu-item-text">系统管理</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <main class="page-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue"
import { useRoute, useRouter } from "vue-router"

const router = useRouter()

const route = useRoute()
const activeRoute = computed(() => {
  if (route.path === "/home") return "/home"
  if (route.path.startsWith("/home/dashboard")) return "/home/dashboard"
  if (route.path.startsWith("/home/member")) return "/home/member"
  if (route.path.startsWith("/home/order")) return "/home/order"
  if (route.path.startsWith("/home/recharge")) return "/home/recharge"
  if (route.path.startsWith("/home/consumption")) return "/home/consumption"
  if (route.path.startsWith("/home/snack")) return "/home/snack"
  if (route.path.startsWith("/home/settings")) return "/home/settings"
  return "/home"
})

const currentTime = ref("")

const updateTime = () => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, "0")
  const minutes = String(now.getMinutes()).padStart(2, "0")
  const seconds = String(now.getSeconds()).padStart(2, "0")
  currentTime.value = `${hours}:${minutes}:${seconds}`
}

const logout = () => {
  window.localStorage.removeItem("card-manager-logged-in")
  router.push("/login")
}

let timer: number | null = null

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000) as unknown as number
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.home-layout {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: var(--app-layout-bg);
}

/* 顶部Header样式 */
.page-header {
  flex: 0 0 auto;
  background: var(--app-header-bg);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 100;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  max-width: 1920px;
  margin: 0 auto;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.logo-icon {
  width: 50px;
  height: 50px;
  background: var(--app-logo-bg);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.logo-emoji {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.header-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-header h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 700;
  color: var(--app-header-text);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 1px;
}

.header-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--app-header-sub-text);
  letter-spacing: 2px;
  font-weight: 300;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-time {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--app-time-bg);
  border-radius: 24px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.header-time:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.time-icon {
  font-size: 18px;
}

.time-text {
  font-size: 16px;
  color: var(--app-header-text);
  font-weight: 500;
  font-family: "Courier New", monospace;
  letter-spacing: 1px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: var(--app-user-info-bg);
  border-radius: 24px;
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
  transition: all 0.3s ease;
  cursor: pointer;
}

.user-info:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(240, 147, 251, 0.4);
}

.user-avatar {
  font-size: 20px;
}

.user-name {
  font-size: 15px;
  color: var(--app-header-text);
  font-weight: 500;
}

/* 主体布局 */
.layout-body {
  flex: 1 1 auto;
  display: flex;
  gap: 20px;
  padding: 20px;
  min-height: 0;
  overflow: hidden;
}

/* 左侧导航栏 */
.page-aside {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  padding: 0;
  border-radius: 20px;
  background: var(--app-sidebar-bg);
  box-shadow: 0 8px 32px rgba(30, 60, 114, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.aside-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.aside-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-header-text);
  letter-spacing: 1px;
}

.menu-icon {
  font-size: 22px;
}

.nav-menu {
  flex: 1;
  border-right: none;
  padding: 16px 12px;
  background: transparent;
}

.nav-menu ::v-deep .el-menu-item {
  border-radius: 12px;
  margin-bottom: 8px;
  height: 50px;
  line-height: 50px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-menu ::v-deep .el-menu-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(
    90deg,
    rgba(240, 147, 251, 0.3) 0%,
    transparent 100%
  );
  transition: width 0.3s ease;
}

.nav-menu ::v-deep .el-menu-item:hover::before {
  width: 100%;
}

.nav-menu ::v-deep .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.nav-menu ::v-deep .el-menu-item.is-active {
  background: var(--app-menu-active-bg);
  box-shadow: 0 4px 12px rgba(240, 147, 251, 0.3);
  font-weight: 600;
}

.nav-menu ::v-deep .el-menu-item.is-active::after {
  content: "";
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 60%;
  background: var(--app-menu-active-after-bg);
  border-radius: 2px 0 0 2px;
}

.menu-item-icon {
  font-size: 20px;
  margin-right: 12px;
}

.menu-item-text {
  font-size: 15px;
  letter-spacing: 0.5px;
}

/* 主内容区域 */
.page-main {
  flex: 1 1 auto;
  min-height: 0;
  background: var(--app-main-bg);
  color: var(--app-main-text);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  overflow: auto;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.page-main:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .page-aside {
    flex: 0 0 200px;
  }

  .header-content {
    padding: 16px 24px;
  }

  .layout-body {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .page-aside {
    flex: 0 0 180px;
  }

  .header-subtitle {
    display: none;
  }

  .header-time {
    display: none;
  }
}
</style>
