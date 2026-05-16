<template>
  <div class="home-layout">
    <header class="page-header">
      <h1>百万撤离主题桌游</h1>
    </header>

    <div class="layout-body">
      <aside class="page-aside">
        <el-menu
          class="nav-menu"
          :default-active="activeRoute"
          :router="true"
          unique-opened
          background-color="transparent"
          text-color="#b8c7ee"
          active-text-color="#ffffff"
        >
          <el-menu-item index="/home">首页</el-menu-item>
          <el-menu-item index="/home/dashboard">桌台管理</el-menu-item>
          <el-menu-item index="/home/member">会员管理</el-menu-item>
        </el-menu>
      </aside>

      <main class="page-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeRoute = computed(() => {
  if (route.path === '/home') return '/home'
  if (route.path.startsWith('/home/dashboard')) return '/home/dashboard'
  if (route.path.startsWith('/home/member')) return '/home/member'
  return '/home'
})
</script>

<style scoped>
.home-layout {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #e8f0ff;
}

.page-header {
  flex: 0 0 auto;
  padding: 28px 40px;
  background: #c8dcff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}

.page-header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f3250;
}

.layout-body {
  flex: 1 1 auto;
  display: flex;
  gap: 24px;
  padding: 28px 40px 40px;
  min-height: 0;
  overflow: hidden;
}

.page-aside {
  flex: 0 0 220px;
  padding: 24px 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, #1f2f4f 0%, #253552 100%);
  box-shadow: 0 20px 60px rgba(20, 45, 90, 0.12);
}

.nav-menu ::v-deep .el-menu-item {
  border-radius: 14px;
  margin-bottom: 10px;
}

.nav-menu ::v-deep .el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.14);
}

.page-main {
  flex: 1 1 auto;
  min-height: 0;
  background: transparent;
  border-radius: 24px;
  padding: 32px;
  box-shadow: none;
  overflow: auto;
  display: flex;
  flex-direction: column;
}
</style>
