import { z } from 'zod'

export const addressSchema = z.object({
  recipientName: z.string().min(1, 'Recipient name is required'),
  phoneNumber: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^08\d{8,11}$/, 'Phone number must start with 08 and be 10-13 digits'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  provinceCode: z.string().min(1, 'Province is required'),
  regencyCode: z.string().min(1, 'City/Regency is required'),
  districtCode: z.string().min(1, 'District is required'),
  villageCode: z.string().min(1, 'Village/Sub-district is required'),
  postalCode: z
    .string()
    .min(1, 'Postal code is required')
    .length(5, 'Postal code must be exactly 5 digits')
    .regex(/^\d{5}$/, 'Postal code must contain only numbers'),
  isDefault: z.boolean().optional(),
})

export type AddressFormData = z.infer<typeof addressSchema>
