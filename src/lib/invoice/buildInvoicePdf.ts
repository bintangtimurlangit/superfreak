import { jsPDF } from 'jspdf'
import path from 'path'
import fs from 'fs'
import type { Order } from '@/payload-types'

const BRAND_BLUE = { r: 29, g: 13, b: 243 } // #1D0DF3
const BRAND_RED = { r: 227, g: 57, b: 70 } // #E63946

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

function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png')
    if (fs.existsSync(logoPath)) {
      return fs.readFileSync(logoPath).toString('base64')
    }
  } catch {
    // ignore
  }
  return null
}

export function buildInvoicePdf(order: Order): Uint8Array {
  const doc = new jsPDF()
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  let y = 20

  // ----- Header: Logo (left) + INVOICE (right) -----
  const logoBase64 = getLogoBase64()
  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', margin, y, 35, 12)
    } catch {
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
      doc.text('Superfreak Studio', margin, y + 8)
      doc.setTextColor(0, 0, 0)
    }
  } else {
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
    doc.text('Superfreak Studio', margin, y + 8)
    doc.setTextColor(0, 0, 0)
  }

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(BRAND_RED.r, BRAND_RED.g, BRAND_RED.b)
  doc.text('INVOICE', pageW - margin, y + 8, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  y += 18

  // Thick blue separator line
  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageW - margin, y)
  doc.setLineWidth(0.2)
  y += 14

  // ----- Customer (left) | Date & Valid Till (right) -----
  const ship = order.shipping
  const customerName = ship?.recipientName ?? '—'
  const customerPhone = ship?.phoneNumber ?? '—'
  const orderDate = formatDate(order.createdAt)
  const validTill = formatDate(
    new Date(new Date(order.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
  )

  const rightColX = pageW - margin - 55
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Customer', margin, y)
  doc.text('Date', rightColX, y)
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.text(customerName, margin, y)
  doc.text(orderDate, rightColX, y)
  y += 6

  doc.text(customerPhone, margin, y)
  doc.setFont('helvetica', 'bold')
  doc.text('Valid Till', rightColX, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text(validTill, rightColX, y)
  y += 14

  // ----- Item table: blue header, columns No | Item Name | Quantity | Rate | Amount -----
  const colNo = margin
  const colName = margin + 14
  const colQty = 95
  const colRate = 128
  const colAmount = 158
  const tableEnd = pageW - margin

  const headerY = y
  doc.setFillColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
  doc.rect(colNo, headerY, tableEnd - colNo, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('No', colNo + 2, headerY + 6)
  doc.text('Item Name', colName + 2, headerY + 6)
  doc.text('Quantity', colQty + 2, headerY + 6)
  doc.text('Rate', colRate + 2, headerY + 6)
  doc.text('Amount', colAmount + 2, headerY + 6)
  doc.setTextColor(0, 0, 0)
  y = headerY + 9

  doc.setDrawColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  let totalQty = 0
  order.items.forEach((item, i) => {
    const itemTotal = item.totalPrice ?? 0
    const qty = item.quantity ?? 1
    totalQty += qty
    const unitPrice = qty > 0 ? itemTotal / qty : 0
    const name = (item.fileName || 'Item').slice(0, 32)
    doc.line(colNo, y, tableEnd, y)
    doc.text(String(i + 1), colNo + 2, y + 5)
    doc.text(name, colName + 2, y + 5)
    doc.text(`${qty} pcs`, colQty + 2, y + 5)
    doc.text(formatCurrency(unitPrice), colRate + 2, y + 5)
    doc.text(formatCurrency(itemTotal), colAmount + 2, y + 5)
    y += 7
  })

  doc.line(colNo, y, tableEnd, y)
  doc.line(colNo, headerY, colNo, y)
  doc.line(colName, headerY, colName, y)
  doc.line(colQty, headerY, colQty, y)
  doc.line(colRate, headerY, colRate, y)
  doc.line(colAmount, headerY, colAmount, y)
  doc.line(tableEnd, headerY, tableEnd, y)
  y += 10

  // ----- Grand Total & Total Quantity (right-aligned) -----
  const summary = order.summary
  doc.setFont('helvetica', 'normal')
  doc.text('Grand Total:', colRate, y)
  doc.text(formatCurrency(summary.totalAmount ?? 0), tableEnd - 2, y, { align: 'right' })
  y += 6
  doc.text('Total Quantity:', colRate, y)
  doc.text(`${totalQty} pcs`, tableEnd - 2, y, { align: 'right' })
  y += 20

  // ----- Footer: blue bar with contact -----
  const footerH = 14
  const footerY = pageH - footerH
  doc.setFillColor(BRAND_BLUE.r, BRAND_BLUE.g, BRAND_BLUE.b)
  doc.rect(0, footerY, pageW, footerH, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const footerText = '@superfreakstudio    +62 851-2113-2367    @superfreakstudio'
  doc.text(footerText, pageW / 2, footerY + footerH / 2 + 1, { align: 'center' })

  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer
  return new Uint8Array(arrayBuffer)
}
