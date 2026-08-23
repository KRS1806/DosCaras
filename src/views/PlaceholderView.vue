<script setup lang="ts">
defineProps<{
  titulo: string
}>()
</script>

<template>
  <div>Pendiente: {{ titulo }}</div>
</template>
