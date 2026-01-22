import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

import midtransClient from 'midtrans-client'

/**
 * Midtrans Payment Notification Handler
 * Handles payment status updates from Midtrans
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const notification = await req.json()

    // Initialize Midtrans API client
    const apiClient = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    // Verify notification signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || ''
    const orderId = notification.order_id
    const statusCode = notification.status_code
    const grossAmount = notification.gross_amount
    const signatureKey = notification.signature_key

    const hash = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex')

    if (hash !== signatureKey) {
      console.error('Invalid signature for notification:', orderId)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Get transaction status from Midtrans
    const transactionStatus = await apiClient.transaction.notification(notification)

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
      console.error('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const order = orders.docs[0]

    // Update order based on transaction status
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

    // Update order
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: {
        status: orderStatus,
        paymentInfo: {
          ...order.paymentInfo,
          paymentStatus,
          transactionId: transactionStatus.transaction_id,
          paymentMethod: transactionStatus.payment_type,
          paidAt: paymentStatus === 'paid' ? new Date().toISOString() : order.paymentInfo?.paidAt,
        },
      },
    })

    console.log(`Order ${orderId} updated: ${paymentStatus}`)

    return NextResponse.json({
      success: true,
      orderId,
      paymentStatus,
      orderStatus,
    })
  } catch (error) {
    console.error('Error processing Midtrans notification:', error)
    return NextResponse.json(
      {
        error: 'Failed to process notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
