import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import midtransClient from 'midtrans-client'

interface OrderItem {
  fileId: string
  fileName: string
  fileSize: number
  quantity: number
  configuration: {
    material: string
    color: string
    layerHeight: string
    infill: string
    wallCount: string
  }
  statistics: {
    printTime: number
    filamentWeight: number
  }
}

interface ShippingDetails {
  addressId: string
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2?: string
  villageName: string
  districtName: string
  regencyName: string
  provinceName: string
  postalCode: string
  courier: string
  service: string
  estimatedDelivery: string
  shippingCost: number
  totalWeight: number
}

interface CreateOrderRequest {
  items: OrderItem[]
  shipping: ShippingDetails
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const body: CreateOrderRequest = await req.json()

    // Get authenticated user from Payload (app-users collection)
    const { user } = await payload.auth({ headers: req.headers })

    console.log('Auth result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userCollection: user?.collection,
    })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }

    // Verify user exists in app-users collection
    try {
      const appUser = await payload.findByID({
        collection: 'app-users',
        id: String(user.id),
      })
      console.log('Found app-user:', { id: appUser.id, email: appUser.email })
    } catch (error) {
      console.error('User not found in app-users:', error)
      return NextResponse.json(
        { error: 'User account not found. Please sign in again.' },
        { status: 401 },
      )
    }

    // Get current pricing from CourierSettings
    const courierSettings = await payload.findGlobal({
      slug: 'courier-settings',
    })

    const pricingSettings = courierSettings?.pricingSettings || {
      filamentCostPerGram: 100,
      printTimeCostPerHour: 10000,
      markupPercentage: 30,
    }

    // Calculate pricing for each item
    const itemsWithPricing = body.items.map((item) => {
      const { statistics } = item

      // Calculate costs
      const filamentTotalCost = statistics.filamentWeight * pricingSettings.filamentCostPerGram
      const printTimeTotalCost = (statistics.printTime / 60) * pricingSettings.printTimeCostPerHour
      const basePrice = filamentTotalCost + printTimeTotalCost
      const markupAmount = basePrice * (pricingSettings.markupPercentage / 100)
      const subtotalPerUnit = basePrice + markupAmount

      return {
        file: item.fileId,
        fileName: item.fileName,
        fileSize: item.fileSize,
        quantity: item.quantity,
        configuration: item.configuration,
        statistics: item.statistics,
        pricing: {
          filamentCostPerGram: pricingSettings.filamentCostPerGram,
          filamentTotalCost,
          printTimeCostPerHour: pricingSettings.printTimeCostPerHour,
          printTimeTotalCost,
          basePrice,
          markupPercentage: pricingSettings.markupPercentage,
          markupAmount,
          subtotalPerUnit,
        },
        totalPrice: subtotalPerUnit * item.quantity,
      }
    })

    // Calculate order summary
    const subtotal = itemsWithPricing.reduce((sum, item) => sum + item.totalPrice, 0)
    const totalWeight = itemsWithPricing.reduce(
      (sum, item) => sum + item.statistics.filamentWeight * item.quantity,
      0,
    )
    const totalPrintTime = itemsWithPricing.reduce(
      (sum, item) => sum + item.statistics.printTime * item.quantity,
      0,
    )
    const totalAmount = subtotal + body.shipping.shippingCost

    // Debug user object
    console.log('User object:', {
      id: user.id,
      email: user.email,
      idType: typeof user.id,
    })

    // Create order in Payload
    const order = await payload.create({
      collection: 'orders',
      draft: false,
      data: {
        user: String(user.id), // Ensure it's a string
        status: 'unpaid',
        items: itemsWithPricing,
        summary: {
          subtotal,
          shippingCost: body.shipping.shippingCost,
          totalAmount,
          totalWeight,
          totalPrintTime,
        },
        shipping: body.shipping,
        paymentInfo: {
          paymentStatus: 'pending',
        },
      },
    })

    // Initialize Midtrans Snap
    if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
      throw new Error('Midtrans credentials not configured')
    }

    const snap = new midtransClient.Snap({
      isProduction: false, // Set to true for production
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY,
    })

    // Prepare transaction parameters
    const parameter = {
      transaction_details: {
        order_id: order.orderNumber,
        gross_amount: Math.round(totalAmount),
      },
      customer_details: {
        first_name: body.shipping.recipientName,
        phone: body.shipping.phoneNumber,
        shipping_address: {
          first_name: body.shipping.recipientName,
          phone: body.shipping.phoneNumber,
          address: body.shipping.addressLine1,
          city: body.shipping.regencyName,
          postal_code: body.shipping.postalCode,
          country_code: 'IDN',
        },
      },
      item_details: [
        ...itemsWithPricing.map((item, index) => ({
          id: `item-${index + 1}`,
          price: Math.round(item.pricing.subtotalPerUnit),
          quantity: item.quantity,
          name: item.fileName,
        })),
        {
          id: 'shipping',
          price: Math.round(body.shipping.shippingCost),
          quantity: 1,
          name: `Shipping (${body.shipping.courier} ${body.shipping.service})`,
        },
      ],
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders/${order.id}?payment=success`,
        error: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders/${order.id}?payment=error`,
        pending: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders/${order.id}?payment=pending`,
      },
    }

    // Create Snap transaction
    const transaction = await snap.createTransaction(parameter)

    // Update order with Midtrans details
    await payload.update({
      collection: 'orders',
      id: order.id,
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
      orderId: order.id,
      orderNumber: order.orderNumber,
      snapToken: transaction.token,
      snapUrl: transaction.redirect_url,
      totalAmount,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      {
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
