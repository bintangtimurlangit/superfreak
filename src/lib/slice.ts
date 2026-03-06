import { parseConfigurationValues } from '@/lib/validations/order'

export interface SliceConfig {
  material?: string
  layerHeight?: string
  infill?: string
  wallCount?: string
}

export interface SliceStatistics {
  print_time_minutes: number
  print_time_formatted: string
  filament_length_mm: number
  filament_volume_cm3: number
  filament_weight_g: number
  filament_type: string
  layer_height: number
  infill_density: number
  wall_count: number
}

/**
 * Call the slice API with a file and print configuration. Returns statistics (weight, print time, etc.).
 * Used for initial slice in UploadStep and re-slice in ReviewStep when config changes.
 */
export async function sliceFile(
  file: File,
  config: SliceConfig,
): Promise<SliceStatistics> {
  const validation = parseConfigurationValues({
    layerHeight: config.layerHeight,
    infill: config.infill,
    wallCount: config.wallCount,
  })

  if (!validation.valid) {
    throw new Error(
      `Configuration validation failed: ${validation.errors.join(', ')}`,
    )
  }

  const { layerHeight, infillDensity, wallCount } = validation.values
  const filamentType = config.material?.toUpperCase() || 'PLA'

  const formData = new FormData()
  formData.append('file', file)
  formData.append('layer_height', layerHeight.toString())
  formData.append('infill_density', infillDensity.toString())
  formData.append('wall_count', wallCount.toString())
  formData.append('filament_type', filamentType)

  const response = await fetch('/api/slice', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(errorData.detail || `Slice failed: ${response.status}`)
  }

  return response.json()
}
