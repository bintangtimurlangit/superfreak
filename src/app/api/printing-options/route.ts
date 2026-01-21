import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

interface PricingTableRow {
  layerHeight: number | null
  pricePerGram: number | null
}

interface ColorOption {
  name: string
  hexCode?: string | null
  isActive?: boolean
}

interface PrintingOptionValue {
  label: string
  value: string
  isActive?: boolean | null
  id?: string | null
}

export async function GET() {
  try {
    const payload = await getPayload()

    // Fetch active filament types
    const filamentTypes = await payload.find({
      collection: 'filament-types',
      where: {
        isActive: { equals: true },
      },
      sort: 'name',
      limit: 100,
    })

    // Fetch active printing options (infill, wallCount, etc.)
    const printingOptions = await payload.find({
      collection: 'printing-options',
      where: {
        isActive: { equals: true },
      },
      sort: 'type',
      limit: 100,
    })

    // Fetch pricing to get available layer heights
    const pricing = await payload.find({
      collection: 'printing-pricing',
      where: {
        isActive: { equals: true },
      },
      limit: 100,
    })

    // Extract unique layer heights from pricing tables
    const layerHeights = new Set<number>()
    pricing.docs.forEach((priceDoc) => {
      if (priceDoc.pricingTable && Array.isArray(priceDoc.pricingTable)) {
        priceDoc.pricingTable.forEach((row: PricingTableRow) => {
          if (row.layerHeight != null) {
            layerHeights.add(row.layerHeight)
          }
        })
      }
    })

    // Organize data
    const materials = filamentTypes.docs.map((doc) => doc.name).filter(Boolean)
    
    // Get all colors from all filament types
    const allColors = new Set<string>()
    filamentTypes.docs.forEach((doc) => {
      if (doc.colors && Array.isArray(doc.colors)) {
        doc.colors.forEach((color: ColorOption) => {
          if (color.name && color.isActive !== false) {
            allColors.add(color.name)
          }
        })
      }
    })

    // Organize printing options by type
    const optionsByType: Record<string, Array<{ label: string; value: string }>> = {}
    printingOptions.docs.forEach((doc) => {
      if (doc.values && Array.isArray(doc.values)) {
        optionsByType[doc.type] = doc.values
          .filter((val: PrintingOptionValue) => val.isActive !== false)
          .map((val: PrintingOptionValue) => ({
            label: val.label,
            value: val.value,
          }))
      }
    })

    // Get wall count max value
    const wallCountOption = printingOptions.docs.find((doc) => doc.type === 'wallCount')
    const maxWallCount = wallCountOption?.maxValue || 20

    return NextResponse.json({
      materials: Array.from(materials).sort(),
      colors: Array.from(allColors).sort(),
      layerHeights: Array.from(layerHeights)
        .sort((a, b) => a - b)
        .map((h) => h.toFixed(2)),
      infill: optionsByType.infill || [],
      maxWallCount,
    })
  } catch (error) {
    console.error('Error fetching printing options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch printing options' },
      { status: 500 }
    )
  }
}
