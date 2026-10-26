// Applies any new SQL files in supabase/migrations to your Supabase database.
//   npm run db:upgrade          -> run all pending migrations
//   npm run db:new add_reviews  -> create the next numbered migration file
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(root, 'supabase', 'migrations')

// Minimal .env loader (no extra dependency)
for (const file of ['.env', '.env.local']) {
  const p = path.join(root, file)
  if (!fs.existsSync(p)) continue
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([\w]+)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}

const files = () => fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()

// ---- new migration ----
if (process.argv[2] === 'new') {
  const name = (process.argv[3] || 'change').toLowerCase().replace(/[^a-z0-9]+/g, '_')
  const last = files().pop()?.match(/^(\d+)/)?.[1] || '0'
  const num = String(Number(last) + 1).padStart(3, '0')
  const file = path.join(dir, `${num}_${name}.sql`)
  fs.writeFileSync(file, `-- ${num}_${name}\n-- Write idempotent SQL where possible (if not exists / drop ... if exists).\n\n`)
  console.log('Created', path.relative(root, file))
  process.exit(0)
}

// ---- upgrade ----
const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is missing. Add it to .env (Supabase → Connect → Connection string → Session pooler).')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } })

try {
  await client.connect()
  await client.query(`create table if not exists public.schema_migrations (
    name text primary key,
    applied_at timestamptz default now()
  )`)

  const applied = new Set((await client.query('select name from public.schema_migrations')).rows.map((r) => r.name))
  const pending = files().filter((f) => !applied.has(f))

  if (!pending.length) {
    console.log('Database is up to date. Nothing to run.')
  }

  for (const f of pending) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8')
    process.stdout.write(`Applying ${f} ... `)
    try {
      await client.query('begin')
      await client.query(sql)
      await client.query('insert into public.schema_migrations (name) values ($1)', [f])
      await client.query('commit')
      console.log('done')
    } catch (e) {
      await client.query('rollback')
      console.log('FAILED')
      console.error(`\n${f}: ${e.message}`)
      process.exitCode = 1
      break
    }
  }
} catch (e) {
  console.error('Could not connect:', e.message)
  process.exitCode = 1
} finally {
  await client.end().catch(() => {})
}
