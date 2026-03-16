import { useState, useEffect } from 'react'
import axios from 'axios'
import type { AddressData } from '../types'

const STORAGE_KEY = 'addresses_data'

export const useAddresses = () => {
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<AddressData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchAddresses = async (forceRefresh = false) => {
    setIsLoading(true)
    try {
      if (!forceRefresh) {
        const cachedData = localStorage.getItem(STORAGE_KEY)
        if (cachedData) {
          const parsedData = JSON.parse(cachedData)
          setAddresses(parsedData)
          setFilteredAddresses(parsedData)
          setIsLoading(false)
          return
        }
      }

      const response = await axios.get(import.meta.env.VITE_APP_GET_ADDRESSES)
      if (response.data?.ret === 0 && response.data?.data) {
        setAddresses(response.data.data)
        setFilteredAddresses(response.data.data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data.data))
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAddresses = (query: string) => {
    if (query.trim() === '') {
      setFilteredAddresses(addresses)
    } else {
      const filtered = addresses.filter(address =>
        address.CardCode.toLowerCase().includes(query.toLowerCase()) ||
        address.CardName.toLowerCase().includes(query.toLowerCase()) ||
        address.City?.toLowerCase().includes(query.toLowerCase()) ||
        address.Country?.toLowerCase().includes(query.toLowerCase()) ||
        address.E_Mail?.toLowerCase().includes(query.toLowerCase()) ||
        address.CntctPrsn?.toLowerCase().includes(query.toLowerCase()) ||
        address.Phone1?.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredAddresses(filtered)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  useEffect(() => {
    filterAddresses(searchQuery)
  }, [searchQuery, addresses])

  return {
    addresses,
    filteredAddresses,
    isLoading,
    searchQuery,
    setSearchQuery,
    fetchAddresses,
    filterAddresses
  }
}