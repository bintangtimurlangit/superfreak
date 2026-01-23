'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Calendar,
  MapPin,
  Truck,
  Download,
  MessageSquare,
  CreditCard,
  Send,
  Paperclip,
  Loader2,
} from 'lucide-react'
import StatusBadge from '@/components/orders/StatusBadge'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import type { Order as PayloadOrder } from '@/payload-types'

// Mock conversation data - keeping this for future implementation
const mockConversations = [
  {
    id: '1',
    message:
      'Thank you for your order! We are currently reviewing your 3D models to ensure optimal print quality.',
    senderType: 'admin',
    senderName: 'Support Team',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 90 min ago
    isRead: true,
  },
  {
    id: '2',
    message:
      'We noticed that the wall thickness on your phone case design is quite thin (0.8mm). For better durability, we recommend increasing it to at least 1.2mm. Would you like us to adjust this, or would you prefer to upload a revised file?',
    senderType: 'admin',
    senderName: 'Engineering Team',
    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(), // 60 min ago
    isRead: true,
  },
  {
    id: '3',
    message:
      'Thanks for letting me know! Yes, please go ahead and adjust the wall thickness to 1.2mm. I want it to be durable.',
    senderType: 'customer',
    senderName: 'You',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    isRead: true,
  },
  {
    id: '4',
    message:
      'Perfect! We will make the adjustment and proceed with printing. The modification will not affect the price or delivery time. We will update you once printing begins.',
    senderType: 'admin',
    senderName: 'Engineering Team',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    isRead: true,
  },
]

interface OrderData {
  id: string
  orderNumber: string
  status:
    | 'unpaid'
    | 'in-review'
    | 'needs-discussion'
    | 'printing'
    | 'shipping'
    | 'in-delivery'
    | 'delivered'
    | 'completed'
    | 'canceled'
  subtotal: number
  shippingCost: number
  totalAmount: number
  createdAt: string
  items: Array<{
    id: string
    fileName: string
    quantity: number
    price: number
    totalPrice: number
    configuration: {
      material: string
      color: string
      layerHeight: string
      infill: string
      wallCount: string
    }
    statistics?: {
      printTime: number
      filamentWeight: number
    }
  }>
  shippingAddress: {
    fullName: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country: string
    phone: string
  }
  paymentInfo: {
    method: string
    status: string
    transactionId?: string
    paidAt?: string
  }
  trackingNumber?: string | null
  customerNotes?: string | null
  adminNotes?: string | null
  statusHistory: Array<{
    status: string
    changedAt: string
  }>
  conversations: typeof mockConversations
}

