<script setup lang="ts">
import LoginForm from '@/components/LoginForm.vue'
</script>

<template>
  <main class="auth-view">
    <LoginForm />
  </main>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}
</style>
