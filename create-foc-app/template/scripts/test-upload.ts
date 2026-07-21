import { config as loadEnv } from 'dotenv'
loadEnv({ path: ['.env.local', '.env'], quiet: true })

import chalk from 'chalk'
import { createSynapse } from '../lib/synapse'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function testUpload() {
  console.log(chalk.bold('\n🧪 FOC Upload Test — end-to-end round trip\n'))

  const synapse = createSynapse()

  const info = await synapse.storage.getStorageInfo()
  const minSize = Math.max(info.serviceParameters.minUploadSize, 256)

  const testContent = `scaffold-foc upload test — ${new Date().toISOString()}\nIf you can read this back, the FOC round trip works.\n`.padEnd(
    minSize,
    '.'
  )
  const bytes = new TextEncoder().encode(testContent)

  console.log(chalk.cyan(`→ Uploading ${bytes.length} byte test piece...`))

  let result: Awaited<ReturnType<typeof synapse.storage.upload>>
  try {
    result = await synapse.storage.upload(bytes, {
      callbacks: {
        onStored: (providerId) => console.log(chalk.dim(`  stored with provider #${providerId}`)),
        onPiecesAdded: (tx) => console.log(chalk.dim(`  on-chain tx: ${tx}`)),
        onPiecesConfirmed: (dataSetId) => console.log(chalk.dim(`  confirmed in data set #${dataSetId}`)),
      },
    })
  } catch (e) {
    console.log(chalk.red(`✗ Upload failed: ${e instanceof Error ? e.message : e}`))
    console.log(chalk.yellow('\nCommon causes:'))
    console.log('  - No USDFC deposited or operator not approved → npm run foc:setup')
    console.log('  - No gas (tFIL) in wallet → npm run foc:check')
    console.log('  - No active storage providers on this network')
    process.exit(1)
  }

  const pieceCid = result.pieceCid.toString()
  const copy = result.copies[0]

  console.log(chalk.green('✓ Upload successful'))
  console.log(`  Piece CID:   ${pieceCid}`)
  if (copy) {
    console.log(`  Data set:    #${copy.dataSetId} (provider #${copy.providerId})`)
    console.log(`  Retrieval:   ${copy.retrievalUrl}`)
  }
  if (result.failedAttempts.length > 0) {
    console.log(chalk.yellow(`  ⚠ ${result.failedAttempts.length} provider attempt(s) failed before success`))
  }

  console.log(chalk.cyan('\n→ Downloading it back...'))

  let roundTripOk = false
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const data = await synapse.storage.download({ pieceCid: result.pieceCid })
      const text = new TextDecoder().decode(data)
      if (text === testContent) {
        console.log(chalk.green('✓ Round trip successful — downloaded content matches'))
        roundTripOk = true
      } else {
        console.log(chalk.yellow('⚠ Downloaded content does not match what was uploaded'))
      }
      break
    } catch (e) {
      if (attempt === 6) {
        console.log(chalk.yellow(`⚠ Download failed after ${attempt} attempts (piece may still be propagating)`))
        console.log(chalk.dim(`  ${e instanceof Error ? e.message : e}`))
        console.log(chalk.dim('  Try again in a minute: npm run foc:status'))
      } else {
        console.log(chalk.dim(`  attempt ${attempt} not ready yet, retrying in 5s...`))
        await sleep(5000)
      }
    }
  }

  console.log(chalk.bold(roundTripOk ? chalk.green('\n✅ The full FOC stack works.\n') : '\n🟡 Upload worked; retrieval pending.\n'))
  console.log('Add these to .env.local so foc:status has defaults:')
  console.log(chalk.cyan(`  FOC_TEST_PIECE_CID=${pieceCid}`))
  if (copy) console.log(chalk.cyan(`  FOC_TEST_DATASET_ID=${copy.dataSetId}`))
  console.log()
}

testUpload().catch((e) => {
  console.error(chalk.red('\nUnexpected error:'), e)
  process.exit(1)
})
