<template>
  <el-dialog
    :model-value="visible"
    title="开始计时"
    width="500px"
    append-to-body
    @close="resetForm"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form :model="form" label-width="100px">
      <el-form-item label="娱乐类型">
        <el-select v-model="form.entertainment" placeholder="请选择娱乐类型" style="width: 100%">
          <el-option
            v-for="item in entertainments"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="人数">
        <el-input-number
          v-model="form.currentUsers"
          :min="1"
          :max="capacity"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
      <el-form-item label="开始时间">
        <el-time-picker
          v-model="form.startTime"
          placeholder="选择开始时间"
          format="HH:mm:ss"
          value-format="HH:mm:ss"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认开始</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  visible: boolean
  entertainments: string[]
  capacity: number
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  confirm: [data: { entertainment: string; currentUsers: number; startTimestamp: number }]
}>()

const form = ref({
  entertainment: '',
  currentUsers: 1,
  startTime: '',
})

const resetForm = () => {
  form.value = { entertainment: '', currentUsers: 1, startTime: '' }
}

watch(() => props.visible, (v) => {
  if (v) resetForm()
})

const handleConfirm = () => {
  if (!form.value.entertainment) {
    ElMessage.warning('请选择娱乐类型')
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
  emit('confirm', {
    entertainment: form.value.entertainment,
    currentUsers: form.value.currentUsers,
    startTimestamp,
  })
}
</script>
