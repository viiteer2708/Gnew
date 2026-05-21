import { NextRequest, NextResponse } from 'next/server'
import { listFolder } from '@/lib/materiales-source'

export async function GET(request: NextRequest) {
  const folderId = request.nextUrl.searchParams.get('id')
  if (!folderId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  try {
    const data = await listFolder(folderId)
    return NextResponse.json(data)
  } catch (err) {
    console.error('[API materiales/folder] Error:', err)
    return NextResponse.json({ error: 'Error al cargar carpeta' }, { status: 500 })
  }
}
