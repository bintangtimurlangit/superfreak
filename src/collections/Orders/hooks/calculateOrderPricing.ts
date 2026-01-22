import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Calculate pricing for order items before creating/updating order
 */
export const calculateOrderPricing: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // Only calculate on create
  if (operation !== 'create') {
    return data
  }

  // Get pricing settings from CourierSettings global
  const courierSettings = await req.payload.findGlobal({
    slug: 'courier-settings',
  })

  const pricingSettings = courierSettings?.pricingSettings || {
    filamentCostPerGram: 100,
    printTimeCostPerHour: 10000,
    markupPercentage: 30,
  }

  // Calculate pricing for each item
  if (data.items && Array.isArray(data.items)) {
    data.items = data.items.map((item: any) => {
      const { statistics } = item

      // Calculate costs
      const filamentTotalCost = statistics.filamentWeight * pricingSettings.filamentCostPerGram
      const printTimeTotalCost = (statistics.printTime / 60) * pricingSettings.printTimeCostPerHour
      const basePrice = filamentTotalCost + printTimeTotalCost
      const markupAmount = basePrice * (pricingSettings.markupPercentage / 100)
      const subtotalPerUnit = basePrice + markupAmount

      return {
        ...item,
        pricing: {
          filamentCostPerGram: pricingSettings.filamentCostPerGram,
          filamentTotalCost,
          printTimeCostPerHour: pricingSettings.printTimeCostPerHour,
          printTimeTotalCost,
          basePrice,
          markupPercentage: pricingSettings.markupPercentage,
          markupAmount,
          subtotalPerUnit,
        },
      }
    })

    // Calculate summary totals
    const subtotal = data.items.reduce(
      (sum: number, item: any) => sum + item.pricing.subtotalPerUnit * item.quantity,
      0,
    )
    const totalWeight = data.items.reduce(
      (sum: number, item: any) => sum + item.statistics.filamentWeight * item.quantity,
      0,
    )
    const totalPrintTime = data.items.reduce(
      (sum: number, item: any) => sum + item.statistics.printTime * item.quantity,
      0,
    )
    const shippingCost = data.shipping?.shippingCost || 0
    const totalAmount = subtotal + shippingCost

    data.summary = {
      subtotal,
      shippingCost,
      totalAmount,
      totalWeight,
      totalPrintTime,
    }
  }

  return data
}
