import axios from 'axios'
import { DEFAULT_DHL_RATE_SLABS, type DHLEcommerceRateSlab } from './dhlEcommerceRates'

// Interface for DHL eCommerce rate list API response
interface DHLEcommerceRateListResponse {
  data: DHLEcommerceRateSlab[]
  count: number
}

export interface RateCalculationFormData {
  ship_from_contact_name: string
  ship_from_company_name: string
  ship_from_street1: string
  ship_from_city: string
  ship_from_state: string
  ship_from_postal_code: string
  ship_from_country: string
  ship_from_phone: string
  ship_from_email: string
  ship_to_contact_name: string
  ship_to_company_name: string
  ship_to_street1: string
  ship_to_city: string
  ship_to_state: string
  ship_to_postal_code: string
  ship_to_country: string
  ship_to_phone: string
  ship_to_email: string
  pick_up_date: string
  expected_delivery_date: string
  customs_terms_of_trade?: string
  parcels?: Array<{
    width: number | string
    height: number | string
    depth: number | string
    dimension_unit: string
    weight_value: number | string
    weight_unit: string
    description: string
    parcel_items?: Array<{
      description: string
      quantity: number | string
      price_currency: string
      price_amount: number | string
      item_id: string
      origin_country: string
      weight_unit: string
      weight_value: number | string
      sku: string
      hs_code: string
    }>
  }>
}

export interface ShippingRate {
  shipper_account: {
    id: string
    slug: string
    description: string
  }
  service_type: string
  service_name: string
  pickup_deadline: string
  booking_cut_off: string
  delivery_date: string
  transit_time?: number
  error_message?: string
  info_message?: string
  charge_weight?: {
    value: number
    unit: string
  }
  total_charge?: {
    amount: number
    currency: string
  }
  detailed_charges?: any[]
}

export interface RateCalculationOptions {
  transformRates?: boolean
  includeUniqueId?: boolean
}

/**
 * Transforms form data into the format expected by the backend API
 */
const transformFormDataToShipment = (formData: RateCalculationFormData) => {
  return {
    ship_from: {
      contact_name: formData.ship_from_contact_name,
      company_name: formData.ship_from_company_name,
      street1: formData.ship_from_street1,
      city: formData.ship_from_city,
      state: formData.ship_from_state,
      postal_code: formData.ship_from_postal_code,
      country: formData.ship_from_country,
      phone: formData.ship_from_phone,
      email: formData.ship_from_email
    },
    ship_to: {
      contact_name: formData.ship_to_contact_name,
      company_name: formData.ship_to_company_name,
      street1: formData.ship_to_street1,
      city: formData.ship_to_city,
      state: formData.ship_to_state,
      postal_code: formData.ship_to_postal_code,
      country: formData.ship_to_country,
      phone: formData.ship_to_phone,
      email: formData.ship_to_email
    },
    parcels: formData.parcels?.map(parcel => ({
      box_type: "custom",
      dimension: {
        width: parseFloat(String(parcel.width)) || 0,
        height: parseFloat(String(parcel.height)) || 0,
        depth: parseFloat(String(parcel.depth)) || 0,
        unit: parcel.dimension_unit
      },
      items: parcel.parcel_items?.map(item => ({
        description: item.description,
        quantity: parseInt(String(item.quantity)) || 1,
        price: {
          currency: item.price_currency,
          amount: parseFloat(String(item.price_amount)) || 0,
        },
        item_id: item.item_id,
        origin_country: item.origin_country,
        weight: {
          unit: item.weight_unit,
          value: parseFloat(String(item.weight_value)) || 0,
        },
        sku: item.sku,
        hs_code: item.hs_code
      })),
      description: parcel.description,
      weight: {
        unit: parcel.weight_unit,
        value: parseFloat(String(parcel.weight_value)) || 0
      }
    })),
    delivery_instructions: "handle with care"
  }
}

/**
 * Determines shipment type based on origin and destination countries
 */
const determineShipmentType = (fromCountry: string, toCountry: string): string => {
  if (fromCountry === "THA" && toCountry === "THA") {
    return "domestic"
  } else if (toCountry === "THA" && fromCountry !== "THA") {
    return "import"
  } else if (fromCountry === "THA" && toCountry !== "THA") {
    return "export"
  } else {
    return "cross-border" // neither side is THA
  }
}

/**
 * Generates a unique ID for a shipping rate
 */
