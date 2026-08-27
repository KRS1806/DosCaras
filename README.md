# DosCaras

Frontend web para **Las Dos Caras**: un espacio donde cada publicación presenta **dos perspectivas** (lado A y lado B), con fuentes, reacciones, comentarios y un tablero para explorar el debate.

Este repositorio es la aplicación de cliente. Se conecta a una API REST mediante `VITE_API_URL`.

---

## Tabla de contenidos

- [Qué hace](#qué-hace)
- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
- [Scripts](#scripts)
- [Variables de entorno](#variables-de-entorno)
- [Rutas](#rutas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Roles y permisos](#roles-y-permisos)

---

## Qué hace

En DosCaras una **vista** (publicación) no es un artículo de un solo lado. Incluye:

| Parte | Contenido |
| --- | --- |
| **Lado A / Lado B** | Título, descripción (mínimo 100 caracteres al publicar) y fuentes |
| **Fuentes** | Enlace, YouTube o documento |
| **Metadatos** | Categoría, hashtags, autor y fecha |
| **Participación** | Likes / dislikes por lado, favoritos, comentarios en hilos y compartir |

El tablero de inicio lista publicaciones con filtros, orden y paginación. El perfil reúne tus publicaciones, favoritos e historial de lectura.

---

## Funcionalidades

### Para visitantes

- Tablero con filtros por categoría, hashtags y orden (recientes o más likes de cada lado)
- Página de categoría y perfil público de autor
- Detalle de publicación, búsqueda y tema claro / oscuro (se guarda en el navegador)

### Para usuarios autenticados

- Registro, activación de cuenta por token e inicio de sesión
- Crear y editar publicaciones (borrador local mientras escribís)
- Reaccionar a cada lado, guardar favoritos y comentar
- Perfil con publicaciones propias, favoritos e historial

### Para superadmin

- Gestión de usuarios
- Gestión de categorías
- Moderación de publicaciones

Las rutas de administración redirigen a `/403` si el usuario no es superadmin.

---

## Stack

| Área | Tecnología |
| --- | --- |
| UI | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| Lenguaje | TypeScript |
| Build | [Vite](https://vite.dev/) |
| Estado | [Pinia](https://pinia.vuejs.org/) |
| Rutas | [Vue Router](https://router.vuejs.org/) |
| HTTP | [Axios](https://axios-http.com/) |

---

## Requisitos

- **Node.js** `^22.18.0` o `>=24.12.0`
- **npm** (u otro gestor compatible)
- API de DosCaras en ejecución (por defecto `http://localhost:3000/api`)

Editor recomendado: [VS Code](https://code.visualstudio.com/) con la extensión [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar).

---

## Inicio rápido

```sh
git clone <url-del-repositorio>
cd DosCaras
```

Copiá las variables de entorno:

```sh
copy .env.example .env
```

En macOS o Linux usá `cp .env.example .env`. Ajustá `VITE_API_URL` si tu API no corre en el puerto 3000.

Instalá dependencias y arrancá el servidor de desarrollo:

```sh
npm install
npm run dev
```

Vite mostrará la URL local (normalmente `http://localhost:5173`).

---

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Type-check + build de producción |
| `npm run build-only` | Build sin type-check |
| `npm run type-check` | Comprobación de tipos con `vue-tsc` |
| `npm run preview` | Vista previa del build de producción |

---

## Variables de entorno

Definidas en `.env` (ver `.env.example`):

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API | `http://localhost:3000/api` |

El cliente HTTP (`src/services/httpClient.ts`) usa esa base y envía `Authorization: Bearer <token>` cuando hay sesión.

---

## Rutas

| Ruta | Acceso | Vista |
| --- | --- | --- |
| `/` | Público | Tablero de publicaciones |
| `/login` | Solo invitados | Inicio de sesión |
| `/register` | Solo invitados | Registro |
| `/activate/:token` | Público | Activación de cuenta |
| `/categories/:id` | Público | Publicaciones de una categoría |
| `/views/:id` | Público | Detalle de publicación |
| `/views/new` | Autenticado | Nueva publicación |
| `/views/:id/edit` | Autenticado | Editar publicación |
| `/search` | Público | Resultados de búsqueda |
| `/authors/:id` | Público | Perfil de autor |
| `/profile` | Autenticado | Perfil propio |
| `/admin/users` | Superadmin | Usuarios |
| `/admin/categories` | Superadmin | Categorías |
| `/admin/moderation` | Superadmin | Moderación |
| `/403` | Público | Sin permisos |
| `/*` | Público | Página no encontrada |

Si una ruta exige sesión y no hay token, el router envía a `/login`. Si ya hay sesión, `/login` y `/register` redirigen al inicio.

---

## Estructura del proyecto

```text
DosCaras/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/             # Estilos globales
│   ├── components/         # Layout, tablero, formularios, notificaciones
│   ├── models/             # Tipos de dominio (Usuario, Publicacion, Lado, …)
│   ├── router/             # Rutas y guards
│   ├── services/           # Cliente HTTP y llamadas a la API
│   ├── stores/             # Pinia: auth, favoritos, notificaciones
│   ├── utils/              # Hashtags, YouTube, compartir, colores
│   ├── views/              # Páginas por ruta
│   ├── App.vue
│   └── main.ts
├── .env.example
├── index.html
├── package.json
└── vite.config.ts
```

Alias de importación: `@` apunta a `src/` (configurado en Vite).

---

## Arquitectura

```text
Vista (Vue)  →  Store (Pinia) / Service  →  httpClient (Axios)  →  API
                     ↑
              CacheService (localStorage)
```

- **Servicios** (`src/services/`): auth, vistas, categorías, hashtags, reacciones, hilos, historial, autores y panel de administración.
- **httpClient**: intercepta el token, reintenta GET ante fallos de red y traduce códigos HTTP (400, 401, 403, 404, 409, 422, 5xx) a errores tipados o notificaciones.
- **Sesión**: el token y el usuario se persisten en `localStorage` (`lasdoscaras_auth`) y se restauran al arrancar la app.
- **Caché local**: filtros del tablero, tema, borrador de publicación y favoritos.

---

## Roles y permisos

| Rol | Qué puede hacer |
| --- | --- |
| Invitado | Leer el tablero, el detalle y buscar |
| `user` | Todo lo anterior + publicar, reaccionar, favoritos y perfil |
| `superadmin` | Todo lo anterior + usuarios, categorías y moderación |

Una cuenta puede estar **activa** o **baneada**. El registro exige activación con el token que entrega la API.

---

## Licencia

Proyecto privado (`"private": true` en `package.json`).
