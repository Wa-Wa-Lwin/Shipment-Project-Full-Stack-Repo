import axios from 'axios'
import { validateCalculateRatesData, validateWeights } from '../utils/shipment-validations'
import { validateShipmentEdit } from '../hooks/useShipmentEditValidation'
import type { ShipmentFormData } from '../types/shipment-form.types'

interface HandlePreviewProps {
  formData: ShipmentFormData
  today: string
  rateCalculationSnapshot: any
  watchedFields: any
  calculatedRates: any[]
  transformedRates: any[]
  selectedRateId: string | null
  previouslyChosenRate: any
  setErrorModal: (modal: { isOpen: boolean; title: string; message?: string; details?: any[] }) => void
  setPreviewData: (data: ShipmentFormData) => void
  setIsPreviewOpen: (isOpen: boolean) => void
}

/**
 * Handles the preview action - validates form and shows preview modal
 */
export const handlePreview = async ({
  formData,
  today,
  rateCalculationSnapshot,
  watchedFields,
  calculatedRates,
  transformedRates,
  selectedRateId,
  previouslyChosenRate,
  setErrorModal,
  setPreviewData,
  setIsPreviewOpen
}: HandlePreviewProps) => {
  // Validate the form
  const validation = validateShipmentEdit(formData, {
    today,
    rateCalculationSnapshot,
    watchedFields,
    calculatedRates,
    selectedRateId,
    previouslyChosenRate
  })

  // If there are validation errors, show them
  if (!validation.isValid) {
    setErrorModal({
      isOpen: true,
      title: 'Validation Failed',
      message: 'Please fix the following issues before proceeding:',
      details: validation.errors
    })
    return
  }

  // Special handling for Supplier Pickup - no rates needed
  if (formData.service_options === 'Supplier Pickup') {
    const formDataWithoutRates = {
      ...formData,
      rates: []
    }
    setPreviewData(formDataWithoutRates)
    setIsPreviewOpen(true)
    return
  }

  // Special handling for Grab service option
  if (formData.service_options === 'Grab') {
    console.log('Grab shipment - using form rates:', formData.rates)
    setPreviewData(formData)
    setIsPreviewOpen(true)
    return
  }

  // Handle calculated rates or previously chosen rate
  if (calculatedRates.length > 0) {
    // Use the newly calculated and selected rate
    const formDataWithRates = {
      ...formData,
      rates: transformedRates
    }
    setPreviewData(formDataWithRates)
    setIsPreviewOpen(true)
  } else {
    // Use the previously chosen rate
    const formDataWithRates = {
      ...formData,
      rates: [previouslyChosenRate]
    }
    setPreviewData(formDataWithRates)
    setIsPreviewOpen(true)
  }
}

interface HandleConfirmSubmitProps {
  previewData: ShipmentFormData | null
  shipmentId: string | undefined
  msLoginUser: any
  user: any
  selectedRateId: string | null
  previouslyChosenRate: any
  setIsSubmitting: (isSubmitting: boolean) => void
  setIsPreviewOpen: (isOpen: boolean) => void
  success: (message: string, title: string) => void
  showError: (message: string, title: string) => void
}

/**
 * Handles the final submit after preview confirmation
 */
