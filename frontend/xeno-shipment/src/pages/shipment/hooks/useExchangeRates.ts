import { useState, useEffect } from 'react'
import axios from 'axios'
import { DEFAULT_EXCHANGE_RATES } from '../utils/rate-utils'

interface ExchangeRateResponse {
  conversion_rates: Record<string, number>
  time_last_update_unix: number
}

interface UseExchangeRatesReturn {
  exchangeRates: Record<string, number>
  lastUpdated: string | null
  ratesError: string | null
  isLoadingRates: boolean
  fetchExchangeRates: (forceRefresh?: boolean) => Promise<void>
}

const CACHE_KEY = 'exchange_rates_thb'
const CACHE_TIMESTAMP_KEY = 'exchange_rates_timestamp'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Load cached exchange rates from localStorage
 */
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

/**
 * Save exchange rates to localStorage
 */
const saveCachedRates = (rates: Record<string, number>, timestamp: number): void => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(rates))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, timestamp.toString())
  } catch (error) {
    console.error('Failed to save cached rates:', error)
  }
}

/**
 * Check if cached rates are still valid (less than 1 hour old)
 */
const isCacheValid = (timestamp: number): boolean => {
  const now = Date.now()
  return (now - timestamp) < CACHE_DURATION
}

/**
 * Custom hook for managing exchange rates with caching
 *
 * Features:
 * - Automatic caching in localStorage
 * - Auto-refresh every hour
 * - Fallback to default rates on error
 * - Force refresh capability
 */
export const useExchangeRates = (): UseExchangeRatesReturn => {
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({
    THB: 1.0 // Default fallback
  })
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [ratesError, setRatesError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  /**
   * Fetch exchange rates from API or cache
   */
  const fetchExchangeRates = async (forceRefresh = false): Promise<void> => {
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
        setExchangeRates(DEFAULT_EXCHANGE_RATES)
        // Only show error if we're forcing a refresh, not on initial load
        if (forceRefresh) {
          setRatesError('Failed to fetch current exchange rates')
        }
      }
    } finally {
      setIsLoadingRates(false)
    }
  }

  // Auto-refresh rates on mount and every hour
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

  return {
    exchangeRates,
    lastUpdated,
    ratesError,
    isLoadingRates,
    fetchExchangeRates
  }
}
