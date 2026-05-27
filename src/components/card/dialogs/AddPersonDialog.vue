<template>
  <el-dialog
    :model-value="visible"
    title="拼桌"
    width="500px"
    append-to-body
    @close="resetForm"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="拼桌人数">
        <el-input-number
          v-model="form.users"
          :min="1"
          :max="maxAddUsers"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="开始时间">
        <el-time-picker
          v-model="form.startTime"
          placeholder="默认为当前时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认拼桌</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  maxAddUsers: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [data: { users: number; startTimestamp: number }]
}>()

const form = ref({
  users: 1,
  startTime: null as string | null,
})

const resetForm = () => {
  form.value = { users: 1, startTime: null }
}

watch(() => props.visible, (v) => {
  if (v) resetForm()
})

const handleConfirm = () => {
  if (form.value.users <= 0) {
    ElMessage.warning('请输入拼桌人数')
    return
  }
  let startTimestamp: number
  if (form.value.startTime) {
    const now = new Date()
    const [h, m, s] = form.value.startTime.split(':').map(Number)
    now.setHours(h, m, s, 0)
    startTimestamp = now.getTime()
  } else {
    startTimestamp = Date.now()
  }
  emit('confirm', { users: form.value.users, startTimestamp })
}
</script>
