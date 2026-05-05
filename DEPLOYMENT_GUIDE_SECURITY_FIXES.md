# Orisae Platform - Deployment & Testing Guide

Quick reference for deploying the security-patched version of Orisae.

## 1. Smart Contract Deployment

### Update IPMarketplace.sol Constructor Call

The updated `IPMarketplace` contract now requires two parameters:

```solidity
// OLD:
IPMarketplace marketplace = new IPMarketplace(feeCollectorAddress);

// NEW:
IPMarketplace marketplace = new IPMarketplace(
    feeCollectorAddress,
    usdcTokenAddress  // e.g., 0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d on Base
);
```

**USDC Addresses:**
- Base Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b1566469c3d`
- Base Sepolia: `0x1c7D4B196Cb0C6f48185d2A3d234B67aEfA89467`

### Deploy Script Updates

Update `scripts/deploy.js` to pass the USD token address:

```javascript
const marketplace = await IPMarketplace.deploy(
    feeCollectorAddress,
    usdcTokenAddress
);
```

### After Deployment

1. Save contract addresses to environment variables:
```bash
VITE_CREATOR_REGISTRY_ADDRESS=0x...
VITE_IP_MARKETPLACE_ADDRESS=0x...
VITE_IP_TOKENIZATION_ADDRESS=0x...
```

2. Verify on block explorer (BaseScan for Base mainnet)

## 2. Backend Deployment

### Environment Variables

Create a `.env.production` file with:

```bash
# ============= CRITICAL - SET THESE =============
JWT_SECRET=$(openssl rand -base64 32)  # Generate a new secret
CORS_ORIGIN=https://yourdomain.com     # Your frontend URL

# ============= Database =============
DATABASE_URL=postgresql://user:password@host:5432/orisae
# OR for Cloudflare Workers, configure in wrangler.json

# ============= RPC URLs =============
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
VITE_BASE_MAINNET_RPC_URL=https://base.infura.io/v3/YOUR_INFURA_KEY
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# ============= Contract Addresses =============
VITE_CREATOR_REGISTRY_ADDRESS=0x...
VITE_IP_MARKETPLACE_ADDRESS=0x...
VITE_BLOCKCHAIN_NETWORK=base  # or baseSepolia

# ============= Optional =============
ENVIRONMENT=production
ETHERSCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key
```

### Deployment Steps

```bash
# 1. Install dependencies
npm install
# or
bun install

# 2. Run database migrations
npm run db:migrate
# or
bun run db:migrate

# 3. Deploy backend
npm run build
npm run deploy
# or for Vercel/Cloudflare:
vercel deploy --prod
wrangler deploy

# 4. Verify environment variables are set
# Check that JWT_SECRET is configured and strong
# Check that CORS_ORIGIN matches your frontend
```

### Verify Backend is Working

```bash
# Test JWT secret is required
# (This should fail without JWT_SECRET set):
curl https://your-api.com/api/auth/nonce
# Expected: 500 error about missing JWT_SECRET

# With JWT_SECRET set:
curl https://your-api.com/api/auth/nonce
# Expected: 200 response with nonce
```

## 3. Frontend Deployment

### Environment Variables

Create a `.env.production` file:

```bash
VITE_API_URL=https://your-api.com
VITE_CREATOR_REGISTRY_ADDRESS=0x...
VITE_IP_MARKETPLACE_ADDRESS=0x...
VITE_IP_TOKENIZATION_ADDRESS=0x...
VITE_BLOCKCHAIN_NETWORK=base
VITE_BASE_MAINNET_RPC_URL=https://base.infura.io/v3/YOUR_KEY
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
VITE_SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
```

### Build & Deploy

```bash
npm run build
npm run preview

# Deploy to Vercel
vercel deploy --prod

# OR Deploy to Netlify
netlify deploy --prod

