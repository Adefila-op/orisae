/**
 * CONVERSION TRACKING GUIDE
 * 
 * This document explains how the Autopilot system safely tracks final purchases
 * while avoiding platform blocks and respecting user privacy.
 * 
 * ============================================================================
 * KEY FEATURES FOR SAFE CONVERSION TRACKING
 * ============================================================================
 * 
 * 1. BOT DETECTION & PREVENTION
 *    - Detects common bot user agents: Selenium, Puppeteer, Headless Chrome, etc.
 *    - Checks for headless browser indicators (navigator.webdriver, missing APIs)
 *    - Validates that tracking comes from actual browser environment
 *    - If bot detected: Tracking is SKIPPED (request succeeds but data not tracked)
 * 
 * 2. PRIVACY COMPLIANCE
 *    - Respects Do Not Track (DNT) header from browser
 *    - Only sends generic browser/OS info (not full user agent string)
 *    - Uses anonymous session IDs instead of fingerprinting
 *    - Never stores or tracks sensitive personal data
 *    - Logs only first 50 characters of user agent for audit
 * 
 * 3. USER INTERACTION VALIDATION
 *    - Conversion only tracked if:
 *      ✓ User interaction appears legitimate (is_legitimate flag)
 *      ✓ User actually clicked the link (session data present)
 *      ✓ Amount is valid (0-999999)
 *      ✓ Request came from web client
 *    - If any validation fails: Request rejected with error
 * 
 * 4. SAFE USER-AGENT HANDLING
 *    - Extracts only: Browser type (Chrome, Safari, Firefox, Edge)
 *    - Extracts only: OS type (Windows, macOS, Linux, Android, iOS)
 *    - Never sends raw user agent string to avoid fingerprinting
 *    - Prevents issues with tools that block aggressive tracking
 * 
 * 5. RATE LIMITING & REQUEST SAFETY
 *    - Click tracking: 5 second timeout (won't tie up connections)
 *    - Conversion tracking: 10 second timeout (allows time for proper processing)
 *    - Sends minimal headers (X-Client-Type, X-Tracking-Version, X-Event-Priority)
 *    - Headers are standard and won't trigger platform blocks
 *    - Adds small delays (100ms) between tracking and redirect
 * 
 * 6. PLATFORM-SAFE CORS HEADERS
 *    - Uses standard CORS headers that don't trigger blocks
 *    - Includes: X-Content-Type-Options, X-Frame-Options, HSTS
 *    - Avoids suspicious header combinations that trigger blocks
 *    - Works with all major e-commerce platforms
 * 
 * ============================================================================
 * CONVERSION TRACKING FLOW
 * ============================================================================
 * 
 * STEP 1: User clicks trackable link
 *   └─ Frontend calls trackClick(linkCode)
 *   └─ Checks if interaction is legitimate
 *   └─ If not legitimate (bot, DNT enabled): Skips tracking, still redirects
 *   └─ If legitimate: Sends to /api/events/click
 *   └─ Stores session data: { link_code, offer_type, offer_value }
 *   └─ Redirects to product URL
 * 
 * STEP 2: User makes purchase on product page
 *   └─ Product page calls trackConversion(linkCode, amount, orderInfo)
 *   └─ Frontend validates:
 *      ✓ Amount is valid number (0-999999)
 *      ✓ Session data exists (user did click the link)
 *      ✓ No bot indicators present
 *      ✓ DNT not enabled
 *   └─ Sends to /api/events/conversion with high priority
 * 
 * STEP 3: Backend records conversion
 *   └─ Server receives conversion event
 *   └─ Validates X-Client-Type header = 'web'
 *   └─ Checks user agent doesn't appear bot-like\n *   └─ Records event: user_events table with full details\n *   └─ Updates link stats: conversion_count, total_value\n *   └─ Triggers creator notification immediately\n *   └─ Returns success with notification_id\n *\n * STEP 4: Creator gets notified\n *   └─ Notification queued to notification-worker\n *   └─ In-app notification created\n *   └─ Email sent via email-worker\n *   └─ Creator sees: \"Purchase of $X via [Platform] Link\"\n *\n * ============================================================================\n * USAGE EXAMPLES\n * ============================================================================\n *\n * TRACKING A CLICK (on product link page):\n * ─────────────────────────────────────────\n * import { trackClick } from '@/lib/tracking'\n *\n * <a href=\"#\" onClick={() => trackClick('ABC123', 'https://gumroad.com/...')}>\n *   Buy Now\n * </a>\n *\n *\n * TRACKING A FINAL PURCHASE (on success page after payment):\n * ─────────────────────────────────────────────────────────\n * import { trackConversion } from '@/lib/tracking'\n *\n * // Called after successful payment\n * const result = await trackConversion('ABC123', 49.99, {\n *   orderId: 'order_123',\n *   productId: 'product_456',\n *   customerId: 'customer_789'\n * })\n *\n * if (result.success) {\n *   console.log('Purchase recorded. Notification sent to creator')\n *   // Show success message to customer\n * } else {\n *   console.error('Failed to record purchase')\n *   // Still show success to customer - don't punish them\n *   // Creator will get revenue eventually even if tracking fails\n * }\n *\n *\n * ============================================================================\n * WHAT GETS TRACKED\n * ============================================================================\n *\n * FOR EACH CLICK:\n *   - link_code (which trackable link)\n *   - device_type (mobile/tablet/desktop)\n *   - referrer (where user came from)\n *   - utm_source, utm_campaign, utm_medium (marketing source)\n *   - browser type & OS (safe version, not fingerprint)\n *   - is_legitimate (true if human, false if bot)\n *\n * FOR EACH CONVERSION:\n *   - link_code (which trackable link led to purchase)\n *   - amount (purchase price)\n *   - device_type (mobile/tablet/desktop)\n *   - conversion_timestamp (when purchase happened)\n *   - order_info (optional: orderId, productId, customerId)\n *   - browser type & OS (safe version)\n *   - is_legitimate (true if human detected)\n *\n * WHAT NEVER GETS TRACKED:\n *   - Full user agent string ❌\n *   - IP address (not used) ❌\n *   - Browsing fingerprint ❌\n *   - Email addresses ❌\n *   - Payment method details ❌\n *   - Personal identifying information ❌\n *\n *\n * ============================================================================\n * HANDLING FAILURES\n * ============================================================================\n *\n * CLICK TRACKING FAILS:\n *   - User still redirects to product page\n *   - No data loss\n *   - Payment can still happen (tracking separate from transaction)\n *   - Retry happens next time user clicks\n *\n * CONVERSION TRACKING FAILS:\n *   - User sees success message (they paid successfully)\n *   - Event is retried every 30 seconds for 24 hours\n *   - If it ultimately fails, creator still gets payment\n *   - Just missing notification and analytics\n *   - Better to miss notification than fail customer purchase!\n *\n *\n * ============================================================================\n * TESTING IN DEVELOPMENT\n * ============================================================================\n *\n * To test tracking without actually processing requests:\n *\n * 1. Set NEXT_PUBLIC_API_URL environment variable\n * 2. Enable logging in browser console\n * 3. Click a trackable link - should see:\n *    ✅ Click tracked: ABC123\n *\n * 4. Call trackConversion on your test page:\n *    const result = await trackConversion('ABC123', 49.99)\n *    console.log(result)\n *\n * 5. Check server logs for:\n *    💰 Sending conversion event: ABC123 $49.99\n *    ✅ CONVERSION RECORDED: ABC123 $49.99\n *    🎉 Purchase notification sent to creator\n *\n *\n * ============================================================================\n * MONITORING & DEBUGGING\n * ============================================================================\n *\n * Check browser console for:\n *   ✅ = Successful tracking\n *   ❌ = Tracking failed\n *   ⚠️  = Potential issue\n *   🔒 = Privacy setting prevented tracking (DNT)\n *   🤖 = Bot detected\n *\n * Check server logs for:\n *   💰 CONVERSION EVENT = Purchase tracked\n *   ❌ Error recording conversion = Server-side error\n *   ⚠️  Unusual user agent length = Potential issue\n *   ⚠️  Non-web client = May be bot or proxy\n *\n *\n * ============================================================================\n * PRIVACY & COMPLIANCE\n * ============================================================================\n *\n * This tracking system is designed to be:\n *\n * ✅ GDPR Compliant\n *    - Minimal data collection\n *    - No fingerprinting\n *    - Anonymous session IDs\n *    - Respects DNT header\n *\n * ✅ CCPA Compliant\n *    - Users can opt-out via DNT\n *    - No personal data collected\n *    - Clear about what's tracked\n *\n * ✅ ePrivacy Compliant\n *    - Respects browser privacy settings\n *    - No cross-site tracking\n *    - No sensitive data collection\n *\n * ✅ Platform-Safe\n *    - Works with Gumroad, Stripe, Shopify, PayPal, etc.\n *    - Doesn't trigger platform security blocks\n *    - Uses standard HTTP headers\n *    - No aggressive tracking patterns\n *\n *\n * ============================================================================\n * EMERGENCY PROCEDURES\n * ============================================================================\n *\n * IF CONVERSIONS AREN'T TRACKING:\n *\n * 1. Check browser console for errors\n *    - Is API endpoint reachable?\n *    - Is link_code valid?\n *    - Is amount valid number?\n *\n * 2. Check server logs\n *    - Is /api/events/conversion receiving requests?\n *    - Are there validation errors?\n *    - Is database connection working?\n *\n * 3. Check database\n *    - SELECT * FROM user_events WHERE event_type = 'conversion' ORDER BY created_at DESC;\n *    - Are events being created?\n *\n * 4. Check link stats\n *    - SELECT conversion_count, total_value FROM smart_links WHERE code = 'ABC123';\n *    - Are counts being updated?\n *\n * IF TRACKING IS BEING BLOCKED:\n *\n * 1. Check platform security settings\n *    - Is API domain whitelisted?\n *    - Are CORS headers correct?\n *\n * 2. Check for suspicious patterns\n *    - Are requests coming from different IPs?\n *    - Are there too many requests too quickly?\n *\n * 3. Add rate limiting\n *    - Batch conversion requests if many happening\n *    - Add 100-500ms delay between requests\n *\n * 4. Contact platform support\n *    - Explain tracking is for revenue attribution\n *    - Show it respects DNT and user privacy\n *    - Provide server logs as evidence\n *\n *\n * ============================================================================\n * VERSION HISTORY\n * ============================================================================\n *\n * v2.0 (Current)\n *   - Added bot detection\n *   - Added privacy compliance\n *   - Added safe user-agent handling\n *   - Added conversion validation\n *   - Improved error handling\n *   - Respects Do Not Track header\n *\n * v1.0\n *   - Basic click and conversion tracking\n *   - Session storage of link data\n */\n