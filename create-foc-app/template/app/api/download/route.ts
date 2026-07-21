import { NextRequest, NextResponse } from 'next/server'
import { getSynapse } from '@/lib/synapse'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(req: NextRequest) {
  const pieceCid = req.nextUrl.searchParams.get('pieceCid')
  if (!pieceCid) {
    return NextResponse.json({ error: 'pieceCid query param required' }, { status: 400 })
  }

  try {
    const data = await getSynapse().storage.download({ pieceCid })
    return new NextResponse(Buffer.from(data), {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${pieceCid}"`,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Download failed' },
      { status: 500 }
    )
  }
}
