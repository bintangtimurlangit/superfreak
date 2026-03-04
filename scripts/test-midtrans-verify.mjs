/**
 * Test Midtrans transaction status (same logic as /api/payment/verify).
 * Run from project root with .env loaded. Key never leaves your machine.
 *
 * Usage: node scripts/test-midtrans-verify.mjs <midtrans_order_id>
 * Example: node scripts/test-midtrans-verify.mjs ORD-1772641815050-569
 */

import 'dotenv/config'
import midtransClient from 'midtrans-client'

const midtransOrderId = process.argv[2]
if (!midtransOrderId) {
  console.error('Usage: node scripts/test-midtrans-verify.mjs <midtrans_order_id>')
  console.error('Example: node scripts/test-midtrans-verify.mjs ORD-1772641815050-569')
  process.exit(1)
}

const useSandbox = process.env.MIDTRANS_USE_SANDBOX === 'true'
const serverKey = process.env.MIDTRANS_SERVER_KEY
const clientKey = process.env.MIDTRANS_CLIENT_KEY

if (!serverKey || !clientKey) {
  console.error('Missing MIDTRANS_SERVER_KEY or MIDTRANS_CLIENT_KEY in .env')
  process.exit(1)
}

console.log('Config: useSandbox =', useSandbox, '| endpoint =', useSandbox ? 'sandbox' : 'production')
console.log('Fetching status for:', midtransOrderId)

const core = new midtransClient.CoreApi({
  isProduction: !useSandbox,
  serverKey,
  clientKey,
})

try {
  const status = await core.transaction.status(midtransOrderId)
  console.log('OK:', status.transaction_status, status)
} catch (err) {
  console.error('Error:', err.message)
  if (err.httpStatusCode) console.error('HTTP', err.httpStatusCode)
  if (err.ApiResponse) console.error('API response:', err.ApiResponse)
  process.exit(1)
}
