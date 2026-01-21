export interface Address {
  id: string
  recipientName: string
  phoneNumber: string
  addressLine1: string
  addressLine2: string
  provinceCode: string
  regencyCode: string
  districtCode: string
  villageCode: string
  postalCode: string
  isDefault: boolean
}

export interface Province {
  code: string
  name: string
}

export interface Regency {
  code: string
  name: string
  province_code: string
}

export interface District {
  code: string
  name: string
  regency_code: string
}

export interface Village {
  code: string
  name: string
  district_code: string
}

export interface SavedAddress extends Address {
  provinceName?: string
  regencyName?: string
  districtName?: string
  villageName?: string
}
