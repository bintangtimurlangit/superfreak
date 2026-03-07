'use client'

import { useCart } from '@/components/providers/CartProvider'
import Button from '@/components/ui/Button'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { ShoppingCart, Box, ChevronRight } from 'lucide-react'

export default function CartPage() {
  const t = useTranslations('Cart')
  const { cart, cartCount } = useCart()

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] bg-[#F8F8F8] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full border border-[#EFEFEF] bg-white mb-6">
            <ShoppingCart className="h-8 w-8 text-[#989898]" />
          </div>
          <h1 className="text-xl font-semibold text-[#292929] mb-2">{t('empty')}</h1>
          <p className="text-sm text-[#6b7280] mb-6">{t('emptyDescription')}</p>
          <Link href="/order">
            <Button className="rounded-lg border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333]">
              {t('startOrder')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] bg-[#F8F8F8] py-8 px-6 md:px-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#292929] mb-6 flex items-center gap-2">
          <ShoppingCart className="h-6 w-6" />
          {t('title')}
          <span className="text-sm font-normal text-[#6b7280]">({cartCount} items)</span>
        </h1>

        <ul className="space-y-4 mb-8">
          {cart.map((item) => (
            <li
              key={item.id}
              className="bg-white rounded-xl border border-[#EFEFEF] p-4 flex items-center gap-4"
            >
              <div className="h-14 w-14 rounded-lg bg-[#F8F8F8] border border-[#EFEFEF] flex items-center justify-center flex-shrink-0">
                <Box className="h-6 w-6 text-[#989898]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#292929] truncate">{item.name}</p>
                <p className="text-sm text-[#6b7280]">
                  {item.configuration?.material ?? '—'} · {item.configuration?.color ?? '—'} ·{' '}
                  {item.configuration?.layerHeight ?? '—'} · {item.configuration?.infill ?? '—'}
                </p>
                {item.statistics && (
                  <p className="text-xs text-[#989898] mt-0.5">
                    {t('weight')}: {item.statistics.filament_weight_g}g
                    {item.configuration?.quantity && item.configuration.quantity > 1
                      ? ` × ${item.configuration.quantity}`
                      : ''}
                  </p>
                )}
              </div>
              <div className="text-sm text-[#292929] font-medium">
                {t('quantity')}: {item.configuration?.quantity ?? 1}
              </div>
            </li>
          ))}
        </ul>

        <Link href="/order" className="block">
          <Button className="w-full rounded-lg h-12 border border-[#292929] !bg-[#292929] text-white hover:!bg-[#333333] flex items-center justify-center gap-2">
            {t('proceedToCheckout')}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
