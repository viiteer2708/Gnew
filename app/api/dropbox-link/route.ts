import { NextRequest, NextResponse } from 'next/server'
import { getDownloadUrl } from '@/lib/materiales-source'

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('id')
  if (!fileId) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const link = await getDownloadUrl(fileId)
  if (!link) return NextResponse.json({ error: 'Could not generate link' }, { status: 500 })

  return NextResponse.json({ link })
}
