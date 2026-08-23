<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/auth'
import { extraerMensajeError } from '@/services/httpClient'

const router = useRouter()

const form = reactive({
  email: '',
  password: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')

function validate(): string | null {
  if (!form.email || !form.password) {
    return 'Completa todos los campos.'
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return 'Ingresa un correo electrónico válido.'
  }
  return null
}

async function handleSubmit() {
  errorMessage.value = ''

  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    await login({
      email: form.email,
      password: form.password,
    })
    router.push('/')
  } catch (error) {
    errorMessage.value = extraerMensajeError(error, 'No se pudo iniciar sesión. Intenta de nuevo.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <p class="auth-eyebrow">De nuevo por acá</p>
    <h2 class="auth-title">Inicia sesión</h2>
    <p class="auth-subtitle">Ingresa con tu cuenta de DosCaras.</p>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label for="email">Correo electrónico</label>
        <input id="email" v-model="form.email" type="email" autocomplete="email" required />
      </div>

      <div class="field">
        <label for="password">Contraseña</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          autocomplete="current-password"
          required
        />
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? 'Ingresando…' : 'Ingresar al sistema' }}
      </button>
    </form>

    <p class="switch-link">
      ¿No tienes cuenta?
      <RouterLink to="/register">Regístrate</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 2.25rem 2rem;
  border-radius: 18px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  box-shadow: 0 20px 45px -25px rgba(91, 33, 182, 0.45);
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
  margin: 0 0 1.75rem;
  font-size: 0.9rem;
  color: var(--color-text);
  opacity: 0.75;
}

form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-heading);
}

input {
  padding: 0.65rem 0.85rem;
  border: 1.5px solid var(--color-border);
  border-radius: 10px;
  background-color: var(--color-background);
  color: var(--color-text);
  font-size: 0.95rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

input:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.18);
}

.submit-btn {
  margin-top: 0.35rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.15s,
    opacity 0.15s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
}

.message.error {
  color: #ef4444;
}

.switch-link {
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.85;
}

.switch-link a {
  color: #7c3aed;
  font-weight: 600;
  text-decoration: none;
}

.switch-link a:hover {
  text-decoration: underline;
}
</style>
