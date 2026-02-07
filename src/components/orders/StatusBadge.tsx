'use client'

import React from 'react'
import {
  CreditCard,
  Search,
  MessageSquare,
  Printer,
  Truck,
  Package,
  CheckCircle,
  Check,
  XCircle,
} from 'lucide-react'

export type OrderStatus =
  | 'unpaid'
  | 'in-review'
  | 'needs-discussion'
  | 'printing'
  | 'shipping'
  | 'in-delivery'
  | 'delivered'
  | 'completed'
  | 'canceled'

interface StatusBadgeProps {
  status: OrderStatus
  className?: string
  showIcon?: boolean
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string
    bgColor: string
    textColor: string
    icon: React.ComponentType<{ className?: string }>
  }
> = {
  unpaid: {
    label: 'Unpaid',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    icon: CreditCard,
  },
  'in-review': {
    label: 'In Review',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    icon: Search,
  },
  'needs-discussion': {
    label: 'Needs Discussion',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    icon: MessageSquare,
  },
  printing: {
    label: 'Printing',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    icon: Printer,
  },
  shipping: {
    label: 'Shipping',
    bgColor: 'bg-cyan-50',
    textColor: 'text-cyan-700',
    icon: Truck,
  },
  'in-delivery': {
    label: 'In Delivery',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    icon: Package,
  },
  delivered: {
    label: 'Delivered',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    icon: CheckCircle,
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    icon: Check,
  },
  canceled: {
    label: 'Canceled',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    icon: XCircle,
  },
}

export default function StatusBadge({ status, className = '', showIcon = true }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor} ${className}`}
      style={{ fontFamily: 'var(--font-geist-sans)' }}
    >
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      {config.label}
    </span>
  )
}
