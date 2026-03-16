import { useState } from 'react'
import { Button, Card, CardBody, Modal, ModalContent, ModalBody, Spinner, Select, SelectItem } from '@heroui/react'
import { Controller } from 'react-hook-form'
import { useShipmentDuplicateForm } from '../hooks/useShipmentDuplicateForm'
import { useShipmentRateCalculation } from '../hooks/useShipmentRateCalculation'
import { validateCalculateRatesData, validateWeights, validateShipmentScope } from '../utils/shipment-validations'
import { CUSTOM_PURPOSES, INCOTERMS } from '../constants/form-defaults'
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

const ShipmentDuplicateForm = () => {
  const { register, control, handleSubmit, setValue, errors, onSubmit, isSubmitting, isLoading, today, getValues, watch, reset, trigger } = useShipmentDuplicateForm()

  // Watch for changes in critical fields that affect rates
  const watchedFields = watch([
    'ship_from_country', 'ship_from_postal_code', 'ship_from_city', 'ship_from_state', 'ship_from_street1', 'ship_from_company_name',
    'ship_to_country', 'ship_to_postal_code', 'ship_to_city', 'ship_to_state', 'ship_to_street1', 'ship_to_company_name',
    'parcels'
  ])

  // Use the shared rate calculation hook
  const {
    isCalculatingRate,
    calculatedRates,
    transformedRates,
    selectedRateId,
    rateCalculationError,
    calculateRates,
    handleRateSelection,
    handleClearRates,
    setRateCalculationSnapshot
  } = useShipmentRateCalculation({ watchedFields })

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ShipmentFormData | null>(null)

  // Step/Section Management
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const steps = [
    { id: 0, name: 'Basic Information', icon: 'solar:box-bold' },
    { id: 1, name: 'Addresses', icon: 'solar:map-point-bold' },
    { id: 2, name: 'Pickup Information', icon: 'solar:calendar-bold' },
    { id: 3, name: 'Parcels & Items', icon: 'solar:box-minimalistic-bold' },
    { id: 4, name: 'Shipping Rates', icon: 'solar:dollar-bold' }
  ]

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
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Helper function to get the highest completed step
  const getHighestCompletedStep = (): { stepNumber: number; stepName: string } | null => {
    if (completedSteps.size === 0) return null
    const maxStep = Math.max(...Array.from(completedSteps)) + 1
    return {
      stepNumber: maxStep,
      stepName: steps[maxStep]?.name || ''
    }
  }

  // Step Navigation Handlers
  const handleNextStep = async () => {
    const isValid = await trigger()
    if (isValid) {
      // Additional validation: Check shipment scope when leaving step 1 (Addresses)
      if (currentStep === 1) {
        const formData = getValues()
        const scopeValidation = validateShipmentScope(formData)

        if (!scopeValidation.isValid && scopeValidation.error) {
          setErrorModal({
            isOpen: true,
            title: scopeValidation.error.title,
            message: scopeValidation.error.message,
            details: scopeValidation.error.details
          })
          return
        }
      }

      // Additional validation: Check parcel item weights when leaving step 3 (Parcels & Items)
      if (currentStep === 3) {
        const formData = getValues()
        const weightValidation = validateWeights(formData)

        if (!weightValidation.isValid) {
          setErrorModal({
            isOpen: true,
            title: 'Weight Validation Failed',
            message: 'Please fix the weight issues below before proceeding to the next step.',
            details: weightValidation.errors
          })
          return
        }

      // 2. Customize Invoice validation
      if (formData.use_customize_invoice && !formData.customize_invoice_file && !formData.customize_invoice_url) {
        setErrorModal({
          isOpen: true,
          title: 'Invoice Validation Failed',
          message: 'Please upload a PDF file before proceeding, since "Upload Customize Invoice" is enabled.'
        })
        return
      }
      }

      setCompletedSteps(prev => new Set(prev).add(currentStep))

      // If we're editing a previous step, return to the highest completed step
      // Otherwise, proceed to the next sequential step
      const highestCompleted = getHighestCompletedStep()
      if (highestCompleted && currentStep < highestCompleted.stepNumber) {
        setCurrentStep(highestCompleted.stepNumber)
      } else {
        setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
      }
    }
  }

  const handlePreviousStep = () => {
    // If we're editing a previous step, return to the highest completed step
    // Otherwise, go to the previous sequential step
    const highestCompleted = getHighestCompletedStep()
    if (highestCompleted && currentStep < highestCompleted.stepNumber) {
      setCurrentStep(highestCompleted.stepNumber)
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 0))
    }
  }

  const handleEditStep = (stepId: number) => {
    // Navigate to the step to edit
    setCurrentStep(stepId)
  }

  const handlePreview = async (data: ShipmentFormData) => {
    // Use the data from form submission instead of getValues()
    const formData = data

    // Validate customize invoice file
    if (formData.use_customize_invoice) {
      const hasValidFile = formData.customize_invoice_file instanceof File
      if (!hasValidFile) {
        setErrorModal({
          isOpen: true,
          title: 'Customize Invoice File Required',
          message: 'You have checked "Upload Customize Invoice" but no file was selected.',
          details: [{
            path: 'Customize Invoice',
            info: 'Please select a PDF file to upload, or uncheck the "Upload Customize Invoice" option.'
          }]
        })
        return
      }
    }

    // Validate weights first
    const weightValidation = validateWeights(formData)
    if (!weightValidation.isValid) {
      setErrorModal({
        isOpen: true,
        title: 'Weight Validation Failed',
        message: 'Please fix the weight issues below before proceeding.',
        details: weightValidation.errors
      })
      return
    }

    // Validate based on shipping_options
    const shippingOptions = formData.shipping_options || 'calculate_rates'

    if (shippingOptions === 'calculate_rates') {
      // Validate that rates have been calculated
      if (calculatedRates.length === 0) {
        setErrorModal({
          isOpen: true,
          title: 'Rate Calculation Required',
          message: 'Please calculate shipping rates before proceeding to preview.',
          details: [{ path: 'Rates', info: 'Click "Calculate Rates" button to get available shipping options' }]
        })
        return
      }

      // Validate that a rate is selected
      if (!selectedRateId) {
        setErrorModal({
          isOpen: true,
          title: 'Rate Selection Required',
          message: 'Please select a shipping rate before proceeding to preview.',
          details: [{
            path: 'Rate Selection',
            info: 'Choose one of the calculated shipping rates from the rates section'
          }]
      })
      return
    }
    } else if (shippingOptions === 'grab_pickup') {
      // Validate that grab rate amount is entered
      if (!formData.grab_rate_amount || parseFloat(formData.grab_rate_amount) <= 0) {
        setErrorModal({
          isOpen: true,
          title: 'Grab Information Required',
          message: 'Please enter Grab delivery charge before proceeding to preview.',
          details: [{ path: 'Grab Rate', info: 'Enter the total charge amount for Grab delivery' }]
        })
        return
      }
    }
    // No validation needed for supplier_pickup

    // Prepare data based on shipping_options
    let formDataWithRates = formData

    if (shippingOptions === 'calculate_rates') {
      if (calculatedRates.length === 0) {
        // Calculate rates if not already done
        formDataWithRates = await calculateRates(formData)
      } else {
        // Use already stored transformed rates to avoid recalculation
        formDataWithRates = {
          ...formData,
          rates: transformedRates
        }
      }
    } else {
      // For grab_pickup and supplier_pickup, just use formData as is
      formDataWithRates = formData
    }

    setPreviewData(formDataWithRates)
    setIsPreviewOpen(true)
  }

  const handleConfirmSubmit = () => {
    if (previewData) {
      // Mark selected rate as chosen using unique ID, ensure only one rate is chosen
      const updatedRates = previewData.rates?.map(rate => ({
        ...rate,
        chosen: rate.unique_id === selectedRateId ? true : false
      })) || []

      // Convert weight values from scientific notation to decimal strings
      const normalizedParcels = previewData.parcels?.map(parcel => ({
        ...parcel,
        weight_value: Number(Number(parcel.weight_value).toFixed(5)),
        net_weight_value: Number(Number(parcel.net_weight_value || 0).toFixed(5)),
        parcel_weight_value: Number(Number(parcel.parcel_weight_value || 0).toFixed(5)),
        parcel_items: parcel.parcel_items?.map(item => ({
          ...item,
          weight_value: Number(Number(item.weight_value).toFixed(5)),
          price_amount: Number(Number(item.price_amount).toFixed(4))
        }))
      }))

      // Clean up customize_invoice_file if not a valid File
      const finalData = {
        ...previewData,
        parcels: normalizedParcels,
        rates: updatedRates,
        // If use_customize_invoice is false or file is not valid, set to null
        customize_invoice_file: (previewData.use_customize_invoice && previewData.customize_invoice_file instanceof File)
          ? previewData.customize_invoice_file
          : null
      }

      setIsPreviewOpen(false)
      onSubmit(finalData)
    }
  }

  const handleCalculateRate = async () => {
    const formData = getValues()

    // Validate form data before calculating rates
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

    // Validate weights before calculating rates
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
      // Store snapshot of form data when rates were calculated
      setRateCalculationSnapshot(watchedFields)
    } else {
      console.log("Rates calculated but no rates were returned.")
    }
  }

  if (isLoading) {
    return (
      <Card shadow="none" className="p-5 m-0 bg-transparent">
        <CardBody className="flex justify-center items-center p-8">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-gray-600">Loading shipment data...</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      <Card shadow="none" className="m-0 bg-transparent">
        <CardBody className="p-0">
          <form
            onSubmit={handleSubmit(handlePreview, () => { })}
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
                      <div className="flex gap-2">
                        <Button
                          variant="bordered"
                          onPress={handlePreviousStep}
                          isDisabled={currentStep === 0}
                          startContent={<Icon icon="solar:arrow-left-linear" width={20} />}
                        >
                          Previous
                        </Button>
                      </div>
                      <Button
                        color="primary"
                        onPress={handleNextStep}
                        endContent={<Icon icon="solar:arrow-right-linear" width={20} />}
                      >
                        {(() => {
                          const highestCompleted = getHighestCompletedStep()
                          return highestCompleted && currentStep < highestCompleted.stepNumber
                            ? `Return to ${highestCompleted.stepName}`
                            : 'Next Step'
                        })()}
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
                        <hr />
                        {/* Customs fields - only show for international shipments */}
                        {watch('shipment_scope_type') && watch('shipment_scope_type').toLowerCase().startsWith('international') && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            <Controller
                              name="customs_purpose"
                              control={control}
                              defaultValue="sample"
                              rules={{ required: 'Customs purpose is required for international shipments' }}
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  isRequired
                                  label={<span>Customs Purpose</span>}
                                  placeholder="Select"
                                  errorMessage={errors.customs_purpose?.message}
                                  isInvalid={!!errors.customs_purpose}
                                  selectedKeys={watch('customs_purpose') ? [watch('customs_purpose')] : field.value ? [field.value] : []}
                                  onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string
                                    if (selectedKey) field.onChange(selectedKey)
                                  }}
                                  color={!watch('customs_purpose') ? "warning" : "default"}
                                >
                                  {CUSTOM_PURPOSES.map((option) => (
                                    <SelectItem key={option.key} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                            />
                            <Controller
                              name="customs_terms_of_trade"
                              control={control}
                              defaultValue="exw"
                              rules={{ required: 'Incoterms is required for international shipments' }}
                              render={({ field }) => (
                                <Select
                                  {...field}
                                  isRequired
                                  label={<span>Incoterms</span>}
                                  placeholder="Select"
                                  errorMessage={errors.customs_terms_of_trade?.message}
                                  isInvalid={!!errors.customs_terms_of_trade}
                                  selectedKeys={watch('customs_terms_of_trade') ? [watch('customs_terms_of_trade')] : field.value ? [field.value] : []}
                                  onSelectionChange={(keys) => {
                                    const selectedKey = Array.from(keys)[0] as string
                                    if (selectedKey) {
                                      field.onChange(selectedKey)
                                      // Clear rates since incoterms changed
                                      handleClearRates()
                                    }
                                  }}
                                  color={!watch('customs_terms_of_trade') ? "warning" : "default"}
                                >
                                  {INCOTERMS.map((option) => (
                                    <SelectItem key={option.key} value={option.value}>
                                      {option.value}
                                    </SelectItem>
                                  ))}
                                </Select>
                              )}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center border-t pt-4">
                      <div className="flex gap-2">
                        <Button
                          variant="bordered"
                          onPress={handlePreviousStep}
                          startContent={<Icon icon="solar:arrow-left-linear" width={20} />}
                        >
                          Previous
                        </Button>
                      </div>
                      <Button
                        color="primary"
                        onPress={handleNextStep}
                        endContent={<Icon icon="solar:arrow-right-linear" width={20} />}
                      >
                        {(() => {
                          const highestCompleted = getHighestCompletedStep()
                          return highestCompleted && currentStep < highestCompleted.stepNumber
                            ? `Return to ${highestCompleted.stepName}`
                            : 'Next Step'
                        })()}
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
                      <div className="flex gap-2">
                        <Button
                          variant="bordered"
                          onPress={handlePreviousStep}
                          startContent={<Icon icon="solar:arrow-left-linear" width={20} />}
                        >
                          Previous
                        </Button>
                      </div>
                      <Button
                        color="primary"
                        onPress={handleNextStep}
                        endContent={<Icon icon="solar:arrow-right-linear" width={20} />}
                      >
                        {(() => {
                          const highestCompleted = getHighestCompletedStep()
                          return highestCompleted && currentStep < highestCompleted.stepNumber
                            ? `Return to ${highestCompleted.stepName}`
                            : 'Next Step'
                        })()}
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
                      <div className="flex gap-2">
                        <Button
                          variant="bordered"
                          onPress={handlePreviousStep}
                          startContent={<Icon icon="solar:arrow-left-linear" width={20} />}
                        >
                          Previous
                        </Button>
                      </div>
                      <Button
                        color="primary"
                        onPress={handleNextStep}
                        endContent={<Icon icon="solar:arrow-right-linear" width={20} />}
                      >
                        {(() => {
                          const highestCompleted = getHighestCompletedStep()
                          return highestCompleted && currentStep < highestCompleted.stepNumber
                            ? `Return to ${highestCompleted.stepName}`
                            : 'Next Step'
                        })()}
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
                <Card className="border-2 border-primary shadow-lg m-1">
                  <CardBody className="p-6">
                    <div className="mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon icon={steps[4].icon} width={28} className="text-primary" />
                        <h2 className="text-xl font-bold text-primary">{steps[4].name}</h2>
                      </div>
                      <p className="text-sm text-gray-500">Step 5 of {steps.length}</p>
                    </div>
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
                      <div className="flex gap-2">
                        <Button
                          variant="bordered"
                          onPress={handlePreviousStep}
                          startContent={<Icon icon="solar:arrow-left-linear" width={20} />}
                        >
                          Previous
                        </Button>
                      </div>
                      <Button
                        color="success"
                        type="submit"
                        startContent={<Icon icon="solar:eye-bold" width={20} />}
                        isDisabled={
                          watch('shipping_options') === 'calculate_rates'
                            ? (calculatedRates.length === 0 || !selectedRateId)
                            : watch('shipping_options') === 'grab_pickup'
                              ? (!watch('grab_rate_amount') || parseFloat(watch('grab_rate_amount') || '0') <= 0)
                              : false // supplier_pickup - no validation needed
                        }
                      >
                        {watch('shipping_options') === 'calculate_rates'
                          ? (calculatedRates.length === 0
                            ? 'Calculate Rates First'
                            : !selectedRateId
                              ? 'Select Rate First'
                              : 'Preview & Submit')
                          : watch('shipping_options') === 'grab_pickup'
                            ? (!watch('grab_rate_amount') || parseFloat(watch('grab_rate_amount') || '0') <= 0
                              ? 'Input Grab Information First'
                              : 'Preview & Submit')
                            : 'Preview & Submit'} {/* supplier_pickup */}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ) : completedSteps.has(3) && selectedRateId && (
                <div className="pb-1">
                  <RatesSummary
                    data={getValues()}
                    selectedRateId={selectedRateId}
                    transformedRates={transformedRates}
                    serviceType={watch('service_options')}
                    onEdit={() => handleEditStep(4)}
                  />
                </div>
              )}
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Preview Modal */}
      {previewData && (
        <ShipmentPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onConfirm={handleConfirmSubmit}
          formData={previewData}
          isSubmitting={isSubmitting}
          selectedRateId={selectedRateId}
          shippingOptions={watch('shipping_options')}
        />
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
      />

      {/* Loading Modal */}
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
              label="Submitting shipment..."
              labelColor="success"
            />
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                Please wait while we process your request...
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

export default ShipmentDuplicateForm
