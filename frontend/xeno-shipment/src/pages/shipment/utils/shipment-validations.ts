import type { ShipmentFormData } from '../types/shipment-form.types'

export interface ValidationResult {
  isValid: boolean
  errors: Array<{ path: string; info: string }>
}

/**
 * Validates data required for rate calculation
 */
export const validateCalculateRatesData = (formData: ShipmentFormData): ValidationResult => {
  const errors: Array<{ path: string; info: string }> = []

  // Validate address fields
  if (!formData.ship_from_company_name?.trim()) {
    errors.push({ path: 'data.shipment.ship_from.company_name', info: 'Ship from company name is required' })
  }
  if (!formData.ship_to_company_name?.trim()) {
    errors.push({ path: 'data.shipment.ship_to.company_name', info: 'Ship to company name is required' })
  }

  // Validate parcels
  if (!formData.parcels || formData.parcels.length === 0) {
    errors.push({ path: 'data.shipment.parcels', info: 'At least one parcel is required' })
  } else {
    formData.parcels.forEach((parcel, parcelIndex) => {
      // Validate parcel dimensions
      if (!parcel.width || parseFloat(String(parcel.width)) <= 0) {
        errors.push({
          path: `data.shipment.parcels.${parcelIndex}.dimension.width`,
          info: 'data.shipment.parcels.' + parcelIndex + '.dimension.width should be > 0'
        })
      }
      if (!parcel.height || parseFloat(String(parcel.height)) <= 0) {
        errors.push({
          path: `data.shipment.parcels.${parcelIndex}.dimension.height`,
          info: 'data.shipment.parcels.' + parcelIndex + '.dimension.height should be > 0'
        })
      }
      if (!parcel.depth || parseFloat(String(parcel.depth)) <= 0) {
        errors.push({
          path: `data.shipment.parcels.${parcelIndex}.dimension.depth`,
          info: 'data.shipment.parcels.' + parcelIndex + '.dimension.depth should be > 0'
        })
      }

      // Validate parcel has items
      if (!parcel.parcel_items || parcel.parcel_items.length === 0) {
        errors.push({
          path: `data.shipment.parcels.${parcelIndex}.items`,
          info: 'Each parcel must have at least one item'
        })
      } else {
        // Validate items
        parcel.parcel_items.forEach((item, itemIndex) => {
          if (!item.description?.trim()) {
            errors.push({
              path: `data.shipment.parcels.${parcelIndex}.items.${itemIndex}.description`,
              info: 'data.shipment.parcels.' + parcelIndex + '.items.' + itemIndex + '.description is a required property'
            })
          }
          if (!item.quantity || parseInt(String(item.quantity)) < 1) {
            errors.push({
              path: `data.shipment.parcels.${parcelIndex}.items.${itemIndex}.quantity`,
              info: 'Item quantity must be at least 1'
            })
          }
          if (!item.weight_value || parseFloat(String(item.weight_value)) <= 0) {
            errors.push({
              path: `data.shipment.parcels.${parcelIndex}.items.${itemIndex}.weight.value`,
              info: 'Item weight must be greater than 0'
            })
          }
          if (!item.price_amount || parseFloat(String(item.price_amount)) <= 0) {
            errors.push({
              path: `data.shipment.parcels.${parcelIndex}.items.${itemIndex}.price.amount`,
              info: 'Item price must be greater than 0'
            })
          }
        })
      }
    })
  }

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates parcel and item weights
 */
export const validateWeights = (formData: ShipmentFormData): ValidationResult => {
  const errors: Array<{ path: string; info: string }> = []

  formData.parcels?.forEach((parcel, parcelIndex) => {
    if (parcel.parcel_items && parcel.parcel_items.length > 0) {
      // Calculate total item weight
      const totalItemWeight = parcel.parcel_items.reduce((sum, item) => {
        const itemWeight = parseFloat(String(item.weight_value)) || 0
        const quantity = parseInt(String(item.quantity)) || 1
        return sum + (itemWeight * quantity)
      }, 0)

      const parcelWeight = parseFloat(String(parcel.weight_value)) || 0

      if (parcelWeight < totalItemWeight) {
        errors.push({
          path: `Parcel ${parcelIndex + 1} - Weight`,
          info: `Parcel weight (${parcelWeight}kg) must be greater than or equal to the sum of item weights (${totalItemWeight.toFixed(2)}kg). Please increase the parcel weight or reduce item weights.`
        })
      }
    }

    // Check for invalid weights
    const parcelWeight = parseFloat(String(parcel.weight_value)) || 0
    if (parcelWeight <= 0) {
      errors.push({
        path: `Parcel ${parcelIndex + 1} - Weight`,
        info: `Parcel weight must be greater than 0kg`
      })
    }

    // Check for invalid dimensions
    const parcelDepth = parseFloat(String(parcel.depth)) || 0
    if (parcelDepth <= 0) {
      errors.push({
        path: `Parcel ${parcelIndex + 1} - Length/Depth`,
        info: `Parcel length/depth must be greater than 0cm`
      })
    }

    const parcelWidth = parseFloat(String(parcel.width)) || 0
    if (parcelWidth <= 0) {
      errors.push({
        path: `Parcel ${parcelIndex + 1} - Width`,
        info: `Parcel width must be greater than 0cm`
      })
    }

    const parceHeight = parseFloat(String(parcel.height)) || 0
    if (parceHeight <= 0) {
      errors.push({
        path: `Parcel ${parcelIndex + 1} - Height`,
        info: `Parcel height     must be greater than 0cm`
      })
    }

    // Check item weights
    parcel.parcel_items?.forEach((item, itemIndex) => {
      const itemWeight = parseFloat(String(item.weight_value)) || 0
      if (itemWeight <= 0) {
        errors.push({
          path: `Parcel ${parcelIndex + 1} - Item ${itemIndex + 1} Weight`,
          info: `Item weight must be greater than 0kg`
        })
      }
    })
  })

  return { isValid: errors.length === 0, errors }
}

/**
 * Validates shipment scope type matches selected countries
 */
export const validateShipmentScope = (formData: ShipmentFormData): {
  isValid: boolean
  error?: { title: string; message: string; details: Array<{ path: string; info: string }> }
} => {
  const shipFromCountry = formData.ship_from_country?.toUpperCase()
  const shipToCountry = formData.ship_to_country?.toUpperCase()
  const scopeType = formData.shipment_scope_type?.toLowerCase()

  const shipFromXenoptics = formData.ship_from_company_name?.toLowerCase().startsWith('xenoptic') || formData.ship_from?.company_name?.toLowerCase().startsWith('xenoptic')
  const shipToXenoptics = formData.ship_to_company_name?.toLowerCase().startsWith('xenoptic') || formData.ship_to?.company_name?.toLowerCase().startsWith('xenoptic')

  const bothThai = shipFromCountry === 'THA' && shipToCountry === 'THA'
  const bothNotThai = shipFromCountry !== 'THA' && shipToCountry !== 'THA'
  const fromThaiToOther = shipFromCountry === 'THA' && shipToCountry !== 'THA'
  const fromOtherToThai = shipFromCountry !== 'THA' && shipToCountry === 'THA'

  if (
    (scopeType === 'domestic_export' && !shipFromXenoptics) ||
    (scopeType === 'domestic_import' && !shipToXenoptics) ||
    (scopeType.startsWith('domestic') && !bothThai)     
  ) {
    return {
      isValid: false,
      error: {
        title: 'Shipment Scope Mismatch',
        message: 'The selected addresses do not match the shipment scope type.',
        details: [{
          path: 'Shipment Scope',
          info:
            'Please change your Scope Type in Basic Information:\n' +
            '• Domestic Export- Ship From has to be Xenoptics Company (Check Spelling and Address) and Ship To address has to be in Thailand (THA)\n' +
            '• Domestic Import- Ship To has to be Xenoptics Company (Check Spelling and Address) and Ship From address has to be in Thailand (THA)\n'
        }]

      }
    }
  }

  if (
    (scopeType === 'international_export' && !fromThaiToOther) ||
    (scopeType === 'international_import' && !fromOtherToThai) ||
    (scopeType === 'international_global' && !bothNotThai)
  ) {
    return {
      isValid: false,
      error: {
        title: 'Shipment Scope Mismatch',
        message: 'The selected addresses do not match the shipment scope type.',
        details: [{
          path: 'Shipment Scope',
          info:
            'Please change your Scope Type in Basic Information:\n' +
            '• International Export - shipping from THA to another country\n' +
            '• International Import - shipping from another country to THA\n' +
            '• International Global - both countries are outside Thailand'
        }]
      }
    }
  }

  return { isValid: true }
}
