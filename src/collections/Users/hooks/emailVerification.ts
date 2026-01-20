import crypto from 'crypto'

/**
 * Generate a secure verification token
 */
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate an 8-character verification code (uppercase alphanumeric)
 */
export function generateVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Hash a verification code for storage
 */
export function hashVerificationCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

/**
 * Verify a code against a hash
 */
export function verifyCode(code: string, hash: string): boolean {
  const codeHash = hashVerificationCode(code)
  return crypto.timingSafeEqual(Buffer.from(codeHash), Buffer.from(hash))
}

/**
 * Check if a verification token is expired (24 hours)
 */
export function isVerificationExpired(expireTimestamp?: number | null): boolean {
  if (!expireTimestamp) return true
  return Date.now() > expireTimestamp
}
