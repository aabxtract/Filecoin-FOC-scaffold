import { Synapse, calibration, mainnet } from '@filoz/synapse-sdk'
import { privateKeyToAccount } from 'viem/accounts'

const CHAINS = { calibration, mainnet } as const
export type FocNetwork = keyof typeof CHAINS

export function createSynapse(): Synapse {
  const privateKey = process.env.FOC_PRIVATE_KEY
  const network = (process.env.FOC_NETWORK ?? 'calibration') as FocNetwork

  if (!privateKey) {
    throw new Error('FOC_PRIVATE_KEY is not set — add your wallet private key to .env.local')
  }
  if (!privateKey.startsWith('0x')) {
    throw new Error('FOC_PRIVATE_KEY must be 0x-prefixed hex')
  }
  if (!(network in CHAINS)) {
    throw new Error(`FOC_NETWORK must be "calibration" or "mainnet", got "${network}"`)
  }

  return Synapse.create({
    account: privateKeyToAccount(privateKey as `0x${string}`),
    chain: CHAINS[network],
    source: process.env.FOC_APP_NAME ?? 'create-foc-app',
  })
}

// Reuse one instance across Next.js hot reloads / route invocations
const g = globalThis as typeof globalThis & { __focSynapse?: Synapse }

export function getSynapse(): Synapse {
  g.__focSynapse ??= createSynapse()
  return g.__focSynapse
}
