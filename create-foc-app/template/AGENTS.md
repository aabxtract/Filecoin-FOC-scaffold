# FOC App — Agent Context

This project was scaffolded with **scaffold-foc**. It uses the **Filecoin Onchain Cloud (FOC)** via the Synapse SDK — `@filoz/synapse-sdk` **v1.x** (verify the installed version before assuming API shapes; the SDK moves fast).

## Architecture

- `lib/synapse.ts` — Synapse SDK initialization. **Always import from here** (`getSynapse()` for server routes, `createSynapse()` for one-shot scripts). Never instantiate `Synapse` elsewhere.
- `scripts/` — dev utilities, run with `npm run foc:*` (executed via `tsx`).
- `app/` — Next.js 16 app router. API routes in `app/api/` hold all server-side SDK calls: `upload` (POST, file → pieceCid), `download` (GET, pieceCid → bytes), `status` (GET, account summary + data sets).

## Environment Variables

All FOC config lives in `.env.local` (gitignored):
- `FOC_PRIVATE_KEY` — wallet private key (0x-prefixed hex). Server-side only, never expose to the client.
- `FOC_NETWORK` — `calibration` or `mainnet`
- `FOC_APP_NAME` — source tag for Synapse telemetry
- `FOC_TEST_PIECE_CID` / `FOC_TEST_DATASET_ID` — optional, written by `foc:test-upload`, used as defaults by `foc:status`

Scripts load env with `dotenv` (`.env.local` first, then `.env`). Next.js loads `.env.local` natively.

## SDK v1.x Key Concepts (differs from older docs/examples!)

- **`pieceCid` is the content address.** Uploads return it; downloads require it. There is no flat `datasetId` returned from upload.
- **`dataSetId`** (`bigint`) identifies an on-chain data set (one per provider copy). Found in `result.copies[n].dataSetId` and via `storage.findDataSets()`. Used for proof/status queries.
- `Synapse.create({ account, chain, source })` — **synchronous** static factory. `chain` is a chain object (`calibration` / `mainnet` exported from the SDK root), not a string.
- `storage.upload(data)` takes **`Uint8Array | ReadableStream`** — not a `File`. Convert with `new Uint8Array(await file.arrayBuffer())`.
- `storage.download({ pieceCid })` returns a **`Uint8Array`**.
- All token amounts are **`bigint`** (USDFC = 18 decimals). Use `formatUnits` / `parseUnits` re-exported from `@filoz/synapse-sdk`. **`bigint` breaks `JSON.stringify`** — stringify explicitly in API responses.
- The SDK is **ESM-only**.

## Main API surface

```ts
const synapse = getSynapse()

// Payments (Filecoin Pay)
await synapse.payments.walletBalance()        // USDFC in wallet (bigint)
await synapse.payments.balance()              // USDFC deposited (bigint)
await synapse.payments.accountSummary()       // { funds, availableFunds, debt, totalLockup, lockupRatePerMonth, ... }
await synapse.payments.depositWithPermitAndApproveOperator({ amount, rateAllowance, lockupAllowance, maxLockupPeriod })
await synapse.payments.getRailsAsPayer()

// Storage (Warm Storage)
await synapse.storage.getStorageInfo()        // { providers, pricing, serviceParameters (min/max upload size), allowances }
await synapse.storage.upload(bytes, { callbacks })   // → { pieceCid, size, complete, copies, failedAttempts }
await synapse.storage.download({ pieceCid })  // → Uint8Array
await synapse.storage.findDataSets()          // → EnhancedDataSetInfo[] (isLive, activePieceCount, providerId, ...)

// Proof state (PDP) — per piece, via a context
const ctx = await synapse.storage.createContext({ dataSetId })
await ctx.pieceStatus({ pieceCid })           // { dataSetLastProven, dataSetNextProofDue, retrievalUrl, inChallengeWindow, isProofOverdue }
await ctx.getScheduledRemovals()

// viem client with public actions
await synapse.client.getBlockNumber()
await synapse.client.getBalance({ address })
await synapse.client.waitForTransactionReceipt({ hash })
```

Uploads require: USDFC deposited in Filecoin Pay **and** operator approval. `npm run foc:setup` does both in one transaction.

Upload size limits exist — read `serviceParameters.minUploadSize` / `maxUploadSize` from `getStorageInfo()` instead of hardcoding.

## Test Scripts

Before building or debugging, always run:
- `npm run foc:check` — verifies the full setup, prints the exact fix for each failure
- `npm run foc:setup` — deposit USDFC + approve operator (one tx)
- `npm run foc:test-upload` — end-to-end upload/download round trip
- `npm run foc:status [pieceCid|dataSetId]` — account, data sets, PDP proof health

## Security model of this scaffold

The API routes sign with the single server wallet (`FOC_PRIVATE_KEY`) — every visitor's upload is paid by it. `GET /api/status` also exposes that wallet's balances and data sets with no auth. Both are fine for a local-dev scaffold; for production move to user wallets or the SDK's session-key module (`@filoz/synapse-sdk/session`), and gate `/api/status`.

## Faucets (calibration)

- tFIL (gas): https://faucet.calibnet.chainsafe-fil.io
- tUSDFC (storage): https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc

## If an SDK call fails

Check the real surface in `node_modules/@filoz/synapse-sdk/dist/src/` — `synapse.d.ts`, `types.d.ts`, `storage/manager.d.ts`, `storage/context.d.ts`, `payments/service.d.ts`. Trust those typings over any docs or examples.
