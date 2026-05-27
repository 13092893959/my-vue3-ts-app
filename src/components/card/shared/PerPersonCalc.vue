<template>
  <div>
    <el-form-item label="计算方式">
      <div style="display: flex; align-items: center">
        <el-switch :model-value="modelValue" @change="$emit('update:modelValue', $event)" />
        <span style="margin-left: 8px; font-size: 12px; color: #909399">
          {{ modelValue ? '按人均计算' : '按总金额计算' }}
        </span>
      </div>
    </el-form-item>
    <el-form-item v-if="modelValue" label="每人金额">
      <el-input-number
        :model-value="perPersonAmount"
        :min="0"
        :precision="2"
        :step="10"
        controls-position="right"
        style="width: 100%"
        @change="$emit('update:perPersonAmount', $event)"
      />
      <div style="margin-top: 4px; font-size: 12px; color: #909399">
        = ¥{{ (perPersonAmount || 0).toFixed(2) }} × {{ users }}人 = ¥{{ ((perPersonAmount || 0) * users).toFixed(2) }}
      </div>
    </el-form-item>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  modelValue?: boolean
  perPersonAmount?: number
  users?: number
}>(), {
  modelValue: false,
  perPersonAmount: 0,
  users: 1,
})

defineEmits<{
  'update:modelValue': [value: boolean]
  'update:perPersonAmount': [value: number]
}>()
</script>
