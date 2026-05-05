import express, { Express, Request, Response, NextFunction } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { Pool } from 'pg'
import Redis from 'ioredis'
import { Queue, Worker } from 'bullmq'

// Import routes
import linkRoutes from './routes/links'
import linkGeneratorRoutes from './routes/link-generator'
import eventRoutes from './routes/events'
import intentRoutes from './routes/intent'
import notificationRoutes from './routes/notifications'
import analyticsRoutes from './routes/analytics'

// Import workers
import startEmailWorker from './workers/email-worker'
import startNotificationWorker from './workers/notification-worker'
import startAnalyticsWorker, { scheduleAnalyticsAggregation } from './workers/analytics-worker'

// Load environment variables
dotenv.config()

const app: Express = express()
const port = process.env.API_PORT || 3001

// Database connection pool
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
})

// Redis client
export const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  db: 0,
})

// BullMQ Job Queues
export const emailQueue = new Queue('emails', {
  connection: redis,
})

export const notificationQueue = new Queue('notifications', {
  connection: redis,
})

export const analyticQueue = new Queue('analytics', {
  connection: redis,
})

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://autopilot.app', 'https://orisae-main.vercel.app']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  next()
})

// Security and tracking safety headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Don't trigger security blocks by adding suspicious headers
  // Just add standard ones that won't flag platforms
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  })
  
  // Log suspicious patterns for conversion events only
  if (req.path === '/api/events/conversion') {
    const userAgent = req.get('user-agent') || ''
    const referer = req.get('referer') || ''
    
    // Log for monitoring, don't block
    if (userAgent.length < 10 || userAgent.length > 500) {
      console.warn('⚠️ Unusual user agent length for conversion event')
    }
  }
  
  next()
})

// Health check with database verification
app.get('/health', async (req: Request, res: Response) => {
  try {
    await db.query('SELECT NOW()')
    res.json({ 
      status: 'ok', 
      timestamp: new Date(),
      database: 'connected',
      redis: redis.status
    })
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: (error as any).message
    })
  }
})

// API status endpoint
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    api: 'running',
    version: '1.0.0',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
  })
})

// API Routes
app.use('/api/links', linkRoutes)
app.use('/api/links', linkGeneratorRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/intent', intentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/analytics', analyticsRoutes)

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date(),
  })
})

// Database connection check
db.on('error', (err) => {
  console.error('❌ Database pool error:', err)
})

db.on('connect', () => {
  console.log('✅ Database pool connected')
})

// Store worker instances for cleanup
let emailWorker: Worker | null = null
let notificationWorker: Worker | null = null
let analyticsWorker: Worker | null = null

// Start server
const server = app.listen(port, async () => {
  console.log(`🚀 Autopilot API Server running on http://localhost:${port}`)
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📊 Database: ${process.env.DATABASE_URL || 'postgresql://localhost:5432/autopilot'}`)
  console.log(`🔴 Redis: ${process.env.REDIS_URL || 'redis://localhost:6379'}`)
  
  // Test database connection
  try {
    await db.query('SELECT NOW()')
    console.log('✅ Database connection verified')
  } catch (error) {
    console.error('⚠️ Database connection failed:', (error as any).message)
  }

  // Test Redis connection
  try {
    await redis.ping()
    console.log('✅ Redis connection verified')
  } catch (error) {
    console.error('⚠️ Redis connection failed:', (error as any).message)
  }

  // Start background workers
  try {
    console.log('\n🚀 Starting background workers...')
    emailWorker = await startEmailWorker()
    notificationWorker = await startNotificationWorker()
    analyticsWorker = await startAnalyticsWorker()
    await scheduleAnalyticsAggregation()
    console.log('✅ All workers started successfully\n')
  } catch (error) {
    console.error('❌ Failed to start workers:', (error as any).message)
  }
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...')
  
  // Close workers
  if (emailWorker) {
    console.log('Closing email worker...')
    await emailWorker.close()
  }
  if (notificationWorker) {
    console.log('Closing notification worker...')
    await notificationWorker.close()
  }
  if (analyticsWorker) {
    console.log('Closing analytics worker...')
    await analyticsWorker.close()
  }
  
  // Close queues
  console.log('Closing job queues...')
  await emailQueue.close()
  await notificationQueue.close()
  await analyticQueue.close()
  
  // Close connections
  console.log('Closing database connection...')
  await db.end()
  
  console.log('Closing Redis connection...')
  await redis.quit()
  
  console.log('✅ Graceful shutdown complete')
  process.exit(0)
})

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

export default app
