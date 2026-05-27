<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    filterable
    clearable
    :filter-method="onFilter"
    style="width: 100%"
    @change="$emit('update:modelValue', $event)"
    @change="$emit('change', $event)"
  >
    <el-option
      v-for="member in filteredMembers"
      :key="member.id"
      :label="`${member.name || '(无名)'} ${member.phone ? '(' + member.phone + ')' : ''}`"
      :value="member.id"
    >
      <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center; gap: 8px">
          <span>{{ member.name }}</span>
          <el-tag v-if="member.isMember === true" type="success" size="small">⭐ 会员</el-tag>
        </div>
        <span style="color: #8492a6; font-size: 13px">
          {{ member.cardType === '充值卡' ? `余额: ¥${(member.balance || 0).toFixed(2)}` : `剩余: ${member.remainingTimes}次` }}
        </span>
      </div>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Member {
  id: number
  name: string
  phone: string
  isMember?: boolean
  cardType?: string
  balance?: number
  remainingTimes?: number
}

const props = withDefaults(defineProps<{
  modelValue?: number | null
  members: Member[]
  placeholder?: string
}>(), {
  modelValue: null,
  placeholder: '请选择会员',
})

defineEmits<{
  'update:modelValue': [value: number | null]
  change: [value: number | null]
}>()

const keyword = ref('')

const filteredMembers = computed(() => {
  if (!keyword.value) return props.members
  const kw = keyword.value.toLowerCase()
  return props.members.filter(
    (m) => m.name?.toLowerCase().includes(kw) || m.phone?.includes(kw)
  )
})

const onFilter = (query: string) => {
  keyword.value = query
}
</script>
