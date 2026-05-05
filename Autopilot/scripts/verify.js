#!/usr/bin/env node

/**
 * Autopilot Setup Verification Script
 * Tests that all components are properly configured and running
 */

const http = require('http')
const { Pool } = require('pg')

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

function log(status, message) {
  const symbol = status === 'ok' ? '✅' : status === 'error' ? '❌' : '⚠️'
  console.log(`${symbol} ${message}`)
}

async function checkAPI() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/health', (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data)
            log('ok', `API Server running on port 3001 (${json.status})`)
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

    // Check tables exist
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

    // Check if demo data exists
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

async function checkRedis() {
  const Redis = require('ioredis')
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  })

  return new Promise((resolve) => {
    redis.on('connect', () => {
      log('ok', 'Redis connected')
      redis.quit()
      resolve(true)
    })
    redis.on('error', (err) => {
      log('error', `Redis connection failed: ${err.message}`)
      resolve(false)
    })
  })
}

async function checkEnvironment() {
  const required = ['DATABASE_URL', 'NODE_ENV']
  const missing = required.filter((key) => !process.env[key])

  if (missing.length === 0) {
    log('ok', 'Environment variables configured')
    return true
  } else {
    log('error', `Missing env vars: ${missing.join(', ')}`)
    return false
  }
}

async function main() {
  console.log('\n🔍 Autopilot Setup Verification\n')

  const results = {
    environment: await checkEnvironment(),
    database: await checkDatabase(),
    redis: await checkRedis(),
    api: await checkAPI(),
  }

  console.log('\n📊 Verification Results\n')
  console.log(`Environment: ${results.environment ? '✅ OK' : '❌ FAILED'}`)
  console.log(`Database:    ${results.database ? '✅ OK' : '❌ FAILED'}`)
  console.log(`Redis:       ${results.redis ? '✅ OK' : '❌ FAILED'}`)
  console.log(`API:         ${results.api ? '✅ OK' : '❌ FAILED'}`)

  const allPassed = Object.values(results).every((v) => v)

  if (allPassed) {
    console.log('\n✅ All systems operational! Ready to use Autopilot.\n')
    console.log('Access the application:')
    console.log('  Landing:  http://localhost:3000')
    console.log('  Dashboard: http://localhost:3000/dashboard')
    console.log('  API:      http://localhost:3001/api\n')
    process.exit(0)
  } else {
    console.log('\n❌ Some checks failed. See above for details.\n')
    console.log('For help, see: SETUP_GUIDE.md\n')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Verification error:', err)
  process.exit(1)
})
