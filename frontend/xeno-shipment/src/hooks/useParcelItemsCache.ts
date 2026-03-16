import { useState, useEffect } from 'react'
import axios from 'axios'

interface MaterialData {
  material_code: string;
  description: string;
  type_name: string;
  part_revision: string;
  supplier_name: string;
  sku: string;
  part_no: string;
  hscode: string;
}

interface ParcelItemsCache {
  data: MaterialData[];
  timestamp: number;
  version: string;
}

const CACHE_KEY = 'parcel_items_cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
const CACHE_VERSION = '1.0'

// Standalone function to preload parcel items (can be called outside of React components)
export const preloadParcelItemsCache = async (): Promise<void> => {
  try {
    const response = await axios.get(import.meta.env.VITE_APP_GET_PARCEL_ITEMS)
    if (response.data?.ret === 0 && response.data?.data) {
      const cache = {
        data: response.data.data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    }
  } catch (error) {
    console.error('Failed to preload parcel items:', error)
  }
}

export const useParcelItemsCache = () => {
  const [materials, setMaterials] = useState<MaterialData[]>(() => {
    // Initialize with cached data synchronously
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return []

      const parsedCache: ParcelItemsCache = JSON.parse(cached)

      // Check if cache is valid
      if (parsedCache.version === CACHE_VERSION) {
        const now = Date.now()
        const isExpired = (now - parsedCache.timestamp) > CACHE_DURATION
        if (!isExpired) {
          return parsedCache.data
        }
      }

      // Cache is invalid, remove it
      localStorage.removeItem(CACHE_KEY)
      return []
    } catch (error) {
      console.error('Failed to load parcel items from cache:', error)
      localStorage.removeItem(CACHE_KEY)
      return []
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const isCacheValid = (cache: ParcelItemsCache): boolean => {
    if (!cache || cache.version !== CACHE_VERSION) {
      return false
    }
    
    const now = Date.now()
    const isExpired = (now - cache.timestamp) > CACHE_DURATION
    return !isExpired
  }

  const loadFromCache = (): MaterialData[] => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return []

      const parsedCache: ParcelItemsCache = JSON.parse(cached)
      
      if (isCacheValid(parsedCache)) {
        setLastFetch(new Date(parsedCache.timestamp))
        return parsedCache.data
      }
      
      // Cache is invalid, remove it
      localStorage.removeItem(CACHE_KEY)
      return []
    } catch (error) {
      console.error('Failed to load parcel items from cache:', error)
      localStorage.removeItem(CACHE_KEY)
      return []
    }
  }

  const saveToCache = (data: MaterialData[]) => {
    try {
      const cache: ParcelItemsCache = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
      setLastFetch(new Date())
    } catch (error) {
      console.error('Failed to save parcel items to cache:', error)
    }
  }

  const fetchParcelItems = async (forceRefresh = false): Promise<MaterialData[]> => {
    // If already loading, don't start another request
    if (isLoading) {
      return materials
    }

    // Check cache first if not forcing refresh
    if (!forceRefresh) {
      const cachedData = loadFromCache()
      if (cachedData.length > 0) {
        setMaterials(cachedData)
        return cachedData
      }
    }

    // If we already have materials and not forcing refresh, return existing data
    if (materials.length > 0 && !forceRefresh) {
      return materials
    }

    setIsLoading(true)
    try {
      const response = await axios.get(import.meta.env.VITE_APP_GET_PARCEL_ITEMS)
      if (response.data?.ret === 0 && response.data?.data) {
        const fetchedData = response.data.data
        setMaterials(fetchedData)
        saveToCache(fetchedData)
        return fetchedData
      }
      return []
    } catch (error) {
      console.error('Failed to fetch parcel items:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    setMaterials([])
    setLastFetch(null)
  }

  const getCacheInfo = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const parsedCache: ParcelItemsCache = JSON.parse(cached)
      return {
        count: parsedCache.data.length,
        timestamp: new Date(parsedCache.timestamp),
        version: parsedCache.version,
        isValid: isCacheValid(parsedCache)
      }
    } catch {
      return null
    }
  }

  // Set lastFetch timestamp if cache was loaded
  useEffect(() => {
    if (materials.length > 0) {
      try {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
          const parsedCache: ParcelItemsCache = JSON.parse(cached)
          setLastFetch(new Date(parsedCache.timestamp))
        }
      } catch {
        // Ignore errors
      }
    }
  }, [])

  return {
    materials,
    isLoading,
    lastFetch,
    fetchParcelItems,
    clearCache,
    getCacheInfo
  }
}