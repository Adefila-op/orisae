import express, { Router } from 'express'
import { db } from '../server'
import linkService from '../services/link-service'
import { v4 as uuidv4 } from 'uuid'

const router: Router = express.Router()

// Track click event - Safe version that respects bot detection and privacy
router.post('/click', async (req, res) => {
  try {
    const {
      link_code,
      browser_info,
      device_type,
      ip_address,
      referrer,
      utm_source,
      utm_campaign,
      utm_medium,
      user_address,
      is_legitimate,
      user_agent_info,
    } = req.body

    if (!link_code) {
      return res.status(400).json({ error: 'link_code is required' })
    }

    // Check for bot-like behavior in user agent
    const userAgent = req.get('user-agent') || ''
    const clientType = req.get('X-Client-Type') || ''
    
    // Only warn (don't block) but do log suspicious requests
    if (clientType !== 'web') {
      console.warn('⚠️ Suspicious click from non-web client:', link_code)
    }

    // Get link
    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Record event with safety info
    await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type, browser_info, device_type,
        ip_address, referrer, utm_source, utm_campaign, utm_medium, intent_signals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        uuidv4(),
        link.id,
        user_address || null,
        'click',
        JSON.stringify({
          ...browser_info,
          user_agent_info,
          is_legitimate,
        }),
        device_type || 'unknown',
        ip_address || null,
        referrer || null,
        utm_source || null,
        utm_campaign || null,
        utm_medium || null,
        JSON.stringify({
          client_type: clientType,
          safe_user_agent: user_agent_info,
        }),
      ]
    )

    // Update link stats - only count legitimate clicks
    if (is_legitimate !== false) {
      await linkService.updateLinkStats(link.id, 'click')
    }

    console.log('✅ Click tracked (legitimate):', link_code)

    // Redirect to target URL
    res.json({
      redirect: link.target_url,
      link_id: link.id,
      offer_type: link.offer_type,
      offer_value: link.offer_value,
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Track conversion event - CRITICAL: Final purchase event
router.post('/conversion', async (req, res) => {
  try {
    const { link_code, user_address, amount, is_legitimate, conversion_timestamp, order_info } = req.body

    if (!link_code) {
      return res.status(400).json({ error: 'link_code is required' })
    }

    if (typeof amount !== 'number' || amount < 0 || amount > 999999) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    // Get link
    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    // Validate that conversion is from legitimate source
    const isBot = req.get('X-Client-Type') !== 'web'
    const userAgent = req.get('user-agent') || ''
    const botPatterns = ['bot', 'crawler', 'spider', 'curl', 'wget', 'python', 'headless']
    const appearsToBeBot = botPatterns.some(p => userAgent.toLowerCase().includes(p))

    if (appearsToBeBot && !is_legitimate) {
      return res.status(403).json({ error: 'Request rejected: bot-like behavior' })
    }

    // Log conversion for audit trail
    console.log('💰 CONVERSION EVENT:', {
      link_code,
      amount,
      timestamp: conversion_timestamp || new Date().toISOString(),
      user_agent: userAgent.substring(0, 50), // Log only first 50 chars
    })

    // Record conversion event with full details
    const result = await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type, intent_signals
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        uuidv4(),
        link.id,
        user_address || null,
        'conversion',
        JSON.stringify({
          amount,
          is_legitimate,
          timestamp: conversion_timestamp,
          order_info: order_info || {},
          user_agent_safe: userAgent.substring(0, 30),
        }),
      ]
    )

    // Update link stats - THIS IS THE CRITICAL UPDATE
    await linkService.updateLinkStats(link.id, 'conversion', amount)

    // Trigger purchase notification to creator
    try {
      const { notificationService } = await import('../services/notification-service')
      const notifResult = await notificationService.notifyConversion(
        link.creator_id,
        link_code,
        `Purchase via ${link.platform || 'Smart Link'}`,
        amount
      )

      console.log('✅ CONVERSION RECORDED AND NOTIFIED:', link_code, `$${amount}`)

      res.json({
        success: true,
        message: 'Conversion recorded',
        link_id: link.id,
        notification_id: notifResult?.id,
        amount,
        timestamp: new Date().toISOString(),
      })
    } catch (notifError) {
      console.error('⚠️ Notification failed but conversion was recorded:', notifError)
      res.json({
        success: true,
        message: 'Conversion recorded',
        link_id: link.id,
        amount,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error: any) {
    console.error('❌ Error recording conversion:', error.message)
    res.status(500).json({ error: error.message })
  }
})

// Track abandoned cart
router.post('/abandon', async (req, res) => {
  try {
    const { link_code, user_address } = req.body

    if (!link_code) {
      return res.status(400).json({ error: 'link_code is required' })
    }

    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    await db.query(
      `INSERT INTO user_events (
        id, link_id, user_address, event_type
      ) VALUES ($1, $2, $3, $4)`,
      [uuidv4(), link.id, user_address || null, 'abandoned']
    )

    res.json({ success: true, message: 'Abandon event recorded' })
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

// Get events for a link
router.get('/:link_code', async (req, res) => {
  try {
    const { link_code } = req.params

    const link = await linkService.getLink(link_code)
    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    const result = await db.query(
      `SELECT * FROM user_events 
       WHERE link_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [link.id]
    )

    res.json(result.rows)
  } catch (error: any) {
    res.status(500).json({ error: error.message })
  }
})

export default router
