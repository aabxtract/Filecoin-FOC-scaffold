#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import ora from 'ora'
import prompts from 'prompts'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const nameArg = args.find((a) => !a.startsWith('--'))
const skipInstall = flags.has('--no-install')

// npm mangles dotfiles in published packages, so the template ships these
// dot-less and we restore them here.
const RENAMES = [
  ['gitignore', '.gitignore'],
  ['env.example', '.env.example'],
]

const NAME_RE = /^[a-z0-9][a-z0-9._-]*$/

function fail(msg) {
  console.error(chalk.red(`\n✗ ${msg}\n`))
  process.exit(1)
}

async function main() {
  console.log(chalk.cyan('\n🌊 create-foc-app') + chalk.dim(' — Filecoin Onchain Cloud starter\n'))

  let name = nameArg
  if (!name) {
    const res = await prompts({
      type: 'text',
      name: 'projectName',
      message: 'Project name:',
      initial: 'my-foc-app',
      validate: (v) => (NAME_RE.test(v) ? true : 'Lowercase letters, digits, ".", "-", "_" only'),
    })
    if (!res.projectName) fail('Cancelled')
    name = res.projectName
  }

  if (!NAME_RE.test(name)) {
    fail(`Invalid project name "${name}" — use lowercase letters, digits, ".", "-", "_"`)
  }

  const targetDir = resolve(process.cwd(), name)
  const templateDir = join(__dirname, '../template')

  if (existsSync(targetDir) && readdirSync(targetDir).length > 0) {
    fail(`Directory "${name}" already exists and is not empty`)
  }

  const spinner = ora('Creating project...').start()

  cpSync(templateDir, targetDir, {
    recursive: true,
    filter: (src) => {
      const base = basename(src)
      return base !== 'node_modules' && base !== '.next' && base !== '.env.local'
    },
  })

  for (const [from, to] of RENAMES) {
    const src = join(targetDir, from)
    if (existsSync(src)) renameSync(src, join(targetDir, to))
  }

  // Pre-create .env.local so the user only has to fill in the key
  const envExample = join(targetDir, '.env.example')
  if (existsSync(envExample)) copyFileSync(envExample, join(targetDir, '.env.local'))

  const pkgPath = join(targetDir, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  pkg.name = name
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  spinner.succeed(`Project created at ${chalk.bold(name)}`)

  let installed = false
  if (!skipInstall) {
    const installSpinner = ora('Installing dependencies (this can take a minute)...').start()
    try {
      execSync('npm install --no-audit --no-fund', { cwd: targetDir, stdio: 'ignore' })
      installSpinner.succeed('Dependencies installed')
      installed = true
    } catch {
      installSpinner.warn('npm install failed — run it manually inside the project')
    }
  }

  console.log(chalk.green('\n✅ Done! Next steps:\n'))
  console.log(chalk.cyan(`  cd ${name}`))
  if (!installed) console.log(chalk.cyan('  npm install'))
  console.log(chalk.cyan('  # Put your wallet private key in .env.local'))
  console.log(chalk.cyan('  npm run foc:check       ') + chalk.dim('# verify your setup'))
  console.log(chalk.cyan('  npm run foc:setup       ') + chalk.dim('# deposit USDFC + approve storage (one tx)'))
  console.log(chalk.cyan('  npm run foc:test-upload ') + chalk.dim('# end-to-end upload round trip'))
  console.log(chalk.cyan('  npm run dev             ') + chalk.dim('# launch the app\n'))
  console.log(chalk.dim('  Faucets (calibration testnet) are linked in .env.local\n'))
}

main().catch((e) => fail(e?.message ?? String(e)))
