import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import midtransClient from 'midtrans-client'
import { withApiLogger } from '@/lib/api-logger'

/**
 * Midtrans Payment Notification Handler
 * Handles payment status updates from Midtrans webhook
 * Reference: https://docs.midtrans.com/en/after-payment/http-notification
 */
export const POST = withApiLogger(async function midtransNotification(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const notification = await req.json()

    // Initialize Midtrans CoreApi client (not Snap) for transaction operations
    // Reference: Official Midtrans example uses CoreApi for notifications
    const core = new midtransClient.CoreApi({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    // Verify and get transaction status from Midtrans
    // This method internally validates the signature
    const transactionStatus = await core.transaction.notification(notification)

    const orderId = transactionStatus.order_id

    // Find order by order number
    const orders = await payload.find({
      collection: 'orders',
      where: {
        orderNumber: {
          equals: orderId,
        },
      },
      limit: 1,
    })

    if (orders.docs.length === 0) {
      console.error('[Midtrans Notification] Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders.docs[0]

    // Map Midtrans transaction status to our order status
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

    const paymentMethod = mapPaymentMethod(transactionStatus.payment_type || '')

    // Update order with payment status
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

    console.log(`[Midtrans Notification] Order ${orderId} updated: ${paymentStatus}`)

    return NextResponse.json({
      success: true,
      orderId,
      paymentStatus,
      orderStatus,
    })
  } catch (error) {
    console.error('[Midtrans Notification] Error processing notification:', error)
    return NextResponse.json(
      {
        error: 'Failed to process notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
})
