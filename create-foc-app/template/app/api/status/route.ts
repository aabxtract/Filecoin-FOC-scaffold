import { NextResponse } from 'next/server'
import { formatUnits } from '@filoz/synapse-sdk'
import { getSynapse } from '@/lib/synapse'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const usdfc = (v: bigint) => formatUnits(v, { decimals: 18, digits: 4 })

export async function GET() {
  try {
    const synapse = getSynapse()

    const [summary, dataSets] = await Promise.all([
      synapse.payments.accountSummary(),
      synapse.storage.findDataSets(),
    ])

    return NextResponse.json({
      account: {
        funds: usdfc(summary.funds),
        availableFunds: usdfc(summary.availableFunds),
        debt: usdfc(summary.debt),
        totalLockup: usdfc(summary.totalLockup),
        lockupRatePerMonth: usdfc(summary.lockupRatePerMonth),
      },
      dataSets: dataSets.map((ds) => ({
        dataSetId: ds.dataSetId.toString(),
        isLive: ds.isLive,
        activePieceCount: Number(ds.activePieceCount),
        providerId: ds.providerId.toString(),
        withCDN: ds.withCDN,
      })),
    })
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