const getRateUniqueId = (rate: ShippingRate): string => {
  const shipperAccountId = rate.shipper_account?.id || ''
  const totalChargeAmount = rate.total_charge?.amount || 0
  const totalChargeCurrency = rate.total_charge?.currency || 'null'
  const transitTime = rate.transit_time || 'null'
  return `${shipperAccountId}-${rate.service_type}-${transitTime}-${totalChargeAmount}-${totalChargeCurrency}`
}

/**
 * Transforms API rates into the format used by ShipmentForm
 */
const transformRatesForShipmentForm = (apiRates: ShippingRate[]) => {
  return apiRates.map((rate: ShippingRate) => ({
    shipper_account_id: rate.shipper_account.id,
    shipper_account_slug: rate.shipper_account.slug,
    shipper_account_description: rate.shipper_account.description,
    service_type: rate.service_type,
    service_name: rate.service_name,
    pickup_deadline: rate.pickup_deadline,
    booking_cut_off: rate.booking_cut_off,
    delivery_date: rate.delivery_date,
    transit_time: rate.transit_time || 0,
    error_message: rate.error_message || '',
    info_message: rate.info_message || '',
    charge_weight_value: rate.charge_weight?.value || 0,
    charge_weight_unit: rate.charge_weight?.unit || '',
    total_charge_amount: rate.total_charge?.amount || 0,
    total_charge_currency: rate.total_charge?.currency || '',
    unique_id: getRateUniqueId(rate),
    chosen: false,
    detailed_charges: JSON.stringify(rate.detailed_charges) || ''
  }))
}

/**
 * Fetch DHL eCommerce domestic rate list from API
 */
const fetchDHLEcommerceRateList = async (): Promise<DHLEcommerceRateSlab[]> => {
  try {
    const apiUrl = import.meta.env.VITE_APP_GET_ALL_DHL_ECOMMERCE_DOMESTIC_RATE_LIST
    if (!apiUrl) {
      console.error('DHL eCommerce rate list API URL not configured')
      return []
    }

    const response = await axios.get<DHLEcommerceRateListResponse>(apiUrl)
    return response.data?.data || []
  } catch (error) {
    console.error('Failed to fetch DHL eCommerce rate list:', error)
    return []
  }
}

/**
 * Checks if a shipment is within the Bangkok postal code region.
 * A shipment is considered within Bangkok if at least one (origin or destination) postal code starts with "10".
 * @param fromPostalCode - The ship_from postal code.
 * @param toPostalCode - The ship_to postal code.
 * @returns boolean - True if at least one address is in the BKK postal code region.
 */
const isBKKPostalCodeShipment = (fromPostalCode: string, toPostalCode: string): boolean => {
  const isFromBKK = fromPostalCode.startsWith('10');
  const isToBKK = toPostalCode.startsWith('10');

  return isFromBKK || isToBKK;
};

/**
 * Find the appropriate rate based on weight
 */
const findRateByWeight = (weight: number, rateSlabs: DHLEcommerceRateSlab[], isBKK: boolean): number => {
  // Normalize and sort slabs by min weight
  const sorted = rateSlabs.slice().sort((a, b) => parseFloat(a.min_weight_kg) - parseFloat(b.min_weight_kg))

  if (sorted.length === 0) {
    console.warn('No rate slabs available to determine rate for weight', weight)
    return 62 // last resort (should not happen because DEFAULT_DHL_RATE_SLABS exists)
  }

  // Find the appropriate slab by looking for the highest min_weight that is <= weight
  // This handles floating point precision issues (e.g., 15.00002 falls between 15.000 and 15.001)
  let matchedSlab: DHLEcommerceRateSlab | null = null

  for (const slab of sorted) {
    const minWeight = parseFloat(slab.min_weight_kg)
    const maxWeight = parseFloat(slab.max_weight_kg)

    // Round to 3 decimal places to avoid floating point precision issues
    const roundedWeight = Math.round(weight * 1000) / 1000
    const roundedMin = Math.round(minWeight * 1000) / 1000
    const roundedMax = Math.round(maxWeight * 1000) / 1000

    // Check if weight falls within this slab's range (with rounding)
    if (roundedWeight >= roundedMin && roundedWeight <= roundedMax) {
      matchedSlab = slab
      break
    }

    // Also check if weight is slightly above max (within 0.01kg) - use this slab
    if (roundedWeight > roundedMax && roundedWeight <= roundedMax + 0.01) {
      matchedSlab = slab
      break
    }
  }

  if (matchedSlab) {
    const chargeType = isBKK ? matchedSlab.bkk_charge_thb : matchedSlab.upc_charge_thb;
    return parseFloat(chargeType);
  }

  // If no match found, find the closest slab
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  const firstMin = parseFloat(first.min_weight_kg)
  const lastMax = parseFloat(last.max_weight_kg)

  if (weight < firstMin) {
    // below minimum - use first slab's upcountry rate
    const chargeType = isBKK ? first.bkk_charge_thb : first.upc_charge_thb;
    return parseFloat(chargeType);
  }

  if (weight > lastMax) {
    // above maximum - use last slab's upcountry rate
    const chargeType = isBKK ? last.bkk_charge_thb : last.upc_charge_thb;
    return parseFloat(chargeType);
  }

  // Find the nearest slab by min_weight
  const nearestSlab = sorted.reduce((prev, curr) => {
    const prevDiff = Math.abs(parseFloat(prev.min_weight_kg) - weight)
    const currDiff = Math.abs(parseFloat(curr.min_weight_kg) - weight)
    return currDiff < prevDiff ? curr : prev
  })

  console.warn(`Weight ${weight}kg did not match any slab exactly, using nearest slab (min: ${nearestSlab.min_weight_kg}kg)`)
  const chargeType = isBKK ? nearestSlab.bkk_charge_thb : nearestSlab.upc_charge_thb;
  return parseFloat(chargeType);
}

