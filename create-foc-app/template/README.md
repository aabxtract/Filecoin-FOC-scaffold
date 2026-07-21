# My FOC App

Scaffolded with [scaffold-foc](https://www.npmjs.com/package/scaffold-foc) — a Next.js app on the **Filecoin Onchain Cloud** via the Synapse SDK.

## Quick start

```bash
# 1. Add your wallet private key to .env.local (faucet links inside)
# 2. Verify everything is wired up:
npm run foc:check
# 3. Fund storage (deposit USDFC + approve operator, one tx):
npm run foc:setup
# 4. Prove the stack works end to end:
npm run foc:test-upload
# 5. Launch:
npm run dev
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run foc:check` | Verify env, wallet, RPC, gas, USDFC balances, providers, operator approval — with the exact fix printed for each failure |
| `npm run foc:setup [amount]` | Deposit USDFC (default 5) + approve the storage operator in one transaction |
| `npm run foc:test-upload` | Upload a test piece, download it back, verify contents match |
| `npm run foc:status [pieceCid\|dataSetId]` | Account funds/lockup/burn rate, data sets, PDP proof state |

## Structure

- `lib/synapse.ts` — SDK initialization; import `getSynapse()` everywhere
- `app/api/upload` / `app/api/download` — server-side storage endpoints
- `app/page.tsx` — minimal upload/retrieve UI
- `scripts/` — the `foc:*` utilities
- `AGENTS.md` — context for AI coding tools (Claude Code, Cursor, etc.)

## ⚠ Security model

This scaffold signs with a single **server-side wallet** — every upload through the UI is paid by `FOC_PRIVATE_KEY`. That's intentional for a starter/demo. For production, switch to user wallets or Synapse session keys.

## Learn more

- FOC docs: https://docs.filecoin.cloud
- Synapse SDK: https://github.com/FilOzone/synapse-sdk
