import { validateWeights, validateShipmentScope } from '../utils/shipment-validations'
import type { ShipmentFormData } from '../types/shipment-form.types'

export interface ValidationError {
  path: string
  info: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

interface ValidationOptions {
  today: string
  rateCalculationSnapshot: any
  watchedFields: any
  calculatedRates: any[]
  selectedRateId: string | null
  previouslyChosenRate: any
}

/**
 * Validates shipment form data before submission
 * Returns all validation errors at once for better UX
 */
export const validateShipmentEdit = (
  formData: ShipmentFormData,
  options: ValidationOptions
): ValidationResult => {
  const {
    today,
    rateCalculationSnapshot,
    watchedFields,
    calculatedRates,
    selectedRateId,
    previouslyChosenRate
  } = options

  const allErrors: ValidationError[] = []

  // 1. Weight validation
  const weightValidation = validateWeights(formData)
  if (!weightValidation.isValid) {
    allErrors.push(...weightValidation.errors)
  }

  // 2. Validate pickup date is not in the past
  if (formData.pick_up_date) {
    const pickupDate = new Date(formData.pick_up_date)
    const todayStart = new Date(today)

    if (pickupDate < todayStart) {
      allErrors.push({
        path: 'Pickup Date',
        info: `Selected: ${formData.pick_up_date} | Today: ${today} - Please select today or a future date.`
      })
    }
  }

  // 3. Validate shipment scope matches ship from/to countries
  const scopeValidation = validateShipmentScope(formData)
  if (!scopeValidation.isValid && scopeValidation.error) {
    allErrors.push(...scopeValidation.error.details)
  }

  // 4. Rate validations (only if NOT Supplier Pickup)
  if (formData.service_options !== 'Supplier Pickup') {
    // 4a. Check if critical fields changed since rate was selected (for non-Grab services)
    if (formData.service_options !== 'Grab' && rateCalculationSnapshot) {
      const currentSnapshot = JSON.stringify(watchedFields)
      const savedSnapshot = JSON.stringify(rateCalculationSnapshot)

      console.log('=== Rate Validation Debug ===')
      console.log('Current watchedFields:', watchedFields)
      console.log('Saved rateCalculationSnapshot:', rateCalculationSnapshot)
      console.log('Current Snapshot String:', currentSnapshot)
      console.log('Saved Snapshot String:', savedSnapshot)
      console.log('Are they equal?', currentSnapshot === savedSnapshot)

      if (currentSnapshot !== savedSnapshot) {
        console.log('DIFFERENCE DETECTED - Adding error')
        allErrors.push({
          path: 'Rate Recalculation Required',
          info: 'Address or parcel information has changed since the rate was selected. Please recalculate and select a new rate before proceeding!'
        })
      }
    }

    // 4b. For Grab, check if rate was entered or already exists
    if (formData.service_options === 'Grab' && !selectedRateId) {
      // Check if there's already a grab_rate_amount in the form (from previous save)
      const hasExistingGrabRate = formData.grab_rate_amount &&
                                   formData.grab_rate_amount !== '' &&
                                   parseFloat(formData.grab_rate_amount) > 0

      if (!hasExistingGrabRate) {
        allErrors.push({
          path: 'Grab Rate',
          info: 'Please enter the Grab delivery charge in the Rates section'
        })
      }
    }

    // 4c. If user recalculated rates, check if they selected one
    if (formData.service_options !== 'Grab' && calculatedRates.length > 0 && !selectedRateId) {
      allErrors.push({
        path: 'Rate Selection',
        info: 'Please select one of the calculated shipping rates from the rates section'
      })
    }

    // 4d. If no new rates calculated and no previous rate exists
    if (formData.service_options !== 'Grab' && calculatedRates.length === 0 && !previouslyChosenRate) {
      allErrors.push({
        path: 'Rate',
        info: 'No rate available for this shipment. Please calculate rates or contact support.'
      })
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}
