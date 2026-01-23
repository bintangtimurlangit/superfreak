'use client'

import React from 'react'
import { Calendar, Package, ChevronRight } from 'lucide-react'
import StatusBadge, { type OrderStatus } from './StatusBadge'

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  createdAt: string
  items: Array<{
    fileName: string
    quantity: number
    price: number
  }>
  trackingNumber?: string
}

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
      {/* Header: Order Number, Date, Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-[#989898]" />
          <div>
            <h3
              className="text-base font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {order.orderNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5 text-[#989898]" />
              <span
                className="text-xs text-[#989898]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-4">
        {order.items.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-start gap-4">
            {/* Product Image Placeholder */}
            <div className="w-16 h-16 bg-[#F8F8F8] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#EFEFEF]">
              <Package className="h-6 w-6 text-[#989898]" />
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4
                className="text-sm font-medium text-[#292929] line-clamp-2"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {item.fileName}
              </h4>
              <p
                className="text-xs text-[#989898] mt-1"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {item.quantity} {item.quantity > 1 ? 'items' : 'item'} ×{' '}
                {formatCurrency(item.price)}
              </p>
            </div>

            {/* Item Price */}
            <div className="text-right">
              <p
                className="text-sm font-semibold text-[#292929]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {formatCurrency(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}
        {order.items.length > 3 && (
          <p
            className="text-sm text-[#989898] text-center"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            + {order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Total Amount */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EFEFEF]">
        <span className="text-sm text-[#989898]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          Total Amount
        </span>
        <span
          className="text-lg font-bold text-[#292929]"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Tracking Number (if available) */}
      {order.trackingNumber && (
        <div className="mb-4 pb-4 border-b border-[#EFEFEF]">
          <div className="flex items-center justify-between">
            <span
              className="text-xs text-[#989898]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Tracking Number
            </span>
            <span
              className="text-sm font-medium text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {order.trackingNumber}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {order.status === 'unpaid' ? (
          <>
            <button
              className="flex-1 px-4 py-2.5 bg-[#1D0DF3] text-white rounded-lg text-sm font-medium hover:bg-[#1a0cd9] transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Pay Now
            </button>
            <button
              onClick={() => (window.location.href = `/orders/${order.id}`)}
              className="flex-1 px-4 py-2.5 border border-[#DCDCDC] bg-white text-[#292929] rounded-lg text-sm font-medium hover:bg-[#F8F8F8] transition-colors"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              View Details
            </button>
          </>
        ) : order.status === 'delivered' || order.status === 'completed' ? (
          <button
            className="flex-1 px-4 py-2.5 bg-[#10B981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] transition-colors"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Buy Again
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = `/orders/${order.id}`)}
            className="flex-1 px-4 py-2.5 bg-[#1D0DF3] text-white rounded-lg text-sm font-medium hover:bg-[#1a0cd9] transition-colors"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            View Details
          </button>
        )}
        <button
          className="p-2.5 border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors"
          title="More options"
        >
          <ChevronRight className="h-5 w-5 text-[#989898] rotate-90" />
        </button>
      </div>
    </div>
  )
}
