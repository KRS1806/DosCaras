export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: 'user' | 'superadmin'
  estado: 'activo' | 'baneado'
  fechaRegistro: string
}

export interface Fuente {
  id: string
  tipo: 'enlace' | 'youtube' | 'documento'
  url: string
  titulo: string
}

export interface Lado {
  titulo: string
  descripcion: string
  likes: number
  dislikes: number
  fuentes: Fuente[]
}

export interface Publicacion {
  id: string
  titulo: string
  descripcion: string
  autor: {
    id: string
    nombre: string
  }
  ladoA: Lado
  ladoB: Lado
  categoria: Categoria
  hashtags: string[]
  publicado: boolean
  fechaCreacion: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
}

export interface Hashtag {
  id: string
  nombre: string
}

export interface Favorito {
  id: string
  usuarioId: string
  publicacionId: string
  fechaGuardado: string
}

export interface Comentario {
  id: string
  texto: string
  autor: {
    id: string
    nombre: string
  }
  vistaId: string
  hiloId: string
  fechaCreacion: string
  moderado: boolean
}

export interface HiloComentarios {
  id: string
  tema: string
  vistaId: string
  comentarios: Comentario[]
}