/**
 * Calculate volumetric weight for a parcel
 * Formula: (width × length × height in cm) / 5000
 * @param width - Width value
 * @param height - Height value
 * @param depth - Depth/Length value
 * @param dimensionUnit - Unit of dimensions (cm or in)
 * @returns Volumetric weight in kg
 */
const calculateVolumetricWeight = (
  width: number | string,
  height: number | string,
  depth: number | string,
  dimensionUnit: string
): number => {
  let widthCm = parseFloat(String(width)) || 0
  let heightCm = parseFloat(String(height)) || 0
  let depthCm = parseFloat(String(depth)) || 0

  // Convert to cm if dimensions are in inches
  if (dimensionUnit.toLowerCase() === 'in') {
    widthCm = widthCm * 2.54
    heightCm = heightCm * 2.54
    depthCm = depthCm * 2.54
  }

  // Calculate volumetric weight: (width × length × height) / 5000
  const volumetricWeightKg = (widthCm * heightCm * depthCm) / 5000

  return volumetricWeightKg
}

/**
 * Convert weight to kg
 * @param weight - Weight value
 * @param weightUnit - Unit of weight (kg or lb)
 * @returns Weight in kg
 */
const convertWeightToKg = (weight: number | string, weightUnit: string): number => {
  let weightKg = parseFloat(String(weight)) || 0

  // Convert to kg if weight is in pounds
  if (weightUnit.toLowerCase() === 'lb') {
    weightKg = weightKg * 0.453592
  }

  return weightKg
}

/**
 * Calculate total charge weight from parcels for DHL eCommerce
 * Every parcel is charged based on the greater of the actual weight or the volumetric weight
 * (calculated as width × length × height in centimeters divided by 5,000).
 * The greater weight will be used to calculate the service charge.
 */
const calculateChargeWeightThailandDomesticRate = (formData: RateCalculationFormData): number => {
  if (!formData.parcels || formData.parcels.length === 0) {
    return 1 // Default to 1kg if no parcels
  }

  const totalChargeWeight = formData.parcels.reduce((total, parcel) => {
    // Calculate actual weight in kg
    const actualWeightKg = convertWeightToKg(parcel.weight_value, parcel.weight_unit)

    // Calculate volumetric weight in kg
    const volumetricWeightKg = calculateVolumetricWeight(
      parcel.width,
      parcel.height,
      parcel.depth,
      parcel.dimension_unit
    )

    // Take the larger of actual weight or volumetric weight
    const chargeWeight = Math.max(actualWeightKg, volumetricWeightKg)

    console.log(`Parcel charge weight calculation:`, {
      actualWeight: `${actualWeightKg.toFixed(2)} kg`,
      volumetricWeight: `${volumetricWeightKg.toFixed(2)} kg`,
      chargeWeight: `${chargeWeight.toFixed(2)} kg (using ${chargeWeight === actualWeightKg ? 'actual' : 'volumetric'})`,
      dimensions: `${parcel.width}×${parcel.height}×${parcel.depth} ${parcel.dimension_unit}`
    })

    return total + chargeWeight
  }, 0)

  return totalChargeWeight || 1 // Default to 1kg if total is 0
}

/**
 * Create manual domestic rate for Thailand
 * @param chargeWeight - Weight in kg
 * @param totalAmount - Calculated total amount in THB
 */