export const handleConfirmSubmit = async ({
  previewData,
  shipmentId,
  msLoginUser,
  user,
  selectedRateId,
  previouslyChosenRate,
  setIsSubmitting,
  setIsPreviewOpen,
  success,
  showError
}: HandleConfirmSubmitProps) => {
  if (!previewData || !msLoginUser) {
    showError('Missing required data', 'Submission Error')
    return
  }

  setIsSubmitting(true)
  try {
    const formatTimeForAPI = (timeString: string) => {
      if (!timeString) return ''
      const time = timeString.trim()
      let cleanTime = time

      if (time.includes(':')) {
        const parts = time.split(':')
        if (parts.length >= 2) {
          const hours = parts[0].padStart(2, '0')
          const minutes = parts[1].padStart(2, '0')
          cleanTime = `${hours}:${minutes}`
        }
      }

      if (cleanTime.match(/^\d{2}:\d{2}$/)) {
        return cleanTime
      }

      return ''
    }

    // Determine send_status based on current request_status
    let sendStatus: string = ""

    if (msLoginUser.email === previewData.approver_user_mail?.toLowerCase()) {
      sendStatus = 'approver_edited'
    } else if (user?.logisticRole === "1") {
      sendStatus = 'logistic_edited'
    } else {
      sendStatus = 'logistic_edited'
    }

    // Determine which rate ID to mark as chosen
    const chosenRateId = selectedRateId || previouslyChosenRate?.unique_id

    const updatedRates = previewData.rates?.map(rate => ({
      ...rate,
      transit_time: String(rate.transit_time || ''),
      detailed_charges: rate.detailed_charges ? String(rate.detailed_charges).substring(0, 255) : '',
      chosen: rate.unique_id === chosenRateId ? true : false
    })) || []

    // Convert weight values from scientific notation to decimal strings
    const normalizedParcels = previewData.parcels?.map(parcel => ({
      ...parcel,
      weight_value: Number(parcel.weight_value).toFixed(5),
      net_weight_value: Number(parcel.net_weight_value || 0).toFixed(5),
      parcel_weight_value: Number(parcel.parcel_weight_value || 0).toFixed(5),
      parcel_items: parcel.parcel_items?.map(item => ({
        ...item,
        weight_value: Number(item.weight_value).toFixed(5),
        price_amount: Number(item.price_amount).toFixed(4)
      }))
    }))

    const finalData = {
      ...previewData,
      parcels: normalizedParcels,
      send_status: sendStatus,
      login_user_id: user?.userID || 0,
      login_user_name: msLoginUser.name,
      login_user_mail: msLoginUser.email,
      rates: updatedRates,
      pick_up_start_time: formatTimeForAPI(previewData.pick_up_start_time || ''),
      pick_up_end_time: formatTimeForAPI(previewData.pick_up_end_time || ''),
    }

    const editUrl = import.meta.env.VITE_APP_ANYONE_EDIT_REQUEST
    if (!editUrl) {
      throw new Error('Edit API URL not configured')
    }

    const apiUrl = `${editUrl}${shipmentId}`

    const response = await axios.put(apiUrl, finalData, {
      headers: { 'Content-Type': 'application/json' }
    })

    if (response.status === 200) {
      success('Shipment request updated successfully!', 'Success')
      setIsPreviewOpen(false)
      // Force full page reload to ensure UI updates
      window.location.href = `/xeno-shipment/shipment/${shipmentId}`
    }
  } catch (error) {
    console.error('Error updating shipment:', error)

    const errorResponse = (error as any).response?.data

    if (errorResponse) {
      if (errorResponse.meta?.details && Array.isArray(errorResponse.meta.details)) {
        const errorMessages = errorResponse.meta.details.map((detail: any) =>
          `${detail.path}: ${detail.info}`
        ).join('\n')

        showError(`Update failed with validation errors:\n\n${errorMessages}`, 'Validation Error')
      } else if (errorResponse.meta?.message) {
        showError(`Update failed: ${errorResponse.meta.message}`, 'Update Failed')
      } else {
        showError('Error updating shipment request. Please check your form data and try again.', 'Update Error')
      }
    } else if (axios.isAxiosError(error)) {
      showError('Error updating shipment request. Please check your internet connection and try again.', 'Connection Error')
    } else {
      showError(error instanceof Error ? error.message : 'An unexpected error occurred while updating the shipment.', 'Update Error')
    }
  } finally {
    setIsSubmitting(false)
  }
}

interface HandleCalculateRateProps {
  getValues: () => ShipmentFormData
  calculateRates: (formData: ShipmentFormData) => Promise<any>
  watchedFields: any
  setRateCalculationSnapshot: (snapshot: any) => void
  setErrorModal: (modal: { isOpen: boolean; title: string; message?: string; details?: any[] }) => void
}

/**
 * Handles the rate calculation action
 */
export const handleCalculateRate = async ({
  getValues,
  calculateRates,
  watchedFields,
  setRateCalculationSnapshot,
  setErrorModal
}: HandleCalculateRateProps) => {
  const formData = getValues()

  const formValidation = validateCalculateRatesData(formData)
  if (!formValidation.isValid) {
    setErrorModal({
      isOpen: true,
      title: 'Rate Calculation Failed - Validation Errors',
      message: 'Please fix the following issues before calculating rates:',
      details: formValidation.errors
    })
    return
  }

  const weightValidation = validateWeights(formData)
  if (!weightValidation.isValid) {
    setErrorModal({
      isOpen: true,
      title: 'Weight Validation Failed',
      message: 'Please fix the weight issues below before calculating rates.',
      details: weightValidation.errors
    })
    return
  }

  const updatedFormData = await calculateRates(formData)

  if (updatedFormData.rates && updatedFormData.rates.length > 0) {
    setRateCalculationSnapshot(watchedFields)
  }
}
