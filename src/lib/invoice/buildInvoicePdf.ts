import { jsPDF } from 'jspdf'
import type { Order } from '@/payload-types'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

export function buildInvoicePdf(order: Order): Uint8Array {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Title
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('Superfreak Studio', margin, y)
  y += 10

  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text('INVOICE', margin, y)
  y += 12

  // Order number & date
  doc.setFontSize(10)
  doc.text(`Order: ${order.orderNumber ?? order.id}`, margin, y)
  y += 6
  doc.text(`Date: ${formatDate(order.createdAt)}`, margin, y)
  y += 6
  doc.text(`Status: ${order.status}`, margin, y)
  y += 16

  // Items table header
  const colName = margin
  const colQty = 100
  const colPrice = 125
  const colTotal = 165
  const colEnd = pageW - margin

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('Item', colName, y)
  doc.text('Qty', colQty, y)
  doc.text('Unit price', colPrice, y)
  doc.text('Total', colTotal, y)
  y += 2
  doc.setDrawColor(0, 0, 0)
  doc.line(colName, y, colEnd, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  for (const item of order.items) {
    const itemTotal = item.totalPrice ?? 0
    const qty = item.quantity ?? 1
    const unitPrice = qty > 0 ? itemTotal / qty : 0
    const name = (item.fileName || 'Item').slice(0, 40)
    doc.text(name, colName, y)
    doc.text(String(qty), colQty, y)
    doc.text(formatCurrency(unitPrice), colPrice, y)
    doc.text(formatCurrency(itemTotal), colTotal, y)
    y += 7
  }

  y += 6
  doc.line(colName, y, colEnd, y)
  y += 10

  // Summary
  const summary = order.summary
  const subX = colTotal
  doc.text('Subtotal:', colPrice, y)
  doc.text(formatCurrency(summary.subtotal ?? 0), subX, y)
  y += 7
  doc.text('Shipping:', colPrice, y)
  doc.text(formatCurrency(summary.shippingCost ?? 0), subX, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Total:', colPrice, y)
  doc.text(formatCurrency(summary.totalAmount ?? 0), subX, y)
  y += 14

  // Shipping address
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text('Ship to:', margin, y)
  y += 7
  doc.setFontSize(9)
  const ship = order.shipping
  if (ship) {
    doc.text(ship.recipientName ?? '—', margin, y)
    y += 5
    doc.text([ship.addressLine1, ship.addressLine2].filter(Boolean).join(', ') || '—', margin, y)
    y += 5
    const cityLine = [ship.regencyName, ship.provinceName, ship.postalCode].filter(Boolean).join(', ')
    if (cityLine) doc.text(cityLine, margin, y)
    y += 5
    if (ship.phoneNumber) doc.text(ship.phoneNumber, margin, y)
  }
  y += 10

  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Thank you for your order. — Superfreak Studio', margin, y)

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  return new Uint8Array(arrayBuffer)
}
