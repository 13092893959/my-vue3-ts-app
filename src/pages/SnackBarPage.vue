<template>
  <div class="snack-management-page">
    <div class="page-header">
      <h2></h2>
      <el-button type="primary" @click="showAddDialog" size="large">
        <el-icon><Plus /></el-icon>
        新增零食
      </el-button>
    </div>

    <div class="content-card">
      <el-table
        :data="snacks"
        stripe
        style="width: 100%"
        v-loading="loading"
        border
      >
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column
          prop="category"
          label="分类"
          width="150"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="getCategoryType(row.category)">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="150" align="right">
          <template #default="{ row }"> ¥{{ row.price.toFixed(2) }} </template>
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

      <!-- <div v-if="snacks.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无零食数据" />
      </div> -->
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
        <el-form-item label="零食ID">
          <el-input v-if="isEditMode" v-model="formData.id" disabled />
          <el-input v-else value="自动生成" disabled />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入零食名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="formData.category"
            placeholder="请选择分类"
            style="width: 100%"
          >
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
        <span class="dialog-footer">
          <el-button @click="showFormDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSnack">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue"
import { ElMessage } from "element-plus"

const snacks = ref([])
const loading = ref(false)
const showFormDialog = ref(false)
const isEditMode = ref(false)
const formRef = ref(null)

const formData = reactive({
  id: "",
  name: "",
  category: "",
  price: 0,
  unit: "",
  stock: 0,
})

const rules = {
  name: [{ required: true, message: "请输入零食名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择分类", trigger: "change" }],
  price: [{ required: true, message: "请输入单价", trigger: "blur" }],
  unit: [{ required: true, message: "请输入单位", trigger: "blur" }],
  stock: [{ required: true, message: "请输入库存", trigger: "blur" }],
}

const loadSnacks = async () => {
  loading.value = true
  try {
    const response = await fetch("http://localhost:3000/api/snacks")
    const result = await response.json()
    snacks.value = result.data
  } catch (error) {
    console.error("加载零食数据失败:", error)
    ElMessage.error("网络连接失败")
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEditMode.value = false
  // 重置表单数据
  formData.id = ""
  formData.name = ""
  formData.category = ""
  formData.price = 0
  formData.unit = ""
  formData.stock = 0
  showFormDialog.value = true
}

const editSnack = (row) => {
  isEditMode.value = true
  Object.assign(formData, row)
  showFormDialog.value = true
}

const deleteSnack = async (row) => {
  try {
    const response = await fetch(`http://localhost:3000/api/snacks/${row.id}`, {
      method: "DELETE",
    })
    const result = await response.json()
    if (result.success) {
      ElMessage.success("删除成功")
      await loadSnacks()
    } else {
      ElMessage.error(result.message || "删除失败")
    }
  } catch (error) {
    console.error("删除零食失败:", error)
    ElMessage.error("网络连接失败")
  }
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  // 重置表单数据
  if (!isEditMode.value) {
    formData.id = ""
    formData.name = ""
    formData.category = ""
    formData.price = 0
    formData.unit = ""
    formData.stock = 0
  }
}

const getCategoryType = (category) => {
  switch (category) {
    case "饮料":
      return "success"
    case "零食":
      return "warning"
    case "小吃":
      return "info"
    case "其他":
      return "danger"
    default:
      return ""
  }
}

// 保存零食（新增/编辑）
const saveSnack = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      console.log("准备保存零食数据:", formData)

      if (isEditMode.value) {
        // 更新零食
        const response = await fetch(
          `http://localhost:3000/api/snacks/${formData.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
          },
        )

        const result = await response.json()
        console.log("更新结果:", result)
        if (result.success) {
          ElMessage.success("更新成功")
          await loadSnacks()
          showFormDialog.value = false
        } else {
          ElMessage.error(result.message || "更新失败")
        }
      } else {
        // 创建新零食 - 自动生成ID
        const newId = `SNK${String(snacks.value.length + 1).padStart(3, "0")}`
        const snackData = { ...formData, id: newId }

        console.log("发送的零食数据:", snackData)

        const response = await fetch(
          "http://localhost:3000/api/snacks/create",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(snackData),
          },
        )

        const result = await response.json()
        console.log("创建结果:", result)
        if (result.success) {
          ElMessage.success("添加成功")
          await loadSnacks()
          showFormDialog.value = false
        } else {
          ElMessage.error(result.message || "添加失败")
        }
      }
    } catch (error) {
      console.error("保存零食失败:", error)
      ElMessage.error("网络连接失败")
    }
  })
}

loadSnacks()
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

.content-card {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

.low-stock {
  color: red;
}

.dialog-footer {
  text-align: right;
}
</style>
