/**
 * Demo authentication helper for local development
 * Simulates authentication without requiring wallet connection
 */

export interface DemoUser {
  id: string
  wallet_address: string
}

const DEMO_USER: DemoUser = {
  id: process.env.DEMO_USER_ID || '550e8400-e29b-41d4-a716-446655440000',
  wallet_address: process.env.DEMO_WALLET_ADDRESS || '0x1234567890123456789012345678901234567890',
}

export function getDemoToken(): string {
  // Return a JWT-like token for development
  // In production, this would come from actual wallet connection
  return `Bearer ${Buffer.from(JSON.stringify(DEMO_USER)).toString('base64')}`
}

export function getDemoUser(): DemoUser {
  return DEMO_USER
}

export function getDemoAuthHeader(): Record<string, string> {
  return {
    'Authorization': getDemoToken(),
  }
}

export function isDevMode(): boolean {
  return process.env.NODE_ENV === 'development'
}
