<template>
  <button @click="onClick" :style="{ backgroundColor: color, color: 'white', width: width, padding: '10px', border: 'none', borderRadius: '5px', cursor: 'pointer' }">
    {{ text }}
  </button>
</template>

<script setup lang="ts">
interface Props {
  color: string;
  width: string;
  text: string;
  onClick: () => void;
}

defineProps<Props>();
</script>