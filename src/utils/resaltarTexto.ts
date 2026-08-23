function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escaparRegExp(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function resaltarTexto(texto: string, termino?: string): string {
  const escapado = escaparHtml(texto)
  const limpio = termino?.trim()
  if (!limpio) {
    return escapado
  }
  const patron = new RegExp(escaparRegExp(limpio), 'ig')
  return escapado.replace(patron, (coincidencia) => `<mark>${coincidencia}</mark>`)
}
