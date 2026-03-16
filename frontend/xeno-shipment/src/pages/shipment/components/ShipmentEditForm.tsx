import { useState, useEffect } from 'react'
import { Button, Card, CardBody, Modal, ModalContent, ModalBody, Spinner } from '@heroui/react'
import axios from 'axios'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import { useShipmentRateCalculation } from '../hooks/useShipmentRateCalculation'
import { validateCalculateRatesData, validateWeights, validateShipmentScope } from '../utils/shipment-validations'
import { DEFAULT_FORM_VALUES } from '../constants/form-defaults'
import {
  BasicInformation,
  AddressSelector,
  PickupInformation,
  ParcelsSection,
  RatesSection,
  BasicInfoSummary,
  AddressesSummary,
  PickupInfoSummary,
  ParcelsSummary,
  RatesSummary
} from './form-sections'
import ShipmentPreviewModal from './ShipmentPreviewModal'
import ErrorModal from './ErrorModal'
import type { ShipmentFormData } from '../types/shipment-form.types'
import { Icon } from '@iconify/react/dist/iconify.js'
import { isRateChosen } from '../utils/rateUtils'

const ShipmentEditForm = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const navigate = useNavigate()
  const { user, msLoginUser } = useAuth()
  const { success, error: showError } = useNotification()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ShipmentFormData | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const formMethods = useForm<ShipmentFormData>({
    defaultValues: DEFAULT_FORM_VALUES
  })

  const { register, control, handleSubmit, watch, setValue, getValues, reset, formState: { errors } } = formMethods

  // Watch for changes in critical fields that affect rates
  const watchedFields = watch([
    'ship_from_country', 'ship_from_postal_code', 'ship_from_city', 'ship_from_state', 'ship_from_street1', 'ship_from_company_name',
    'ship_to_country', 'ship_to_postal_code', 'ship_to_city', 'ship_to_state', 'ship_to_street1', 'ship_to_company_name',
    'parcels',
    'service_options',
    'insurance_enabled', 'insurance_insured_value_amount', 'insurance_insured_value_currency',
    'customs_purpose', 'customs_terms_of_trade', 'payment_terms',
    'shipment_scope_type'
  ])

  // Use the shared rate calculation hook (with skipInitialClearOnEdit enabled)
  const {
    isCalculatingRate,
    calculatedRates,
    transformedRates,
    selectedRateId,
    rateCalculationError,
    calculateRates,
    handleRateSelection,
    handleClearRates,
    setRateCalculationSnapshot,
    rateCalculationSnapshot,
    setInitialLoadComplete
  } = useShipmentRateCalculation({ watchedFields, skipInitialClearOnEdit: true })

  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean
    title: string
    message?: string
    details?: Array<{ path: string; info: string }>
  }>({
    isOpen: false,
    title: '',
    message: '',
    details: []
  })

  // Step/Section Management - Start with all summaries visible (currentStep = -1)
  // Users can click "Edit" on any section to modify it
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [completedSteps] = useState<Set<number>>(new Set([0, 1, 2, 3]))
  const [previouslyChosenRate, setPreviouslyChosenRate] = useState<any>(null)

  const steps = [
    { id: 0, name: 'Basic Information', icon: 'solar:box-bold' },
    { id: 1, name: 'Addresses', icon: 'solar:map-point-bold' },
    { id: 2, name: 'Pickup Information', icon: 'solar:calendar-bold' },
    { id: 3, name: 'Parcels & Items', icon: 'solar:box-minimalistic-bold' },
    { id: 4, name: 'Shipping Rates', icon: 'solar:dollar-bold' }
  ]

  const today = new Date().toISOString().split('T')[0]

  // Load existing shipment data
  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setIsLoading(true)

        if (!shipmentId) {
          throw new Error('Invalid shipment ID')
        }

        const baseUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID
        if (!baseUrl) {
          throw new Error('API URL not configured')
        }

        const apiUrl = `${baseUrl}${shipmentId}`
        const response = await axios.get(apiUrl)
        const shipmentData = response.data.shipment_request

        // Transform shipment data to form format
        const formData: ShipmentFormData = {
          shipmentRequestID: shipmentData.shipmentRequestID,
          shipment_scope_type: shipmentData.shipment_scope_type || '',

          // Basic shipment info
          service_options: shipmentData.service_options || '',
          shipping_options: shipmentData.shipping_options || 'calculate_rates',
          urgent_reason: shipmentData.urgent_reason || '',
          request_status: shipmentData.request_status || '',
          remark: shipmentData.remark || '',
          topic: shipmentData.topic || '',
          po_number: shipmentData.po_number || '',
          other_topic: shipmentData.other_topic || '',
          due_date: shipmentData.due_date || '',
          sales_person: shipmentData.sales_person || '',
          po_date: shipmentData.po_date || '',
          send_to: shipmentData.send_to || '',

          // Ship From Address
          ship_from_contact_name: shipmentData.ship_from_contact_name || shipmentData.ship_from?.contact_name || '',
          ship_from_company_name: shipmentData.ship_from_company_name || shipmentData.ship_from?.company_name || '',
          ship_from_street1: shipmentData.ship_from_street1 || shipmentData.ship_from?.street1 || '',
          ship_from_street2: shipmentData.ship_from_street2 || shipmentData.ship_from?.street2 || '',
          ship_from_street3: shipmentData.ship_from_street3 || shipmentData.ship_from?.street3 || '',
          ship_from_city: shipmentData.ship_from_city || shipmentData.ship_from?.city || '',
          ship_from_state: shipmentData.ship_from_state || shipmentData.ship_from?.state || '',
          ship_from_postal_code: shipmentData.ship_from_postal_code || shipmentData.ship_from?.postal_code || '',
          ship_from_country: shipmentData.ship_from_country || shipmentData.ship_from?.country || '',
          ship_from_phone: shipmentData.ship_from_phone || shipmentData.ship_from?.phone || '',
          ship_from_email: shipmentData.ship_from_email || shipmentData.ship_from?.email || '',
          ship_from_tax_id: shipmentData.ship_from_tax_id || shipmentData.ship_from?.tax_id || '',
          ship_from_eori_number: shipmentData.ship_from_eori_number || shipmentData.ship_from?.eori_number || '',

          // Ship To Address
          ship_to_contact_name: shipmentData.ship_to_contact_name || shipmentData.ship_to?.contact_name || '',
          ship_to_company_name: shipmentData.ship_to_company_name || shipmentData.ship_to?.company_name || '',
          ship_to_street1: shipmentData.ship_to_street1 || shipmentData.ship_to?.street1 || '',
          ship_to_street2: shipmentData.ship_to_street2 || shipmentData.ship_to?.street2 || '',
          ship_to_street3: shipmentData.ship_to_street3 || shipmentData.ship_to?.street3 || '',
          ship_to_city: shipmentData.ship_to_city || shipmentData.ship_to?.city || '',
          ship_to_state: shipmentData.ship_to_state || shipmentData.ship_to?.state || '',
          ship_to_postal_code: shipmentData.ship_to_postal_code || shipmentData.ship_to?.postal_code || '',
          ship_to_country: shipmentData.ship_to_country || shipmentData.ship_to?.country || '',
          ship_to_phone: shipmentData.ship_to_phone || shipmentData.ship_to?.phone || '',
          ship_to_email: shipmentData.ship_to_email || shipmentData.ship_to?.email || '',
          ship_to_tax_id: shipmentData.ship_to_tax_id || shipmentData.ship_to?.tax_id || '',
          ship_to_eori_number: shipmentData.ship_to_eori_number || shipmentData.ship_to?.eori_number || '',

          // Parcels data
          parcels: shipmentData.parcels?.map((parcel: any) => ({
            box_type_name: parcel.box_type_name || '',
            width: parseFloat(String(parcel.width)) || 0,
            height: parseFloat(String(parcel.height)) || 0,
            depth: parseFloat(String(parcel.depth)) || 0,
            dimension_unit: parcel.dimension_unit || 'cm',
            weight_value: parseFloat(String(parcel.weight_value)) || 0,
            net_weight_value: parseFloat(String(parcel.net_weight_value)) || 0,
            parcel_weight_value: parseFloat(String(parcel.parcel_weight_value)) || 0,
            weight_unit: parcel.weight_unit || 'kg',
            description: parcel.description || '',
            parcel_items: parcel.items?.map((item: any) => ({
              description: item.description || '',
              quantity: parseInt(String(item.quantity)) || 1,
              price_amount: parseFloat(String(item.price_amount)) || 0,
              price_currency: item.price_currency || 'THB',
              weight_value: parseFloat(String(item.weight_value)) || 0,
              weight_unit: item.weight_unit || 'kg',
              origin_country: item.origin_country || '',
              sku: item.sku || '',
              material_code: item.material_code || '',
              hs_code: item.hs_code || '',
              item_id: item.item_id || '',
              return_reason: item.return_reason || ''
            })) || []
          })) || [],

          // Pickup info
          pick_up_status: shipmentData.pick_up_status || true,
          pick_up_date: shipmentData.pick_up_date || '',
          pick_up_start_time: shipmentData.pick_up_start_time || '',
          pick_up_end_time: shipmentData.pick_up_end_time || '',
          pick_up_instructions: shipmentData.pick_up_instructions || '',

          // Insurance
          insurance_enabled: shipmentData.insurance_enabled || false,
          insurance_insured_value_amount: shipmentData.insurance_insured_value_amount || 0,
          insurance_insured_value_currency: shipmentData.insurance_insured_value_currency || 'THB',

          // Customs
          customs_purpose: shipmentData.customs_purpose || '',
          customs_terms_of_trade: shipmentData.customs_terms_of_trade || '',
          payment_terms: shipmentData.payment_terms || '',

          // Rates
          rates: shipmentData.rates?.map((rate: any) => ({
            shipper_account_id: rate.shipper_account_id || '',
            shipper_account_slug: rate.shipper_account_slug || '',
            shipper_account_description: rate.shipper_account_description || '',
            service_type: rate.service_type || '',
            service_name: rate.service_name || '',
            pickup_deadline: rate.pickup_deadline || '',
            booking_cut_off: rate.booking_cut_off || '',
            delivery_date: rate.delivery_date || '',
            transit_time: rate.transit_time || '',
            error_message: rate.error_message || '',
            info_message: rate.info_message || '',
            charge_weight_value: parseFloat(String(rate.charge_weight_value)) || 0,
            charge_weight_unit: rate.charge_weight_unit || '',
            total_charge_amount: parseFloat(String(rate.total_charge_amount)) || 0,
            total_charge_currency: rate.total_charge_currency || '',
            unique_id: rate.unique_id || `${rate.shipper_account_id}-${rate.service_type}`,
            chosen: String(rate.chosen).trim() === "1" || Number(rate.chosen) === 1 || rate.chosen === true,
            past_chosen: String(rate.past_chosen).trim() === "1" || Number(rate.past_chosen) === 1 || rate.past_chosen === true,
            detailed_charges: rate.detailed_charges || ''
          })) || [],

          // User info
          created_user_id: shipmentData.created_user_id || '',
          created_user_name: shipmentData.created_user_name || '',
          created_user_mail: shipmentData.created_user_mail || '',
          created_date_time: shipmentData.created_date_time || '',

          approver_user_id: shipmentData.approver_user_id || null,
          approver_user_name: shipmentData.approver_user_name || '',
          approver_user_mail: shipmentData.approver_user_mail || null,
          approver_approved_date_time: shipmentData.approver_approved_date_time || null,
          approver_rejected_date_time: shipmentData.approver_rejected_date_time || null,

          label_status: shipmentData.label_status || null,
          pick_up_created_status: shipmentData.pick_up_created_status || null,

          // Initialize Grab rate fields - try to get from direct fields first, then from chosen rate
          grab_rate_amount: shipmentData.grab_rate_amount || '',
          grab_rate_currency: shipmentData.grab_rate_currency || 'THB',

          // Billing
          billing: shipmentData.billing || 'shipper',
          recipient_shipper_account_number: shipmentData.recipient_shipper_account_number || '',
          recipient_shipper_account_country_code: shipmentData.recipient_shipper_account_country_code || '',

          // Customize Invoice
          // In edit mode, always default to false - user must explicitly check to upload a new invoice
          use_customize_invoice: false,
          customize_invoice_url: shipmentData.customize_invoice_url || '',
          customize_invoice_file: null
        }

        reset(formData)

        // Store the previously chosen rate for display only
        console.log('Raw API rates:', shipmentData.rates)
        console.log('Transformed rates:', formData.rates)
        console.log('Rates with chosen status:', formData.rates?.map(r => ({
          service: r.service_name,
          chosen: r.chosen,
          unique_id: r.unique_id
        })))

        const chosenRate = formData.rates?.find(rate => isRateChosen(rate.chosen))
        console.log('Found chosen rate:', chosenRate)

        if (chosenRate) {
          setPreviouslyChosenRate(chosenRate)
          console.log('Set previouslyChosenRate:', chosenRate)
        } else {
          console.warn('No chosen rate found in shipment data')
          console.warn('All rates chosen values:', formData.rates?.map(r => r.chosen))
        }

        // Don't clear rates in edit mode - we want to show the previously selected rate
        setInitialLoadComplete()

        // ALWAYS set initial snapshot for rate validation (not just if there's a previously chosen rate)
        // This allows us to detect if ANY data changes after loading
        // Create snapshot directly from loaded formData, not from watchedFields
        // because watchedFields might not be updated yet
        const initialSnapshot = [
          formData.ship_from_country,
          formData.ship_from_postal_code,
          formData.ship_from_city,
          formData.ship_from_state,
          formData.ship_from_street1,
          formData.ship_from_company_name,
          formData.ship_to_country,
          formData.ship_to_postal_code,
          formData.ship_to_city,
          formData.ship_to_state,
          formData.ship_to_street1,
          formData.ship_to_company_name,
          formData.parcels,
          formData.service_options,
          formData.insurance_enabled,
          formData.insurance_insured_value_amount,
          formData.insurance_insured_value_currency,
          formData.customs_purpose,
          formData.customs_terms_of_trade,
          formData.payment_terms,
          formData.shipment_scope_type
        ]
        setRateCalculationSnapshot(initialSnapshot)

        // Set initial step to -1 to show all summaries
        // Users can click "Edit" on any section to modify it
        setCurrentStep(-1)
      } catch (error) {
        console.error('Error fetching shipment:', error)
        showError('Failed to load shipment data', 'Loading Error')
        navigate('/shipment')
      } finally {
        setIsLoading(false)
      }
    }

    fetchShipment()
  }, [shipmentId])

  const handlePreview = async (data: ShipmentFormData) => {
    const formData = data

    // Collect all validation errors
    const allErrors: Array<{ path: string; info: string }> = []

    // 0. Validate customize invoice file
    if (formData.use_customize_invoice) {
      const hasValidFile = formData.customize_invoice_file instanceof File
      const hasExistingInvoiceUrl = formData.customize_invoice_url && formData.customize_invoice_url !== ''

      // In edit mode, allow if there's an existing invoice URL OR a new file is selected
      if (!hasValidFile && !hasExistingInvoiceUrl) {
        allErrors.push({
          path: 'Customize Invoice',
          info: 'You have checked "Update Customize Invoice" but no file was selected. Please select a PDF file to upload, or uncheck the option.'
        })
      }
    }

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

    // 4. Validate based on shipping_options
    const shippingOptions = formData.shipping_options || 'calculate_rates'

    if (shippingOptions === 'calculate_rates') {
      // Rate validations - ALWAYS require rates to match current data
      // Check if critical fields changed since rate was calculated/loaded
      const hasSnapshot = rateCalculationSnapshot !== null && rateCalculationSnapshot !== undefined

      if (!hasSnapshot) {
        // No snapshot means form just loaded - this shouldn't happen but handle it
        allErrors.push({
          path: 'Rate Calculation Required',
          info: 'Please calculate shipping rates before proceeding.'
        })
      } else {
        const currentSnapshot = JSON.stringify(watchedFields)
        const savedSnapshot = JSON.stringify(rateCalculationSnapshot)

        console.log('=== Rate Validation Debug ===')
        console.log('Current watchedFields:', watchedFields)
        console.log('Saved rateCalculationSnapshot:', rateCalculationSnapshot)
        console.log('Current Snapshot String:', currentSnapshot)
        console.log('Saved Snapshot String:', savedSnapshot)
        console.log('Are they equal?', currentSnapshot === savedSnapshot)

        // If data has changed since last rate calculation/load
        if (currentSnapshot !== savedSnapshot) {
          console.log('DIFFERENCE DETECTED - Adding error')
          allErrors.push({
            path: 'Rate Recalculation Required',
            info: 'Shipment information has changed since the rate was calculated. Please recalculate and select a new rate before proceeding for updating.'
          })
        } else {
          // Data hasn't changed - ensure we have a valid rate
          // Either a newly calculated rate OR the original previously chosen rate
          const hasValidRate = (calculatedRates.length > 0 && selectedRateId) || previouslyChosenRate

          if (!hasValidRate) {
            allErrors.push({
              path: 'Rate Required',
              info: 'No shipping rate available. Please calculate rates or contact support.'
            })
          } else if (calculatedRates.length > 0 && !selectedRateId) {
            // User calculated new rates but didn't select one
            allErrors.push({
              path: 'Rate Selection Required',
              info: 'You have calculated new rates but have not selected one. Please select a shipping rate from the rates section.'
            })
          }
        }
      }
    } else if (shippingOptions === 'grab_pickup') {
      // Validate that grab rate amount is entered and greater than 0
      if (!formData.grab_rate_amount || parseFloat(formData.grab_rate_amount) <= 0) {
        allErrors.push({
          path: 'Grab Information Required',
          info: 'Please enter Grab delivery charge (must be greater than 0) before proceeding to preview.'
        })
      }
    }
    // No validation needed for supplier_pickup

    // If there are any validation errors, show them all at once
    if (allErrors.length > 0) {
      setErrorModal({
        isOpen: true,
        title: 'Validation Failed',
        message: 'Please fix the following issues before proceeding:',
        details: allErrors
      })
      return
    }

    // All validations passed - proceed with preview

    // Prepare data based on shipping_options
    let formDataWithRates = formData

    if (shippingOptions === 'calculate_rates') {
      // Handle calculated rates or previously chosen rate
      if (calculatedRates.length > 0) {
        // Use the newly calculated and selected rate
        formDataWithRates = {
          ...formData,
          rates: transformedRates
        }
      } else {
        // Use the previously chosen rate
        formDataWithRates = {
          ...formData,
          rates: [previouslyChosenRate]
        }
      }
    } else if (shippingOptions === 'grab_pickup') {
      // For grab pickup, include grab rate information
      formDataWithRates = {
        ...formData,
        rates: [] // No shipping rates for grab pickup
      }
    } else {
      // supplier_pickup - no rates needed
      formDataWithRates = {
        ...formData,
        rates: []
      }
    }

    setPreviewData(formDataWithRates)
    setIsPreviewOpen(true)
  }

  const handleConfirmSubmit = async () => {
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
        sendStatus = 'logistic_edited' // 'fallback_error'
      }

      // Determine which rate ID to mark as chosen
      const chosenRateId = selectedRateId || previouslyChosenRate?.unique_id

      const updatedRates = previewData.rates?.map(rate => ({
        ...rate,
        // Ensure transit_time is a string
        transit_time: String(rate.transit_time || ''),
        // Truncate detailed_charges to 255 characters
        detailed_charges: rate.detailed_charges ? String(rate.detailed_charges).substring(0, 255) : '',
        // Mark the selected rate as chosen (either newly selected or previously chosen)
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

      // Check if there's a file to upload
      const hasFile = previewData.customize_invoice_file instanceof File

      let response
      if (hasFile) {
        // Use FormData for file upload (same approach as create form)
        const formData = new FormData()

        // Add the file first
        formData.append('customize_invoice_file', previewData.customize_invoice_file as File)

        // Helper function to append nested objects to FormData - same as create form
        const appendToFormData = (data: any, parentKey = '') => {
          if (data && typeof data === 'object' && !(data instanceof File)) {
            if (Array.isArray(data)) {
              data.forEach((item, index) => {
                appendToFormData(item, `${parentKey}[${index}]`)
              })
            } else {
              Object.keys(data).forEach((key) => {
                appendToFormData(data[key], parentKey ? `${parentKey}[${key}]` : key)
              })
            }
          } else if (data !== null && data !== undefined) {
            // Convert boolean to 1 or 0 for Laravel validation
            if (typeof data === 'boolean') {
              formData.append(parentKey, data ? '1' : '0')
            } else {
              formData.append(parentKey, String(data))
            }
          }
        }

        // Add all fields to FormData with proper nested array notation
        Object.keys(finalData).forEach((key) => {
          // Skip the file field as it's already added, and skip nested ship_from/ship_to objects
          if (key === 'customize_invoice_file' || key === 'ship_from' || key === 'ship_to') return

          const value = finalData[key as keyof typeof finalData]
          appendToFormData(value, key)
        })

        // Explicitly add use_customize_invoice
        formData.append('use_customize_invoice', previewData.use_customize_invoice ? '1' : '0')

        // Debug: Log FormData contents
        console.log('=== FormData Debug ===')
        console.log('Total entries:', Array.from(formData.entries()).length)
        if (previewData.customize_invoice_file) {
          console.log('File size:', previewData.customize_invoice_file.size, 'bytes (',
                      (previewData.customize_invoice_file.size / 1024 / 1024).toFixed(2), 'MB)')
        }
        console.log('FormData entries:')
        for (let pair of formData.entries()) {
          console.log(pair[0] + ': ' + (pair[1] instanceof File ? `File(${pair[1].name})` : pair[1]))
        }
        console.log('=== End FormData Debug ===')

        // Backend route is POST, not PUT
        response = await axios.post(apiUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000, // 60 second timeout for large file uploads
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        })
      } else {
        // Use JSON for non-file updates
        // Preserve existing customize_invoice_url if no new file is uploaded
        const dataToSend = {
          ...finalData,
          customize_invoice_url: previewData.customize_invoice_url || null,
          use_customize_invoice: previewData.use_customize_invoice || false
        }

        response = await axios.post(apiUrl, dataToSend, {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      if (response.status === 200) {
        success('Shipment request updated successfully!', 'Success')
        setIsPreviewOpen(false)
        // Force full page reload to ensure UI updates
        window.location.href = `/xeno-shipment/shipment/${shipmentId}`
      }
    } catch (error) {
      console.error('Error updating shipment:', error)

      // Check for response data (handles both AxiosError and custom errors with response attached)
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
        // Handle network errors without response data
        showError('Error updating shipment request. Please check your internet connection and try again.', 'Connection Error')
      } else {
        // Handle other unexpected errors
        showError(error instanceof Error ? error.message : 'An unexpected error occurred while updating the shipment.', 'Update Error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCalculateRate = async () => {
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

  // Step Navigation Handler - Only for editing completed steps via summary cards
  const handleEditStep = (stepId: number) => {
    // Navigate to the step to edit
    setCurrentStep(stepId)
  }

  // Handler for "Done" button - closes current section and shows all summaries
  const handleDoneEditing = () => {
    setCurrentStep(-1) // -1 means show all summaries
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" label="Loading shipment data..." />
      </div>
    )
  }

  return (
    <>
      <Card shadow="none" className="p-0 m-0 bg-transparent">
        <CardBody className="p-0">
          <div className="flex justify-between items-center mb-0 p-2">
            <h1 className="text-2xl font-bold px-5">Edit Shipment Request ID - {shipmentId}</h1>
            <div className="flex gap-2">
              <Button
                className="bg-red-500 text-white hover:bg-red-700"
                variant="bordered"
                type="button"
                onPress={() => window.location.href = `/xeno-shipment/shipment/${shipmentId}`}
              >
                Cancel
              </Button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit(handlePreview)}
            className="space-y-4"
          >
            {/* All Sections with Active Section Inline */}
            <div className="space-y-3">
              {/* Step 0: Basic Information */}
              {currentStep === 0 ? (
                <Card className="border-2 border-primary shadow-lg m-1">
                  <CardBody className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon icon={steps[0].icon} width={28} className="text-primary" />
                        <h2 className="text-xl font-bold text-primary">{steps[0].name}</h2>
                      </div>
                      <p className="text-sm text-gray-500">Step 1 of {steps.length}</p>
                    </div>
                    <div className="mb-6">
                      <BasicInformation
                        register={register}
                        errors={errors}
                        control={control}
                        watch={watch}
                        setValue={setValue}
                        onClearRates={handleClearRates}
                      />
                    </div>
                    <div className="flex justify-left items-center border-t gap-2 pt-4">
                      <Button
                        color="primary"
                        type="button"
                        onPress={handleDoneEditing}
                        startContent={<Icon icon="solar:check-circle-bold" width={20} />}
                      >
                        Done
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : completedSteps.has(0) && (
                <BasicInfoSummary data={getValues()} onEdit={() => handleEditStep(0)} />
              )}

              {/* Step 1: Addresses */}
              {currentStep === 1 ? (
                <Card className="border-2 border-primary shadow-lg m-1">
                  <CardBody className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon icon={steps[1].icon} width={28} className="text-primary" />
                        <h2 className="text-xl font-bold text-primary">{steps[1].name}</h2>
                      </div>
                      <p className="text-sm text-gray-500">Step 2 of {steps.length}</p>
                    </div>
                    <div className="mb-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
                          <AddressSelector
                            register={register}
                            errors={errors}
                            control={control}
                            setValue={setValue}
                            title="Ship From Address"
                            prefix="ship_from"
                            forceRefresh={refreshCounter}
                            watch={watch}
                            onClearRates={handleClearRates}
                          />
                          <div className="flex justify-center my-4 md:my-0">
                            <Button
                              size="sm"
                              variant="bordered"
                              color="primary"
                              startContent={<Icon icon="solar:refresh-bold" />}
                              onPress={() => {
                                const currentValues = getValues();
                                const swappedValues = {
                                  ...currentValues,
                                  ship_from_company_name: currentValues.ship_to_company_name,
                                  ship_from_contact_name: currentValues.ship_to_contact_name,
                                  ship_from_phone: currentValues.ship_to_phone,
                                  ship_from_email: currentValues.ship_to_email,
                                  ship_from_country: currentValues.ship_to_country,
                                  ship_from_city: currentValues.ship_to_city,
                                  ship_from_state: currentValues.ship_to_state,
                                  ship_from_postal_code: currentValues.ship_to_postal_code,
                                  ship_from_street1: currentValues.ship_to_street1,
                                  ship_from_street2: currentValues.ship_to_street2,
                                  ship_from_tax_id: currentValues.ship_to_tax_id,
                                  ship_from_eori_number: currentValues.ship_to_eori_number,
                                  ship_to_company_name: currentValues.ship_from_company_name,
                                  ship_to_contact_name: currentValues.ship_from_contact_name,
                                  ship_to_phone: currentValues.ship_from_phone,
                                  ship_to_email: currentValues.ship_from_email,
                                  ship_to_country: currentValues.ship_from_country,
                                  ship_to_city: currentValues.ship_from_city,
                                  ship_to_state: currentValues.ship_from_state,
                                  ship_to_postal_code: currentValues.ship_from_postal_code,
                                  ship_to_street1: currentValues.ship_from_street1,
                                  ship_to_street2: currentValues.ship_from_street2,
                                  ship_to_tax_id: currentValues.ship_from_tax_id,
                                  ship_to_eori_number: currentValues.ship_from_eori_number,
                                };
                                reset(swappedValues);
                                handleClearRates();
                                setRefreshCounter(prev => prev + 1);
                              }}
                            >
                              Swap
                            </Button>
                          </div>
                          <AddressSelector
                            register={register}
                            errors={errors}
                            control={control}
                            setValue={setValue}
                            title="Ship To Address"
                            prefix="ship_to"
                            forceRefresh={refreshCounter}
                            watch={watch}
                            onClearRates={handleClearRates}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-left items-center border-t pt-4">
                      <Button
                        color="primary"
                        type="button"
                        onPress={handleDoneEditing}
                        startContent={<Icon icon="solar:check-circle-bold" width={20} />}
                      >
                        Done
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : completedSteps.has(1) && (
                <AddressesSummary data={getValues()} onEdit={() => handleEditStep(1)} />
              )}

              {/* Step 2: Pickup Information */}
              {currentStep === 2 ? (
                <Card className="border-2 border-primary shadow-lg m-1">
                  <CardBody className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon icon={steps[2].icon} width={28} className="text-primary" />
                        <h2 className="text-xl font-bold text-primary">{steps[2].name}</h2>
                      </div>
                      <p className="text-sm text-gray-500">Step 3 of {steps.length}</p>
                    </div>
                    <div className="mb-6">
                      <PickupInformation
                        register={register}
                        control={control}
                        errors={errors}
                        today={today}
                        setValue={setValue}
                        watch={watch}
                        onClearRates={handleClearRates}
                      />
                    </div>
                    <div className="flex justify-left items-center border-t gap-2 pt-4">
                      <Button
                        color="primary"
                        type="button"
                        onPress={handleDoneEditing}
                        startContent={<Icon icon="solar:check-circle-bold" width={20} />}
                      >
                        Done
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : completedSteps.has(2) && (
                <PickupInfoSummary data={getValues()} onEdit={() => handleEditStep(2)} />
              )}

              {/* Step 3: Parcels & Items */}
              {currentStep === 3 ? (
                <Card className="border-2 border-primary shadow-lg m-1">
                  <CardBody className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon icon={steps[3].icon} width={28} className="text-primary" />
                        <h2 className="text-xl font-bold text-primary">{steps[3].name}</h2>
                      </div>
                      <p className="text-sm text-gray-500">Step 4 of {steps.length}</p>
                    </div>
                    <div className="mb-6">
                      <ParcelsSection
                        register={register}
                        errors={errors}
                        control={control}
                        setValue={setValue}
                        watch={watch}
                        onClearRates={handleClearRates}
                      />
                    </div>
                    <div className="flex justify-left items-center border-t gap-2 pt-4">
                      <Button
                        color="primary"
                        type="button"
                        onPress={handleDoneEditing}
                        startContent={<Icon icon="solar:check-circle-bold" width={20} />}
                      >
                        Done
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : completedSteps.has(3) && (
                <div className="pb-1">
                  <ParcelsSummary data={getValues()} onEdit={() => handleEditStep(3)} />
                </div>
              )}

              {/* Step 4: Shipping Rates */}
              {currentStep === 4 ? (
                <>
                  {/* Rate Calculation Section */}
                  <Card className="border-2 border-primary shadow-lg m-1">
                    <CardBody className="p-6">
                      <div className="mb-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon icon={steps[4].icon} width={28} className="text-primary" />
                          <h2 className="text-xl font-bold text-primary">{steps[4].name}</h2>
                        </div>
                        <p className="text-sm text-gray-500">Step 5 of {steps.length} - Calculate shipping rates</p>
                      </div>
                      {watch('shipping_options') === 'calculate_rates' && (
                        <div className="mb-4 p-4 bg-gray-50 rounded border">
                          <h3 className="font-semibold mb-2">
                            Previously Chosen Rate :
                            {previouslyChosenRate ?
                              <span className="text-green-600 font-semibold"> Found ✓</span> :
                              <span className="text-red-600 font-semibold"> Not Found ✗</span>
                            }
                          </h3>
                          {previouslyChosenRate ? (
                            <div>
                              <p className="text-sm mb-1">
                                <strong>{previouslyChosenRate.shipper_account_description} </strong> ({previouslyChosenRate.service_name})
                                <strong> | Amount:</strong> {previouslyChosenRate.total_charge_amount} {previouslyChosenRate.total_charge_currency}
                                <strong> | Charged Weight:</strong> {previouslyChosenRate.charge_weight_value} {previouslyChosenRate.charge_weight_unit}
                                <strong> | Transit Time:</strong> {previouslyChosenRate.shipper_account_description === 'DHL eCommerce Asia' || previouslyChosenRate.shipper_account_description === 'FedEx Domestic Thailand' ? '1-3(Working) day(s)' : `${previouslyChosenRate.transit_time} (days)`}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-red-600 mt-2">
                              No previously chosen rate found.
                            </p>
                          )}
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <RatesSection
                          rates={calculatedRates}
                          onCalculateRates={handleCalculateRate}
                          isCalculating={isCalculatingRate}
                          selectedRateId={selectedRateId}
                          onSelectRate={handleRateSelection}
                          register={register}
                          control={control}
                          errors={errors}
                          serviceOption={watch('service_options')}
                          topic={watch('topic')}
                          rateCalculationError={rateCalculationError}
                          watch={watch}
                          setValue={setValue}
                          shipmentScopeType={watch('shipment_scope_type')}
                        />
                      </div>
                      <div className="flex justify-left items-center border-t gap-2 pt-4">
                        <Button
                          color="primary"
                          type="button"
                          onPress={handleDoneEditing}
                          startContent={<Icon icon="solar:check-circle-bold" width={20} />}
                        >
                          Done
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                </>
              ) :
                // Show rates section when step is completed
                completedSteps.has(3) && (
                  (() => {
                    const shippingOption = watch('shipping_options') || 'calculate_rates'

                    // For calculate_rates: show rate summary or error
                    if (shippingOption === 'calculate_rates') {
                      if (selectedRateId || previouslyChosenRate) {
                        return (
                          <div className="pb-1">
                            <RatesSummary
                              data={getValues()}
                              selectedRateId={selectedRateId}
                              previouslyChosenRate={previouslyChosenRate}
                              transformedRates={transformedRates}
                              serviceType={watch('service_options')}
                              onEdit={() => handleEditStep(4)}
                            />
                          </div>
                        )
                      } else {
                        return (
                          <Card className="border-2 border-orange-300 bg-orange-50 shadow-sm m-1">
                            <CardBody className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <Icon icon="solar:danger-triangle-bold" className="text-orange-600 text-2xl" />
                                  <div>
                                    <h3 className="font-bold text-orange-800">Shipping Rates Required</h3>
                                    <p className="text-sm text-orange-700">
                                      No shipping rate available. Please calculate and select a rate.
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  color="warning"
                                  variant="flat"
                                  size="sm"
                                  onPress={() => handleEditStep(4)}
                                  startContent={<Icon icon="solar:calculator-bold" width={20} />}
                                >
                                  Calculate Rates
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        )
                      }
                    }

                    // For grab_pickup: show grab info card
                    if (shippingOption === 'grab_pickup') {
                      return (
                        <Card className="border-2 border-purple-300 bg-purple-50 shadow-sm m-1">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon icon="solar:delivery-bold" className="text-purple-600 text-2xl" />
                                <div>
                                  <h3 className="font-bold text-purple-800">Grab Pickup Selected</h3>
                                  <p className="text-sm text-purple-700">
                                    Delivery Amount: {watch('grab_rate_amount') || '0'} {watch('grab_rate_currency') || 'THB'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                color="secondary"
                                variant="flat"
                                size="sm"
                                onPress={() => handleEditStep(4)}
                                startContent={<Icon icon="solar:pen-bold" width={20} />}
                              >
                                Edit
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    }

                    // For supplier_pickup: show supplier info card
                    if (shippingOption === 'supplier_pickup') {
                      return (
                        <Card className="border-2 border-green-300 bg-green-50 shadow-sm m-1">
                          <CardBody className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon icon="solar:box-minimalistic-bold" className="text-green-600 text-2xl" />
                                <div>
                                  <h3 className="font-bold text-green-800">Supplier Pickup Selected</h3>
                                  <p className="text-sm text-green-700">
                                    Free delivery arranged by supplier
                                  </p>
                                </div>
                              </div>
                              <Button
                                color="success"
                                variant="flat"
                                size="sm"
                                onPress={() => handleEditStep(4)}
                                startContent={<Icon icon="solar:pen-bold" width={20} />}
                              >
                                Edit
                              </Button>
                            </div>
                          </CardBody>
                        </Card>
                      )
                    }

                    return null
                  })()
                )}
            </div>

            {/* Main Submit Button - Always visible */}
            <div className="mt-6 flex justify-center">
              <Button
                color="success"
                type="submit"
                size="lg"
                startContent={<Icon icon="solar:check-circle-bold" width={24} />}
                className="px-8 py-6 text-lg font-semibold"
                isDisabled={
                  watch('shipping_options') === 'calculate_rates'
                    ? ((calculatedRates.length === 0 && !previouslyChosenRate) || (calculatedRates.length > 0 && !selectedRateId))
                    : watch('shipping_options') === 'grab_pickup'
                      ? (!watch('grab_rate_amount') || parseFloat(watch('grab_rate_amount') || '0') <= 0)
                      : false // supplier_pickup - no validation needed
                }
              >
                {watch('shipping_options') === 'calculate_rates'
                  ? ((calculatedRates.length === 0 && !previouslyChosenRate)
                    ? 'Calculate Rates First'
                    : (calculatedRates.length > 0 && !selectedRateId)
                      ? 'Select Rate First'
                      : 'Preview & Update Shipment')
                  : watch('shipping_options') === 'grab_pickup'
                    ? (!watch('grab_rate_amount') || parseFloat(watch('grab_rate_amount') || '0') <= 0
                      ? 'Input Grab Information First'
                      : 'Preview & Update Shipment')
                    : 'Preview & Update Shipment'} {/* supplier_pickup */}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {previewData && (
        <ShipmentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmSubmit}
          formData={previewData}
          isSubmitting={isSubmitting}
          selectedRateId={selectedRateId || previouslyChosenRate?.unique_id || ''}
          shippingOptions={watch('shipping_options')}
        />
      )}

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />

      <Modal
        isOpen={isSubmitting}
        hideCloseButton
        isDismissable={false}
        size="sm"
        backdrop="blur"
      >
        <ModalContent>
          <ModalBody className="flex flex-col items-center justify-center py-8 space-y-4">
            <Spinner
              size="lg"
              color="success"
              label="Updating shipment..."
              labelColor="success"
            />
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                Please wait while we process your update...
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ShipmentEditForm
