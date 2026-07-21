import { config as loadEnv } from 'dotenv'
loadEnv({ path: ['.env.local', '.env'], quiet: true })

import { formatUnits } from '@filoz/synapse-sdk'
import chalk from 'chalk'
import { createSynapse } from '../lib/synapse'

const usdfc = (v: bigint) => `${formatUnits(v, { decimals: 18, digits: 4 })} USDFC`
const section = (msg: string) => console.log(chalk.cyan(`\n${msg}`))

async function status() {
  // Accept a pieceCid (starts with "ba...") or a numeric dataSetId as the arg;
  // fall back to what foc:test-upload wrote into .env.local.
  const arg = process.argv[2]
  const pieceCid = arg?.startsWith('ba') ? arg : process.env.FOC_TEST_PIECE_CID
  const dataSetIdArg = arg && /^\d+$/.test(arg) ? BigInt(arg) : process.env.FOC_TEST_DATASET_ID ? BigInt(process.env.FOC_TEST_DATASET_ID) : undefined

  console.log(chalk.bold('\n📊 FOC Status'))

  const synapse = createSynapse()

  // --- PAYMENTS ---
  section('Account (Filecoin Pay)')
  try {
    const [summary, rails] = await Promise.all([
      synapse.payments.accountSummary(),
      synapse.payments.getRailsAsPayer(),
    ])
    console.log(`  Funds:      ${usdfc(summary.funds)} (available: ${usdfc(summary.availableFunds)})`)
    console.log(`  Locked:     ${usdfc(summary.totalLockup)}`)
    console.log(`  Burn rate:  ${usdfc(summary.lockupRatePerMonth)}/month`)
    console.log(`  Open rails: ${rails.length}`)
    if (summary.debt > 0n) console.log(chalk.yellow(`  ⚠ Debt: ${usdfc(summary.debt)} — deposit more USDFC (npm run foc:setup)`))
  } catch (e) {
    console.log(chalk.red(`  Payment check failed: ${e instanceof Error ? e.message : e}`))
  }

  // --- DATA SETS ---
  section('Data Sets')
  let firstLiveDataSetId: bigint | undefined
  try {
    const dataSets = await synapse.storage.findDataSets()
    if (dataSets.length === 0) {
      console.log(chalk.dim('  No data sets yet — run npm run foc:test-upload to create one'))
    }
    for (const ds of dataSets) {
      const live = ds.isLive ? chalk.green('live') : chalk.red('not live')
      const marker = dataSetIdArg !== undefined && ds.dataSetId === dataSetIdArg ? chalk.cyan(' ←') : ''
      console.log(
        `  #${ds.dataSetId}  ${live}  pieces: ${ds.activePieceCount}  provider: #${ds.providerId}  CDN: ${ds.withCDN ? 'yes' : 'no'}${marker}`
      )
      if (ds.isLive && firstLiveDataSetId === undefined) firstLiveDataSetId = ds.dataSetId
    }
  } catch (e) {
    console.log(chalk.red(`  Data set check failed: ${e instanceof Error ? e.message : e}`))
  }

  // --- PROOF STATE (PDP) ---
  section('Proof State (PDP)')
  const targetDataSetId = dataSetIdArg ?? firstLiveDataSetId
  if (!pieceCid || targetDataSetId === undefined) {
    console.log(chalk.dim('  Skipped — needs a piece CID and data set.'))
    console.log(chalk.dim('  Run foc:test-upload, then add FOC_TEST_PIECE_CID / FOC_TEST_DATASET_ID to .env.local,'))
    console.log(chalk.dim('  or pass one directly: npm run foc:status -- <pieceCid>'))
  } else {
    try {
      const ctx = await synapse.storage.createContext({ dataSetId: targetDataSetId })
      const piece = await ctx.pieceStatus({ pieceCid })

      if (!piece) {
        console.log(chalk.yellow(`  Piece not found in data set #${targetDataSetId}`))
      } else {
        console.log(`  Piece:          ${pieceCid.slice(0, 24)}…`)
        console.log(`  Last proven:    ${piece.dataSetLastProven ? piece.dataSetLastProven.toLocaleString() : chalk.dim('not yet')}`)
        console.log(`  Next proof due: ${piece.dataSetNextProofDue ? piece.dataSetNextProofDue.toLocaleString() : chalk.dim('n/a')}`)
        if (piece.inChallengeWindow !== undefined) {
          console.log(`  In challenge window: ${piece.inChallengeWindow ? 'yes' : `no (${piece.hoursUntilChallengeWindow?.toFixed(1) ?? '?'}h away)`}`)
        }
        if (piece.isProofOverdue) console.log(chalk.red('  ⚠ Proof is OVERDUE — provider may be failing'))
        if (piece.retrievalUrl) console.log(`  Retrieval URL:  ${piece.retrievalUrl}`)
      }

      const removals = await ctx.getScheduledRemovals()
      if (removals.length > 0) {
        console.log(chalk.yellow(`  ⚠ Scheduled removals in this data set: ${removals.length}`))
      }
    } catch (e) {
      console.log(chalk.red(`  Proof check failed: ${e instanceof Error ? e.message : e}`))
    }
  }

  console.log()
}

status().catch((e) => {
  console.error(chalk.red('\nUnexpected error:'), e)
  process.exit(1)
})
