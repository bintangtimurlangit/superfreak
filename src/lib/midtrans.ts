import midtransClient from 'midtrans-client'

export function getMidtransSnap() {
  return new midtransClient.Snap({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })
}

export function getMidtransCore() {
  return new midtransClient.CoreApi({
    isProduction: process.env.NODE_ENV === 'production',
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  })
}

export async function createSnapTransaction(params: {
  orderId: string
  grossAmount: number
  customerDetails: {
    firstName: string
    phone: string
    shippingAddress: {
      firstName: string
      phone: string
      address: string
      city: string
      postalCode: string
    }
  }
  itemDetails: Array<{
    id: string
    price: number
    quantity: number
    name: string
  }>
}) {
  const snap = getMidtransSnap()

  const parameter = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    customer_details: {
      first_name: params.customerDetails.firstName,
      phone: params.customerDetails.phone,
      shipping_address: {
        first_name: params.customerDetails.shippingAddress.firstName,
        phone: params.customerDetails.shippingAddress.phone,
        address: params.customerDetails.shippingAddress.address,
        city: params.customerDetails.shippingAddress.city,
        postal_code: params.customerDetails.shippingAddress.postalCode,
        country_code: 'IDN',
      },
    },
    item_details: params.itemDetails.map((item) => ({
      ...item,
      price: Math.round(item.price),
    })),
    callbacks: {
      finish: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders?payment=success`,
      error: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders?payment=error`,
      pending: `${process.env.NEXT_PUBLIC_SERVER_URL}/orders?payment=pending`,
    },
  }

  return await snap.createTransaction(parameter)
}

export async function getTransactionStatus(orderId: string) {
  const core = getMidtransCore()
  return await core.transaction.status(orderId)
}

export async function cancelTransaction(orderId: string) {
  const core = getMidtransCore()
  return await core.transaction.cancel(orderId)
}

export async function refundTransaction(orderId: string, amount?: number) {
  const core = getMidtransCore()
  const params = amount ? { refund_amount: amount } : {}
  return await core.transaction.refund(orderId, params)
}
