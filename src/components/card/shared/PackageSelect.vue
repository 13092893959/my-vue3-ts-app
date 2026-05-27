<template>
  <el-select
    :model-value="modelValue"
    multiple
    :placeholder="placeholder"
    style="width: 100%"
    @change="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  >
    <el-option
      v-for="pkg in packages"
      :key="pkg.id"
      :label="`${pkg.name} - ¥${pkg.price}`"
      :value="pkg.id"
    >
      <div style="display: flex; align-items: center; justify-content: space-between">
        <span>{{ pkg.name }}</span>
        <span style="color: #8492a6; font-size: 13px">¥{{ pkg.price }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
interface Package {
  id: string | number
  name: string
  price: number
  entertainment?: string
}

withDefaults(defineProps<{
  modelValue?: string[]
  packages: Package[]
  placeholder?: string
}>(), {
  modelValue: () => [],
  placeholder: '请选择团购套餐（可多选）',
})

defineEmits<{
  'update:modelValue': [value: string[]]
  change: [value: string[]]
}>()
</script>
