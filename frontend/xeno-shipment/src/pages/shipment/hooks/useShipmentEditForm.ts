import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import axios from 'axios'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import { DEFAULT_FORM_VALUES } from '../constants/form-defaults'
import type { ShipmentFormData } from '../types/shipment-form.types'

interface UseShipmentEditFormProps {
  shipmentId: string | undefined
  setRateCalculationSnapshot: (snapshot: any) => void
  setInitialLoadComplete: () => void
}

export const useShipmentEditForm = ({
  shipmentId,
  setRateCalculationSnapshot,
  setInitialLoadComplete
}: UseShipmentEditFormProps) => {
  const navigate = useNavigate()
  const { user, msLoginUser } = useAuth()
  const { success, error: showError } = useNotification()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ShipmentFormData | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [previouslyChosenRate, setPreviouslyChosenRate] = useState<any>(null)

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

  const formMethods = useForm<ShipmentFormData>({
    defaultValues: DEFAULT_FORM_VALUES
  })

  const { reset, watch } = formMethods

  // Watch service_options to auto-navigate between steps
  const serviceOption = watch('service_options')
  const previousServiceOptionRef = useRef(serviceOption)

  // Load existing shipment data
  useEffect(() => {
    const fetchShipment = async () => {
      try {
        setIsLoading(true)

        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
        const response = await axios.get(`${apiUrl}/shipments/${shipmentId}`, {
          headers: {
            'x-user-email': msLoginUser?.email || user?.email || '',
            'x-user-name': msLoginUser?.name || user?.username || ''
          }
        })

        const formData = response.data.shipment
        reset(formData)

        // Store the previously chosen rate
        const chosenRate = formData.rates?.find((r: any) => r.chosen === true || r.chosen === 'true')
        if (chosenRate) {
          setPreviouslyChosenRate(chosenRate)
        } else {
          console.warn('No chosen rate found in shipment data')
          console.warn('All rates chosen values:', formData.rates?.map((r: any) => r.chosen))
        }

        setInitialLoadComplete()

        // Set initial snapshot for rate validation (if there's a previously chosen rate)
        if (chosenRate && formData.service_options !== 'Supplier Pickup') {
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
            formData.parcels
          ]
          setRateCalculationSnapshot(initialSnapshot)
        }

        // Set initial step to -1 to show all summaries
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

  // Auto-navigate when service option changes
  useEffect(() => {
    if (previousServiceOptionRef.current === serviceOption) {
      return
    }

    previousServiceOptionRef.current = serviceOption

    if (serviceOption === 'Supplier Pickup' && currentStep === 4) {
      setCurrentStep(-1)
    }

    if (serviceOption !== 'Supplier Pickup' && currentStep === 3) {
      setCurrentStep(4)
    }
  }, [serviceOption, currentStep])

  const handleEditStep = (stepId: number) => {
    setCurrentStep(stepId)
  }

  const handleDoneEditing = () => {
    setCurrentStep(-1)
  }

  return {
    // Form methods
    formMethods,

    // State
    isLoading,
    isSubmitting,
    setIsSubmitting,
    isPreviewOpen,
    setIsPreviewOpen,
    previewData,
    setPreviewData,
    refreshCounter,
    setRefreshCounter,
    currentStep,
    setCurrentStep,
    previouslyChosenRate,
    errorModal,
    setErrorModal,
    serviceOption,

    // Handlers
    handleEditStep,
    handleDoneEditing,

    // Auth & Navigation
    user,
    msLoginUser,
    navigate,
    success,
    showError
  }
}
