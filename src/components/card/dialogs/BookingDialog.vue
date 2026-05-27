<template>
  <el-dialog
    :model-value="visible"
    title="预约桌台"
    width="500px"
    append-to-body
    @close="resetForm"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="桌台编号">
        <el-input :model-value="tableId" disabled />
      </el-form-item>
      <el-form-item label="预约人数" prop="bookingUsers">
        <el-input-number
          v-model="form.bookingUsers"
          :min="1"
          :max="capacity"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="预约时间" prop="bookingTime">
        <el-date-picker
          v-model="form.bookingTime"
          type="datetime"
          placeholder="选择预约时间"
          style="width: 100%"
          format="YYYY-MM-DD HH:mm"
        />
      </el-form-item>
      <el-form-item label="预留手机号" prop="phone">
        <el-input v-model="form.phone" placeholder="请输入预留手机号" maxlength="11" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认预约</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps<{
  visible: boolean
  tableId: string
  capacity: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [data: { tableCode: string; bookingUsers: number; bookingTime: Date | null; phone: string }]
}>()

const formRef = ref<FormInstance>()
const form = ref({
  tableCode: props.tableId,
  bookingUsers: 1,
  bookingTime: null as Date | null,
  phone: '',
})

const rules: FormRules = {
  bookingUsers: [{ required: true, message: '请输入预约人数', trigger: 'blur' }],
  bookingTime: [{ required: true, message: '请选择预约时间', trigger: 'change' }],
  phone: [
    { required: true, message: '请输入预留手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

const resetForm = () => {
  formRef.value?.clearValidate()
  form.value = { tableCode: props.tableId, bookingUsers: 1, bookingTime: null, phone: '' }
}

const handleConfirm = async () => {
  if (!formRef.value) return
  await formRef.value.validate((valid) => {
    if (valid) {
      emit('confirm', { ...form.value })
    }
  })
}
</script>
