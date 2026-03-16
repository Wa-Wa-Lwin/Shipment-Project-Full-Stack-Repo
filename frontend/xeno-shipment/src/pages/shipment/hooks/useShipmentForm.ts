import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import { DEFAULT_FORM_VALUES } from '../constants/form-defaults'
import type { ShipmentFormData } from '../types/shipment-form.types'

export const useShipmentForm = () => {
  const { user, approver, msLoginUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { success, error: showError } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formMethods = useForm<ShipmentFormData>({
    defaultValues: DEFAULT_FORM_VALUES
  })

  const { register, control, handleSubmit, watch, setValue, getValues, trigger, reset, formState: { errors } } = formMethods

  // Load duplicate data if URL contains duplicate parameter
  useEffect(() => {
    const isDuplicate = searchParams.get('duplicate') === 'true'
    if (isDuplicate) {
      const duplicateDataString = sessionStorage.getItem('duplicateShipmentData')
      if (duplicateDataString) {
        try {
          const duplicateData = JSON.parse(duplicateDataString)
          console.log('Loading duplicate shipment data:', duplicateData)

          // Reset form with the duplicate data
          reset({
            ...DEFAULT_FORM_VALUES,
            ...duplicateData
          })

          // Clear the session storage after loading
          sessionStorage.removeItem('duplicateShipmentData')

          // Show success message
          success('Shipment data loaded for duplication. Please review and modify as needed before submitting.', 'Duplicate Data Loaded')
        } catch (error) {
          console.error('Error loading duplicate data:', error)
          showError('Failed to load duplicate shipment data', 'Loading Error')
        }
      }
    }
  }, [searchParams, reset, success, showError])

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
      const hasFile = data.use_customize_invoice && data.customize_invoice_file

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
        success('Shipment request created successfully!', 'Success')
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
    today
  }
}