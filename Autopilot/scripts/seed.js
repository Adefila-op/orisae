#!/usr/bin/env node

/**
 * Seed script for Autopilot database
 * Populates initial test data for development
 */

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://autopilot_user:changeme@localhost:5432/autopilot',
})

async function seed() {
  try {
    console.log('🌱 Seeding database...')

    // Create test user
    const userResult = await pool.query(
      `INSERT INTO users (id, wallet_address, username, display_name, is_creator)
       VALUES (gen_random_uuid(), '0x1234567890123456789012345678901234567890', 'testcreator', 'Test Creator', true)
       RETURNING id`
    )

    const userId = userResult.rows[0].id
    console.log(`✅ Created test user: ${userId}`)

    // Create test products
    const productResult = await pool.query(
      `INSERT INTO products (id, creator_id, title, description, price)
       VALUES 
       (gen_random_uuid(), $1, 'Digital Course', 'Advanced course on digital products', 99.99),
       (gen_random_uuid(), $1, 'E-book', 'Marketing guide for creators', 29.99)
       RETURNING id`
    )

    console.log(`✅ Created ${productResult.rows.length} products`)

    // Create test links
    const linkResult = await pool.query(
      `INSERT INTO smart_links (id, creator_id, code, short_url, target_url, offer_type, offer_value)
       VALUES 
       (gen_random_uuid(), $1, 'ABC123', 'https://autopilot.app/l/ABC123', 'https://example.com/product1', 'recovery', 15),
       (gen_random_uuid(), $1, 'DEF456', 'https://autopilot.app/l/DEF456', 'https://example.com/product2', 'discount', 10)
       RETURNING id`
    )

    console.log(`✅ Created ${linkResult.rows.length} smart links`)

    console.log('🎉 Database seeding complete!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
