# create-foc-app

**The fastest way to start building on Filecoin Onchain Cloud.**

```bash
npx create-foc-app my-project
```

One command gives you a Next.js app wired to the [Synapse SDK](https://github.com/FilOzone/synapse-sdk) (v1.x) with a working upload/retrieve UI — plus built-in test scripts that verify your setup and debug storage issues *before* they hit production.

## What you get

```
my-project/
├── app/                  Next.js 16 app router — upload/retrieve UI + API routes
├── lib/synapse.ts        Synapse SDK initialization (one place, imported everywhere)
├── scripts/              FOC dev utilities (see below)
├── .env.local            Pre-created — just add your private key
└── AGENTS.md             Context file so AI coding tools understand the FOC stack
```

## The scripts

| Command | What it does |
|---|---|
| `npm run foc:check` | Verifies your entire setup: env vars, wallet, RPC, gas, USDFC balance, deposit, storage providers, operator approval. Every failure prints the exact fix. |
| `npm run foc:setup` | Takes a fresh faucet wallet to "ready to upload" in **one transaction** — deposits USDFC and approves the storage operator via EIP-2612 permit. |
| `npm run foc:test-upload` | End-to-end proof the stack works: uploads a test piece, downloads it back, verifies the content matches. Prints your piece CID and data set ID. |
| `npm run foc:status` | Health snapshot: Filecoin Pay account (funds, lockup, burn rate), your data sets, and live PDP proof state for any piece. |

## Quick start

```bash
npx create-foc-app my-project
cd my-project
# put your wallet key in .env.local (faucet links are in the file)
npm run foc:check
npm run foc:setup
npm run foc:test-upload
npm run dev
```

## Requirements

- Node.js ≥ 20
- A wallet with tFIL (gas) and tUSDFC (storage) on Filecoin Calibration — faucet links are in the generated `.env.local`

## Flags

- `--no-install` — skip `npm install` after scaffolding

## Roadmap

- `--template` flag (storage app, AI agent app, payment rails app)
- `foc:doctor` — auto-fix setup issues using the SDK's `storage.prepare()` transaction builder
- Session-key auth for user-paid uploads
- `@filoz/synapse-react` hooks UI
- GitHub Actions CI template for FOC apps

## License

MIT
