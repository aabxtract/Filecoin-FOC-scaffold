import { config as loadEnv } from 'dotenv'
loadEnv({ path: ['.env.local', '.env'], quiet: true })

import { formatUnits } from '@filoz/synapse-sdk'
import chalk from 'chalk'
import { privateKeyToAccount } from 'viem/accounts'
import { createSynapse, normalizePrivateKey } from '../lib/synapse'

const pass = (msg: string) => console.log(chalk.green('  ✓'), msg)
const fail = (msg: string, fix?: string) => {
  console.log(chalk.red('  ✗'), msg)
  if (fix) console.log(chalk.dim(`    → ${fix}`))
}
const warn = (msg: string, fix?: string) => {
  console.log(chalk.yellow('  ⚠'), msg)
  if (fix) console.log(chalk.dim(`    → ${fix}`))
}
const section = (msg: string) => console.log(chalk.cyan(`\n${msg}`))
const usdfc = (v: bigint) => `${formatUnits(v, { decimals: 18, digits: 4 })} USDFC`
const fil = (v: bigint) => `${formatUnits(v, { decimals: 18, digits: 4 })} FIL`

const TFIL_FAUCET = 'https://faucet.calibnet.chainsafe-fil.io'
const USDFC_FAUCET = 'https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc'

async function check() {
  console.log(chalk.bold('\n🔍 FOC Setup Check'))
  let hasErrors = false

  // --- ENV VARS ---
  section('Environment')

  for (const key of ['FOC_PRIVATE_KEY', 'FOC_NETWORK']) {
    if (process.env[key]) pass(`${key} is set`)
    else {
      fail(`${key} is missing`, 'fill it in .env.local (created for you by scaffold-foc)')
      hasErrors = true
    }
  }

  const network = process.env.FOC_NETWORK
  if (network && !['calibration', 'mainnet'].includes(network)) {
    fail(`FOC_NETWORK must be "calibration" or "mainnet", got "${network}"`)
    hasErrors = true
  }

  if (hasErrors) {
    console.log(chalk.red('\n❌ Fix .env.local first, then re-run npm run foc:check\n'))
    process.exit(1)
  }

  // --- WALLET ---
  section('Wallet')

  let address: `0x${string}`
  try {
    address = privateKeyToAccount(normalizePrivateKey(process.env.FOC_PRIVATE_KEY!)).address
    pass(`Wallet derived: ${address}`)
  } catch (e) {
    fail(`Invalid private key: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }

  // --- SYNAPSE + RPC ---
  section(`Network (${network})`)

  let synapse: ReturnType<typeof createSynapse>
  try {
    synapse = createSynapse()
    pass('Synapse SDK initialized')
  } catch (e) {
    fail(`Synapse init failed: ${e instanceof Error ? e.message : e}`)
    process.exit(1)
  }

  try {
    const block = await synapse.client.getBlockNumber()
    pass(`RPC reachable — block ${block}`)
  } catch (e) {
    fail(`RPC unreachable: ${e instanceof Error ? e.message : e}`, 'check your network connection')
    process.exit(1)
  }

  try {
    const gas = await synapse.client.getBalance({ address })
    if (gas > 0n) pass(`Gas balance: ${fil(gas)}`)
    else {
      fail('Gas balance: 0 FIL — transactions will fail', `get tFIL: ${TFIL_FAUCET}`)
      hasErrors = true
    }
  } catch (e) {
    warn(`Could not read FIL balance: ${e instanceof Error ? e.message : e}`)
  }

  // --- PAYMENTS ---
  section('Payments (Filecoin Pay)')

  try {
    const [inWallet, deposited] = await Promise.all([
      synapse.payments.walletBalance(),
      synapse.payments.balance(),
    ])

    if (inWallet > 0n) pass(`USDFC in wallet: ${usdfc(inWallet)}`)
    else warn('USDFC in wallet: 0', `get tUSDFC: ${USDFC_FAUCET}`)

    if (deposited > 0n) {
      pass(`USDFC deposited: ${usdfc(deposited)}`)
    } else if (inWallet > 0n) {
      fail('USDFC deposited: 0 — storage needs a deposit', 'run: npm run foc:setup')
      hasErrors = true
    } else {
      fail('No USDFC anywhere — storage cannot be paid for', `1) faucet: ${USDFC_FAUCET}  2) npm run foc:setup`)
      hasErrors = true
    }
  } catch (e) {
    fail(`Payment check failed: ${e instanceof Error ? e.message : e}`)
    hasErrors = true
  }

  // --- STORAGE SERVICE ---
  section('Storage (Warm Storage)')

  try {
    const info = await synapse.storage.getStorageInfo()

    if (info.providers.length > 0) {
      pass(`Active storage providers: ${info.providers.length}`)
    } else {
      fail('No active storage providers on this network')
      hasErrors = true
    }

    const perMonth = formatUnits(info.pricing.noCDN.perTiBPerMonth, { decimals: 18, digits: 2 })
    pass(`Pricing: ${perMonth} ${info.pricing.tokenSymbol}/TiB/month`)
    pass(
      `Upload size limits: ${info.serviceParameters.minUploadSize} B – ${(
        info.serviceParameters.maxUploadSize / 1024 / 1024
      ).toFixed(0)} MiB`
    )

    if (info.allowances?.isApproved) {
      pass('Operator approval: set')
    } else {
      fail('Operator approval: not set — uploads will be rejected', 'run: npm run foc:setup')
      hasErrors = true
    }
  } catch (e) {
    fail(`Storage service check failed: ${e instanceof Error ? e.message : e}`)
    hasErrors = true
  }

  // --- RESULT ---
  console.log()
  if (hasErrors) {
    console.log(chalk.red('❌ Setup incomplete. Fix the issues above, then re-run npm run foc:check\n'))
    process.exit(1)
  }
  console.log(chalk.green("✅ All checks passed. You're ready to build on FOC.\n"))
  console.log(chalk.dim('Next: npm run foc:test-upload\n'))
}

check().catch((e) => {
  console.error(chalk.red('\nUnexpected error:'), e)
  process.exit(1)
})
