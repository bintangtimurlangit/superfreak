'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  Search,
  MessageCircle,
  Printer,
  CheckCircle2,
  PackageCheck,
} from 'lucide-react'
import StatusBadge from '@/components/orders/StatusBadge'
import Button from '@/components/ui/Button'
import type { Order as PayloadOrder } from '@/types/api'
import PaymentSelectionModal from '@/components/orders/PaymentSelectionModal'
import { Link, useRouter } from '@/i18n/navigation'
import { api, isUsingNestApi, getApiBaseUrl } from '@/lib/api-client'
import { ORDERS, PAYMENT } from '@/lib/api/urls'

// Order discussion message (from API)
export interface OrderMessageItem {
  id: string
  body: string
  author: string | { id: string; name?: string | null; email?: string | null; role?: string }
  createdAt: string
}

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
  orderUserId?: string // current order owner (for discussion "customer" vs "admin")
}

function normalizeMessage(doc: {
  id: string
  body: string
  author: string | { id: string; name?: string | null; email?: string | null; role?: string }
  createdAt: string
}): OrderMessageItem {
  return { id: doc.id, body: doc.body, author: doc.author, createdAt: doc.createdAt }
}

export default function OrderDetailsPage() {
  const [newMessage, setNewMessage] = useState('')
  const [messages, setMessages] = useState<OrderMessageItem[]>([])
  const [sending, setSending] = useState(false)
  const [messageError, setMessageError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verifyCompleted, setVerifyCompleted] = useState(false)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const discussionRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const isPaymentReturn = searchParams.get('payment') === 'success'
  const confirmingPayment = isPaymentReturn && !verifyCompleted

  // Fetch order data
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        console.groupCollapsed('[OrderDebug] Fetch start')
        console.log('orderId:', orderId)
        console.log('usingNestApi:', isUsingNestApi())
        let payloadOrder: PayloadOrder & { _id?: string }
        if (isUsingNestApi()) {
          const res = await api.get(ORDERS.byId(orderId))
          if (!res.ok) {
            const status = (res as { status?: number }).status
            if (status === 404) throw new Error('Order not found')
            if (status === 403) throw new Error('You do not have access to this order')
            throw new Error('Failed to fetch order')
          }
          payloadOrder = (await res.json()) as PayloadOrder & { _id?: string }
          if (!payloadOrder.id && payloadOrder._id) {
            (payloadOrder as PayloadOrder).id = String(payloadOrder._id)
          }
        } else {
          const response = await fetch(`/api/orders/${orderId}`, { credentials: 'include' })
          if (!response.ok) throw new Error('Failed to fetch order')
          payloadOrder = await response.json()
        }

        console.log('[OrderDebug] Raw payloadOrder:', payloadOrder)
        console.log('[OrderDebug] Raw payloadOrder.items length:', payloadOrder.items?.length ?? 0)

        const summary = payloadOrder.summary ?? {}
        const items = payloadOrder.items ?? []

        // Transform Payload order to component format (Nest may return slightly different shape)
        const transformedOrder: OrderData = {
          id: payloadOrder.id ?? String(payloadOrder._id ?? ''),
          orderNumber: payloadOrder.orderNumber || 'N/A',
          status: payloadOrder.status ?? 'unpaid',
          subtotal: Number(summary.subtotal) ?? 0,
          shippingCost: Number(summary.shippingCost) ?? 0,
          totalAmount: Number(summary.totalAmount) ?? 0,
          createdAt: payloadOrder.createdAt ?? new Date().toISOString(),
          items: items.map((item, index) => {
            const rowCandidate =
              Array.isArray(item) && item.length > 0 && typeof item[0] === 'object'
                ? (item[0] as unknown)
                : item
            const row = rowCandidate as Record<string, unknown>
            const qty = Number(row.quantity) || 0
            const totalPrice = Number((row as { totalPrice?: number }).totalPrice) ?? 0
            const config = (row.configuration as Record<string, unknown>) ?? {}
            const stats = row.statistics as Record<string, number> | undefined
            console.log('[OrderDebug] Mapping item', {
              index,
              rawItem: row,
              rawConfig: config,
              rawStats: stats,
            })
            return {
              id: (row.id as string) || `item-${index}`,
              fileName: (row.fileName as string) ?? '',
              quantity: qty,
              price: qty ? totalPrice / qty : 0,
              totalPrice,
              configuration: {
                material: String(config.material ?? ''),
                color: String(config.color ?? ''),
                layerHeight: String(config.layerHeight ?? ''),
                infill: String(config.infill ?? ''),
                wallCount: String(config.wallCount ?? ''),
              },
              statistics: stats
                ? {
                    printTime: Number(stats.printTime) || 0,
                    filamentWeight: Number(stats.filamentWeight) || 0,
                  }
                : undefined,
            }
          }),
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
          statusHistory:
            payloadOrder.statusHistory?.map((history) => ({
              status: history.status,
              changedAt: history.changedAt,
            })) || [
              {
                status: payloadOrder.status,
                changedAt: payloadOrder.createdAt,
              },
            ],
          orderUserId:
            typeof payloadOrder.user === 'object' && payloadOrder.user !== null && 'id' in payloadOrder.user
              ? (payloadOrder.user as { id: string }).id
              : payloadOrder.user != null
                ? String(payloadOrder.user)
                : undefined,
        }

        console.log('[OrderDebug] Transformed order:', transformedOrder)
        console.log(
          '[OrderDebug] Transformed items summary:',
          transformedOrder.items.map((it) => ({
            id: it.id,
            fileName: it.fileName,
            quantity: it.quantity,
            configuration: it.configuration,
            statistics: it.statistics,
          })),
        )
        console.groupEnd()
        setOrder(transformedOrder)
      } catch (err) {
        console.error('Error fetching order:', err)
        console.groupEnd()
        setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  // Log exactly what UI is about to render.
  useEffect(() => {
    if (!order) return
    console.groupCollapsed('[OrderDebug] Render state')
    console.log('order.id:', order.id)
    console.log('order.status:', order.status)
    console.log('items length:', order.items.length)
    console.log(
      'items:',
      order.items.map((it) => ({
        id: it.id,
        fileName: it.fileName,
        quantity: it.quantity,
        configuration: it.configuration,
        statistics: it.statistics,
      })),
    )
    console.groupEnd()
  }, [order])

  // Fetch discussion messages when order is needs-discussion
  useEffect(() => {
    if (!orderId || !order || order.status !== 'needs-discussion') return
    const abort = new AbortController()
    const load = async () => {
      try {
        if (isUsingNestApi()) {
          const res = await api.get(ORDERS.messages(orderId))
          if (!res.ok) throw new Error('Failed to fetch messages')
          const data = await res.json()
          const list = Array.isArray(data) ? data : (data as { docs?: unknown[] }).docs || []
          setMessages(list.map((d) => normalizeMessage(d as OrderMessageItem & { author: unknown })))
        } else {
          const res = await fetch(`/api/orders/${orderId}/messages`, { credentials: 'include', signal: abort.signal })
          if (!res.ok) throw new Error('Failed to fetch messages')
          const data: { docs: unknown[] } = await res.json()
          setMessages((data.docs || []).map((d) => normalizeMessage(d as OrderMessageItem & { author: unknown })))
        }
      } catch (e) {
        if ((e as Error)?.name !== 'AbortError') setMessages([])
      }
    }
    load()
    return () => abort.abort()
  }, [orderId, order?.id, order?.status])

  // Live stream: SSE for new messages when discussion is visible
  useEffect(() => {
    if (!orderId || !order || order.status !== 'needs-discussion') return
    const streamUrl = isUsingNestApi()
      ? `${getApiBaseUrl()}${ORDERS.messagesStream(orderId)}`
      : `/api/orders/${orderId}/messages/stream`
    const es = new EventSource(streamUrl, { withCredentials: true })
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { id?: string; body?: string; author?: unknown; createdAt?: string }
        if (data.id && data.body != null) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) return prev
            return [...prev, normalizeMessage(data as Parameters<typeof normalizeMessage>[0])]
          })
        }
      } catch {}
    }
    es.onerror = () => es.close()
    return () => es.close()
  }, [orderId, order?.id, order?.status])

  // Verify payment status when user returns from Midtrans (no full reload; update state so we show Paid immediately)
  useEffect(() => {
    const verificationKey = `payment_verified_${orderId}`
    const alreadyVerified = sessionStorage.getItem(verificationKey)

    if (isPaymentReturn && orderId && !isVerifying && !alreadyVerified) {
      setIsVerifying(true)
      sessionStorage.setItem(verificationKey, 'true')

      const run = async () => {
        try {
          const res = isUsingNestApi()
            ? await api.post(PAYMENT.verify, { orderId })
            : await fetch(PAYMENT.verify, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ orderId }),
              })
          const data = (await res.json()) as {
            success?: boolean
            orderStatus?: string
            paymentStatus?: string
          }
          if (data.success) {
            const orderStatus = (data.orderStatus ?? undefined) as OrderData['status'] | undefined
            const paymentStatus = (data.paymentStatus ?? undefined) as OrderData['paymentInfo']['status'] | undefined
            setOrder((prev) =>
              prev
                ? {
                    ...prev,
                    status: orderStatus ?? prev.status,
                    paymentInfo: {
                      ...prev.paymentInfo,
                      status: paymentStatus ?? prev.paymentInfo.status,
                    },
                  }
                : null,
            )
            router.replace(`/orders/${orderId}`, { scroll: false })
          } else {
            sessionStorage.removeItem(verificationKey)
          }
        } catch {
          sessionStorage.removeItem(verificationKey)
        } finally {
          setIsVerifying(false)
          setVerifyCompleted(true)
        }
      }
      run()
    } else if (isPaymentReturn && alreadyVerified) {
      setVerifyCompleted(true)
    }
  }, [isPaymentReturn, orderId, isVerifying, router])

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

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      bank_transfer: 'Bank Transfer',
      credit_card: 'Credit Card',
      e_wallet: 'QRIS & E-Wallet',
    }
    return labels[method] || method
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unpaid':
        return CreditCard
      case 'in-review':
        return Search
      case 'needs-discussion':
        return MessageCircle
      case 'printing':
        return Printer
      case 'shipping':
        return Package
      case 'in-delivery':
        return Truck
      case 'delivered':
        return PackageCheck
      case 'completed':
        return CheckCircle2
      default:
        return Package
    }
  }

  const handleCancelOrder = async () => {
    setIsCanceling(true)
    try {
      if (isUsingNestApi()) {
        const res = await api.post(ORDERS.cancel(orderId))
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { details?: string; error?: string }
          throw new Error(data.details || data.error || 'Failed to cancel order')
        }
        const updated = (await res.json()) as { status?: string }
        const newStatus = (updated.status ?? 'canceled') as OrderData['status']
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      } else {
        const response = await fetch(ORDERS.cancel(orderId), { method: 'POST', credentials: 'include' })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.details || data.error || 'Failed to cancel order')
        }
        const updated = (await response.json()) as { status?: string }
        const newStatus = (updated.status ?? 'canceled') as OrderData['status']
        setOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
      setIsCancelModalOpen(false)
    } catch (error) {
      console.error('Error canceling order:', error)
      alert(error instanceof Error ? error.message : 'Failed to cancel order. Please try again.')
    } finally {
      setIsCanceling(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#1D0DF3] mx-auto mb-4" />
              <p className="text-[14px] sm:text-[16px] text-[#7C7C7C]">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // After payment return: show "Confirming payment..." until verify completes, then show order as Paid (no flash of Unpaid)
  if (confirmingPayment) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#1D0DF3] mx-auto mb-4" />
              <p className="text-[14px] sm:text-[16px] text-[#7C7C7C]">Confirming your payment...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 text-[14px] sm:text-[16px] text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-12 text-center">
            <Package className="h-16 w-16 text-[#DCDCDC] mx-auto mb-4" />
            <h2 className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929] mb-2">
              Order Not Found
            </h2>
            <p className="text-[14px] sm:text-[16px] font-normal text-[#7C7C7C] mb-6">
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
    <div className="min-h-screen bg-[#FAFAFA] py-8 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href="/my-order"
          className="inline-flex items-center gap-2 text-[14px] sm:text-[16px] text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
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
              <h1 className="text-[24px] sm:text-[28px] md:text-[32px] font-normal leading-[100%] tracking-[-0.5px] text-[#292929]">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            {/* Estimated Delivery Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <Truck className="h-4 w-4 text-blue-600" />
              <span className="text-[14px] font-medium text-blue-900">
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
          <div className="flex items-center gap-2 text-[14px] sm:text-[16px] text-[#989898] mb-6">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(order.createdAt)}</span>
          </div>

          {/* Action Buttons - consistent text-[14px] font-medium */}
          <div className="flex flex-wrap items-center gap-3">
            {order.status === 'unpaid' && (
              <Button
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-[#1D0DF3] text-white hover:bg-[#1a0cd9] text-[14px] font-medium h-10 px-4"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Now
              </Button>
            )}
            <a
              href={isUsingNestApi() ? `${getApiBaseUrl()}${ORDERS.invoice(orderId)}` : `/api/orders/${orderId}/invoice`}
              download={`invoice-${order.orderNumber ?? orderId}.pdf`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#DCDCDC] bg-white h-10 px-4 text-[14px] font-medium text-[#292929] transition-colors hover:bg-[#F5F5F5]"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </a>
            {order.status === 'needs-discussion' ? (
              <Button
                variant="secondary"
                className="border border-[#DCDCDC] text-[14px] font-medium h-10 px-4"
                onClick={() => discussionRef.current?.scrollIntoView({ behavior: 'smooth' })}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Discuss order
              </Button>
            ) : (
              <Button variant="secondary" className="border border-[#DCDCDC] text-[14px] font-medium h-10 px-4">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            )}
            {(order.status === 'delivered' || order.status === 'completed') && (
              <Button className="bg-[#10B981] text-white hover:bg-[#059669] text-[14px] font-medium h-10 px-4">
                <Package className="h-4 w-4 mr-2" />
                Buy Again
              </Button>
            )}
            {(order.status === 'unpaid' ||
              order.status === 'in-review' ||
              order.status === 'needs-discussion') && (
              <Button
                onClick={() => setIsCancelModalOpen(true)}
                variant="secondary"
                className="border border-red-200 text-red-600 hover:bg-red-50 ml-auto text-[14px] font-medium h-10 px-4"
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Horizontal Order Timeline - All Statuses */}
        <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6 mb-6">
          <h2 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-[#292929] mb-4">
            Order Progress
          </h2>
          {(() => {
            const statuses = [
              'unpaid',
              'in-review',
              'needs-discussion',
              'printing',
              'shipping',
              'in-delivery',
              'delivered',
              'completed',
            ]
            return (
              <div className="w-full">
                <div className="flex items-center w-full">
                  {statuses.map((status, index) => {
                    const currentStatusIndex = statuses.indexOf(order.status)
                    const isPast = index < currentStatusIndex
                    const isCurrent = order.status === status
                    return (
                      <div
                        key={status}
                        className={`flex items-center min-w-0 ${index < statuses.length - 1 ? 'flex-1' : 'flex-shrink-0'}`}
                      >
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent ? 'bg-[#1D0DF3]' : isPast ? 'bg-[#1D0DF3]' : 'bg-[#E8E8E8]'
                          }`}
                        >
                          {(() => {
                            const Icon = getStatusIcon(status)
                            return (
                              <Icon
                                className={`h-4 w-4 ${isPast || isCurrent ? 'text-white' : 'text-[#C8C8C8]'}`}
                              />
                            )
                          })()}
                        </div>
                        {index < statuses.length - 1 && (
                          <div
                            className={`flex-1 min-h-0 min-w-[8px] h-0.5 flex-shrink ${
                              isPast ? 'bg-[#1D0DF3]' : 'bg-[#E8E8E8]'
                            }`}
                            aria-hidden
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="flex w-full mt-3">
                  {statuses.map((status, index) => {
                    const currentStatusIndex = statuses.indexOf(order.status)
                    const isPast = index < currentStatusIndex
                    const isCurrent = order.status === status
                    const statusEntry = order.statusHistory.find((h) => h.status === status)
                    return (
                      <div
                        key={status}
                        className={`flex items-start min-w-0 ${index < statuses.length - 1 ? 'flex-1' : 'flex-shrink-0'}`}
                      >
                        <div className="flex flex-col items-center w-8 flex-shrink-0">
                          <div className="max-w-[100px]">
                            <StatusBadge
                              status={
                                status === 'unpaid' && order.paymentInfo?.status === 'paid'
                                  ? 'paid'
                                  : (status as OrderData['status'])
                              }
                              showIcon={false}
                              className={`!px-2 !py-0.5 !text-[12px] md:!text-[14px] !gap-1 whitespace-nowrap ${!isPast && !isCurrent ? 'opacity-40' : ''}`}
                            />
                          </div>
                          <p className="text-[12px] md:text-[14px] text-[#989898] mt-1.5 text-center min-h-[1.25rem] leading-tight">
                            {statusEntry
                              ? new Date(statusEntry.changedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : ''}
                          </p>
                        </div>
                        {index < statuses.length - 1 && <div className="flex-1 min-w-[8px] flex-shrink" aria-hidden />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items - redesigned card layout */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-[#292929] mb-5">
                Order Items
              </h2>
              <div className="space-y-6">
                {order.items.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-[16px] border border-[#EFEFEF] bg-white overflow-hidden ${index < order.items.length - 1 ? 'mb-6' : ''}`}
                  >
                    {/* Item row: image + name + quantity/price line + total */}
                    <div className="p-4 flex items-start gap-4">
                      <div className="w-20 h-20 flex-shrink-0 rounded-[12px] bg-[#F8F8F8] border border-[#EFEFEF] flex items-center justify-center">
                        <Package className="h-8 w-8 text-[#989898]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] sm:text-[16px] font-semibold text-[#292929] mb-1">
                          {item.fileName}
                        </h3>
                        <p className="text-[12px] md:text-[14px] text-[#989898]">
                          Quantity: {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[16px] md:text-[18px] font-bold text-[#292929]">
                          {formatCurrency(item.totalPrice)}
                        </p>
                      </div>
                    </div>

                    {/* Print Configuration - label (regular) : value (bold) */}
                    <div className="bg-[#F8F8F8] border-t border-[#EFEFEF] px-4 py-4">
                      <h4 className="text-[14px] sm:text-[16px] font-semibold text-[#292929] mb-3">
                        Print Configuration
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2.5 text-[12px] md:text-[14px]">
                        <div className="flex gap-1.5">
                          <span className="text-[#7C7C7C] shrink-0">Material:</span>
                          <span className="text-[#292929] font-semibold">{item.configuration.material}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[#7C7C7C] shrink-0">Color:</span>
                          <span className="text-[#292929] font-semibold">{item.configuration.color}</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[#7C7C7C] shrink-0">Layer Height:</span>
                          <span className="text-[#292929] font-semibold">{item.configuration.layerHeight}mm</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[#7C7C7C] shrink-0">Infill:</span>
                          <span className="text-[#292929] font-semibold">{item.configuration.infill}%</span>
                        </div>
                        <div className="flex gap-1.5">
                          <span className="text-[#7C7C7C] shrink-0">Wall Count:</span>
                          <span className="text-[#292929] font-semibold">{item.configuration.wallCount}</span>
                        </div>
                        {item.statistics && (
                          <div className="flex gap-1.5">
                            <span className="text-[#7C7C7C] shrink-0">Filament Weight:</span>
                            <span className="text-[#292929] font-semibold">{item.statistics.filamentWeight}g</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Download 3D File link */}
                    <div className="px-4 pb-4 pt-2">
                      <button
                        type="button"
                        className="text-[12px] md:text-[14px] text-[#1D0DF3] hover:text-[#1a0cd9] font-medium inline-flex items-center gap-1.5 underline underline-offset-2"
                      >
                        <Download className="h-3.5 w-3.5" />
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
                  className="text-[18px] md:text-[20px] font-semibold text-[#292929] mb-3"
                >
                  Customer Notes
                </h2>
                <p
                  className="text-[14px] text-[#656565] leading-relaxed"
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
                      className="text-[18px] md:text-[20px] font-semibold text-purple-900 mb-2"
                    >
                      Message from Admin
                    </h2>
                    <p
                      className="text-[14px] text-purple-800 leading-relaxed"
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
              <div ref={discussionRef} className="bg-blue-50 rounded-[20px] border-2 border-blue-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <h2 className="text-[14px] sm:text-[16px] font-semibold text-blue-900">
                    Discussion
                  </h2>
                </div>

                {/* Messages Container - Compact */}
                <div className="space-y-3 mb-3 max-h-[400px] overflow-y-auto">
                  {messages.length === 0 && (
                    <p className="text-[14px] text-blue-700/80">No messages yet. Start the conversation below.</p>
                  )}
                  {messages.map((msg) => {
                    const authorId = typeof msg.author === 'object' && msg.author !== null ? msg.author.id : msg.author
                    const isCustomer = order.orderUserId && authorId === order.orderUserId
                    const senderName =
                      typeof msg.author === 'object' && msg.author !== null
                        ? (msg.author.name || msg.author.email || 'Support')
                        : 'Support'
                    return (
                      <div key={msg.id}>
                        <div
                          className={`${
                            isCustomer ? 'bg-blue-600 text-white ml-4' : 'bg-white text-[#292929] mr-4'
                          } rounded-lg px-3 py-2 shadow-sm`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[12px] md:text-[14px] font-semibold ${
                                isCustomer ? 'text-blue-100' : 'text-blue-600'
                              }`}
                            >
                              {isCustomer ? 'You' : senderName}
                            </span>
                            <span
                              className={`text-[12px] md:text-[14px] ${
                                isCustomer ? 'text-blue-200' : 'text-[#989898]'
                              }`}
                            >
                              {formatTimeAgo(msg.createdAt)}
                            </span>
                          </div>
                          <p className="text-[14px] leading-relaxed">{msg.body}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Message Input - Compact */}
                <div className="pt-3 border-t border-blue-200">
                  {messageError && (
                    <p className="text-red-600 text-[14px] mb-2">{messageError}</p>
                  )}
                  <textarea
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); setMessageError(null) }}
                    placeholder="Type your message..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 text-[14px] placeholder:text-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2"
                  />
                  <div className="flex items-center gap-2">
                    <button className="text-[12px] md:text-[14px] text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
                      <Paperclip className="h-3.5 w-3.5" />
                      Attach
                    </button>
                    <Button
                      className="ml-auto bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-[14px]"
                      disabled={!newMessage.trim() || sending}
                      onClick={async () => {
                        const body = newMessage.trim()
                        if (!body) return
                        setSending(true)
                        setMessageError(null)
                        try {
                          const res = isUsingNestApi()
                            ? await api.post(ORDERS.messages(orderId), { body })
                            : await fetch(`/api/orders/${orderId}/messages`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ body }),
                              })
                          const data = await res.json()
                          if (res.ok && data.id) {
                            setNewMessage('')
                            setMessages((prev) => {
                              if (prev.some((m) => m.id === data.id)) return prev
                              return [...prev, normalizeMessage(data)]
                            })
                          } else if (res.status === 403) {
                            setMessageError(data?.error || 'Discussion is not available for this order.')
                          }
                        } catch {
                          setMessageError('Failed to send. Try again.')
                        } finally {
                          setSending(false)
                        }
                      }}
                    >
                      {sending ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* Order Summary */}
            <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-6">
              <h2
                className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-[#292929] mb-4"
              >
                Order Summary
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#989898]">Subtotal</span>
                  <span className="text-[#292929] font-medium">
                    {formatCurrency(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-[14px]">
                  <span className="text-[#989898]">Shipping</span>
                  <span className="text-[#292929] font-medium">
                    {formatCurrency(order.shippingCost)}
                  </span>
                </div>
                <div className="pt-3 border-t border-[#EFEFEF]">
                  <div className="flex justify-between">
                    <span
                      className="text-[14px] sm:text-[16px] font-semibold text-[#292929]"
                    >
                      Total
                    </span>
                    <span
                      className="text-[18px] md:text-[20px] font-bold text-[#292929]"
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
                className="text-[18px] md:text-[20px] font-semibold text-[#292929] mb-4 flex items-center gap-2"
              >
                <CreditCard className="h-5 w-5" />
                Payment Info
              </h2>
              <div className="space-y-3 text-[14px]">
                <div>
                  <span className="text-[#989898]">Method:</span>
                  <p className="text-[#292929] font-medium mt-0.5">
                    {getPaymentMethodLabel(order.paymentInfo.method)}
                  </p>
                </div>
                <div>
                  <span className="text-[#989898]">Status:</span>
                  <p className="text-green-600 font-medium mt-0.5">{order.paymentInfo.status}</p>
                </div>
                <div>
                  <span className="text-[#989898]">Transaction ID:</span>
                  <p className="text-[#292929] font-mono text-[12px] md:text-[14px] mt-0.5">
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
                className="text-[18px] md:text-[20px] font-semibold text-[#292929] mb-4 flex items-center gap-2"
              >
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              <div className="text-[14px] text-[#656565] space-y-1">
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
                  className="text-[18px] md:text-[20px] font-semibold text-blue-900 mb-3 flex items-center gap-2"
                >
                  <Truck className="h-5 w-5" />
                  Tracking Info
                </h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-[14px] text-blue-700">Tracking Number:</span>
                    <p className="text-blue-900 font-mono text-[14px] font-semibold mt-1">
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

      <PaymentSelectionModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        totalAmount={order.totalAmount}
      />

      {/* Cancel Order Confirmation Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[20px] max-w-md w-full p-6 shadow-xl">
            <h2
              className="text-[18px] md:text-[20px] font-bold text-[#292929] mb-3"
            >
              Cancel Order?
            </h2>
            <p className="text-[14px] sm:text-[16px] text-[#656565] mb-6">
              Are you sure you want to cancel order <strong>{order.orderNumber}</strong>? This
              action cannot be undone.
            </p>

            {order.status === 'unpaid' && order.paymentInfo.status === 'paid' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p
                  className="text-[14px] text-yellow-800"
                >
                  <strong>Note:</strong> You have already paid for this order. Canceling will
                  initiate a refund process.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => setIsCancelModalOpen(false)}
                variant="secondary"
                className="flex-1 border border-[#DCDCDC]"
                disabled={isCanceling}
              >
                Keep Order
              </Button>
              <Button
                onClick={handleCancelOrder}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Yes, Cancel Order'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

