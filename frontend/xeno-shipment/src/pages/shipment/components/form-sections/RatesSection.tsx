import { Card, CardHeader, CardBody, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Tabs, Tab, Modal, ModalContent, ModalBody, Input, Autocomplete, AutocompleteItem, Select, SelectItem, RadioGroup, Radio } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState, useEffect, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import axios from 'axios'
import type { FormSectionProps } from '../../types/shipment-form.types'
import { getRateUniqueId as generateRateId } from '@services/rateCalculationService'
import { CURRENCIES } from '../../constants/currencies'
import { validateShipmentScope } from '../../utils/shipment-validations'

// Interface for exchange rate API response
interface ExchangeRateResponse {
  conversion_rates: Record<string, number>
  time_last_update_unix: number
}

// Interface for the API response
interface RateResponse {
  shipper_account: {
    id: string
    slug: string
    description: string
  }
  service_type: string | null
  service_name: string | null
  pickup_deadline: string | null
  booking_cut_off: string | null
  delivery_date: string | null
  transit_time: number | null
  error_message: string | null
  info_message: string | null
  charge_weight: { value: number; unit: string } | null
  total_charge: { amount: number; currency: string } | null
  detailed_charges: Array<{ type: string; charge: { amount: number; currency: string } }>
}

type ScopeError = NonNullable<ReturnType<typeof validateShipmentScope>['error']>

interface RatesSectionProps extends FormSectionProps {
  rates: RateResponse[]
  onCalculateRates: () => void
  isCalculating: boolean
  selectedRateId?: string
  onSelectRate: (rateId: string) => void
  serviceOption?: string
  topic?: string
  watch?: any
  rateCalculationError?: {
    message: string
    details?: Array<{ path: string; info: string }>
  } | null
  shipmentScopeType?: string
}

