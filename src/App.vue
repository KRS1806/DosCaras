<script setup lang="ts"></script>

<template>
  <nav class="main-nav">
    <RouterLink to="/" class="brand">DosCaras</RouterLink>
    <div class="nav-links">
      <RouterLink to="/">Inicio</RouterLink>
      <RouterLink to="/register">Registro</RouterLink>
      <RouterLink to="/login">Iniciar sesión</RouterLink>
    </div>
  </nav>

  <RouterView />
</template>

<style scoped>
.main-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.brand {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--color-heading);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 1.25rem;
}

.nav-links a {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  text-decoration: none;
  opacity: 0.75;
  transition: opacity 0.15s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  opacity: 1;
  color: #7c3aed;
}
</style>
