import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import midtransClient from 'midtrans-client'

/**
 * Initialize Midtrans payment for an existing order
 * POST /api/payment/initialize
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { orderId } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify Midtrans credentials
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      throw new Error('Midtrans credentials not configured')
    }

    // Initialize Midtrans Snap
    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    // Prepare transaction parameters
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(order.summary.totalAmount),
      },
      customer_details: {
        first_name: order.shipping.recipientName,
        email: order.user.email,
        phone: order.shipping.phoneNumber,
      },
    }

    // Create Snap transaction
    const transaction = await snap.createTransaction(parameter)

    // Update order with Midtrans details
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        paymentInfo: {
          ...order.paymentInfo,
          midtransOrderId: order.orderNumber,
          midtransSnapToken: transaction.token,
          midtransSnapUrl: transaction.redirect_url,
          paymentExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      },
    })

    return NextResponse.json({
      success: true,
      snapToken: transaction.token,
      snapUrl: transaction.redirect_url,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error initializing payment:', error)
    return NextResponse.json(
      {
        error: 'Failed to initialize payment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
