<script setup lang="ts">
import { reactive, ref } from 'vue'
import axios from 'axios'
import { register } from '@/services/auth'

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const isSubmitting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const activationToken = ref('')

function validate(): string | null {
  if (!form.name || !form.email || !form.password) {
    return 'Completa todos los campos.'
  }
  if (!/^\S+@\S+\.\S+$/.test(form.email)) {
    return 'Ingresa un correo electrónico válido.'
  }
  if (form.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres. Intenta de nuevo.'
  }
  if (form.password !== form.confirmPassword) {
    return 'Las contraseñas no coinciden. Intenta de nuevo.'
  }
  return null
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  activationToken.value = ''

  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  isSubmitting.value = true
  try {
    const response = await register({
      name: form.name,
      email: form.email,
      password: form.password,
    })
    successMessage.value = '¡Cuenta creada con éxito! Activá tu cuenta para poder iniciar sesión.'
    activationToken.value = response.data.activationToken
    form.name = ''
    form.email = ''
    form.password = ''
    form.confirmPassword = ''
  } catch (error) {
    if (axios.isAxiosError(error)) {
      errorMessage.value = error.response?.data?.message ?? 'No se pudo completar el registro. Intenta de nuevo.'
    } else {
      errorMessage.value = 'No se pudo completar el registro. Intenta de nuevo.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="auth-card">
    <p class="auth-eyebrow">Bienvenido</p>
    <h2 class="auth-title">Crea tu cuenta</h2>
    <p class="auth-subtitle">Sumate a DosCaras en unos segundos.</p>

    <form novalidate @submit.prevent="handleSubmit">
      <div class="field">
        <label for="name">Nombre</label>
        <input id="name" v-model="form.name" type="text" autocomplete="name" required />
      </div>

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
          autocomplete="new-password"
          required
        />
      </div>

      <div class="field">
        <label for="confirmPassword">Confirmar contraseña</label>
        <input
          id="confirmPassword"
          v-model="form.confirmPassword"
          type="password"
          autocomplete="new-password"
          required
        />
      </div>

      <p v-if="errorMessage" class="message error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="message success">{{ successMessage }}</p>

      <button type="submit" class="submit-btn" :disabled="isSubmitting">
        {{ isSubmitting ? 'Creando cuenta…' : 'Crear cuenta en el sistema' }}
      </button>
    </form>

    <RouterLink v-if="activationToken" :to="`/activate/${activationToken}`" class="activate-link">
      Activar mi cuenta
    </RouterLink>

    <p class="switch-link">
      ¿Ya tienes cuenta?
      <RouterLink to="/login">Inicia sesión</RouterLink>
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

.message.success {
  color: #10b981;
}

.activate-link {
  display: block;
  margin-top: 1rem;
  padding: 0.65rem 1rem;
  border-radius: 10px;
  border: 1.5px solid #7c3aed;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #7c3aed;
  text-decoration: none;
  transition: background-color 0.15s;
}

.activate-link:hover {
  background-color: rgba(124, 58, 237, 0.08);
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
