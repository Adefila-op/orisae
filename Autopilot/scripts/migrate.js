import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://autopilot_user:changeme@localhost:5432/autopilot',
})

async function migrate() {
  try {
    console.log('Starting database migration...')
    
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf-8')
    
    await pool.query(schema)
    
    console.log('✅ Database migration completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
