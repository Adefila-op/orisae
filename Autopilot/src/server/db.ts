import pg from 'pg'

const { Pool } = pg
type PgPool = InstanceType<typeof Pool>

declare global {
  // eslint-disable-next-line no-var
  var __autopilotPool: PgPool | undefined
}

function createPool() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required')
  }

  return new Pool({
    connectionString,
  })
}

function getPool() {
  if (global.__autopilotPool) {
    return global.__autopilotPool
  }

  const pool = createPool()

  if (process.env.NODE_ENV !== 'production') {
    global.__autopilotPool = pool
  }

  return pool
}

export const db = {
  query: (...args: Parameters<PgPool['query']>) => getPool().query(...args),
}
