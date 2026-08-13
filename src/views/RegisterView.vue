<script setup lang="ts">
import RegisterForm from '@/components/RegisterForm.vue'
</script>

<template>
  <main class="auth-view">
    <RegisterForm />
  </main>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}
</style>
