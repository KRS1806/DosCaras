<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { activate } from '@/services/auth'
import { extraerMensajeError } from '@/services/httpClient'

const route = useRoute()

const status = ref<'loading' | 'success' | 'error'>('loading')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.params.token as string

  try {
    await activate(token)
    status.value = 'success'
  } catch (error) {
    status.value = 'error'
    errorMessage.value = extraerMensajeError(error, 'No se pudo activar la cuenta.')
  }
})
</script>

<template>
  <main class="auth-view">
    <div class="auth-card">
      <p class="auth-eyebrow">Activación de cuenta</p>

      <template v-if="status === 'loading'">
        <h2 class="auth-title">Activando tu cuenta…</h2>
        <p class="auth-subtitle">Un momento por favor.</p>
      </template>

      <template v-else-if="status === 'success'">
        <h2 class="auth-title">¡Cuenta activada!</h2>
        <p class="auth-subtitle">Ya podés iniciar sesión con tu correo y contraseña.</p>
        <RouterLink to="/login" class="submit-link">Ir a iniciar sesión</RouterLink>
      </template>

      <template v-else>
        <h2 class="auth-title">No se pudo activar la cuenta</h2>
        <p class="message error">{{ errorMessage }}</p>
        <RouterLink to="/register" class="submit-link">Volver a registro</RouterLink>
      </template>
    </div>
  </main>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2.25rem 2rem;
  border-radius: 18px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 45px -25px rgba(91, 33, 182, 0.45);
  text-align: center;
}

.auth-eyebrow {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #7c3aed;
}

.auth-title {
  margin: 0 0 0.35rem;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-heading);
}

.auth-subtitle {
  margin: 0 0 1.5rem;
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.75;
}

.message.error {
  margin: 0 0 1.5rem;
  font-size: 0.85rem;
  color: #ef4444;
}

.submit-link {
  display: inline-block;
  padding: 0.65rem 1.25rem;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
