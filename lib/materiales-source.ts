// Server-only — fuente única para materiales.
// Decide en runtime si leer desde el filesystem local (carpeta sincronizada por Dropbox desktop)
// o desde la API de Dropbox según la presencia de MATERIALES_LOCAL_PATH.

import type { DBFile, DBSection } from './dropbox'
import { getMateriales as getMaterialesDropbox, listFolder as listFolderDropbox, getTemporaryLink } from './dropbox'
import { getLocalRoot, getMaterialesLocal, listFolderLocal, resolveLocalPath } from './materiales-local'

export type MaterialesSource = 'local' | 'dropbox'

export function getSource(): MaterialesSource {
  return getLocalRoot() ? 'local' : 'dropbox'
}

export async function getMateriales(): Promise<{ rootFiles: DBFile[]; sections: DBSection[]; source: MaterialesSource }> {
  if (getSource() === 'local') {
    const data = await getMaterialesLocal()
    return { ...data, source: 'local' }
  }
  const data = await getMaterialesDropbox()
  return { ...data, source: 'dropbox' }
}

export async function listFolder(id: string): Promise<{ files: DBFile[]; subfolders: { id: string; name: string }[] }> {
  if (getSource() === 'local') return listFolderLocal(id)
  return listFolderDropbox(id)
}

// Devuelve una URL descargable para el id dado. En local apunta a nuestro endpoint
// que sirve el fichero por stream; en Dropbox usa el temporary link.
export async function getDownloadUrl(id: string): Promise<string | null> {
  if (getSource() === 'local') {
    const resolved = resolveLocalPath(id)
    if (!resolved) return null
    return `/api/materiales/file?id=${encodeURIComponent(id)}`
  }
  return getTemporaryLink(id)
}
