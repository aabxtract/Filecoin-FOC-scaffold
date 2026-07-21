import { NextRequest, NextResponse } from 'next/server'
import { getSynapse } from '@/lib/synapse'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // The SDK takes Uint8Array | ReadableStream, not a File
    const bytes = new Uint8Array(await file.arrayBuffer())
    const result = await getSynapse().storage.upload(bytes)

    // bigints must be stringified before JSON serialization
    return NextResponse.json({
      pieceCid: result.pieceCid.toString(),
      size: result.size,
      complete: result.complete,
      copies: result.copies.map((c) => ({
        providerId: c.providerId.toString(),
        dataSetId: c.dataSetId.toString(),
        pieceId: c.pieceId.toString(),
        retrievalUrl: c.retrievalUrl,
      })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
