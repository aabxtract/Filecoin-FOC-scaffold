# scaffold-foc

<div align="center">

[![npm version](https://img.shields.io/npm/v/scaffold-foc.svg?style=flat-square&color=0070f3)](https://www.npmjs.com/package/scaffold-foc)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-blue.svg?style=flat-square)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Filecoin Onchain Cloud](https://img.shields.io/badge/Filecoin-Onchain%20Cloud-0094FF.svg?style=flat-square)](https://filecoin.io)

**The production starter kit & CLI generator for Filecoin Onchain Cloud (FOC) applications.**

[Quick Start](#quick-start) • [Architecture](#architecture) • [Script Suite](#the-foc-script-suite) • [API Reference](#api-routes) • [SDK Integration](#synapse-sdk-v1x-integration)

</div>

---

## Overview

`scaffold-foc` is an official developer CLI that scaffolds a full-stack Next.js application pre-wired with Filecoin's **Synapse SDK v1.x (`@filoz/synapse-sdk`)**.

Building decentralized storage apps on Filecoin traditionally requires complex wallet configuration, token deposits, operator approvals, gas management, and storage provider negotiations. `scaffold-foc` eliminates this boilerplate by generating a complete, production-ready environment with built-in diagnostic and setup tooling—allowing you to store, retrieve, and verify data on Filecoin in minutes.

---

## Key Capabilities

- **Instant Scaffolding**: One command generates a Next.js 16 App Router application configured for Filecoin Calibration testnet and Mainnet.
- **Complete Round-Trip Storage**: Pre-built client UI and backend API routes for uploading files to decentralized storage and retrieving them by Piece CID.
- **Automated Setup & Diagnostics (`foc:*`)**: Diagnostic scripts that verify RPC health, wallet balances, operator approvals, gas limits, and execute one-transaction wallet onboarding.
- **Filecoin Pay Integration**: Native support for USDFC token deposits, lockups, and EIP-2612 gasless operator permit approvals.
- **Proof of Data Possession (PDP)**: Live proof status verification for stored data sets and storage provider replication health.
- **AI-Ready Context (`AGENTS.md`)**: Embedded architectural documentation designed for AI coding assistants (Antigravity, Cursor, Copilot) to ensure accurate code generation.

---

## Quick Start

### 1. Generate your project

Run the CLI command in your terminal:

```bash
npx scaffold-foc my-foc-app
```

### 2. Configure environment variables

Navigate to your generated directory:

```bash
cd my-foc-app
```

Open `.env.local` and add your Filecoin Calibration wallet private key:

```env
FOC_PRIVATE_KEY=0x...your_private_key_here...
FOC_NETWORK=calibration
FOC_APP_NAME=my-foc-app
```

*(Need testnet funds? Links to tFIL gas and tUSDFC storage faucets are included inside `.env.local`)*

### 3. Run automated setup & verification

Execute the built-in diagnostic and setup sequence:

```bash
# 1. Verify wallet balance, RPC connection, and approval status
npm run foc:check

# 2. Deposit USDFC and grant operator approval in one transaction
npm run foc:setup

# 3. Test end-to-end file upload and retrieval against live storage
npm run foc:test-upload

# 4. Start your local development server
npm run dev
```

Visit `http://localhost:3000` to interact with your application.

---

## Architecture

The scaffolded application is structured around clean separation of concerns between client components, server-side API routes, and Synapse SDK initialization:

```
my-foc-app/
├── app/
│   ├── api/
│   │   ├── download/       # GET /api/download?cid=... (Retrieves file bytes from Filecoin)
│   │   ├── status/         # GET /api/status (Account summary, balances, & data sets)
│   │   └── upload/         # POST /api/upload (Uploads File/Blob to Filecoin storage)
│   ├── globals.css         # Modern dark-mode styling system
│   ├── layout.tsx          # Root application layout
│   └── page.tsx            # Interactive upload, retrieve, and telemetry dashboard UI
├── lib/
│   └── synapse.ts          # Centralized Synapse SDK client initialization
├── scripts/
│   ├── check.ts            # Environment, wallet, & provider diagnostic engine (npm run foc:check)
│   ├── setup.ts            # Gas & operator allowance setup script (npm run foc:setup)
│   ├── status.ts           # Account, proof, and PDP status reporter (npm run foc:status)
│   └── test-upload.ts      # End-to-end storage verification script (npm run foc:test-upload)
├── .env.example            # Environment template
├── .env.local              # Local secrets configuration (gitignored)
└── AGENTS.md               # Context documentation for AI coding tools
```

---

## The `foc:` Script Suite

Every project scaffolded by `scaffold-foc` includes specialized command-line utilities in `./scripts` to manage storage operations and wallet states:

| Command | Primary Function | Details |
|---|---|---|
| `npm run foc:check` | **Diagnostic Engine** | Inspects private key format, Calibration RPC reachability, tFIL gas balance, tUSDFC wallet balance, Filecoin Pay deposits, storage provider selection, and operator approval allowances. Outputs actionable fixes for any failing line. |
| `npm run foc:setup` | **Auto-Provisioner** | Onboards fresh wallets in **one transaction**. Deposits USDFC into Filecoin Pay and approves the default storage operator via EIP-2612 permit authorization. |
| `npm run foc:test-upload` | **Integration Test** | Executes a full round-trip storage cycle: uploads a test payload to storage providers, retrieves the stored bytes, verifies checksum hash equality, and records `FOC_TEST_PIECE_CID`. |
| `npm run foc:status` | **Telemetry & PDP Health** | Displays Filecoin Pay account health (deposited funds, active lockup, monthly burn rate), active data sets, and Provable Data Possession (PDP) verification status for any Piece CID or Data Set ID. |
| `npm run foc:upgrade` | **SDK & Dependencies Upgrader** | Upgrades `@filoz/synapse-sdk` and FOC core dependencies in your project to the latest stable release. |

---

## API Routes

The scaffold includes production-grade Next.js App Router API endpoints that interface with the Synapse SDK on the server:

### 1. Upload File
- **Endpoint**: `POST /api/upload`
- **Payload**: `FormData` containing a `file` field.
- **Function**: Converts file stream to `Uint8Array`, computes piece commitment, uploads to warm storage providers via Synapse SDK, and returns storage metadata.
- **Response**:
  ```json
  {
    "success": true,
    "pieceCid": "bafkzcib...",
    "size": 1048576,
    "dataSets": [ ... ]
  }
  ```

### 2. Download File
- **Endpoint**: `GET /api/download?cid=<PIECE_CID>`
- **Function**: Fetches binary stored data from the Filecoin network by Piece CID using `synapse.storage.download()`.
- **Response**: Binary stream / attachment download.

### 3. Account Telemetry
- **Endpoint**: `GET /api/status`
- **Function**: Retrieves account balance, active storage allowances, lockup schedules, and active data set statuses.
- **Response**:
  ```json
  {
    "walletBalance": "100.0 USDFC",
    "depositedBalance": "50.0 USDFC",
    "accountSummary": { ... },
    "dataSets": [ ... ]
  }
  ```

---

## Synapse SDK v1.x Integration

`scaffold-foc` standardizes Synapse SDK usage via `lib/synapse.ts`.

### Centralized SDK Client (`lib/synapse.ts`)

```typescript
import { Synapse, chain } from '@filoz/synapse-sdk'

export function getSynapse() {
  const privateKey = process.env.FOC_PRIVATE_KEY
  if (!privateKey) throw new Error('FOC_PRIVATE_KEY is missing in environment')

  const targetChain = process.env.FOC_NETWORK === 'mainnet' ? chain.mainnet : chain.calibration

  return Synapse.create({
    account: privateKey,
    chain: targetChain,
    source: process.env.FOC_APP_NAME || 'scaffold-foc-app',
  })
}
```

### Core Operations

```typescript
import { getSynapse } from '@/lib/synapse'

const synapse = getSynapse()

// 1. Upload bytes to Filecoin Storage
const bytes = new Uint8Array(await file.arrayBuffer())
const result = await synapse.storage.upload(bytes)
console.log('Stored Piece CID:', result.pieceCid)

// 2. Download bytes by Piece CID
const downloadedBytes = await synapse.storage.download({ pieceCid: result.pieceCid })

// 3. Query PDP Proof Status
const ctx = await synapse.storage.createContext({ dataSetId: result.copies[0].dataSetId })
const status = await ctx.pieceStatus({ pieceCid: result.pieceCid })
console.log('Next Proof Due:', status.dataSetNextProofDue)
```

---

## CLI Options & Flags

```bash
npx scaffold-foc [project-directory] [options]
```

- `[project-directory]`: Name or path of the directory to create (default: `my-foc-app`).
- `--no-install`: Skip automatic `npm install` after scaffolding.
- `-h, --help`: Display available CLI arguments and options.

---

## Requirements

- **Node.js**: `≥ 20.0.0`
- **Package Manager**: `npm` (v10+), `pnpm`, or `yarn`
- **Wallet**: EVM-compatible wallet (MetaMask, Coinbase Wallet, or raw hex key) with:
  - **tFIL** (Gas currency on Filecoin Calibration)
  - **tUSDFC** (Storage currency on Filecoin Calibration)

### Testnet Faucets

- **tFIL Gas Faucet**: [Calibration ChainSafe Faucet](https://faucet.calibnet.chainsafe-fil.io)
- **tUSDFC Storage Faucet**: [Forest Explorer USDFC Faucet](https://forest-explorer.chainsafe.dev/faucet/calibnet_usdfc)

---

## Roadmap

- [ ] **Multi-Template Support**: Scaffolding flags for specialized storage dApps, AI Agent data vaults, and paywall apps (`--template storage|ai|paywall`).
- [ ] **Auto-Fix Engine (`foc:doctor`)**: Automated transaction builder to resolve missing allowances directly from diagnostic output.
- [ ] **Session Keys Module**: End-to-end integration with `@filoz/synapse-sdk/session` for user-signed/user-funded storage authorization.
- [ ] **React Component Library**: Native React hooks (`@filoz/synapse-react`) for upload progress, PDP status badges, and wallet modal integration.

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for details.
