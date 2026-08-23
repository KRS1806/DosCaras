<script setup lang="ts">
import { useNotifications } from '@/stores/notifications'

const notificaciones = useNotifications()
</script>

<template>
  <div class="notification-center">
    <div
      v-for="item in notificaciones.items"
      :key="item.id"
      :class="['notification', `notification--${item.tipo}`]"
      :role="item.tipo === 'error' || item.tipo === 'warning' ? 'alert' : 'status'"
    >
      <span>{{ item.mensaje }}</span>
      <button
        type="button"
        class="notification__close"
        aria-label="Cerrar notificación"
        @click="notificaciones.descartar(item.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<style scoped>
.notification-center {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: min(360px, calc(100vw - 2rem));
}

.notification {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: white;
  box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.35);
}

.notification--success {
  background-color: #16a34a;
}

.notification--error {
  background-color: #dc2626;
}

.notification--warning {
  background-color: #d97706;
}

.notification--info {
  background-color: #2563eb;
}

.notification__close {
  background: transparent;
  border: none;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}
</style>
