import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import midtransClient from 'midtrans-client'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { orderId, paymentMethod } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      throw new Error('Midtrans credentials not configured')
    }

    if (!order.shipping) {
      return NextResponse.json({ error: 'Order shipping information is missing' }, { status: 400 })
    }

    if (!order.user) {
      return NextResponse.json({ error: 'Order user information is missing' }, { status: 400 })
    }

    let userEmail: string
    if (typeof order.user === 'string') {
      const userData = await payload.findByID({
        collection: 'app-users',
        id: order.user,
      })
      userEmail = userData.email
    } else {
      userEmail = order.user.email
    }

    const snap = new midtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    // Map user friendly payment methods to Midtrans enabled_payments
    const enabledPaymentsMap: Record<string, string[]> = {
      bank_transfer: ['other_va', 'bca_va', 'bni_va', 'bri_va', 'permata_va'],
      credit_card: ['credit_card'],
      e_wallet: ['gopay', 'shopeepay', 'qris'],
    }

    const midtransOrderId = `${order.orderNumber}-T${Date.now()}`

    const parameter: {
      transaction_details: {
        order_id: string
        gross_amount: number
      }
      customer_details: {
        first_name: string
        email: string
        phone: string
      }
      enabled_payments?: string[]
    } = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(order.summary.totalAmount),
      },
      customer_details: {
        first_name: order.shipping.recipientName!,
        email: userEmail,
        phone: order.shipping.phoneNumber!,
      },
    }

    // If a specific payment method is selected, restrict it in Snap
    if (paymentMethod && enabledPaymentsMap[paymentMethod]) {
      parameter.enabled_payments = enabledPaymentsMap[paymentMethod]
    }

    const transaction = await snap.createTransaction(parameter)

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        paymentInfo: {
          ...order.paymentInfo,
          paymentMethod: paymentMethod,
          midtransOrderId: midtransOrderId,
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