# OR Deploy to static hosting
# Copy dist/ to your static host
```

## 4. Security Testing Checklist

### Authentication Tests
- [ ] Login fails if JWT_SECRET is not set (server should crash at startup)
- [ ] Nonce is cryptographically random (not predictable)
- [ ] Tokens expire correctly
- [ ] Invalid tokens are rejected
- [ ] Expired tokens are rejected
- [ ] Users cannot view other users' transaction history

### Token Transfer Tests (Testnet)

1. **Setup:**
   ```bash
   # On Base Sepolia testnet:
   # 1. Deploy contracts
   # 2. Get testnet USDC from faucet
   # 3. Create initial token pool
   ```

2. **Test Buy Transaction:**
   ```bash
   # 1. User approves USDC to marketplace: 
   #    ERC20(usdc).approve(marketplace, amountUSD)
   # 2. Call buyTokens(ipToken, amountUSD)
   # 3. Verify:
   #    - USDC transferred from user to contract
   #    - IP tokens transferred from contract to user
   #    - Pool reserves updated correctly
   #    - Event emitted
   ```

3. **Test Sell Transaction:**
   ```bash
   # 1. User approves IP tokens to marketplace
   # 2. Call sellTokens(ipToken, amountTokens)
   # 3. Verify:
   #    - IP tokens transferred from user to contract
   #    - USDC transferred to user (minus fee)
   #    - Fee transferred to collector
   #    - Pool reserves updated
   ```

### Rate Limiting Tests
- [ ] Auth endpoint rate limits after 5 failed attempts
- [ ] Trading endpoints rate limit after 20 transactions per minute
- [ ] Rate limit headers are sent in responses
- [ ] 429 status code returned when limit exceeded

### CORS Tests
- [ ] Requests from production frontend domain are allowed
- [ ] Requests from other domains are rejected
- [ ] Credentials are sent with requests
- [ ] Preflight requests succeed

## 5. Monitoring & Alerts

### Set Up Alerts For:

1. **JWT_SECRET Missing**
   - Server will crash with clear error message
   - Monitor error logs for startup failures

2. **Token Transfer Failures**
   - Monitor for reverted smart contract transactions
   - Check approval allowances if transfers fail

3. **Rate Limit Spikes**
   - Monitor for unusual trading activity
   - Check for bot attacks

4. **Database Connection Issues**
   - Monitor for transaction rollbacks
   - Verify connection pool health

## 6. Rollback Plan

If critical issues arise:

1. **Backend Rollback:**
   ```bash
   vercel rollback  # or equivalent for your host
   ```

2. **Smart Contract Rollback:**
   - Pause trading via `ownerPause()` if available
   - Direct users to withdraw funds
   - Deploy fixed version to new address

3. **Emergency Response:**
   - Disable CORS_ORIGIN temporarily to stop all traffic
   - Rotate JWT_SECRET to invalidate all tokens
   - Notify users immediately

## 7. Post-Launch Checklist

- [ ] Monitor transaction volumes and pool reserves
- [ ] Verify all fees are collected correctly
- [ ] Check for any error logs
- [ ] Confirm rate limiting is working
- [ ] Verify database is performing well
- [ ] Monitor smart contract state
- [ ] Get formal smart contract audit (before allowing real funds)

## 8. Known Limitations

1. **H-02: Nonce Replay After Server Restart**
   - Current: In-memory nonce store (single instance only)
   - Fix: Implement Redis/Cloudflare KV persistence
   - Impact: Low risk on stable deployments

2. **M-02: Database Schema Compatibility**
   - Current: Supports both SQLite and PostgreSQL
   - Status: Production should standardize on PostgreSQL

3. **M-03: Transaction Atomicity**
   - Current: Sequential operations with error checking
   - Fix: Implement database-level transactions
   - Impact: Minimal risk with current error handling

## Support & Issues

If you encounter issues:

1. Check environment variables are set correctly
2. Verify smart contract addresses match your deployment
3. Check database connectivity
4. Review error logs for specific failures
5. Run tests on testnet before production deployment

---
*Last Updated: 2026-05-05*
*For: Orisae Platform v1.0*
