import { z } from 'zod'

export const modelConfigurationSchema = z.object({
  material: z.string().min(1, 'Material is required'),
  color: z.string().min(1, 'Color is required'),
  layerHeight: z
    .string()
    .min(1, 'Layer height is required')
    .refine(
      (val) => {
        const num = parseFloat(val)
        return !isNaN(num) && num > 0 && num <= 1.0
      },
      { message: 'Layer height must be between 0.01 and 1.0 mm' },
    ),
  infill: z
    .string()
    .min(1, 'Infill is required')
    .regex(/^\d+%$/, 'Infill must be a percentage (e.g., 20%)'),
  wallCount: z
    .string()
    .min(1, 'Wall count is required')
    .refine(
      (val) => {
        const num = parseInt(val, 10)
        return !isNaN(num) && num >= 1 && num <= 20
      },
      { message: 'Wall count must be between 1 and 20' },
    ),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  support: z.boolean().optional(),
  enabled: z.boolean(),
  specialRequest: z.string().optional(),
})

export type ModelConfigurationFormData = z.infer<typeof modelConfigurationSchema>

export const uploadedFileSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'File name is required'),
  size: z.number().positive('File size must be positive'),
  status: z.enum(['pending', 'uploading', 'completed', 'error']),
  configuration: modelConfigurationSchema.optional(),
})

export type UploadedFileFormData = z.infer<typeof uploadedFileSchema>

export function validateModelConfiguration(config: unknown) {
  return modelConfigurationSchema.safeParse(config)
}

export function parseConfigurationValues(config: {
  layerHeight?: string
  infill?: string
  wallCount?: string
}): {
  valid: boolean
  errors: string[]
  values: {
    layerHeight: number
    infillDensity: number
    wallCount: number
  }
} {
  const layerHeight = config.layerHeight ? parseFloat(config.layerHeight) : NaN
  const infillDensity = config.infill ? parseInt(config.infill.replace('%', ''), 10) : NaN
  const wallCount = config.wallCount ? parseInt(config.wallCount, 10) : NaN

  const errors: string[] = []

  if (isNaN(layerHeight) || layerHeight <= 0) {
    errors.push('Invalid layer height')
  }

  if (isNaN(infillDensity) || infillDensity < 0 || infillDensity > 100) {
    errors.push('Invalid infill density (must be 0-100%)')
  }

  if (isNaN(wallCount) || wallCount < 1 || wallCount > 20) {
    errors.push('Invalid wall count (must be 1-20)')
  }

  return {
    valid: errors.length === 0,
    errors,
    values: {
      layerHeight: layerHeight || 0,
      infillDensity: infillDensity || 0,
      wallCount: wallCount || 0,
    },
  }
}