export default function OrderDetailsPage() {
  const [newMessage, setNewMessage] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const params = useParams()
  const orderId = params.id as string

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/orders/${orderId}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch order')
        }

        const payloadOrder: PayloadOrder = await response.json()

        // Transform Payload order to component format
        const transformedOrder: OrderData = {
          id: payloadOrder.id,
          orderNumber: payloadOrder.orderNumber || 'N/A',
          status: payloadOrder.status,
          subtotal: payloadOrder.summary.subtotal,
          shippingCost: payloadOrder.summary.shippingCost,
          totalAmount: payloadOrder.summary.totalAmount,
          createdAt: payloadOrder.createdAt,
          items: payloadOrder.items.map((item, index) => ({
            id: item.id || `item-${index}`,
            fileName: item.fileName,
            quantity: item.quantity,
            price: item.totalPrice / item.quantity, // Unit price = total / quantity
            totalPrice: item.totalPrice,
            configuration: {
              material: item.configuration.material,
              color: item.configuration.color,
              layerHeight: item.configuration.layerHeight,
              infill: item.configuration.infill,
              wallCount: item.configuration.wallCount,
            },
            statistics: item.statistics
              ? {
                  printTime: item.statistics.printTime || 0,
                  filamentWeight: item.statistics.filamentWeight || 0,
                }
              : undefined,
          })),
          shippingAddress: {
            fullName: payloadOrder.shipping?.recipientName || 'N/A',
            addressLine1: payloadOrder.shipping?.addressLine1 || 'N/A',
            addressLine2: payloadOrder.shipping?.addressLine2 || undefined,
            city: payloadOrder.shipping?.regencyName || 'N/A',
            state: payloadOrder.shipping?.provinceName || 'N/A',
            postalCode: payloadOrder.shipping?.postalCode || 'N/A',
            country: 'Indonesia',
            phone: payloadOrder.shipping?.phoneNumber || 'N/A',
          },
          paymentInfo: {
            method: payloadOrder.paymentInfo?.paymentMethod || 'N/A',
            status: payloadOrder.paymentInfo?.paymentStatus || 'pending',
            transactionId: payloadOrder.paymentInfo?.transactionId || undefined,
            paidAt: payloadOrder.paymentInfo?.paidAt || undefined,
          },
          trackingNumber: payloadOrder.shipping?.trackingNumber || null,
          customerNotes: payloadOrder.customerNotes || null,
          adminNotes: payloadOrder.adminNotes || null,
          statusHistory: payloadOrder.statusHistory?.map((history) => ({
            status: history.status,
            changedAt: history.changedAt,
          })) || [
            {
              status: payloadOrder.status,
              changedAt: payloadOrder.createdAt,
            },
          ],
          conversations: mockConversations, // Using mock data for now
        }

        setOrder(transformedOrder)
      } catch (err) {
        console.error('Error fetching order:', err)
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Verify payment status when user returns from Midtrans
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const verificationKey = `payment_verified_${orderId}`

    // Check if we already verified this order
    const alreadyVerified = sessionStorage.getItem(verificationKey)

    if (paymentStatus === 'success' && orderId && !isVerifying && !alreadyVerified) {
      setIsVerifying(true)

      // Mark as verified immediately to prevent duplicate calls
      sessionStorage.setItem(verificationKey, 'true')

      // Call backend to verify payment with Midtrans API
      fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log('Payment verification result:', data)
          if (data.success) {
            // Reload page without query parameter to show updated order status
            window.location.href = `/orders/${orderId}`
          } else {
            // If verification failed, remove the flag so it can be retried
            sessionStorage.removeItem(verificationKey)
          }
        })
        .catch((error) => {
          console.error('Payment verification failed:', error)
          // Remove flag on error so it can be retried
          sessionStorage.removeItem(verificationKey)
        })
        .finally(() => {
          setIsVerifying(false)
        })
    }
  }, [searchParams, orderId, isVerifying])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#1D0DF3] mx-auto mb-4" />
              <p className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
                Loading order details...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-sm text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-12 text-center">
            <Package className="h-16 w-16 text-[#DCDCDC] mx-auto mb-4" />
            <h2
              className="text-xl font-semibold text-[#292929] mb-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Order Not Found
            </h2>
            <p className="text-[#7C7C7C] mb-6" style={{ fontFamily: 'var(--font-geist-sans)' }}>
              {error ||
                'The order you are looking for does not exist or you do not have access to it.'}
            </p>
            <Link href="/my-order">
              <Button className="bg-[#1D0DF3] text-white hover:bg-[#1a0cd9]">
                View All Orders
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/my-order"
          className="inline-flex items-center gap-2 text-sm text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Orders
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6 mb-6">
          {/* Order Number and Status */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-[#1D0DF3]" />
              <h1
                className="text-2xl font-bold text-[#292929]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            {/* Estimated Delivery Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Truck className="h-4 w-4 text-blue-600" />
              <span
                className="text-sm text-blue-900 font-medium"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Est. delivery:{' '}
                {new Date(
                  new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000,
                ).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-[#989898] mb-6">
            <Calendar className="h-4 w-4" />
            <span style={{ fontFamily: 'var(--font-geist-sans)' }}>
              {formatDate(order.createdAt)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {order.status === 'unpaid' && (
              <Button className="bg-[#1D0DF3] text-white hover:bg-[#1a0cd9]">
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            <Button variant="secondary" className="border border-[#DCDCDC]">
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
            <Button variant="secondary" className="border border-[#DCDCDC]">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            {(order.status === 'delivered' || order.status === 'completed') && (
              <Button className="bg-[#10B981] text-white hover:bg-[#059669]">
                <Package className="h-4 w-4 mr-2" />
                Buy Again
              </Button>
            )}
            {/* Cancel Order Button - Only show for certain statuses */}
            {(order.status === 'unpaid' ||
              order.status === 'in-review' ||
              order.status === 'needs-discussion') && (
              <Button
                variant="secondary"
                className="border border-red-200 text-red-600 hover:bg-red-50 ml-auto"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Order Timeline - All Statuses */}
        <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6 mb-6">
          <h2
            className="text-base font-semibold text-[#292929] mb-4"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Order Progress
          </h2>
          <div className="flex items-center justify-between">
            {[
              'unpaid',
              'in-review',
              'needs-discussion',
              'printing',
              'shipping',
              'in-delivery',
              'delivered',
              'completed',
            ].map((status, index, array) => {
              // Find if this status has been reached
              const statusEntry = order.statusHistory.find((h) => h.status === status)
              const isCurrent = order.status === status
              const isPast = order.statusHistory.some((h) => h.status === status)

              return (
                <React.Fragment key={status}>
                  <div className="flex flex-col items-center">
                    {/* Dot with centered connecting line */}
                    <div className="relative flex items-center justify-center mb-2">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          isCurrent ? 'bg-[#1D0DF3]' : isPast ? 'bg-[#1D0DF3]' : 'bg-[#E8E8E8]'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isPast || isCurrent ? 'bg-white' : 'bg-[#C8C8C8]'
                          }`}
                        />
                      </div>
                    </div>
                    <div className="max-w-[100px]">
                      <StatusBadge
                        status={status as OrderData['status']}
                        className={`!px-2 !py-0.5 !text-[10px] !gap-1 whitespace-nowrap ${!isPast && !isCurrent ? 'opacity-40' : ''}`}
                      />
                    </div>
                    <p
                      className="text-xs text-[#989898] mt-1 text-center h-4"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {statusEntry
                        ? new Date(statusEntry.changedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}
                    </p>
                  </div>
                  {index < array.length - 1 && (
                    <div className="flex-1 flex items-center" style={{ marginTop: '-60px' }}>
                      <div className={`flex-1 h-0.5 ${isPast ? 'bg-[#1D0DF3]' : 'bg-[#E8E8E8]'}`} />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2
                className="text-lg font-semibold text-[#292929] mb-4"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`pb-4 ${index < order.items.length - 1 ? 'border-b border-[#EFEFEF]' : ''}`}
                  >
                    <div className="flex items-start gap-4 mb-3">
                      {/* 3D Model Preview Placeholder */}
                      <div className="w-24 h-24 bg-[#F8F8F8] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#EFEFEF]">
                        <Package className="h-8 w-8 text-[#989898]" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base font-semibold text-[#292929] mb-2"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {item.fileName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-[#989898]">Quantity:</span>
                          <span className="text-[#292929] font-medium">{item.quantity}</span>
                          {item.quantity > 1 && (
                            <>
                              <span className="text-[#989898]">×</span>
                              <span className="text-[#292929]">{formatCurrency(item.price)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right">
                        <p
                          className="text-lg font-bold text-[#292929]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Print Configuration */}
                    <div className="bg-[#F8F8F8] rounded-lg p-4 mt-3">
                      <h4
                        className="text-sm font-semibold text-[#292929] mb-3"
                        style={{ fontFamily: 'var(--font-geist-sans)' }}
                      >
                        Print Configuration
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-[#7C7C7C]">Material:</span>
                          <p className="text-[#292929] font-medium mt-0.5">
                            {item.configuration.material}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#7C7C7C]">Color:</span>
                          <p className="text-[#292929] font-medium mt-0.5">
                            {item.configuration.color}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#7C7C7C]">Layer Height:</span>
                          <p className="text-[#292929] font-medium mt-0.5">
                            {item.configuration.layerHeight}mm
                          </p>
                        </div>
                        <div>
                          <span className="text-[#7C7C7C]">Infill:</span>
                          <p className="text-[#292929] font-medium mt-0.5">
                            {item.configuration.infill}%
                          </p>
                        </div>
                        <div>
                          <span className="text-[#7C7C7C]">Wall Count:</span>
                          <p className="text-[#292929] font-medium mt-0.5">
                            {item.configuration.wallCount}
                          </p>
                        </div>
                        {/* Filament Weight - moved from statistics */}
                        {item.statistics && (
                          <div>
                            <span className="text-[#7C7C7C]">Filament Weight:</span>
                            <p className="text-[#292929] font-medium mt-0.5">
                              {item.statistics.filamentWeight}g
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="mt-3">
                      <button className="text-sm text-[#1D0DF3] hover:text-[#1a0cd9] font-medium flex items-center gap-1.5">
                        <Download className="h-4 w-4" />
                        Download 3D File
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Notes */}
            {order.customerNotes && (
              <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
                <h2
                  className="text-lg font-semibold text-[#292929] mb-3"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  Customer Notes
                </h2>
                <p
                  className="text-sm text-[#656565] leading-relaxed"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  {order.customerNotes}
                </p>
              </div>
            )}

            {/* Admin Notes (if needs discussion) */}
            {order.status === 'needs-discussion' && order.adminNotes && (
              <div className="bg-purple-50 rounded-[20px] border border-purple-200 p-6">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <h2
                      className="text-lg font-semibold text-purple-900 mb-2"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Message from Admin
                    </h2>
                    <p
                      className="text-sm text-purple-800 leading-relaxed"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {order.adminNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Order Discussion - Only show for needs-discussion status */}
            {order.status === 'needs-discussion' && (
              <div className="bg-blue-50 rounded-[20px] border-2 border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <h2
                    className="text-base font-semibold text-blue-900"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  >
                    Discussion
                  </h2>
                </div>

                {/* Messages Container - Compact */}
                <div className="space-y-3 mb-3 max-h-[400px] overflow-y-auto">
                  {order.conversations?.map((conversation: (typeof mockConversations)[0]) => (
                    <div key={conversation.id}>
                      <div
                        className={`${
                          conversation.senderType === 'customer'
                            ? 'bg-blue-600 text-white ml-4'
                            : 'bg-white text-[#292929] mr-4'
                        } rounded-lg px-3 py-2 shadow-sm`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-xs font-semibold ${
                              conversation.senderType === 'customer'
                                ? 'text-blue-100'
                                : 'text-blue-600'
                            }`}
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {conversation.senderName}
                          </span>
                          <span
                            className={`text-xs ${
                              conversation.senderType === 'customer'
                                ? 'text-blue-200'
                                : 'text-[#989898]'
                            }`}
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatTimeAgo(conversation.timestamp)}
                          </span>
                        </div>
                        <p
                          className="text-sm leading-relaxed"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {conversation.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input - Compact */}
                <div className="pt-3 border-t border-blue-200">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2"
                    style={{ fontFamily: 'var(--font-geist-sans)' }}
                  />
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attach
                    </button>
                    <Button
                      className="ml-auto bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-sm"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Order Summary */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2
                className="text-lg font-semibold text-[#292929] mb-4"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#989898]">Subtotal</span>
                  <span className="text-[#292929] font-medium">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#989898]">Shipping</span>
                  <span className="text-[#292929] font-medium">
                    {formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#EFEFEF]">
                  <div className="flex justify-between">
                    <span
                      className="text-base font-semibold text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      Total
                    </span>
                    <span
                      className="text-xl font-bold text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2
                className="text-lg font-semibold text-[#292929] mb-4 flex items-center gap-2"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                <CreditCard className="h-5 w-5" />
                Payment Info
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-[#989898]">Method:</span>
                  <p className="text-[#292929] font-medium mt-0.5">{order.paymentInfo.method}</p>
                </div>
                <div>
                  <span className="text-[#989898]">Status:</span>
                  <p className="text-green-600 font-medium mt-0.5">{order.paymentInfo.status}</p>
                </div>
                <div>
                  <span className="text-[#989898]">Transaction ID:</span>
                  <p className="text-[#292929] font-mono text-xs mt-0.5">
                    {order.paymentInfo.transactionId}
                  </p>
                </div>
                <div>
                  <span className="text-[#989898]">Paid At:</span>
                  <p className="text-[#292929] font-medium mt-0.5">
                    {order.paymentInfo.paidAt && formatDate(order.paymentInfo.paidAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2
                className="text-lg font-semibold text-[#292929] mb-4 flex items-center gap-2"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              <div className="text-sm text-[#656565] space-y-1">
                <p className="font-semibold text-[#292929]">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                  {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                <p className="pt-2 text-[#292929] font-medium">{order.shippingAddress.phone}</p>
              </div>
            </div>

            {/* Tracking Information */}
            {order.trackingNumber && (
              <div className="bg-blue-50 rounded-[20px] border border-blue-200 p-6">
                <h2
                  className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-geist-sans)' }}
                >
                  <Truck className="h-5 w-5" />
                  Tracking Info
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-blue-700">Tracking Number:</span>
                    <p className="text-blue-900 font-mono text-sm font-semibold mt-1">
                      {order.trackingNumber}
                    </p>
                  </div>
                  <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                    <Truck className="h-4 w-4 mr-2" />
                    Track Shipment
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
