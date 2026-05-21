// Server-only — never import from client components
// Lee materiales desde una carpeta local (típicamente sincronizada por Dropbox desktop).

import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { DBFile, DBSection } from './dropbox'

const IGNORED_NAMES = new Set([
  'desktop.ini',
  '.DS_Store',
  'Thumbs.db',
  '.dropbox',
  '.dropbox.attr',
  '.dropbox.cache',
])

function isHidden(name: string): boolean {
  return name.startsWith('.') || IGNORED_NAMES.has(name)
}

// Traduce rutas Windows a WSL cuando aplica. Permite escribir `C:\DROPBOX\...` en .env.local
// y que funcione tanto en Node Windows como en Node corriendo dentro de WSL.
function normalizeRoot(raw: string): string {
  const trimmed = raw.trim().replace(/^"|"$/g, '')
  // Detecta unidad Windows tipo `C:\foo` o `C:/foo`
  const winMatch = trimmed.match(/^([a-zA-Z]):[\\/](.*)$/)
  if (winMatch && process.platform === 'linux') {
    const drive = winMatch[1].toLowerCase()
    const rest = winMatch[2].replace(/\\/g, '/')
    return `/mnt/${drive}/${rest}`
  }
  return trimmed
}

export function getLocalRoot(): string | null {
  const raw = process.env.MATERIALES_LOCAL_PATH
  if (!raw) return null
  return normalizeRoot(raw)
}

// Resuelve un id (path relativo URL-encoded) a path absoluto bajo el root.
// Devuelve null si hay intento de escape (path traversal).
export function resolveLocalPath(relativeId: string): string | null {
  const root = getLocalRoot()
  if (!root) return null

  const decoded = decodeURIComponent(relativeId)
  // Si llega un path absoluto o intenta subir directorios → rechazar
  if (path.isAbsolute(decoded)) return null

  const resolved = path.resolve(root, decoded)
  const normalizedRoot = path.resolve(root)
  if (resolved !== normalizedRoot && !resolved.startsWith(normalizedRoot + path.sep)) {
    return null
  }
  return resolved
}

async function readDir(absPath: string, relPath: string): Promise<{ files: DBFile[]; subfolders: { id: string; name: string }[] }> {
  let entries
  try {
    entries = await fs.readdir(absPath, { withFileTypes: true })
  } catch (err) {
    console.error('[materiales-local] readdir error:', absPath, err)
    return { files: [], subfolders: [] }
  }

  const files: DBFile[] = []
  const subfolders: { id: string; name: string }[] = []

  for (const entry of entries) {
    if (isHidden(entry.name)) continue
    const childRel = relPath ? `${relPath}/${entry.name}` : entry.name
    const id = encodeURI(childRel)

    if (entry.isDirectory()) {
      subfolders.push({ id, name: entry.name })
    } else if (entry.isFile()) {
      let size = 0
      try {
        const stat = await fs.stat(path.join(absPath, entry.name))
        size = stat.size
      } catch {
        // ignore
      }
      files.push({ id, name: entry.name, size, path: `/${childRel}` })
    }
  }

  // Orden alfabético, case-insensitive, locale-aware
  const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })
  files.sort((a, b) => collator.compare(a.name, b.name))
  subfolders.sort((a, b) => collator.compare(a.name, b.name))

  return { files, subfolders }
}

export async function listFolderLocal(id: string): Promise<{ files: DBFile[]; subfolders: { id: string; name: string }[] }> {
  const root = getLocalRoot()
  if (!root) return { files: [], subfolders: [] }

  const absPath = id ? resolveLocalPath(id) : root
  if (!absPath) return { files: [], subfolders: [] }

  const relPath = id ? decodeURIComponent(id) : ''
  return readDir(absPath, relPath)
}

export async function getMaterialesLocal(): Promise<{ rootFiles: DBFile[]; sections: DBSection[] }> {
  const root = getLocalRoot()
  if (!root) return { rootFiles: [], sections: [] }

  const rootData = await readDir(root, '')

  const sectionData = await Promise.all(
    rootData.subfolders.map(f => readDir(path.join(root, f.name), f.name))
  )

  const sections: DBSection[] = rootData.subfolders.map((folder, i) => ({
    id: folder.id,
    name: folder.name,
    files: sectionData[i].files,
    subfolders: sectionData[i].subfolders,
  }))

  return { rootFiles: rootData.files, sections }
}
