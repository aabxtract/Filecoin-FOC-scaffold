import { config as loadEnv } from 'dotenv'
loadEnv({ path: ['.env.local', '.env'], quiet: true })

import { formatUnits, parseUnits } from '@filoz/synapse-sdk'
import chalk from 'chalk'
import { createSynapse } from '../lib/synapse'

const usdfc = (v: bigint) => `${formatUnits(v, { decimals: 18, digits: 4 })} USDFC`
const USDFC_FAUCET = 'https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc'

// Filecoin: 2880 epochs/day. Allow the operator to lock funds up to ~30 days ahead.
const EPOCHS_PER_DAY = 2880n
const MAX_LOCKUP_EPOCHS = EPOCHS_PER_DAY * 30n

async function setup() {
  const amountArg = process.argv[2] ?? '5'
  const amount = parseUnits(amountArg, 18)

  console.log(chalk.bold('\n⚙️  FOC Setup — deposit + operator approval\n'))

  const synapse = createSynapse()

  const inWallet = await synapse.payments.walletBalance()
  console.log(`  Wallet USDFC:  ${usdfc(inWallet)}`)
  console.log(`  Will deposit:  ${usdfc(amount)}`)

  if (inWallet < amount) {
    console.log(chalk.red(`\n✗ Not enough USDFC in wallet to deposit ${amountArg}.`))
    console.log(chalk.dim(`  → get tUSDFC: ${USDFC_FAUCET}`))
    console.log(chalk.dim(`  → or deposit less: npm run foc:setup -- 1\n`))
    process.exit(1)
  }

  console.log(chalk.cyan('\n→ Sending one transaction: deposit + approve storage operator...'))

  const hash = await synapse.payments.depositWithPermitAndApproveOperator({
    amount,
    rateAllowance: parseUnits('10', 18),
    lockupAllowance: parseUnits('50', 18),
    maxLockupPeriod: MAX_LOCKUP_EPOCHS,
  })
  console.log(chalk.dim(`  tx: ${hash}`))

  console.log(chalk.cyan('→ Waiting for confirmation...'))
  await synapse.client.waitForTransactionReceipt({ hash })

  const [deposited, info] = await Promise.all([
    synapse.payments.balance(),
    synapse.storage.getStorageInfo(),
  ])

  console.log()
  console.log(chalk.green('✓'), `Deposited balance: ${usdfc(deposited)}`)
  console.log(
    info.allowances?.isApproved ? chalk.green('✓') : chalk.yellow('⚠'),
    `Operator approval: ${info.allowances?.isApproved ? 'set' : 'still propagating — re-run foc:check in a moment'}`
  )
  console.log(chalk.green('\n✅ Setup complete. Next: npm run foc:test-upload\n'))
}

setup().catch((e) => {
  console.error(chalk.red('\nSetup failed:'), e instanceof Error ? e.message : e)
  console.log(chalk.dim('\nRun npm run foc:check to diagnose.\n'))
  process.exit(1)
})
