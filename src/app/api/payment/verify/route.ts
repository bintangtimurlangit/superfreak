import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { headers } from 'next/headers'
import { getMidtransCore } from '@/lib/midtrans'
import { withApiLogger } from '@/lib/api-logger'

/**
 * Verify payment status with Midtrans after user returns from payment
 * This is a secure backend check - only called when user returns from Midtrans
 * The actual payment status is verified with Midtrans API, not from client
 */
export const POST = withApiLogger(async function verifyPayment(request: NextRequest) {
  try {
    const payload = await getPayload()
    const requestHeaders = await headers()

    const { user } = await payload.auth({ headers: requestHeaders })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the order and verify it belongs to the user
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      req: {
        user,
        payload,
        headers: requestHeaders,
      } as any,
      overrideAccess: false, // Enforce access control
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify with Midtrans API using CoreApi (server-side verification)
    const core = getMidtransCore()
    const midtransOrderId = order.paymentInfo?.midtransOrderId || order.orderNumber!
    const transactionStatus = await core.transaction.status(midtransOrderId)

    // Update order based on verified transaction status from Midtrans
    let paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' = 'pending'
    let orderStatus = order.status

    if (transactionStatus.transaction_status === 'capture') {
      if (transactionStatus.fraud_status === 'accept') {
        paymentStatus = 'paid'
        orderStatus = 'in-review'
      }
    } else if (transactionStatus.transaction_status === 'settlement') {
      paymentStatus = 'paid'
      orderStatus = 'in-review'
    } else if (
      transactionStatus.transaction_status === 'cancel' ||
      transactionStatus.transaction_status === 'deny' ||
      transactionStatus.transaction_status === 'expire'
    ) {
      paymentStatus = 'failed'
      orderStatus = 'canceled'
    } else if (transactionStatus.transaction_status === 'pending') {
      paymentStatus = 'pending'
    } else if (transactionStatus.transaction_status === 'refund') {
      paymentStatus = 'refunded'
    }

    // Map Midtrans payment_type to our paymentMethod enum
    const mapPaymentMethod = (
      midtransType: string,
    ): 'bank_transfer' | 'credit_card' | 'e_wallet' | undefined => {
      if (midtransType === 'credit_card' || midtransType === 'debit_card') {
        return 'credit_card'
      } else if (
        midtransType === 'bank_transfer' ||
        midtransType === 'echannel' ||
        midtransType === 'bca_va' ||
        midtransType === 'bni_va' ||
        midtransType === 'permata_va' ||
        midtransType === 'other_va'
      ) {
        return 'bank_transfer'
      } else if (
        midtransType === 'gopay' ||
        midtransType === 'shopeepay' ||
        midtransType === 'qris'
      ) {
        return 'e_wallet'
      }
      return undefined
    }

    // Only update if status changed
    if (paymentStatus !== order.paymentInfo?.paymentStatus || orderStatus !== order.status) {
      const paymentMethod = mapPaymentMethod(transactionStatus.payment_type || '')

      await payload.update({
        collection: 'orders',
        id: order.id,
        data: {
          status: orderStatus,
          paymentInfo: {
            ...order.paymentInfo,
            paymentStatus,
            transactionId: transactionStatus.transaction_id,
            ...(paymentMethod && { paymentMethod }), // Only include if we have a valid mapping
            paidAt: paymentStatus === 'paid' ? new Date().toISOString() : order.paymentInfo?.paidAt,
          },
        },
      })

      console.log(`[Payment Verify] Order ${order.orderNumber} updated: ${paymentStatus}`)
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentStatus,
      orderStatus,
      transactionStatus: transactionStatus.transaction_status,
    })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        details: error.message || 'Unknown error',
      },
      { status: 500 },
    )
  }
})
