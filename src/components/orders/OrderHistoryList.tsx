'use client'

import React, { useState, useEffect } from 'react'
import { Package, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import OrderCard, { type Order } from './OrderCard'
import { type OrderStatus } from './StatusBadge'
import DateRangePicker from './DateRangePicker'
import { useSession } from '@/lib/auth/client'
import type { Order as PayloadOrder } from '@/payload-types'
import PaymentSelectionModal from './PaymentSelectionModal'

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom'

interface OrderHistoryListProps {
  className?: string
}

interface PayloadOrdersResponse {
  docs: PayloadOrder[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

function OrderHistoryListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header + Filters Skeleton */}
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-[12px] animate-pulse flex-shrink-0" />
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Divider */}
        <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

        {/* Search and Date Picker Row Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-[42px] bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-[42px] bg-gray-200 rounded-lg animate-pulse" />
        </div>

        {/* Status Filter Skeleton */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-4 w-12 bg-gray-200 rounded animate-pulse mr-2" />
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="h-9 w-20 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>

      {/* Results Count Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Order Cards Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-[#EFEFEF] rounded-[20px] p-6">
            <div className="space-y-4">
              {/* Order number and date */}
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="h-7 w-24 bg-gray-200 rounded-full animate-pulse" />
              </div>

              {/* Items section */}
              <div className="space-y-2">
                <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
              </div>

              {/* Total and button */}
              <div className="flex items-center justify-between pt-4 border-t border-[#EFEFEF]">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrderHistoryList({ className = '' }: OrderHistoryListProps) {
  const { data: sessionData, isPending: sessionLoading } = useSession()
  const user = sessionData?.user || null
  const isAuthenticated = !!user
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([]) // Changed to array for multiple selection
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null)
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [paymentModalOrder, setPaymentModalOrder] = useState<Order | null>(null)
  const ordersPerPage = 5

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) {
        setOrders([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch('/api/orders', {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }

        const data: PayloadOrdersResponse = await response.json()

        // Transform Payload Order type to OrderCard Order interface
        const transformedOrders: Order[] = data.docs.map((order: PayloadOrder) => ({
          id: order.id,
          orderNumber: order.orderNumber || 'N/A',
          status: order.status,
          totalAmount: order.summary.totalAmount,
          createdAt: order.createdAt,
          items: order.items.map((item) => ({
            fileName: item.fileName,
            quantity: item.quantity,
            price: item.totalPrice / item.quantity, // Unit price = total / quantity
          })),
          trackingNumber: order.shipping?.trackingNumber || undefined,
        }))

        setOrders(transformedOrders)
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
  }, [isAuthenticated, sessionLoading])

  const filterOrdersByDate = (order: Order): boolean => {
    if (dateFilter === 'all') return true

    const orderDate = new Date(order.createdAt)

    // Custom date range filtering
    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const orderTime = orderDate.getTime()
      const startTime = customStartDate.getTime()
      const endTime = customEndDate.getTime() + 24 * 60 * 60 * 1000 // Include end date
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
    // If no statuses selected, show all orders
    if (statusFilter.length === 0) return true
    // Check if order status is in the selected statuses
    return statusFilter.includes(order.status)
  }

  const handleStatusToggle = (status: OrderStatus) => {
    setStatusFilter((prev) => {
      if (prev.includes(status)) {
        // Remove status if already selected
        return prev.filter((s) => s !== status)
      } else {
        // Add status to selection
        return [...prev, status]
      }
    })
  }

  const handleAllStatus = () => {
    // Clear all selections to show all orders
    setStatusFilter([])
  }

  const filteredOrders = orders.filter(
    (order) => filterOrdersByDate(order) && filterOrdersByStatus(order),
  )

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const endIndex = startIndex + ordersPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, dateFilter, customStartDate, customEndDate])

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
      {/* Header + Filters Combined */}
      <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#1D0DF3] rounded-[12px] flex items-center justify-center flex-shrink-0">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1
            className="text-[24px] font-semibold text-[#292929]"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            Order History
          </h1>
        </div>

        {/* Divider */}
        <div className="border-t border-[#EFEFEF] -mx-4 md:-mx-5 mb-6"></div>

        {/* Filters */}
        <div>
          {/* Top Row: Search and Date Picker */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-4 py-2.5 border border-[#DCDCDC] rounded-lg bg-[#F8F8F8] text-[#292929] text-sm focus:outline-none focus:ring-2 focus:ring-[#1D0DF3] focus:border-transparent"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#989898]" />
            </div>

            {/* Date Picker */}
            <DateRangePicker onRangeSelect={handleCustomDateRange} className="w-full" />
          </div>

          {/* Status Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="text-sm font-semibold text-[#292929] mr-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              Status
            </span>
            <button
              onClick={handleAllStatus}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                statusFilter.length === 0
                  ? 'bg-[#1D0DF3] text-white'
                  : 'bg-[#F8F8F8] text-[#292929] hover:bg-[#EFEFEF] border border-[#DCDCDC]'
              }`}
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              All
            </button>
            {[
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'in-review', label: 'In Review' },
              { value: 'needs-discussion', label: 'Needs Discussion' },
              { value: 'printing', label: 'Printing' },
              { value: 'shipping', label: 'Shipping' },
              { value: 'in-delivery', label: 'In Delivery' },
              { value: 'delivered', label: 'Delivered' },
              { value: 'completed', label: 'Completed' },
              { value: 'canceled', label: 'Canceled' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleStatusToggle(option.value as OrderStatus)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter.includes(option.value as OrderStatus)
                    ? 'bg-[#1D0DF3] text-white'
                    : 'bg-[#F8F8F8] text-[#292929] hover:bg-[#EFEFEF] border border-[#DCDCDC]'
                }`}
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {option.label}
              </button>
            ))}
            {(statusFilter.length > 0 || customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setStatusFilter([])
                  setDateFilter('all')
                  setCustomStartDate(null)
                  setCustomEndDate(null)
                }}
                className="px-4 py-2 text-sm font-medium text-[#1D0DF3] hover:text-[#1a0cd9] transition-colors"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count and Pagination Info */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#989898]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
          {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          {filteredOrders.length > ordersPerPage && (
            <span className="ml-2">
              (Page {currentPage} of {totalPages})
            </span>
          )}
        </p>
      </div>

      {/* Orders List */}
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
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onPayNow={(order) => setPaymentModalOrder(order)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-[#DCDCDC] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5 text-[#292929]" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current
                  const showPage =
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)

                  if (!showPage) {
                    // Show ellipsis
                    if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className="px-2 text-[#989898]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          ...
                        </span>
                      )
                    }
                    return null
                  }

                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#1D0DF3] text-white'
                          : 'border border-[#DCDCDC] text-[#292929] hover:bg-[#F8F8F8]'
                      }`}
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                    >
                      {page}
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-[#DCDCDC] hover:bg-[#F8F8F8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5 text-[#292929]" />
              </button>
            </div>
          )}
        </>
      )}

      {paymentModalOrder && (
        <PaymentSelectionModal
          isOpen={!!paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          orderId={paymentModalOrder.id}
          orderNumber={paymentModalOrder.orderNumber}
          totalAmount={paymentModalOrder.totalAmount}
        />
      )}
    </div>
  )
}
