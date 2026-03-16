import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { calculateAndTransformRates, calculateShippingRates, type RateCalculationFormData } from '@services/rateCalculationService'
import type { ShipmentFormData } from '../types/shipment-form.types'

export interface RateCalculationError {
  message: string
  details?: Array<{ path: string; info: string }>
}

export interface UseShipmentRateCalculationOptions {
  watchedFields: any[]
  skipInitialClearOnEdit?: boolean
}

export const useShipmentRateCalculation = ({ watchedFields, skipInitialClearOnEdit = false }: UseShipmentRateCalculationOptions) => {
  const [isCalculatingRate, setIsCalculatingRate] = useState(false)
  const [calculatedRates, setCalculatedRates] = useState<any[]>([])
  const [transformedRates, setTransformedRates] = useState<any[]>([])
  const [selectedRateId, setSelectedRateId] = useState<string>('')
  const [rateCalculationSnapshot, setRateCalculationSnapshot] = useState<any>(null)
  const [rateCalculationError, setRateCalculationError] = useState<RateCalculationError | null>(null)
  const isInitialLoad = useRef(skipInitialClearOnEdit)

  // Effect to clear rates when critical form data changes
  useEffect(() => {
    // Skip clearing rates during initial load for edit forms
    if (isInitialLoad.current) {
      return
    }

    if (rateCalculationSnapshot && calculatedRates.length > 0) {
      const hasChanged = JSON.stringify(watchedFields) !== JSON.stringify(rateCalculationSnapshot)

      if (hasChanged) {
        console.log('Critical form data changed, clearing rates...')
        console.log('Previous:', rateCalculationSnapshot)
        console.log('Current:', watchedFields)
        handleClearRates()
      }
    }
  }, [watchedFields, rateCalculationSnapshot, calculatedRates.length])

  const handleRateSelection = (rateId: string) => {
    setSelectedRateId(rateId)
  }

  const handleClearRates = () => {
    setCalculatedRates([])
    setTransformedRates([])
    setSelectedRateId('')
    setRateCalculationSnapshot(null)
    setRateCalculationError(null)
  }

  const calculateRates = async (formData: ShipmentFormData): Promise<ShipmentFormData> => {
    try {
      setIsCalculatingRate(true)

      // Convert ShipmentFormData to RateCalculationFormData
      const serviceFormData: RateCalculationFormData = {
        ship_from_contact_name: formData.ship_from_contact_name,
        ship_from_company_name: formData.ship_from_company_name,
        ship_from_street1: formData.ship_from_street1,
        ship_from_city: formData.ship_from_city,
        ship_from_state: formData.ship_from_state,
        ship_from_postal_code: formData.ship_from_postal_code,
        ship_from_country: formData.ship_from_country,
        ship_from_phone: formData.ship_from_phone,
        ship_from_email: formData.ship_from_email,
        ship_to_contact_name: formData.ship_to_contact_name,
        ship_to_company_name: formData.ship_to_company_name,
        ship_to_street1: formData.ship_to_street1,
        ship_to_city: formData.ship_to_city,
        ship_to_state: formData.ship_to_state,
        ship_to_postal_code: formData.ship_to_postal_code,
        ship_to_country: formData.ship_to_country,
        ship_to_phone: formData.ship_to_phone,
        ship_to_email: formData.ship_to_email,
        parcels: formData.parcels,
        pick_up_date: formData.pick_up_date,
        expected_delivery_date: formData.due_date,
        customs_terms_of_trade: formData.customs_terms_of_trade
      }

      // Use the shared rate calculation service to get both original and transformed rates
      const originalRates = await calculateShippingRates(serviceFormData)
      const transformedRates = await calculateAndTransformRates(serviceFormData)

      // Store original rates in component state for display
      console.log('Setting calculated rates:', originalRates)
      setCalculatedRates(originalRates) // Keep original for RatesSection display
      setTransformedRates(transformedRates) // Store transformed rates to avoid recalculation

      // Clear any previous rate calculation errors on success
      setRateCalculationError(null)

      // Store the rates in the form data
      const updatedFormData = {
        ...formData,
        rates: transformedRates
      }

      return updatedFormData
    } catch (error) {
      console.error('Error calculating rates:', error)

      // Check for response data (handles both AxiosError and custom errors with response attached)
      const errorResponse = (error as any).response?.data

      if (errorResponse) {
        // Handle API validation errors
        if (errorResponse.meta?.details && Array.isArray(errorResponse.meta.details)) {
          setRateCalculationError({
            message: errorResponse.meta?.message || 'The request was invalid or cannot be otherwise served.',
            details: errorResponse.meta.details.map((detail: any) => ({
              path: detail.path,
              info: detail.info
            }))
          })
        } else if (errorResponse.meta?.message) {
          setRateCalculationError({
            message: errorResponse.meta.message,
            details: []
          })
        } else {
          setRateCalculationError({
            message: 'Error calculating shipping rates. Please check your form data and try again.',
            details: []
          })
        }
      } else if (axios.isAxiosError(error)) {
        // Handle network errors without response data
        setRateCalculationError({
          message: 'Error calculating shipping rates. Please check your internet connection and try again.',
          details: []
        })
      } else {
        // Handle other unexpected errors
        setRateCalculationError({
          message: error instanceof Error ? error.message : 'An unexpected error occurred while calculating rates.',
          details: []
        })
      }
      return formData
    } finally {
      setIsCalculatingRate(false)
    }
  }

  const setInitialLoadComplete = () => {
    isInitialLoad.current = false
  }

  return {
    // State
    isCalculatingRate,
    calculatedRates,
    transformedRates,
    selectedRateId,
    rateCalculationSnapshot,
    rateCalculationError,

    // Actions
    calculateRates,
    handleRateSelection,
    handleClearRates,
    setRateCalculationSnapshot,
    setInitialLoadComplete
  }
}
