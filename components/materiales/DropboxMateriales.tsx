'use client'

import { useState, useMemo, useCallback } from 'react'
import Image from 'next/image'
import {
  type LucideIcon,
  FileText, FileSpreadsheet, Presentation, Film, File,
  Download, Loader2, FolderOpen, Search, ChevronRight,
  ChevronLeft, Folder, Home
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getBrandLogo } from '@/lib/brand-logos'
import type { DBFile, DBSection } from '@/lib/dropbox'

const DROPBOX_ZIP = 'https://www.dropbox.com/scl/fo/rmx4pz7nubvqdof1mhbri/AFa5wvHv4AABAWr-NXgOjMo?rlkey=goek0ng74bdrm6dg7hsxknyw8&dl=1'
const DROPBOX_FOLDER = 'https://www.dropbox.com/scl/fo/rmx4pz7nubvqdof1mhbri/AFa5wvHv4AABAWr-NXgOjMo?rlkey=goek0ng74bdrm6dg7hsxknyw8&dl=0'

// Slugifica el nombre de la marca para resolver el logo en /public/logos/marcas/{slug}.svg
function brandSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getExt(name: string) {
  return name.split('.').pop()?.toUpperCase() ?? ''
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const extConfig: Record<string, { color: string; bg: string; Icon: LucideIcon }> = {
  PDF:  { color: 'text-red-400',    bg: 'border-red-500/20 bg-red-500/10',     Icon: FileText },
  XLSX: { color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/10', Icon: FileSpreadsheet },
  DOCX: { color: 'text-blue-400',   bg: 'border-blue-500/20 bg-blue-500/10',   Icon: FileText },
  PPTX: { color: 'text-orange-400', bg: 'border-orange-500/20 bg-orange-500/10', Icon: Presentation },
  MP4:  { color: 'text-purple-400', bg: 'border-purple-500/20 bg-purple-500/10', Icon: Film },
}

function getExtConfig(name: string): { color: string; bg: string; Icon: LucideIcon } {
  const ext = getExt(name)
  return extConfig[ext] ?? { color: 'text-muted-foreground', bg: 'border-border bg-muted/30', Icon: File }
}

// ── Breadcrumb entry ─────────────────────────────────────────────────────────

interface BreadcrumbEntry {
  id: string
  name: string
  files: DBFile[]
  subfolders: { id: string; name: string }[]
}

// ── File row (unchanged) ─────────────────────────────────────────────────────

function FileRow({ file }: { file: DBFile }) {
  const [loading, setLoading] = useState(false)
  const cfg = getExtConfig(file.name)
  const Icon = cfg.Icon

  async function handleDownload() {
    setLoading(true)
    try {
      const res = await fetch(`/api/dropbox-link?id=${encodeURIComponent(file.id)}`)
      const data = await res.json()
      if (data.link) {
        const a = document.createElement('a')
        a.href = data.link
        a.download = file.name
        a.click()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card/50 p-3 hover:border-border/80 hover:bg-card transition-colors group">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', cfg.bg)}>
        <Icon className={cn('h-4 w-4', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border', cfg.bg, cfg.color)}>
            {getExt(file.name)}
          </span>
          <span className="text-[10px] text-muted-foreground">{formatSize(file.size)}</span>
        </div>
      </div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {loading ? 'Generando...' : 'Descargar'}
      </button>
    </div>
  )
}

// ── Subfolder card ───────────────────────────────────────────────────────────

function SubfolderCard({ name, onClick }: { name: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-border bg-card/80 px-4 py-3 text-left hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group"
    >
      <Folder className="h-5 w-5 text-amber-400 shrink-0" />
      <span className="text-sm font-medium text-foreground truncate group-hover:text-amber-300 transition-colors">{name}</span>
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-auto shrink-0" />
    </button>
  )
}

// ── Loading skeleton ─────────────────────────────────────────────────────────

function FolderSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 rounded-xl border border-border bg-card/50" />
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 rounded-lg border border-border bg-card/50" />
        ))}
      </div>
    </div>
  )
}

// ── Brand card (home view) ───────────────────────────────────────────────────

function BrandCard({
  section,
  onSelect,
}: {
  section: DBSection
  onSelect: () => void
}) {
  const [logoFailed, setLogoFailed] = useState(false)
  const slug = brandSlug(section.name)
  const logoSrc = getBrandLogo(slug) ?? `/logos/marcas/${slug}.svg`

  return (
    <button
      onClick={onSelect}
      aria-label={section.name}
      title={section.name}
      className="group flex h-32 items-center justify-center rounded-2xl border border-border bg-card/60 p-6 hover:border-primary/40 hover:bg-card hover:shadow-lg hover:shadow-primary/5 transition-all"
    >
      {logoFailed ? (
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
          <span className="text-2xl font-black text-primary">
            {section.name.slice(0, 2).toUpperCase()}
          </span>
        </div>
      ) : (
        <Image
          src={logoSrc}
          alt={section.name}
          width={200}
          height={100}
          className="max-h-20 w-auto object-contain transition-transform group-hover:scale-105"
          onError={() => setLogoFailed(true)}
          unoptimized
        />
      )}
    </button>
  )
}

// ── Breadcrumb component ─────────────────────────────────────────────────────

function Breadcrumb({
  entries,
  onNavigate,
}: {
  entries: BreadcrumbEntry[]
  onNavigate: (index: number) => void
}) {
  return (
    <div className="flex items-center gap-1 text-sm flex-wrap">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50"
      >
        <Home className="h-3.5 w-3.5" />
        <span>Materiales</span>
      </button>
      {entries.map((entry, i) => (
        <span key={entry.id} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
          {i === entries.length - 1 ? (
            <span className="font-semibold text-foreground px-1.5 py-0.5">{entry.name}</span>
          ) : (
            <button
              onClick={() => onNavigate(i)}
              className="text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50"
            >
              {entry.name}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface DropboxMaterialesProps {
  rootFiles: DBFile[]
  sections: DBSection[]
  source?: 'local' | 'dropbox'
}

export function DropboxMateriales({ rootFiles, sections, source = 'dropbox' }: DropboxMaterialesProps) {
  const [search, setSearch] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbEntry[]>([])
  const [navigating, setNavigating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHome = breadcrumb.length === 0
  const currentLevel = breadcrumb[breadcrumb.length - 1] ?? null

  // Files visible at current level (for search + stats)
  const currentFiles = useMemo(() => {
    if (isHome) return [...rootFiles, ...sections.flatMap(s => s.files)]
    return currentLevel.files
  }, [isHome, rootFiles, sections, currentLevel])

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    return currentFiles.filter(f => f.name.toLowerCase().includes(q))
  }, [currentFiles, search])

  const totalFiles = currentFiles.length
  const totalSize = currentFiles.reduce((s, f) => s + f.size, 0)

  // ── Navigation functions ─────────────────────────────────────────────────

  const enterSection = useCallback((section: DBSection) => {
    setSearch('')
    setError(null)
    setBreadcrumb([{
      id: section.id,
      name: section.name,
      files: section.files,
      subfolders: section.subfolders,
    }])
  }, [])

  const navigateToFolder = useCallback(async (id: string, name: string) => {
    setNavigating(true)
    setError(null)
    setSearch('')
    try {
      const res = await fetch(`/api/dropbox-folder?id=${encodeURIComponent(id)}`)
      if (!res.ok) throw new Error('Error al cargar carpeta')
      const data: { files: DBFile[]; subfolders: { id: string; name: string }[] } = await res.json()
      setBreadcrumb(prev => [...prev, { id, name, files: data.files, subfolders: data.subfolders }])
    } catch {
      setError('No se pudo cargar la carpeta. Inténtalo de nuevo.')
    } finally {
      setNavigating(false)
    }
  }, [])

  const navigateToBreadcrumb = useCallback((index: number) => {
    setSearch('')
    setError(null)
    if (index < 0) {
      setBreadcrumb([])
    } else {
      setBreadcrumb(prev => prev.slice(0, index + 1))
    }
  }, [])

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Stats + CTAs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-4 text-sm">
          <div>
            <span className="font-bold text-foreground">{totalFiles}</span>
            <span className="text-muted-foreground ml-1">archivos</span>
          </div>
          <div>
            <span className="font-bold text-foreground">{formatSize(totalSize)}</span>
            <span className="text-muted-foreground ml-1">en total</span>
          </div>
        </div>
        {source === 'dropbox' && (
          <div className="flex gap-2">
            <a
              href={DROPBOX_FOLDER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary/30 hover:text-foreground transition-all"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Ver en Dropbox
            </a>
            <a
              href={DROPBOX_ZIP}
              className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/20 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar todo (ZIP)
            </a>
          </div>
        )}
      </div>

      {/* Breadcrumb */}
      {!isHome && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateToBreadcrumb(breadcrumb.length - 2)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md border border-border bg-card/50 px-2 py-1 hover:bg-card"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Atrás
          </button>
          <Breadcrumb entries={breadcrumb} onNavigate={navigateToBreadcrumb} />
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder={isHome ? 'Buscar archivo...' : `Buscar en ${currentLevel.name}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {navigating && <FolderSkeleton />}

      {/* Content */}
      {!navigating && (
        <>
          {/* Search results */}
          {searchResults !== null ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}</p>
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No se encontraron archivos</p>
              ) : (
                searchResults.map(f => <FileRow key={f.id} file={f} />)
              )}
            </div>
          ) : isHome ? (
            /* ── Home view: brand cards grid ───────────────────────────── */
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sections.map(section => (
                  <BrandCard
                    key={section.id}
                    section={section}
                    onSelect={() => enterSection(section)}
                  />
                ))}
              </div>
              {rootFiles.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center gap-2 bg-card/80 px-4 py-3">
                    <FolderOpen className="h-4 w-4 text-primary/70" />
                    <span className="text-sm font-semibold text-foreground">GENERAL</span>
                  </div>
                  <div className="border-t border-border p-3 space-y-2 bg-background/30">
                    {rootFiles.map(f => <FileRow key={f.id} file={f} />)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Folder view: subfolders + files ───────────────────────── */
            <div className="space-y-3">
              {/* Subfolders grid */}
              {currentLevel.subfolders.length > 0 && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {currentLevel.subfolders.map(sf => (
                      <SubfolderCard
                        key={sf.id}
                        name={sf.name}
                        onClick={() => navigateToFolder(sf.id, sf.name)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Files list */}
              {currentLevel.files.length > 0 && (
                <div className="space-y-2">
                  {currentLevel.files.map(f => <FileRow key={f.id} file={f} />)}
                </div>
              )}

              {/* Empty state */}
              {currentLevel.files.length === 0 && currentLevel.subfolders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FolderOpen className="h-10 w-10 mb-3 opacity-40" />
                  <p className="text-sm">Esta carpeta está vacía</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