const RatesSection = ({ rates, onCalculateRates, isCalculating, selectedRateId, onSelectRate, serviceOption, rateCalculationError, watch, control, shipmentScopeType }: RatesSectionProps) => {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    THB: 1.0 // Default fallback
  })

  // State for manual Grab rate
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Inside RatesSection component, add sorting state
  const [sortBy, setSortBy] = useState<'thb' | 'transit' | null>('thb')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedCarrier, setSelectedCarrier] = useState<string>('all')
  const [scopeError, setScopeError] = useState<ScopeError | null>(null)

  // Cache keys
  const CACHE_KEY = 'exchange_rates_thb'
  const CACHE_TIMESTAMP_KEY = 'exchange_rates_timestamp'
  const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

  // Load cached rates from localStorage
  const loadCachedRates = (): { rates: Record<string, number> | null; timestamp: number | null } => {
    try {
      const cachedRates = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

      if (cachedRates && cachedTimestamp) {
        return {
          rates: JSON.parse(cachedRates),
          timestamp: parseInt(cachedTimestamp)
        }
      }
    } catch (error) {
      console.error('Failed to load cached rates:', error)
    }
    return { rates: null, timestamp: null }
  }

  // Save rates to localStorage
  const saveCachedRates = (rates: Record<string, number>, timestamp: number) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(rates))
      localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
    } catch (error) {
      console.error('Failed to save cached rates:', error)
    }
  }

  // Check if cached rates are still valid (less than 1 hour old)
  const isCacheValid = (timestamp: number): boolean => {
    const now = Date.now()
    return (now - timestamp) < CACHE_DURATION
  }

  // Fetch exchange rates from API or cache
  const fetchExchangeRates = async (forceRefresh = false) => {
    setIsLoadingRates(true)
    setRatesError(null)

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const { rates: cachedRates, timestamp: cachedTimestamp } = loadCachedRates()

      if (cachedRates && cachedTimestamp && isCacheValid(cachedTimestamp)) {
        setExchangeRates(cachedRates)
        setLastUpdated(new Date(cachedTimestamp).toLocaleString())
        setIsLoadingRates(false)
        return
      }
    }

    try {
      // Using local API endpoint for exchange rates
      const apiUrl = import.meta.env.VITE_APP_CONVERT_RATES_TO_THB
      const response = await axios.get<ExchangeRateResponse>(apiUrl)

      // The API response already contains rates TO THB, so use them directly
      const thbRates: Record<string, number> = response.data.conversion_rates
      thbRates.THB = 1.0 // Ensure THB to THB is always 1

      const timestamp = Date.now()

      // Save to cache and state
      saveCachedRates(thbRates, timestamp)
      setExchangeRates(thbRates)
      setLastUpdated(new Date(timestamp).toLocaleString())
      setRatesError(null)
      console.log('Exchange rates updated:', Object.keys(thbRates))
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)

      // Try to use cached rates even if expired as fallback
      const { rates: cachedRates } = loadCachedRates()
      if (cachedRates) {
        setExchangeRates(cachedRates)
        // Only show error if we're forcing a refresh, not on initial load
        if (forceRefresh) {
          setRatesError('Failed to fetch current exchange rates')
        }
      } else {
        // Ultimate fallback to hardcoded rates
        setExchangeRates({
          USD: 35.0,
          EUR: 38.5,
          GBP: 43.2,
          JPY: 0.24,
          CNY: 4.9,
          SGD: 26.1,
          MYR: 7.8,
          HKD: 4.13, // 1 HKD = 4.13 THB (approximate)
          THB: 1.0
        })
        // Only show error if we're forcing a refresh, not on initial load
        if (forceRefresh) {
          setRatesError('Failed to fetch current exchange rates')
        }
      }
    } finally {
      setIsLoadingRates(false)
    }
  }

  // Auto-refresh rates every hour
  useEffect(() => {
    // Initial load - only if no cached rates exist or cache is expired
    const { rates: cachedRates, timestamp: cachedTimestamp } = loadCachedRates()

    if (!cachedRates || !cachedTimestamp || !isCacheValid(cachedTimestamp)) {
      // Only fetch if we don't have valid cached data
      fetchExchangeRates()
    } else {
      // Use cached data and don't show error
      setExchangeRates(cachedRates)
      setLastUpdated(new Date(cachedTimestamp).toLocaleString())
    }

    // Set up hourly refresh interval
    const interval = setInterval(() => {
      fetchExchangeRates()
    }, CACHE_DURATION)

    return () => clearInterval(interval)
  }, [])

  // const formatCurrency = (amount: number | undefined | null, currency: string | null) => {
  //   if (amount == null || !currency) return 'N/A'; // covers null and undefined
  //   return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
  // };

  const convertToTHB = (amount: number | undefined | null, currency: string | null) => {
    if (amount == null || !currency) return 'N/A';

    const rate = exchangeRates[currency.toUpperCase()];
    if (!rate) {
      console.log('Exchange rate not found for:', currency, 'Available rates:', Object.keys(exchangeRates));
      return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency} (Rate N/A)`;
    }

    const thbAmount = amount * rate;
    return `${thbAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertWeightToKg = (weight: { value: number; unit: string } | null) => {
    if (!weight) return '-';

    let kgValue = weight.value;
    switch (weight.unit.toLowerCase()) {
      case 'lb':
      case 'lbs':
        kgValue = weight.value * 0.453592;
        break;
      case 'g':
      case 'gram':
      case 'grams':
        kgValue = weight.value / 1000;
        break;
      case 'oz':
      case 'ounce':
      case 'ounces':
        kgValue = weight.value * 0.0283495;
        break;
      case 'kg':
      case 'kilogram':
      case 'kilograms':
        // Already in kg
        break;
      default:
        // Assume kg if unknown unit
        break;
    }

    return `${kgValue.toFixed(2)} kg`;
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-'
    return new Date(dateTime).toLocaleString()
  }

  const getAvailableUniqueRates = (rates: RateResponse[]) => {
    const seen = new Set<string>()
    let availableRates = rates.filter(rate => {
      // Only include rates that are available (have total_charge and no error_message)
      if (rate.error_message || !rate.total_charge?.amount) {
        return false
      }

      // Create unique key combining shipper account and service type
      const uniqueKey = `${rate.shipper_account.id}-${rate.service_type}-${rate.transit_time || 'null'}-${rate.total_charge?.amount || 0}-${rate.total_charge?.currency || 'null'}`
      if (seen.has(uniqueKey)) {
        return false
      }
      seen.add(uniqueKey)
      return true
    })

    // If service option is "normal", return only the cheapest rate
    if (serviceOption === 'Normal' && availableRates.length > 0) {
      // Convert all rates to THB for fair comparison
      const ratesWithTHBCost = availableRates.map(rate => {
        const amount = rate.total_charge?.amount || 0
        const currency = rate.total_charge?.currency || 'THB'
        const conversionRate = exchangeRates[currency.toUpperCase()] || 1
        const thbAmount = amount * conversionRate

        return {
          ...rate,
          thbAmount
        }
      })

      // Find the cheapest rate
      const cheapestRate = ratesWithTHBCost.reduce((cheapest, current) =>
        current.thbAmount < cheapest.thbAmount ? current : cheapest
      )

      return [cheapestRate]
    }

    return availableRates
  }

  const getErrorRates = (rates: RateResponse[]) => {
    // Only return rates with actual errors, not just info messages
    let errorRates = rates.filter(rate => rate.error_message)

    // Filter by recipient carrier if billing is recipient
    const billingParty = watch ? watch('billing') : null
    const recipientCarrier = watch ? watch('recipient_carrier') : null

    if (billingParty === 'recipient' && recipientCarrier) {
      // When billing is recipient, only show errors from the selected carrier
      errorRates = errorRates.filter(rate => {
        const slug = rate.shipper_account.slug.toLowerCase()

        // If DHL is selected, include both 'dhl' and 'dhl-global-mail-asia'
        if (recipientCarrier.toLowerCase() === 'dhl') {
          return slug === 'dhl' || slug === 'dhl-global-mail-asia'
        }

        return slug === recipientCarrier.toLowerCase()
      })
    } else if (selectedCarrier !== 'all') {
      // When billing is shipper, filter by the selected carrier tab (unless "All" is selected)
      errorRates = errorRates.filter(rate => {
        const slug = rate.shipper_account.slug.toLowerCase()

        // If DHL is selected, include both 'dhl' and 'dhl-global-mail-asia'
        if (selectedCarrier.toLowerCase() === 'dhl') {
          return slug === 'dhl' || slug === 'dhl-global-mail-asia'
        }

        return slug === selectedCarrier.toLowerCase()
      })
    }

    return errorRates
  }

  // Generate unique rate ID for selection using the shared function from rateCalculationService
  const getRateUniqueId = (rate: RateResponse, _index: number) => {
    // Use the same function from rateCalculationService to ensure consistency
    return generateRateId(rate as any)
  }

  // Auto-select the cheapest rate when service option is "normal"
  useEffect(() => {
    if (serviceOption === 'Normal' && rates.length > 0) {
      const availableRates = getAvailableUniqueRates(rates)
      if (availableRates.length === 1) {
        const cheapestRateId = getRateUniqueId(availableRates[0], 0)
        if (selectedRateId !== cheapestRateId) {
          onSelectRate(cheapestRateId)
        }
      }
    }
  }, [rates, serviceOption, exchangeRates, selectedRateId, onSelectRate])

  // Count carriers from available rates
  const carrierCounts = useMemo(() => {
    const availableRates = getAvailableUniqueRates(rates)
    const counts: Record<string, number> = {
      all: availableRates.length
    }

    availableRates.forEach(rate => {
      const slug = rate.shipper_account.slug.toLowerCase()

      // Group dhl-global-mail-asia with dhl
      if (slug === 'dhl-global-mail-asia') {
        counts['dhl'] = (counts['dhl'] || 0) + 1
      } else {
        counts[slug] = (counts[slug] || 0) + 1
      }
    })

    return counts
  }, [rates, exchangeRates, serviceOption])

  // Sorted and filtered rates using useMemo
  const sortedRates = useMemo(() => {
    // Combine API rates with manual Grab rate if it exists
    let allRates = [...rates]

    let ratesToSort = getAvailableUniqueRates(allRates).map(rate => ({
      ...rate,
      thbAmount: rate.total_charge
        ? rate.total_charge.amount * (exchangeRates[rate.total_charge.currency?.toUpperCase()] || 1)
        : 0
    }))

    // Filter by recipient carrier if billing is recipient
    const billingParty = watch ? watch('billing') : null
    const recipientCarrier = watch ? watch('recipient_carrier') : null

    if (billingParty === 'recipient' && recipientCarrier) {
      ratesToSort = ratesToSort.filter(rate => {
        const slug = rate.shipper_account.slug.toLowerCase()

        // If DHL is selected, include both 'dhl' and 'dhl-global-mail-asia'
        if (recipientCarrier.toLowerCase() === 'dhl') {
          return slug === 'dhl' || slug === 'dhl-global-mail-asia'
        }

        return slug === recipientCarrier.toLowerCase()
      })
    } else if (selectedCarrier !== 'all') {
      // Filter by carrier tabs if not filtering by recipient carrier
      ratesToSort = ratesToSort.filter(rate => {
        const slug = rate.shipper_account.slug.toLowerCase()

        // If DHL is selected, include both 'dhl' and 'dhl-global-mail-asia'
        if (selectedCarrier.toLowerCase() === 'dhl') {
          return slug === 'dhl' || slug === 'dhl-global-mail-asia'
        }

        return slug === selectedCarrier.toLowerCase()
      })
    }

    // Sort
    if (sortBy === 'thb') {
      return ratesToSort.sort((a, b) => sortAsc ? a.thbAmount - b.thbAmount : b.thbAmount - a.thbAmount)
    } else if (sortBy === 'transit') {
      return ratesToSort.sort((a, b) => {
        const aTime = a.transit_time ?? Infinity
        const bTime = b.transit_time ?? Infinity
        return sortAsc ? aTime - bTime : bTime - aTime
      })
    }
    return ratesToSort
  }, [rates, exchangeRates, sortBy, sortAsc, serviceOption, selectedCarrier, watch])

  const shipFromCountry = watch ? watch('ship_from_country') : undefined
  const shipToCountry = watch ? watch('ship_to_country') : undefined
  const currentScopeSelection = shipmentScopeType ?? (watch ? watch('shipment_scope_type') : undefined)
  const normalizedScope = currentScopeSelection?.toLowerCase()

  useEffect(() => {
    if (!scopeError) return
    const validation = validateShipmentScope({
      ship_from_country: shipFromCountry,
      ship_to_country: shipToCountry,
      shipment_scope_type: currentScopeSelection
    } as any)
    if (validation.isValid) {
      setScopeError(null)
    }
  }, [shipFromCountry, shipToCountry, currentScopeSelection, scopeError])

  const handleCalculateRatesClick = () => {
    if (watch) {
      const formData = watch()
      const scopeValidation = validateShipmentScope(formData)
      if (!scopeValidation.isValid) {
        setScopeError(scopeValidation.error ?? null)
        return
      }
    }

    setScopeError(null)
    onCalculateRates()
  }

  return (
    <>
      {scopeError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Icon icon="solar:danger-triangle-bold" className="text-red-600 text-xl mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">{scopeError.title}</p>
              <p className="text-xs text-red-600 mt-1">{scopeError.message}</p>
              {scopeError.details?.length ? (
                <ul className="list-disc list-inside text-xs text-red-600 mt-2 space-y-1">
                  {scopeError.details.map((detail, index) => (
                    <li key={index}>
                      <span className="font-medium">{detail.path}:</span> {detail.info}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {normalizedScope?.toLowerCase().startsWith('domestic') && (
        <>
          {/* Shipping Options Radio */}
          <div className="p-4 rounded-none">
            <Controller
              name="shipping_options"
              control={control}
              defaultValue="calculate_rates"
              render={({ field }) => (
                <RadioGroup
                  value={field.value || 'calculate_rates'}
                  onValueChange={field.onChange}
                  orientation="horizontal"
                  classNames={{
                    wrapper: "gap-4"
                  }}
                  isDisabled={serviceOption?.toLowerCase() !== 'urgent'}
                >
                  <Radio value="calculate_rates"> Calculate Rates
                  </Radio>
                  <Radio value="grab_pickup">
                    Grab Pickup
                  </Radio>
                  <Radio value="supplier_pickup">
                    Supplier Pickup
                  </Radio>
                </RadioGroup>
              )}
            />
            {serviceOption?.toLowerCase() === 'normal' && (
              <p className="text-xs text-gray-500 mt-2">
                <Icon icon="solar:info-circle-bold" className="inline mr-1" />
                Shipping options are only available for Urgent service. Normal service automatically uses Calculate Rates.
              </p>
            )}
          </div>
        </>
      )}

      {/* Supplier Pickup Message - Show when shipping_options is "supplier_pickup" */}
      {watch && watch('shipping_options') === 'supplier_pickup' && (
        <Card shadow="none" className="rounded-none">
          <CardBody className="px-0 pt-0 pb-0">
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <Icon icon="solar:box-bold" className="text-green-600 text-xl mt-0.5" />
                <div>
                  <p className="text-green-800 text-sm">
                    This is Supplier Pickup option. The supplier will arrange the pickup and delivery of the shipment. FREE OF CHARGE.
                  </p>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Calculating Modal */}
      <Modal
        isOpen={isCalculating}
        hideCloseButton
        isDismissable={false}
        backdrop="blur"
        classNames={{
          backdrop: "backdrop-blur-md"
        }}
      >
        <ModalContent>
          <ModalBody className="py-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Icon
                icon="solar:calculator-bold"
                className="text-6xl text-primary animate-pulse"
              />
              <h2 className="text-2xl font-bold text-blue-500">
                Calculating Rates
              </h2>
              <p className="text-gray-500 text-center">
                Please wait while we fetch the best shipping rates for you...
                <br />
                This could take up to estimately 15 seconds.
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Manual Grab Rate Input - Show when shipping_options is "grab_pickup" */}
      {watch && watch('shipping_options') === 'grab_pickup' && (
        <Card shadow="none" className="rounded-none">
          <CardBody className="px-0 pt-0 pb-0">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2 mb-3">
                <Icon icon="solar:hand-money-bold" className="text-blue-600 text-xl mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-800 text-sm">
                    Manual Grab Rate Entry
                  </h3>
                  <p className="text-blue-700 text-xs">
                    Enter the Grab delivery charge manually
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                <Controller
                  name="grab_rate_amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Total Charge Amount"
                      placeholder="Enter amount"
                      type="number"
                      step="0.01"
                      min="0"
                      startContent={
                        <div className="pointer-events-none flex items-center">
                          <span className="text-default-400 text-small">฿</span>
                        </div>
                      }
                      isRequired
                    />
                  )}
                />
                <Controller
                  name="grab_rate_currency"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      defaultItems={CURRENCIES}
                      label="Currency"
                      placeholder="Select currency"
                      variant="flat"
                      size="md"
                      selectedKey={field.value || 'THB'}
                      onSelectionChange={(key) => {
                        field.onChange(key ? key.toString() : 'THB')
                      }}
                      isRequired
                    >
                      {(currency) => (
                        <AutocompleteItem key={currency.key} value={currency.value}>
                          {currency.key}
                        </AutocompleteItem>
                      )}
                    </Autocomplete>
                  )}
                />
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {watch && watch('shipping_options') === 'calculate_rates' && (
        <Card shadow="none" className="rounded-none">
          {/* Billing Section - Show only after rates are calculated and displayed */}
          {/* HIDE BILLING INFORMATIN FOR NOW */}
          <div className="p-2 bg-gray-20 border-gray-200 hidden">
            <div className="flex items-start gap-2 mb-3">
              <Icon icon="solar:wallet-bold" className="text-blue-600 text-xl mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-800 text-sm">
                  Billing Information
                </h3>
                <p className="text-blue-700 text-xs">
                  Specify who will be billed for this shipment
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Controller
                name="billing"
                control={control}
                defaultValue="shipper"
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Billing Party"
                    placeholder="Select billing party"
                    selectedKeys={field.value ? [field.value] : ['shipper']}
                    onSelectionChange={(keys) => {
                      const selectedKey = Array.from(keys)[0] as string
                      if (selectedKey) field.onChange(selectedKey)
                    }}
                    isRequired
                  >
                    <SelectItem key="shipper" value="shipper">
                      Shipper
                    </SelectItem>
                    {/* <SelectItem key="third_party" value="third_party">
                      Third Party
                    </SelectItem> */}
                    <SelectItem key="recipient" value="recipient">
                      Recipient
                    </SelectItem>
                  </Select>
                )}
              />
              {/* Show recipient fields only when billing is "recipient" */}
              {watch && watch('billing') === 'recipient' && (
                <>
                  <Controller
                    name="recipient_carrier"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        label="Select Carrier"
                        placeholder="Choose carrier"
                        selectedKeys={field.value ? [field.value] : []}
                        onSelectionChange={(keys) => {
                          const selectedKey = Array.from(keys)[0] as string
                          field.onChange(selectedKey || '')
                        }}
                        isRequired={watch('billing') === 'recipient'}
                      >
                        <SelectItem key="dhl" value="dhl">
                          DHL
                        </SelectItem>
                        <SelectItem key="fedex" value="fedex">
                          FedEx
                        </SelectItem>
                        <SelectItem key="ups" value="ups">
                          UPS
                        </SelectItem>
                      </Select>
                    )}
                  />
                  <Controller
                    name="recipient_shipper_account_number"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        label="Recipient Account Number"
                        placeholder="Enter account number"
                        isRequired={watch('billing') === 'recipient'}
                      />
                    )}
                  />
                </>
              )}
            </div>
          </div>

          {/* <Card shadow="none" className="py-0 px-4 m-0"> */}
          <CardHeader className="px-0 pt-0 pb-0 flex-row items-center justify-left gap-3 w-full">
            <div className="flex flex-col">
              {ratesError && (
                <p className="text-red-500 text-sm mt-1">
                  <Icon icon="solar:info-circle-bold" className="inline mr-1" />
                  {ratesError} - Using fallback rates
                </p>
              )}
              {lastUpdated && !ratesError && (
                <p className="text-gray-500 text-xs mt-1">
                  <Icon icon="solar:clock-circle-bold" className="inline mr-1" />
                  Exchange rates updated: {lastUpdated}
                </p>
              )}
            </div>
            {(
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="light"
                  size="sm"
                  startContent={<Icon icon="solar:refresh-bold" />}
                  onPress={() => fetchExchangeRates(true)}
                  isLoading={isLoadingRates}
                  disabled={isLoadingRates}
                  title="Force refresh exchange rates"
                  className='hidden'
                >
                  {isLoadingRates ? 'Updating...' : 'Refresh Rates'}
                </Button>
                <Button
                  type="button"
                  color="primary"
                  size="sm"
                  startContent={<Icon icon="solar:calculator-bold" />}
                  onPress={handleCalculateRatesClick}
                  isLoading={isCalculating}
                  disabled={isCalculating}
                >
                  {isCalculating ? 'Calculating...' : 'Calculate Rates'}
                </Button>
              </div>
            )}
          </CardHeader>

          <CardBody className="px-0 pt-2 pb-0">
            {rates.length === 0 ? (
              <div className="text-center py-8">
                {rateCalculationError ? (
                  <div className="flex flex-col items-center gap-4">
                    <Icon icon="solar:danger-circle-bold" className="text-6xl text-red-500 mb-2" />
                    <div className="max-w-2xl">
                      <h3 className="text-xl font-bold text-red-600 mb-2">
                        Rate Calculation Failed
                      </h3>
                      <p className="text-red-500 mb-4">
                        {rateCalculationError.message}
                      </p>
                      {rateCalculationError.details && rateCalculationError.details.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                          <h4 className="font-semibold text-red-700 mb-2">Validation Errors:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {rateCalculationError.details.map((detail, index) => (
                              <li key={index} className="text-red-600 text-sm">
                                <span className="font-medium">{detail.path}:</span> {detail.info}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button
                        type="button"
                        color="danger"
                        variant="flat"
                        size="sm"
                        className="mt-4"
                        startContent={<Icon icon="solar:refresh-bold" />}
                        onPress={handleCalculateRatesClick}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">
                    <Icon icon="solar:calculator-bold" className="text-4xl mb-2 mx-auto" />
                    <p>No rates calculated yet. Click "Calculate Rates" to get shipping quotes.</p>
                  </div>
                )}
              </div>
            ) : <>
              {/* Carrier Filter Tabs - Hide when billing is recipient with selected carrier */}
              {!(watch && watch('billing') === 'recipient' && watch('recipient_carrier')) && (
                <Tabs
                  aria-label="Carrier filter"
                  selectedKey={selectedCarrier}
                  onSelectionChange={(key) => setSelectedCarrier(key as string)}
                  className="mb-4"
                  color="primary"
                  variant="underlined"
                >
                  <Tab
                    key="all"
                    title={
                      <div className="flex items-center gap-2">
                        <span>All</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                          {carrierCounts.all || 0}
                        </span>
                      </div>
                    }
                  />
                  <Tab
                    key="fedex"
                    title={
                      <div className="flex items-center gap-2">
                        <span>FedEx</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                          {carrierCounts.fedex || 0}
                        </span>
                      </div>
                    }
                  />
                  <Tab
                    key="dhl"
                    title={
                      <div className="flex items-center gap-2">
                        <span>DHL</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                          {carrierCounts.dhl || 0}
                        </span>
                      </div>
                    }
                  />
                  <Tab
                    key="ups"
                    title={
                      <div className="flex items-center gap-2">
                        <span>UPS</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                          {carrierCounts.ups || 0}
                        </span>
                      </div>
                    }
                  />
                  <Tab
                    key="tnt"
                    title={
                      <div className="flex items-center gap-2">
                        <span>TNT</span>
                        <span className="text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                          {carrierCounts.tnt || 0}
                        </span>
                      </div>
                    }
                  />
                </Tabs>
              )}

              {/* Error Rates Section - Only show when no available rates */}
              {sortedRates.length === 0 && getErrorRates(rates).length > 0 && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-3">
                    <Icon icon="solar:danger-triangle-bold" className="text-yellow-600 text-xl mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-800 text-sm">
                        Some carriers returned errors
                      </h3>
                      <p className="text-yellow-700 text-xs">
                        The following carriers could not provide rates due to validation issues:
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {getErrorRates(rates).map((rate, index) => (
                      <div key={index} className="bg-white rounded p-3 border border-yellow-200">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-sm text-gray-800">
                              {rate.shipper_account.description}
                            </div>
                            <div className="text-red-600 text-xs mt-1">
                              <Icon icon="solar:close-circle-bold" className="inline mr-1" />
                              {rate.error_message}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>}
            {rates.length > 0 && (
              <>
                <Table aria-label="Shipping Rates" removeWrapper className="min-w-full">
                  <TableHeader>
                    <TableColumn>Select</TableColumn>
                    <TableColumn>Carrier</TableColumn>
                    <TableColumn>Service</TableColumn>
                    <TableColumn className="text-right flex items-center gap-1">
                      Total Charge(Estimated THB)
                      {/* Estimated THB */}
                      <Button
                        className="h-5 w-5 min-w-0"
                        variant="light"
                        isIconOnly
                        onPress={() => {
                          if (sortBy === 'thb') setSortAsc(!sortAsc)
                          else { setSortBy('thb'); setSortAsc(true) }
                        }}
                      >
                        <Icon
                          icon={sortBy === 'thb'
                            ? sortAsc
                              ? "solar:arrow-up-bold"   // lowest → highest
                              : "solar:arrow-down-bold" // highest → lowest
                            : "solar:arrow-up-bold" // default when not sorting by THB
                          }
                          className="w-3 h-3"
                        />
                      </Button>
                    </TableColumn>
                    {/* <TableColumn className="text-right">Total Charge</TableColumn> */}
                    <TableColumn className="text-right">Charge Weight (kg)</TableColumn>
                    {/* <TableColumn>Transit Time</TableColumn> */}
                    <TableColumn className="flex items-center gap-1">
                      Transit Time
                      <Button
                        className="h-5 w-5 min-w-0"
                        variant="light"
                        isIconOnly
                        onPress={() => {
                          if (sortBy === 'transit') setSortAsc(!sortAsc)
                          else { setSortBy('transit'); setSortAsc(true) }
                        }}
                      >
                        <Icon
                          icon={sortBy === 'transit'
                            ? sortAsc
                              ? "solar:arrow-up-bold"
                              : "solar:arrow-down-bold"
                            : "solar:arrow-up-bold"
                          }
                          className="w-3 h-3"
                        />
                      </Button>
                    </TableColumn>
                    <TableColumn>Delivery Date</TableColumn>
                    <TableColumn>Pickup Deadline</TableColumn>
                    <TableColumn>Booking Cutoff</TableColumn>
                  </TableHeader>
                  <TableBody emptyContent={
                    getErrorRates(rates).length > 0
                      ? "No valid rates available. Please review the error messages above and correct the validation issues."
                      : "No available rates found. Check or change the Carrier or your pick up date or expected delivery date or weight."
                  }>
                    {/* {getAvailableUniqueRates(rates).map((rate, index) => { */}
                    {sortedRates.map((rate, index) => {
                      const rateUniqueId = getRateUniqueId(rate, index)
                      const isSelected = selectedRateId === rateUniqueId
                      return (
                        <TableRow
                          key={rateUniqueId}
                          className={isSelected ? 'bg-green-50 border-green-200' : ''}
                        >
                          <TableCell>
                            {isSelected ? (
                              <Button
                                size="sm"
                                color="success"
                                variant="solid"
                                disabled
                                startContent={<Icon icon="solar:check-circle-bold" />}
                              >
                                {serviceOption === 'Normal' ? 'Cheapest' : 'Selected'}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                color="primary"
                                variant="flat"
                                onPress={() => {
                                  onSelectRate(rateUniqueId)
                                }}
                                disabled={!!rate.error_message || !rate.total_charge?.amount}
                                startContent={<Icon icon="solar:check-circle-line-duotone" />}
                              >
                                Select
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>{rate.shipper_account.description}</TableCell>
                          <TableCell>{rate.service_name || rate.service_type || '-'}</TableCell>
                          <TableCell className="text-right">
                            {convertToTHB(
                              rate.total_charge?.amount ?? null,
                              rate.total_charge?.currency ?? null
                            )} THB
                          </TableCell>
                          {/* <TableCell className="text-right">
                          {formatCurrency(
                            rate.total_charge?.amount ?? null,
                            rate.total_charge?.currency ?? null
                          )}
                        </TableCell> */}
                          <TableCell className="text-right">
                            {convertWeightToKg(rate.charge_weight)}
                          </TableCell>
                          <TableCell>
                            {rate.shipper_account.description === 'DHL eCommerce Asia' || rate.shipper_account.description === 'FedEx Domestic Thailand'
                              ? '1-3(Working) day(s)'
                              : rate.transit_time ? `${rate.transit_time} day(s)` : '-'}
                          </TableCell>
                          <TableCell>{formatDateTime(rate.delivery_date)}</TableCell>
                          <TableCell>{formatDateTime(rate.pickup_deadline) || '-'}</TableCell>
                          <TableCell>{formatDateTime(rate.booking_cut_off) || '-'}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </>
            )}
          </CardBody>
        </Card>
      )}
    </>
  )
}

export default RatesSection
