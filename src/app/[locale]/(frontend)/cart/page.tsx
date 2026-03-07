'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCart } from '@/components/providers/CartProvider'
import Button from '@/components/ui/Button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ShoppingCart, Box, ChevronRight, X, ArrowLeft, Loader2 } from 'lucide-react'
import type { CartItem } from '@/lib/cart'

interface PrintingPricingDoc {
  id: string
  filamentType: string | { id: string; name: string }
  pricingTable: Array<{ layerHeight: number; pricePerGram: number }>
  isActive: boolean
}

interface ItemPrice {
  itemId: string
  weight: number
  pricePerGram: number
  quantity: number
  totalPrice: number
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatWeight(grams: number) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2)} kg`
  return `${grams.toFixed(2)} g`
}

function computeCartPrices(
  cart: CartItem[],
  pricingDocs: PrintingPricingDoc[],
): { itemPrices: ItemPrice[]; subtotal: number } {
  const itemPrices: ItemPrice[] = []
  let subtotal = 0

  cart.forEach((item) => {
    if (!item.statistics || !item.configuration) return

    const material = item.configuration.material
    const layerHeight = parseFloat(item.configuration.layerHeight || '0')
    const quantity = item.configuration.quantity || 1
    const weightPerUnit = item.statistics.filament_weight_g || 0
    const totalWeightForItem = weightPerUnit * quantity

    const pricing = pricingDocs.find((p) => {
      if (typeof p.filamentType === 'string') return false
      return (p.filamentType as { name: string }).name === material
    })

    if (pricing) {
      const priceRow = pricing.pricingTable.find(
        (row) => Math.abs(row.layerHeight - layerHeight) < 0.001,
      )
      if (priceRow) {
        const totalPrice = totalWeightForItem * priceRow.pricePerGram
        itemPrices.push({
          itemId: item.id,
          weight: totalWeightForItem,
          pricePerGram: priceRow.pricePerGram,
          quantity,
          totalPrice,
        })
        subtotal += totalPrice
      }
    }
  })

  return { itemPrices, subtotal }
}

export default function CartPage() {
  const t = useTranslations('Cart')
  const { cart, cartCount, setCart, isLoading: cartLoading } = useCart()
  const [pricingDocs, setPricingDocs] = useState<PrintingPricingDoc[]>([])
  const [pricingLoading, setPricingLoading] = useState(true)

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const res = await fetch(
          '/api/printing-pricing?where[isActive][equals]=true&limit=100&depth=1',
        )
        if (res.ok) {
          const data = await res.json()
          setPricingDocs(data.docs || [])
        }
      } catch (e) {
        console.error('Error fetching pricing:', e)
      } finally {
        setPricingLoading(false)
      }
    }
    fetchPricing()
  }, [])

  const { itemPrices, subtotal } = useMemo(
    () => computeCartPrices(cart, pricingDocs),
    [cart, pricingDocs],
  )

  const getItemPrice = (itemId: string) => itemPrices.find((p) => p.itemId === itemId)

  const handleRemove = (itemId: string) => {
    setCart(cart.filter((c) => c.id !== itemId))
  }

  const isLoading = cartLoading || pricingLoading

  if (isLoading && cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#1D0DF3] mx-auto mb-4" />
          <p className="text-[#7C7C7C]" style={{ fontFamily: 'var(--font-geist-sans)' }}>
            {t('loading')}
          </p>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-12">
          <Link
            href="/order"
            className="inline-flex items-center gap-2 text-sm text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
            style={{ fontFamily: 'var(--font-geist-sans)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToOrder')}
          </Link>
          <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-8 md:p-12 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#EFEFEF] bg-[#F8F8F8] mb-6">
              <ShoppingCart className="h-8 w-8 text-[#989898]" />
            </div>
            <h1
              className="text-xl font-semibold text-[#292929] mb-2"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {t('empty')}
            </h1>
            <p
              className="text-sm text-[#7C7C7C] mb-6"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {t('emptyDescription')}
            </p>
            <Link href="/order">
              <Button className="rounded-lg border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333]">
                {t('startOrder')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-4xl mx-auto px-6 md:px-10 py-8 md:py-12">
        <Link
          href="/order"
          className="inline-flex items-center gap-2 text-sm text-[#292929] hover:text-[#1D0DF3] transition-colors mb-6"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToOrder')}
        </Link>

        <h1
          className="text-[24px] font-semibold text-[#292929] mb-2 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          <ShoppingCart className="h-6 w-6" />
          {t('title')}
        </h1>
        <p
          className="text-sm text-[#7C7C7C] mb-6"
          style={{ fontFamily: 'var(--font-geist-sans)' }}
        >
          {cartCount} {cartCount === 1 ? 'item' : 'items'}
        </p>

        <div className="bg-white rounded-[20px] border border-[#EFEFEF] p-4 md:p-6">
          <ul className="space-y-4">
            {cart.map((item) => {
              const priceInfo = getItemPrice(item.id)
              const qty = item.configuration?.quantity ?? 1
              return (
                <li
                  key={item.id}
                  className="relative overflow-hidden rounded-[16px] border border-[#E5E5E5] bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-[#F0F0F0] px-4 py-3 bg-[#FAFAFA]">
                    <h3
                      className="min-w-0 truncate text-sm font-semibold text-[#292929]"
                      style={{ fontFamily: 'var(--font-geist-sans)' }}
                      title={item.name}
                    >
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {priceInfo ? (
                        <div className="text-right">
                          <p
                            className="text-sm font-semibold text-[#1D0DF3]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatCurrency(priceInfo.totalPrice)}
                          </p>
                          <p
                            className="text-[11px] text-[#7C7C7C]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {formatWeight(priceInfo.weight)} @{' '}
                            {formatCurrency(priceInfo.pricePerGram)}/g
                          </p>
                        </div>
                      ) : (
                        <span
                          className="text-xs text-[#7C7C7C]"
                          style={{ fontFamily: 'var(--font-geist-sans)' }}
                        >
                          {t('priceAtCheckout')}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        className="p-2 rounded-[10px] text-[#9CA3AF] hover:bg-[#EFEFEF] hover:text-[#292929] transition-colors"
                        aria-label={t('remove')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 p-4">
                    <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-[#F8F8F8] rounded-[12px] border border-[#EEEEEE] flex items-center justify-center">
                      <Box className="h-12 w-12 text-[#DCDCDC]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Material
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {item.configuration?.material || '–'}
                          </p>
                        </div>
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            Color
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {item.configuration?.color || '–'}
                          </p>
                        </div>
                        {item.statistics && (
                          <>
                            <div>
                              <span
                                className="text-[#9CA3AF]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                Weight/unit
                              </span>
                              <p
                                className="font-medium text-[#292929]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                {formatWeight(item.statistics.filament_weight_g || 0)}
                              </p>
                            </div>
                            <div>
                              <span
                                className="text-[#9CA3AF]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                Layer
                              </span>
                              <p
                                className="font-medium text-[#292929]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                {item.configuration?.layerHeight || '–'} mm
                              </p>
                            </div>
                            <div>
                              <span
                                className="text-[#9CA3AF]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                Infill
                              </span>
                              <p
                                className="font-medium text-[#292929]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                {item.configuration?.infill || '–'}
                              </p>
                            </div>
                            <div>
                              <span
                                className="text-[#9CA3AF]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                Walls
                              </span>
                              <p
                                className="font-medium text-[#292929]"
                                style={{ fontFamily: 'var(--font-geist-sans)' }}
                              >
                                {item.configuration?.wallCount ?? '2'}
                              </p>
                            </div>
                          </>
                        )}
                        <div>
                          <span
                            className="text-[#9CA3AF]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {t('quantity')}
                          </span>
                          <p
                            className="font-medium text-[#292929]"
                            style={{ fontFamily: 'var(--font-geist-sans)' }}
                          >
                            {qty} pcs
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>

          <div className="mt-6 pt-6 border-t border-[#EFEFEF]">
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-base font-semibold text-[#292929]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {t('subtotal')}
              </span>
              <span
                className="text-lg font-semibold text-[#1D0DF3]"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
              >
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p
              className="text-sm text-[#7C7C7C] mb-6"
              style={{ fontFamily: 'var(--font-geist-sans)' }}
            >
              {t('shippingAtCheckout')}
            </p>
            <Link href="/order" className="block">
              <Button className="w-full rounded-lg h-12 border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] flex items-center justify-center gap-2">
                {t('proceedToCheckout')}
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
