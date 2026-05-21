import { NextRequest, NextResponse } from 'next/server'
import { createReadStream } from 'node:fs'
import { promises as fs } from 'node:fs'
import { Readable } from 'node:stream'
import path from 'node:path'
import { resolveLocalPath } from '@/lib/materiales-local'

const MIME_TYPES: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.xls': 'application/vnd.ms-excel',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
  '.txt': 'text/plain; charset=utf-8',
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const absPath = resolveLocalPath(id)
  if (!absPath) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })

  let stat
  try {
    stat = await fs.stat(absPath)
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!stat.isFile()) return NextResponse.json({ error: 'Not a file' }, { status: 400 })

  const ext = path.extname(absPath).toLowerCase()
  const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
  const filename = path.basename(absPath)
  const encodedFilename = encodeURIComponent(filename)

  const nodeStream = createReadStream(absPath)
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>

  return new NextResponse(webStream, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Content-Length': stat.size.toString(),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodedFilename}`,
      'Cache-Control': 'private, max-age=0, no-store',
    },
  })
}