const createThailandDomesticRate = (chargeWeight: number, totalAmount: number): ShippingRate => {
  return {
    shipper_account: {
      id: "fb842bff60154a2f8c84584a74d0cf69",
      slug: "dhl-global-mail-asia",
      description: "DHL eCommerce Asia"
    },
    service_type: "dhl-global-mail-asia_parcel_domestic",
    service_name: "Parcel Domestic",
    pickup_deadline: "",
    booking_cut_off: "",
    delivery_date: "",
    transit_time: undefined,
    error_message: undefined,
    info_message: "Rate will be calculated and received in billing cycle.",
    charge_weight: {
      value: chargeWeight,
      unit: "kg"
    },
    total_charge: {
      amount: totalAmount,
      currency: "THB"
    }
  }
}

/**
 * Calculate shipping rates using the backend API
 * @param formData - The form data containing shipment details
 * @param options - Optional configuration for rate transformation
 * @returns Promise<ShippingRate[]> - Array of shipping rates
 */
export const calculateShippingRates = async (
  formData: RateCalculationFormData,
  _options: RateCalculationOptions = {}
): Promise<ShippingRate[]> => {
  const shipment = transformFormDataToShipment(formData)
  const type = determineShipmentType(formData.ship_from_country, formData.ship_to_country)

  // Backend API payload structure
  const backendPayload = {
    preparedata: {
      shipment: shipment,
      pick_up_date: formData.pick_up_date,
      expected_delivery_date: formData.expected_delivery_date
    },
    type: type
  }

  const response = await axios.post(
    import.meta.env.VITE_APP_CALCULATE_RATE,
    backendPayload,
    {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    }
  )

  // Check if the response contains an error in the meta field
  if (response.data?.meta?.code && response.data.meta.code !== 200) {
    // API returned an error - throw it so it can be caught by the form
    const error: any = new Error(response.data.meta.message || 'Rate calculation failed')
    error.response = response
    throw error
  }

  // Extract rates from the API response
  let apiRates = response.data?.data?.rates || []
  console.log('Rate calculation successful:', apiRates)

  // Add manual domestic rate for Thailand if both countries are THA
  const isDomesticThailand = formData.ship_from_country === "THA" && formData.ship_to_country === "THA"
  if (isDomesticThailand) {
    // Calculate total weight first
    const chargeWeight = calculateChargeWeightThailandDomesticRate(formData)

    // Only show DHL eCommerce Asia if weight is 35kg or less
    if (chargeWeight <= 35) {
      // Check if DHL eCommerce Asia rate already exists
      const hasDHLRate = apiRates.some((rate: ShippingRate) =>
        rate.shipper_account?.slug === "dhl-global-mail-asia"
      )

      // Only add manual rate if DHL eCommerce Asia is not in the response
      if (!hasDHLRate) {
        // Fetch DHL eCommerce rate list
        const rateSlabs = await fetchDHLEcommerceRateList()

        // Use fetched slabs if available, otherwise fall back to built-in default slabs
        const slabsToUse = (rateSlabs && rateSlabs.length > 0) ? rateSlabs : DEFAULT_DHL_RATE_SLABS
        if (!rateSlabs || rateSlabs.length === 0) {
          console.warn('Failed to fetch DHL eCommerce rate list, using default built-in slabs')
        }

        // Determine if the shipment is within BKK region based on postal codes
        const isBKK = isBKKPostalCodeShipment(formData.ship_from_postal_code, formData.ship_to_postal_code);

        // Calculate the rate based on weight and location
        const totalAmount = findRateByWeight(chargeWeight, slabsToUse, isBKK)
        console.log(`DHL eCommerce Asia rate for ${chargeWeight}kg: ${totalAmount} THB (${isBKK ? 'BKK rate' : 'Upcountry rate'})`)

        const manualRate = createThailandDomesticRate(chargeWeight, totalAmount)
        apiRates = [manualRate, ...apiRates] // Add at the beginning
        console.log('Added manual Thailand domestic rate:', manualRate)
      }
    } else {
      console.log('Skipping DHL eCommerce Asia rate - weight exceeds 35kg:', chargeWeight)
    }
  }

  return apiRates
}

/**
 * Calculate shipping rates and transform them for ShipmentForm usage
 * @param formData - The form data containing shipment details
 * @returns Promise<any[]> - Array of transformed shipping rates
 */
export const calculateAndTransformRates = async (formData: RateCalculationFormData): Promise<any[]> => {
  const apiRates = await calculateShippingRates(formData)
  return transformRatesForShipmentForm(apiRates)
}

/**
 * Export utility functions for reuse
 */
export {
  transformFormDataToShipment,
  determineShipmentType,
  getRateUniqueId,
  transformRatesForShipmentForm
}