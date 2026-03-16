/**
 * Utility functions for rate calculations and formatting
 */

/**
 * Format currency amount with proper locale formatting
 */
export const formatCurrency = (
  amount: number | undefined | null,
  currency: string | null
): string => {
  if (amount == null || !currency) return 'N/A'
  return `${amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`
}

/**
 * Convert amount to THB using exchange rates
 */
export const convertToTHB = (
  amount: number | undefined | null,
  currency: string | null,
  exchangeRates: Record<string, number>
): string => {
  if (amount == null || !currency) return 'N/A'

  const rate = exchangeRates[currency.toUpperCase()]
  if (!rate) {
    console.log('Exchange rate not found for:', currency, 'Available rates:', Object.keys(exchangeRates))
    return `${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })} ${currency} (Rate N/A)`
  }

  const thbAmount = amount * rate
  return `${thbAmount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
}

/**
 * Weight unit conversion rates to kg
 */
const WEIGHT_CONVERSION_RATES: Record<string, number> = {
  lb: 0.453592,
  lbs: 0.453592,
  g: 0.001,
  gram: 0.001,
  grams: 0.001,
  oz: 0.0283495,
  ounce: 0.0283495,
  ounces: 0.0283495,
  kg: 1,
  kilogram: 1,
  kilograms: 1
}

/**
 * Convert weight to kg from any unit
 */
export const convertWeightToKg = (
  weight: { value: number; unit: string } | null
): string => {
  if (!weight) return '-'

  const factor = WEIGHT_CONVERSION_RATES[weight.unit.toLowerCase()] ?? 1
  const kgValue = weight.value * factor

  return `${kgValue.toFixed(2)} kg`
}

/**
 * Format date time string to locale string
 */
export const formatDateTime = (dateTime: string | null): string => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString()
}

/**
 * Default exchange rates as fallback
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
  USD: 35.0,
  EUR: 38.5,
  GBP: 43.2,
  JPY: 0.24,
  CNY: 4.9,
  SGD: 26.1,
  MYR: 7.8,
  HKD: 4.13,
  THB: 1.0
}
