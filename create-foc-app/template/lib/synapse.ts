import { Synapse, calibration, mainnet } from '@filoz/synapse-sdk'
import { privateKeyToAccount } from 'viem/accounts'

const CHAINS = { calibration, mainnet } as const
export type FocNetwork = keyof typeof CHAINS

export function normalizePrivateKey(raw: string): `0x${string}` {
  const key = raw.trim().toLowerCase()
  const hex = key.startsWith('0x') ? key.slice(2) : key
  if (!/^[0-9a-f]{64}$/.test(hex)) {
    throw new Error('FOC_PRIVATE_KEY must be 32 bytes of hex (64 chars, optionally 0x-prefixed)')
  }
  return `0x${hex}`
}

export function createSynapse(): Synapse {
  const privateKey = process.env.FOC_PRIVATE_KEY
  const network = (process.env.FOC_NETWORK ?? 'calibration') as FocNetwork

  if (!privateKey) {
    throw new Error('FOC_PRIVATE_KEY is not set — add your wallet private key to .env.local')
  }
  if (!(network in CHAINS)) {
    throw new Error(`FOC_NETWORK must be "calibration" or "mainnet", got "${network}"`)
  }

  return Synapse.create({
    account: privateKeyToAccount(normalizePrivateKey(privateKey)),
    chain: CHAINS[network],
    source: process.env.FOC_APP_NAME ?? 'scaffold-foc',
  })
}

// Reuse one instance across Next.js hot reloads / route invocations
const g = globalThis as typeof globalThis & { __focSynapse?: Synapse }

export function getSynapse(): Synapse {
  g.__focSynapse ??= createSynapse()
  return g.__focSynapse
}
