'use client'

import React, { useState } from 'react'
import { Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react'
import StatusBadge, { type OrderStatus } from './StatusBadge'

export interface Order {
  id: string
  orderNumber: string
  status: OrderStatus
  totalAmount: number
  /** Sum of item prices (print price) */
  subtotal?: number
  /** Shipping cost (ongkir) */
  shippingCost?: number
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
  onPayNow?: (order: Order) => void
}

export default function OrderCard({ order, onPayNow }: OrderCardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false)

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
    <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6 font-sans">
      {/* Header: Order Number, Date, Status */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-[#989898]" />
          <div>
            <h3 className="text-[18px] md:text-[20px] font-semibold leading-[100%] text-[#292929]">
              {order.orderNumber}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="h-3.5 w-3.5 text-[#989898]" />
              <span className="text-[12px] md:text-[14px] text-[#989898]">
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Items List */}
      <div className="space-y-4 mb-4">
        {order.items.length === 0 ? (
          <div className="flex items-center gap-3 py-2">
            <div className="w-16 h-16 bg-[#F8F8F8] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#EFEFEF]">
              <Package className="h-6 w-6 text-[#DCDCDC]" />
            </div>
            <p className="text-[14px] text-[#989898]">Item details unavailable</p>
          </div>
        ) : (
          <>
            {order.items.slice(0, 3).map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-16 h-16 bg-[#F8F8F8] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#EFEFEF]">
                  <Package className="h-6 w-6 text-[#989898]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-medium text-[#292929] line-clamp-2">
                    {item.fileName}
                  </h4>
                  <p className="text-[12px] md:text-[14px] text-[#989898] mt-1">
                    {item.quantity} {item.quantity > 1 ? 'items' : 'item'} ×{' '}
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[14px] font-semibold text-[#292929]">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
            {order.items.length > 3 && (
              <p className="text-[14px] text-[#989898] text-center">
                + {order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </>
        )}
      </div>

      {/* Total Amount */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#EFEFEF]">
        <span className="text-[14px] text-[#989898]">Total Amount</span>
        <span className="text-[18px] md:text-[20px] font-bold text-[#292929]">
          {formatCurrency(order.totalAmount)}
        </span>
      </div>

      {/* Expanded: Print price + Ongkir breakdown */}
      {detailsExpanded && (order.subtotal != null || order.shippingCost != null) && (
        <div className="mb-4 pb-4 border-b border-[#EFEFEF] space-y-2">
          {order.subtotal != null && (
            <div className="flex items-center justify-between text-[12px] md:text-[14px]">
              <span className="text-[#7C7C7C]">Print price (subtotal)</span>
              <span className="text-[#292929] font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
          )}
          {order.shippingCost != null && (
            <div className="flex items-center justify-between text-[12px] md:text-[14px]">
              <span className="text-[#7C7C7C]">Ongkir (shipping)</span>
              <span className="text-[#292929] font-medium">{formatCurrency(order.shippingCost)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[12px] md:text-[14px] pt-1">
            <span className="text-[#292929] font-semibold">Total</span>
            <span className="text-[#292929] font-bold">{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>
      )}

      {/* Tracking Number (if available) */}
      {order.trackingNumber && (
        <div className="mb-4 pb-4 border-b border-[#EFEFEF]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] md:text-[14px] text-[#989898]">Tracking Number</span>
            <span className="text-[14px] font-medium text-[#292929]">{order.trackingNumber}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {order.status === 'unpaid' ? (
          <>
            <button
              onClick={() => onPayNow?.(order)}
              className="flex-1 px-4 py-2.5 bg-[#1D0DF3] text-white rounded-lg text-[14px] font-medium hover:bg-[#1a0cd9] transition-colors"
            >
              Pay Now
            </button>
            <button
              onClick={() => (window.location.href = `/orders/${order.id}`)}
              className="flex-1 px-4 py-2.5 border border-[#DCDCDC] bg-white text-[#292929] rounded-lg text-[14px] font-medium hover:bg-[#F8F8F8] transition-colors"
            >
              View Details
            </button>
          </>
        ) : order.status === 'delivered' || order.status === 'completed' ? (
          <button
            className="flex-1 px-4 py-2.5 bg-[#10B981] text-white rounded-lg text-[14px] font-medium hover:bg-[#059669] transition-colors"
          >
            Buy Again
          </button>
        ) : (
          <button
            onClick={() => (window.location.href = `/orders/${order.id}`)}
            className="flex-1 px-4 py-2.5 bg-[#1D0DF3] text-white rounded-lg text-[14px] font-medium hover:bg-[#1a0cd9] transition-colors"
          >
            View Details
          </button>
        )}
        <button
          type="button"
          onClick={() => setDetailsExpanded((prev) => !prev)}
          className="p-2.5 border border-[#DCDCDC] rounded-lg hover:bg-[#F8F8F8] transition-colors shrink-0"
          title={detailsExpanded ? 'Hide price breakdown' : 'Show print price & ongkir'}
          aria-expanded={detailsExpanded}
        >
          {detailsExpanded ? (
            <ChevronUp className="h-5 w-5 text-[#989898]" />
          ) : (
            <ChevronDown className="h-5 w-5 text-[#989898]" />
          )}
        </button>
      </div>
    </div>
  )
}
