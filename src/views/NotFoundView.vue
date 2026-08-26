<script setup lang="ts"></script>

<template>
  <div class="pagina-error">
    <p class="pagina-error__codigo">404</p>
    <h1>Página no encontrada</h1>
    <p class="pagina-error__mensaje">La página que buscas no existe o fue movida a otra dirección.</p>
    <RouterLink to="/" class="pagina-error__boton">Volver al tablero principal</RouterLink>
  </div>
</template>

<style scoped>
.pagina-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 4rem 1rem;
  text-align: center;
}

.pagina-error__codigo {
  margin: 0;
  font-size: 3.5rem;
  font-weight: 800;
  color: #7c3aed;
}

h1 {
  margin: 0;
  font-size: 1.4rem;
  color: var(--color-heading);
}

.pagina-error__mensaje {
  margin: 0 0 1rem;
  color: var(--color-text);
  opacity: 0.85;
}

.pagina-error__boton {
  padding: 0.6rem 1.2rem;
  border-radius: 8px;
  color: white;
  background: linear-gradient(135deg, #7c3aed, #6366f1);
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
}
</style>
