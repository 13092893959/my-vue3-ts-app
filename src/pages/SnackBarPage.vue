<template>
  <div class="snack-management-page">
    <div class="page-header">
      <h2>🍿 零食管理</h2>
      <el-button type="primary" @click="showAddDialog" size="large">
        <el-icon><Plus /></el-icon>
        新增零食
      </el-button>
    </div>

    <div class="content-card">
      <el-table :data="snacks" stripe style="width: 100%" v-loading="loading" border>
        <el-table-column prop="id" label="零食ID" width="120" align="center" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="category" label="分类" width="150" align="center">
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="150" align="right">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="150" align="center" />
        <el-table-column prop="stock" label="库存" width="150" align="center">
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.stock < 20 }">
              {{ row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180" align="center">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editSnack(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deleteSnack(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="snacks.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无零食数据" />
      </div>
    </div>

    <!-- 新增/编辑零食对话框 -->
    <el-dialog
      v-model="showFormDialog"
      :title="isEditMode ? '编辑零食' : '新增零食'"
      width="500px"
      append-to-body
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="零食ID" prop="id">
          <el-input
            v-model="formData.id"
            placeholder="例如: SNK009"
            :disabled="isEditMode"
          />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入零食名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="formData.category" placeholder="请选择分类" style="width: 100%">
            <el-option label="饮料" value="饮料" />
            <el-option label="零食" value="零食" />
            <el-option label="小吃" value="小吃" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :step="0.5"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="单位" prop="unit">
          <el-input v-model="formData.unit" placeholder="例如: 瓶、包、个" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number
            v-model="formData.stock"
            :min="0"
            :step="1"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFormDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSnack">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

interface Snack {
  id: string
  name: string
  category: string
  price: number
  unit: string
  stock: number
}

const snacks = ref<Snack[]>([])
const loading = ref(false)
const showFormDialog = ref(false)
const isEditMode = ref(false)
const formRef = ref<FormInstance>()

const formData = ref<Snack>({
  id: '',
  name: '',
  category: '饮料',
  price: 0,
  unit: '瓶',
  stock: 0
})

const rules: FormRules = {
  id: [
    { required: true, message: '请输入零食ID', trigger: 'blur' },
    { pattern: /^[A-Z0-9]+$/, message: 'ID只能包含大写字母和数字', trigger: 'blur' }
  ],
  name: [{ required: true, message: '请输入零食名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  price: [{ required: true, message: '请输入单价', trigger: 'blur' }],
  unit: [{ required: true, message: '请输入单位', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

// 加载零食数据
const loadSnacks = async () => {
  loading.value = true
  try {
    const response = await fetch('http://localhost:3000/api/snacks')
    const result = await response.json()
    
    if (result.success) {
      snacks.value = result.data
    } else {
      ElMessage.error(result.message || '加载零食数据失败')
    }
  } catch (error) {
    console.error('加载零食数据失败:', error)
    ElMessage.error('网络连接失败，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}

// 显示新增对话框
const showAddDialog = () => {
  isEditMode.value = false
  resetForm()
  showFormDialog.value = true
}

// 编辑零食
const editSnack = (snack: Snack) => {
  isEditMode.value = true
  formData.value = { ...snack }
  showFormDialog.value = true
}

// 保存零食
const saveSnack = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      if (isEditMode.value) {
        // 更新零食
        const response = await fetch(`http://localhost:3000/api/snacks/${formData.value.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.value)
        })
        
        const result = await response.json()
        if (result.success) {
          ElMessage.success('更新成功')
          await loadSnacks()
          showFormDialog.value = false
        } else {
          ElMessage.error(result.message || '更新失败')
        }
      } else {
        // 创建新零食
        const response = await fetch('http://localhost:3000/api/snacks/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData.value)
        })
        
        const result = await response.json()
        if (result.success) {
          ElMessage.success('添加成功')
          await loadSnacks()
          showFormDialog.value = false
        } else {
          ElMessage.error(result.message || '添加失败')
        }
      }
    } catch (error) {
      console.error('保存零食失败:', error)
      ElMessage.error('网络连接失败')
    }
  })
}

// 删除零食
const deleteSnack = async (snack: Snack) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除零食"${snack.name}"吗？`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const response = await fetch(`http://localhost:3000/api/snacks/${snack.id}`, {
      method: 'DELETE'
    })
    
    const result = await response.json()
    if (result.success) {
      ElMessage.success('删除成功')
      await loadSnacks()
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除零食失败:', error)
      ElMessage.error('网络连接失败')
    }
  }
}

// 重置表单
const resetForm = () => {
  formData.value = {
    id: '',
    name: '',
    category: '饮料',
    price: 0,
    unit: '瓶',
    stock: 0
  }
  formRef.value?.clearValidate()
}

// 获取分类标签类型
const getCategoryType = (category: string) => {
  const typeMap: Record<string, any> = {
    '饮料': '',
    '零食': 'success',
    '小吃': 'warning',
    '其他': 'info'
  }
  return typeMap[category] || ''
}

onMounted(() => {
  loadSnacks()
})
</script>

<style scoped>
.snack-management-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.content-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.empty-state {
  padding: 40px 0;
}

.low-stock {
  color: #f56c6c;
  font-weight: bold;
}
</style>
