<template>
  <div class="settings-page">
    <el-tabs v-model="activeTab" class="settings-tabs">
      <!-- 团购套餐管理 -->
      <el-tab-pane label="🍱 团购套餐管理" name="packages">
        <div class="tab-content">
          <div class="action-bar">
            <el-button type="primary" @click="showAddPackageDialog">
              <el-icon><Plus /></el-icon> 新增套餐
            </el-button>
          </div>
          <el-table :data="packages" stripe border style="width: 100%">
            <el-table-column prop="name" label="套餐名称" min-width="150" />
            <el-table-column prop="entertainment" label="适用类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getEntertainmentType(row.entertainment)">
                  {{ row.entertainment }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="price" label="价格" width="100" align="right">
              <template #default="{ row }">¥{{ row.price.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="duration" label="时长(分钟)" width="120" align="center">
              <template #default="{ row }">{{ row.duration || '-' }}</template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="editPackage(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deletePackage(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 系统主题设置 -->
      <el-tab-pane label="🎨 系统主题设置" name="theme">
        <div class="tab-content theme-content">
          <el-form label-width="120px">
            <el-form-item label="主色调">
              <el-color-picker v-model="themeConfig.primaryColor" />
            </el-form-item>
            <el-form-item label="背景风格">
              <el-radio-group v-model="themeConfig.backgroundStyle">
                <el-radio label="light">简约白</el-radio>
                <el-radio label="dark">深邃黑</el-radio>
                <el-radio label="gradient">渐变紫</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveTheme">保存主题设置</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 套餐编辑/新增对话框 -->
    <el-dialog v-model="showPackageDialog" :title="isEdit ? '编辑套餐' : '新增套餐'" width="500px" append-to-body>
      <el-form :model="packageForm" :rules="packageRules" ref="packageFormRef" label-width="100px">
        <el-form-item label="套餐ID">
          <el-input
            v-if="isEdit"
            v-model="packageForm.id"
            disabled
          />
          <el-input
            v-else
            value="自动生成"
            disabled
          />
        </el-form-item>
        <el-form-item label="套餐名称" prop="name">
          <el-input v-model="packageForm.name" placeholder="请输入套餐名称" />
        </el-form-item>
        <el-form-item label="适用类型" prop="entertainment">
          <el-select v-model="packageForm.entertainment" placeholder="请选择适用类型" style="width: 100%">
            <el-option label="桌游" value="桌游" />
            <el-option label="PS5" value="PS5" />
            <el-option label="拼豆" value="拼豆" />
            <el-option label="通用" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格" prop="price">
          <el-input-number v-model="packageForm.price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="时长(分)" prop="duration">
          <el-input-number v-model="packageForm.duration" :min="0" :step="30" style="width: 100%" />
          <span class="form-tip">填0表示不限时或仅含商品</span>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="packageForm.description" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPackageDialog = false">取消</el-button>
        <el-button type="primary" @click="submitPackageForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const activeTab = ref('packages')
const packages = ref<any[]>([])
const showPackageDialog = ref(false)
const isEdit = ref(false)
const packageFormRef = ref<FormInstance>()

const packageForm = reactive({
  id: '',
  name: '',
  entertainment: '桌游',
  price: 0,
  duration: 120,
  description: ''
})

const packageRules: FormRules = {
  id: [{ required: true, message: '请输入套餐ID', trigger: 'blur' }],
  name: [{ required: true, message: '请输入套餐名称', trigger: 'blur' }],
  entertainment: [{ required: true, message: '请选择适用类型', trigger: 'change' }],
  price: [{ required: true, message: '请输入价格', trigger: 'blur' }]
}

const themeConfig = reactive({
  primaryColor: '#667eea',
  backgroundStyle: 'gradient'
})

// 加载套餐
const loadPackages = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/packages')
    const result = await res.json()
    if (result.success) packages.value = result.data
  } catch (error) {
    ElMessage.error('加载套餐失败')
  }
}

const showAddPackageDialog = () => {
  isEdit.value = false
  Object.assign(packageForm, { id: '', name: '', entertainment: '桌游', price: 0, duration: 120, description: '' })
  showPackageDialog.value = true
}

const editPackage = (row: any) => {
  isEdit.value = true
  Object.assign(packageForm, row)
  showPackageDialog.value = true
}

const submitPackageForm = async () => {
  if (!packageFormRef.value) return
  await packageFormRef.value.validate(async (valid) => {
    if (valid) {
      const url = isEdit.value 
        ? `http://localhost:3000/api/packages/${packageForm.id}`
        : 'http://localhost:3000/api/packages/create'
      const method = isEdit.value ? 'PUT' : 'POST'
      
      // 如果是新增，自动生成套餐ID
      const submitData = isEdit.value 
        ? packageForm 
        : { ...packageForm, id: `PKG${String(packages.value.length + 1).padStart(3, '0')}` }
      
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        })
        const result = await res.json()
        if (result.success) {
          ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
          showPackageDialog.value = false
          loadPackages()
        } else {
          ElMessage.error(result.message)
        }
      } catch (error) {
        ElMessage.error('网络请求失败')
      }
    }
  })
}

const deletePackage = async (row: any) => {
  try {
    await ElMessageBox.confirm(`确定删除套餐 "${row.name}" 吗？`, '警告', { type: 'warning' })
    const res = await fetch(`http://localhost:3000/api/packages/${row.id}`, { method: 'DELETE' })
    const result = await res.json()
    if (result.success) {
      ElMessage.success('删除成功')
      loadPackages()
    }
  } catch (error) {}
}

const getEntertainmentType = (entertainment: string) => {
  const typeMap: Record<string, any> = {
    '桌游': '',
    'PS5': 'success',
    '拼豆': 'warning',
    '其他': 'info'
  }
  return typeMap[entertainment] || ''
}

const saveTheme = () => {
  ElMessage.success('主题设置已保存（演示功能）')
}

onMounted(() => {
  loadPackages()
})
</script>

<style scoped>
.settings-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.settings-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
}
:deep(.el-tabs__content) {
  flex: 1;
  overflow: auto;
}
.tab-content {
  padding: 20px 0;
}
.action-bar {
  margin-bottom: 20px;
}
.form-tip {
  margin-left: 10px;
  color: #909399;
  font-size: 12px;
}
.theme-content {
  max-width: 600px;
}
</style>
