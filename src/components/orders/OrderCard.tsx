'use client'

import React from 'react'
import Link from 'next/link'
import { Calendar, Package, ChevronRight } from 'lucide-react'
import StatusBadge, { type OrderStatus } from './StatusBadge'
import Button from '@/components/ui/Button'

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getActionButton = () => {
    switch (order.status) {
      case 'unpaid':
        return (
          <Button
            variant="secondary"
            size="sm"
            className="!bg-[#1D0DF3] !text-white hover:!bg-[#1a0cd9] text-sm font-medium"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Pay Now
          </Button>
        )
      case 'shipping':
      case 'delivery':
      case 'delivered':
        return (
          <Button
            variant="secondary"
            size="sm"
            className="border border-[#DCDCDC] bg-white text-[#1D0DF3] hover:bg-[#F5F5F5] text-sm font-medium"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Track Order
          </Button>
        )
      default:
        return (
          <Button
            variant="secondary"
            size="sm"
            className="border border-[#DCDCDC] bg-white text-[#292929] hover:bg-[#F5F5F5] text-sm font-medium"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            View Details
          </Button>
        )
    }
  }

  return (
    <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3
              className="text-lg font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {order.orderNumber}
            </h3>
            <StatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-2 text-sm text-[#989898]">
            <Calendar className="h-4 w-4" />
            <span style={{ fontFamily: 'var(--font-geist-sans)' }}>
              {formatDate(order.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Items Preview */}
      <div className="mb-4 pb-4 border-b border-[#EFEFEF]">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-[#989898]" />
          <span
            className="text-sm font-medium text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'}
          </span>
        </div>
        <div className="space-y-1">
          {order.items.slice(0, 2).map((item, index) => (
            <div
              key={index}
              className="text-sm text-[#989898] truncate"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              • {item.fileName} {item.quantity > 1 && `(×${item.quantity})`}
            </div>
          ))}
          {order.items.length > 2 && (
            <div
              className="text-sm text-[#989898]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <div
            className="text-xs text-[#989898] mb-1"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Total Amount
          </div>
          <div
            className="text-xl font-bold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            {formatCurrency(order.totalAmount)}
          </div>
        </div>
        {getActionButton()}
      </div>

      {/* Tracking Number (if available) */}
      {order.trackingNumber && (
        <div className="mt-4 pt-4 border-t border-[#EFEFEF]">
          <div className="flex items-center justify-between">
            <div>
              <div
                className="text-xs text-[#989898] mb-1"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Tracking Number
              </div>
              <div
                className="text-sm font-medium text-[#292929]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {order.trackingNumber}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
