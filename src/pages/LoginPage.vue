<template>
  <div class="login-page">
    <el-card class="login-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>登录</span>
        </div>
      </template>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-position="top"
        @submit.prevent="login"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            prefix-icon="Lock"
            show-password
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            native-type="submit"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>
        <el-alert
          v-if="loginError"
          :title="loginError"
          type="error"
          show-icon
          :closable="false"
        />
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const loginFormRef = ref<FormInstance>()
const loginForm = ref({ username: '', password: '' })
const loginError = ref('')
const loading = ref(false)

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
}

const login = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loginError.value = ''
      loading.value = true
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginForm.value),
        })

        if (!response.ok) {
          const data = await response.json()
          loginError.value = data.message || '用户名或密码错误'
          return
        }

        const data = await response.json()
        if (data.success) {
          window.localStorage.setItem('card-manager-logged-in', 'true')
          router.push('/home')
        } else {
          loginError.value = data.message || '用户名或密码错误'
        }
      } catch (error) {
        loginError.value = '登录服务不可用，请稍后重试'
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f6f7fb;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
}
</style>
