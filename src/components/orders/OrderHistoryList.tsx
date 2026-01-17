'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Filter, Package } from 'lucide-react'
import OrderCard, { type Order } from './OrderCard'
import { type OrderStatus } from './StatusBadge'
import DateRangePicker from './DateRangePicker'
import { useSession } from '@/hooks/useSession'
import { payloadFetch } from '@/lib/payloadFetch'

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom'

interface OrderHistoryListProps {
  className?: string
}

function OrderHistoryListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filters Skeleton */}
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-2 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>

      {/* Order Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrderHistoryList({ className = '' }: OrderHistoryListProps) {
  const { user, isSuccess: isAuthenticated, loading: sessionLoading } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await payloadFetch('/api/orders', {
          method: 'GET',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }

        const data = await response.json()
        setOrders(data.docs || [])
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    if (!sessionLoading) {
      fetchOrders()
    }
  }, [isAuthenticated, user, sessionLoading])

  const filterOrdersByDate = (order: Order): boolean => {
    if (dateFilter === 'all') return true

    const orderDate = new Date(order.createdAt)
    
    // Custom date range filtering
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const orderTime = orderDate.getTime()
      const startTime = customStartDate.getTime()
      const endTime = customEndDate.getTime() + (24 * 60 * 60 * 1000) // Include end date
      return orderTime >= startTime && orderTime <= endTime
    }

    const now = new Date()
    const diffTime = now.getTime() - orderDate.getTime()
    const diffDays = diffTime / (1000 * 60 * 60 * 24)

    switch (dateFilter) {
      case '7days':
        return diffDays <= 7
      case '30days':
        return diffDays <= 30
      case '90days':
        return diffDays <= 90
      default:
        return true
    }
  }

  const handleCustomDateRange = (startDate: Date | null, endDate: Date | null) => {
    setCustomStartDate(startDate)
    setCustomEndDate(endDate)
    if (startDate && endDate) {
      setDateFilter('custom')
    } else {
      setDateFilter('all')
    }
  }

  const filterOrdersByStatus = (order: Order): boolean => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  }

  const filteredOrders = orders.filter(
    (order) => filterOrdersByDate(order) && filterOrdersByStatus(order),
  )

  if (sessionLoading || loading) {
    return <OrderHistoryListSkeleton />
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-12 text-center">
        <Package className="h-16 w-16 text-[#DCDCDC] mx-auto mb-4" />
        <h3
          className="text-xl font-semibold text-[#292929] mb-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          Please Sign In
        </h3>
        <p className="text-[#989898]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          You need to be signed in to view your order history.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Filters */}
      <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
        {/* Date Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-[#989898]" />
            <h3
              className="text-sm font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Date Range
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All Time' },
              { value: '7days', label: 'Last 7 Days' },
              { value: '30days', label: 'Last 30 Days' },
              { value: '90days', label: 'Last 90 Days' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setDateFilter(option.value as DateFilter)
                  if (option.value !== 'custom') {
                    setCustomStartDate(null)
                    setCustomEndDate(null)
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === option.value
                    ? 'bg-[#1D0DF3] text-white'
                    : 'bg-[#F8F8F8] text-[#292929] hover:bg-[#EFEFEF]'
                }`}
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {option.label}
              </button>
            ))}
            <DateRangePicker onRangeSelect={handleCustomDateRange} />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-[#989898]" />
            <h3
              className="text-sm font-semibold text-[#292929]"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Order Status
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'checking', label: 'Checking' },
              { value: 'discuss', label: 'Discuss' },
              { value: 'printing', label: 'Printing' },
              { value: 'shipping', label: 'Shipping' },
              { value: 'delivery', label: 'Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'done', label: 'Done' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value as OrderStatus | 'all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === option.value
                    ? 'bg-[#1D0DF3] text-white'
                    : 'bg-[#F8F8F8] text-[#292929] hover:bg-[#EFEFEF]'
                }`}
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#989898]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
        </p>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-[#EFEFEF] rounded-[20px] p-12 text-center">
          <Package className="h-16 w-16 text-[#DCDCDC] mx-auto mb-4" />
          <h3
            className="text-xl font-semibold text-[#292929] mb-2"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            No Orders Found
          </h3>
          <p className="text-[#989898]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            {orders.length === 0
              ? "You haven't placed any orders yet."
              : 'No orders match your current filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
