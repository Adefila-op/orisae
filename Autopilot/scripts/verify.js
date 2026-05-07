#!/usr/bin/env node

/**
 * Autopilot Setup Verification Script
 * Tests that the main Next.js app and database are properly configured
 */

const http = require('http')
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

function loadLocalEnv() {
  const candidates = ['.env.local', '.env']

  for (const fileName of candidates) {
    const fullPath = path.join(process.cwd(), fileName)
    if (!fs.existsSync(fullPath)) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    for (const line of content.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) continue
      const idx = line.indexOf('=')
      const key = line.slice(0, idx).trim()
      const value = line.slice(idx + 1).trim()
      if (key && !process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

loadLocalEnv()

function log(status, message) {
  const symbol = status === 'ok' ? '[ok]' : status === 'error' ? '[error]' : '[warn]'
  console.log(`${symbol} ${message}`)
}

async function checkAPI() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000/api/status', (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data)
            const status = json.api || json.status || 'running'
            log('ok', `App Router API running on port 3000 (${status})`)
            resolve(true)
          } catch (e) {
            log('error', 'API returned invalid JSON')
            resolve(false)
          }
        } else {
          log('error', `API returned status ${res.statusCode}`)
          resolve(false)
        }
      })
    })
    req.on('error', (err) => {
      log('error', `API connection failed: ${err.message}`)
      resolve(false)
    })
  })
}

async function checkDatabase() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://autopilot_user:changeme@localhost:5432/autopilot',
  })

  try {
    const result = await pool.query('SELECT NOW()')
    log('ok', `PostgreSQL connected (${result.rows[0].now})`)

    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `)

    const tableCount = tables.rows.length
    if (tableCount > 0) {
      log('ok', `Database has ${tableCount} tables`)
    } else {
      log('error', 'No tables found - run npm run db:migrate')
    }

    const users = await pool.query('SELECT COUNT(*) FROM users')
    const links = await pool.query('SELECT COUNT(*) FROM smart_links')
    log('ok', `Found ${users.rows[0].count} users, ${links.rows[0].count} links`)

    await pool.end()
    return true
  } catch (error) {
    log('error', `Database connection failed: ${error.message}`)
    return false
  }
}

async function checkEnvironment() {
  const required = ['DATABASE_URL', 'NODE_ENV']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length === 0) {
    log('ok', 'Environment variables configured')
    return true
  }

  log('error', `Missing env vars: ${missing.join(', ')}`)
  return false
}

async function main() {
  console.log('\nAutopilot Setup Verification\n')

  const results = {
    environment: await checkEnvironment(),
    database: await checkDatabase(),
    api: await checkAPI(),
  }

  console.log('\nVerification Results\n')
  console.log(`Environment: ${results.environment ? 'OK' : 'FAILED'}`)
  console.log(`Database:    ${results.database ? 'OK' : 'FAILED'}`)
  console.log(`API:         ${results.api ? 'OK' : 'FAILED'}`)

  const allPassed = Object.values(results).every((value) => value)

  if (allPassed) {
    console.log('\nAll systems operational. Ready to use Autopilot.\n')
    console.log('Access the application:')
    console.log('  Landing:   http://localhost:3000')
    console.log('  Dashboard: http://localhost:3000/dashboard')
    console.log('  API:       http://localhost:3000/api\n')
    process.exit(0)
  }

  console.log('\nSome checks failed. See above for details.\n')
  console.log('For help, see: SETUP_GUIDE.md\n')
  process.exit(1)
}

main().catch((err) => {
  console.error('Verification error:', err)
  process.exit(1)
})
