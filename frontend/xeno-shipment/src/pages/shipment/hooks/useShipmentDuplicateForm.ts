import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import { DEFAULT_FORM_VALUES } from '../constants/form-defaults'
import type { ShipmentFormData } from '../types/shipment-form.types'

export const useShipmentDuplicateForm = () => {
  const { user, approver, msLoginUser } = useAuth()
  const navigate = useNavigate()
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const { success, error: showError } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const formMethods = useForm<ShipmentFormData>({
    defaultValues: DEFAULT_FORM_VALUES
  })

  const { register, control, handleSubmit, watch, setValue, getValues, trigger, reset, formState: { errors } } = formMethods

  // Fetch shipment data from API when component mounts
  useEffect(() => {
    const fetchShipmentData = async () => {
      if (!shipmentId) {
        console.error('No shipmentId provided')
        showError('Invalid shipment ID', 'Error')
        navigate('/shipment')
        return
      }

      try {
        console.log('Starting to fetch shipment data for ID:', shipmentId)
        setIsLoading(true)
        const baseUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID
        if (!baseUrl) {
          throw new Error('API URL for Shipment Details not configured')
        }

        const apiUrl = `${baseUrl}${shipmentId}`
        console.log('Fetching from URL:', apiUrl)
        const response = await axios.get(apiUrl)
        console.log('API Response:', response.data)
        const shipmentData = response.data.shipment_request

        // Transform the API response to match form structure
        const duplicateData = {
          shipment_scope_type: shipmentData.shipment_scope_type || '',
          send_to: shipmentData.send_to || 'Approver',
          topic: shipmentData.topic || '',
          other_topic: shipmentData.other_topic || '',
          sales_person: shipmentData.sales_person || '',
          po_number: shipmentData.po_number || '',
          po_date: shipmentData.po_date || '',
          service_options: shipmentData.service_options || '',
          urgent_reason: shipmentData.urgent_reason || '',
          remark: shipmentData.remark || '',
          due_date: shipmentData.due_date || '',

          // Ship From Address
          ship_from_company_name: shipmentData.ship_from_company_name || shipmentData.ship_from?.company_name || '',
          ship_from_contact_name: shipmentData.ship_from_contact_name || shipmentData.ship_from?.contact_name || '',
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
          ship_to_company_name: shipmentData.ship_to_company_name || shipmentData.ship_to?.company_name || '',
          ship_to_contact_name: shipmentData.ship_to_contact_name || shipmentData.ship_to?.contact_name || '',
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

          // Pickup Information
          pick_up_status: shipmentData.pick_up_status || true,
          pick_up_date: shipmentData.pick_up_date || '',
          pick_up_start_time: shipmentData.pick_up_start_time || '',
          pick_up_end_time: shipmentData.pick_up_end_time || '',
          pick_up_instructions: shipmentData.pick_up_instructions || '',

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

          customs_purpose: shipmentData.customs_purpose || '',
          customs_terms_of_trade: shipmentData.customs_terms_of_trade || '',
          payment_terms: shipmentData.payment_terms || '',
          rates: [],

          // Grab rate fields (for manual Grab rate entry)
          grab_rate_amount: shipmentData.grab_rate_amount || '',
          grab_rate_currency: shipmentData.grab_rate_currency || 'THB',
        }

        console.log('Loading duplicate shipment data from API:', duplicateData)

        // Reset form with the fetched duplicate data
        reset({
          ...DEFAULT_FORM_VALUES,
          ...duplicateData
        })

        // Show success message
        success(`Shipment #${shipmentId} data loaded for duplication. Please review and modify as needed before submitting.`, 'Duplicate Data Loaded')

      } catch (error) {
        console.error('Error fetching shipment data for duplication:', error)
        showError('Failed to load shipment data for duplication', 'Loading Error')
        navigate('/shipment')
      } finally {
        setIsLoading(false)
      }
    }

    fetchShipmentData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId])

  const onSubmit = async (data: ShipmentFormData) => {
    if (!msLoginUser) {
      showError('User authentication required', 'Authentication Error')
      return
    }

    setIsSubmitting(true)
    try {
      // Ensure pickup times are in correct format (H:i - 24 hour format like "15:03")
      const formatTimeForAPI = (timeString: string) => {
        if (!timeString) return ''

        const time = timeString.trim()

        // Handle various time formats and extract only hours and minutes
        // Remove seconds and microseconds if present
        let cleanTime = time

        // If time has seconds/microseconds like "15:03:00.0000000", extract only HH:MM
        if (time.includes(':')) {
          const parts = time.split(':')
          if (parts.length >= 2) {
            const hours = parts[0].padStart(2, '0')
            const minutes = parts[1].padStart(2, '0')
            cleanTime = `${hours}:${minutes}`
          }
        }

        // Validate final format is HH:MM
        if (cleanTime.match(/^\d{2}:\d{2}$/)) {
          return cleanTime
        }

        return ''
      }

      const submissionData = {
        ...data,
        // Format pickup times to ensure they match API requirements
        pick_up_start_time: formatTimeForAPI(data.pick_up_start_time || ''),
        pick_up_end_time: formatTimeForAPI(data.pick_up_end_time || ''),
        // Auto-bind from auth context - use msLoginUser if no DB data
        created_user_id: user?.userID || 0,
        created_user_name: user ? (user.firstName + ' ' + user.lastName) : msLoginUser.name,
        created_user_mail: user?.email || msLoginUser.email,
        approver_user_id: approver?.userID || 0,
        approver_user_name: approver ? (approver.firstName + ' ' + approver.lastName) : msLoginUser.name,
        approver_user_mail: approver?.email || msLoginUser.email
      }

      // Check if we have a file to upload
      const hasFile = data.use_customize_invoice && data.customize_invoice_file instanceof File

      let response
      if (hasFile) {
        // Use FormData for file upload
        const formData = new FormData()

        // Add the file
        formData.append('customize_invoice_file', data.customize_invoice_file as File)

        // Helper function to append nested objects to FormData
        const appendFormData = (data: any, parentKey = '') => {
          if (data && typeof data === 'object' && !(data instanceof File)) {
            if (Array.isArray(data)) {
              data.forEach((item, index) => {
                appendFormData(item, `${parentKey}[${index}]`)
              })
            } else {
              Object.keys(data).forEach((key) => {
                appendFormData(data[key], parentKey ? `${parentKey}[${key}]` : key)
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
        Object.keys(submissionData).forEach((key) => {
          // Skip the file field as it's already added
          if (key === 'customize_invoice_file') return

          const value = submissionData[key as keyof typeof submissionData]
          appendFormData(value, key)
        })

        response = await axios.post(
          import.meta.env.VITE_APP_ADD_NEW_SHIPMENT_REQUEST,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
      } else {
        // Use regular JSON payload when no file
        // Remove customize_invoice_file from payload to avoid validation errors
        const { customize_invoice_file, ...dataWithoutFile } = submissionData

        response = await axios.post(
          import.meta.env.VITE_APP_ADD_NEW_SHIPMENT_REQUEST,
          dataWithoutFile
        )
      }

      if (response.status === 200 || response.status === 201) {
        success('Duplicate shipment request created successfully!', 'Success')
        // Reset form and redirect to shipment list
        // Use setTimeout to ensure the state updates complete before navigation
        setTimeout(() => {
          reset()
          navigate('/shipment')
        }, 100)
      }
    } catch (error) {
      console.error('Error submitting form:', error)

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data

        // Handle API validation errors
        if (errorData.meta?.details && Array.isArray(errorData.meta.details)) {
          const errorMessages = errorData.meta.details.map((detail: any) =>
            `${detail.path}: ${detail.info}`
          ).join('\n')

          showError(`Submission failed with validation errors:\n\n${errorMessages}`, 'Validation Error')
        } else if (errorData.meta?.message) {
          showError(`Submission failed: ${errorData.meta.message}`, 'Submission Failed')
        } else {
          showError('Error submitting shipment request. Please check your form data and try again.', 'Submission Error')
        }
      } else {
        showError('Error submitting shipment request. Please check your internet connection and try again.', 'Connection Error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    trigger,
    reset,
    errors,
    onSubmit,
    isSubmitting,
    isLoading,
    today
  }
}
