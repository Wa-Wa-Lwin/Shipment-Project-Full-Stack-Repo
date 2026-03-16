import type { AddressData, CardTypeInfo } from '../types'

export const getCardTypeInfo = (type: string): CardTypeInfo => {
  switch (type) {
    case 'C':
      return { label: 'Customer', color: 'primary' as const, icon: 'solar:user-bold' }
    case 'S':
      return { label: 'Supplier', color: 'secondary' as const, icon: 'solar:shop-bold' }
    default:
      return { label: 'Other', color: 'default' as const, icon: 'solar:buildings-bold' }
  }
}

export const formatAddress = (address: AddressData): string => {
  const parts = [
    address.StreetNo || address.MailStrNo,
    address.Address || address.MailAddres,
    address.Building || address.MailBuildi,
    address.City || address.MailCity,
    address.ZipCode || address.MailZipCod
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(', ') : 'No address available'
}

export const getAddressStatistics = (addresses: AddressData[]) => {
  const customers = addresses.filter(a => a.CardType === 'C').length
  const suppliers = addresses.filter(a => a.CardType === 'S').length

  return { customers, suppliers }
}

export const getPaginatedItems = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
) => {
  const totalPages = Math.ceil(items.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = items.slice(startIndex, endIndex)

  return { totalPages, startIndex, endIndex, currentItems }
}