import { useState, useEffect, useMemo } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Pagination,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { ISO_2_COUNTRIES } from '@pages/shipment/constants/iso2countries'
import type { AddressListData } from './types'
import { useAuth } from '@context/AuthContext'

const STORAGE_KEY = 'address_list_cache'

const AddressList = () => {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure()
  const [addresses, setAddresses] = useState<AddressListData[]>([])
  const [allAddresses, setAllAddresses] = useState<AddressListData[]>([])
  const [activeAddresses, setActiveAddresses] = useState<AddressListData[]>([])
  const [inactiveAddresses, setInactiveAddresses] = useState<AddressListData[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<AddressListData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isExportingAll, setIsExportingAll] = useState(false)
  const [isExportingTemplate, setIsExportingTemplate] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [alertMessage, setAlertMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const { user, msLoginUser } = useAuth()
  const [sortConfig, setSortConfig] = useState<{ key: keyof AddressListData | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  })
  const [formData, setFormData] = useState({
    CardCode: '',
    company_name: '',
    CardType: 'S',
    street1: '',
    street2: '',
    street3: '',
    city: '',
    state: '',
    country: 'TH',
    postal_code: '',
    contact_name: '',
    contact: '',
    phone: '',
    email: '',
    tax_id: '',
    phone1: '',
    website: '',
    eori_number: '',
    bind_incoterms: '',
  })

  // Automatically generate full address from address components
  const fullAddress = [
    formData.street1,
    formData.street2,
    formData.street3,
    formData.city,
    formData.state,
    formData.country,
    formData.postal_code
  ].filter(Boolean).join(', ')
  const itemsPerPage = 15

  // Show alert with auto-dismiss after 3 seconds
  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage({ message, type })
    setTimeout(() => {
      setAlertMessage(null)
    }, 3000)
  }

  const fetchAddresses = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          setAllAddresses(cachedData.all_address_list || [])
          setActiveAddresses(cachedData.all_active_address_list || [])
          setInactiveAddresses(cachedData.all_inactive_address_list || [])

          // Set addresses based on current filter
          if (statusFilter === 'active') {
            setAddresses(cachedData.all_active_address_list || [])
          } else if (statusFilter === 'inactive') {
            setAddresses(cachedData.all_inactive_address_list || [])
          } else {
            setAddresses(cachedData.all_address_list || [])
          }
          return
        } catch (error) {
          console.error('Failed to parse cached data:', error)
        }
      }
    }

    setIsLoading(true)
    try {
      const response = await axios.get(import.meta.env.VITE_APP_NEW_ADDRESS_LIST_GET_ALL)
      if (response.data) {
        const allData = response.data.all_address_list || []
        const activeData = response.data.all_active_address_list || []
        const inactiveData = response.data.all_inactive_address_list || []

        setAllAddresses(allData)
        setActiveAddresses(activeData)
        setInactiveAddresses(inactiveData)

        // Set addresses based on current filter
        if (statusFilter === 'active') {
          setAddresses(activeData)
        } else if (statusFilter === 'inactive') {
          setAddresses(inactiveData)
        } else {
          setAddresses(allData)
        }

        // Cache the entire response
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForceRefresh = () => {
    fetchAddresses(true)
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  useEffect(() => {
    fetchAddresses()
  }, [statusFilter])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAddresses(addresses)
    } else {
      const q = searchQuery.toLowerCase()
      const filtered = addresses.filter(address =>
        (address.company_name || '').toLowerCase().includes(q) ||
        (address.CardCode || '').toLowerCase().includes(q) ||
        (address.city || '').toLowerCase().includes(q) ||
        (address.state || '').toLowerCase().includes(q) ||
        (address.contact_name || '').toLowerCase().includes(q) ||
        (address.phone || '').toLowerCase().includes(q) ||
        (address.country || '').toLowerCase().includes(q)
      )
      setFilteredAddresses(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, addresses])

  const handleStatusFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    setStatusFilter(filter)
    setSearchQuery('')
  }

  const handleSort = (key: keyof AddressListData) => {
    setSortConfig((currentConfig) => {
      if (currentConfig.key === key) {
        // Toggle direction if clicking the same column
        return {
          key,
          direction: currentConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      // New column, default to ascending
      return { key, direction: 'asc' }
    })
  }

  // Sort the filtered addresses
  const sortedAddresses = useMemo(() => {
    if (!sortConfig.key) {
      return filteredAddresses
    }

    const sorted = [...filteredAddresses].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

      // Compare values
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })

    return sorted
  }, [filteredAddresses, sortConfig])

  const totalPages = Math.ceil(sortedAddresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = sortedAddresses.slice(startIndex, endIndex)

  const handleCreateNew = () => {
    setFormData({
      CardCode: '',
      company_name: '',
      CardType: 'S',
      street1: '',
      street2: '',
      street3: '',
      city: '',
      state: '',
      country: 'TH',
      postal_code: '',
      contact_name: '',
      contact: '',
      phone: '',
      email: '',
      tax_id: '',
      phone1: '',
      website: '',
      eori_number: '',
      bind_incoterms: '',
    })
    setFormErrors({})
    onOpen()
  }

  const handleViewDetail = (addressID: number) => {
    navigate(`/local/address-list/${addressID}`)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.company_name.trim()) {
      errors.company_name = 'Company name is required'
    }
    if (!formData.street1.trim()) {
      errors.street1 = 'Street 1 is required'
    }
    if (!formData.city.trim()) {
      errors.city = 'City is required'
    }
    if (!formData.state.trim()) {
      errors.state = 'State is required'
    }
    if (!formData.country.trim()) {
      errors.country = 'Country is required'
    }
    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Postal code is required'
    }
    if (!formData.contact_name.trim()) {
      errors.contact_name = 'Contact name is required'
    }

    // Phone number validation - only numbers, spaces, +, -, and () allowed
    const phoneRegex = /^[0-9+\-() ]*$/
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      errors.phone = 'Phone number can only contain numbers and +, -, (), space'
    }
    if (formData.phone1 && !phoneRegex.test(formData.phone1)) {
      errors.phone1 = 'Phone number can only contain numbers and +, -, (), space'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsCreating(true)
    try {
      const payload = {
        ...formData,
        full_address: fullAddress,
        active: 1,
        user_id: user?.userID,
        user_name: msLoginUser?.name
      }

      await axios.post(import.meta.env.VITE_APP_NEW_ADDRESS_LIST_CREATE, payload)

      // Clear cache and force refresh
      localStorage.removeItem(STORAGE_KEY)

      onClose()
      setFormErrors({})

      // Force refresh to show the new address
      await fetchAddresses(true)
    } catch (error: any) {
      console.error('Failed to save address:', error)

      // Handle validation errors from backend
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        Object.keys(error.response.data.errors).forEach(key => {
          backendErrors[key] = error.response.data.errors[key][0]
        })
        setFormErrors(backendErrors)
      } else {
        alert('Failed to create address. Please try again.')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleExportAll = async () => {
    setIsExportingAll(true)
    try {
      const response = await axios.get('/api/logistics/exportAddresses', {
        responseType: 'blob'
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `address_list_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showAlert('Address list exported successfully!', 'success')
    } catch (error) {
      console.error('Failed to export addresses:', error)
      showAlert('Failed to export addresses. Please try again.', 'error')
    } finally {
      setIsExportingAll(false)
    }
  }

  const handleExportTemplate = async () => {
    setIsExportingTemplate(true)
    try {
      const response = await axios.get('/api/logistics/exportAddressTemplate', {
        responseType: 'blob'
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `address_list_template_${new Date().toISOString().split('T')[0]}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      showAlert('Template exported successfully!', 'success')
    } catch (error) {
      console.error('Failed to export template:', error)
      showAlert('Failed to export template. Please try again.', 'error')
    } finally {
      setIsExportingTemplate(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']
      if (!validTypes.includes(file.type)) {
        showAlert('Please select a valid Excel file (.xlsx or .xls)', 'error')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleImportSubmit = async () => {
    if (!selectedFile) {
      showAlert('Please select a file to import', 'error')
      return
    }

    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('user_id', user?.userID?.toString() || '0')
      formData.append('user_name', msLoginUser?.name || 'System')

      const response = await axios.post('/api/logistics/importAddresses', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      showAlert(`Import successful! Imported: ${response.data.imported_count}, Updated: ${response.data.updated_count}`, 'success')

      // Clear cache and force refresh
      localStorage.removeItem(STORAGE_KEY)
      await fetchAddresses(true)

      // Close modal and reset
      setSelectedFile(null)
      onImportClose()
    } catch (error: any) {
      console.error('Failed to import addresses:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to import addresses. Please try again.'
      showAlert(errorMessage, 'error')
    } finally {
      setIsImporting(false)
    }
  }

  // Helper component for sortable column headers
  const SortableHeader = ({ columnKey, label, className = '' }: { columnKey: keyof AddressListData; label: string; className?: string }) => (
    <div
      className={`flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors ${className}`}
      onClick={() => handleSort(columnKey)}
    >
      <span>{label}</span>
      {sortConfig.key === columnKey && (
        <Icon
          icon={sortConfig.direction === 'asc' ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          width={16}
        />
      )}
    </div>
  )

  return (
    <div>
      {/* Alert Toast */}
      {alertMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
          <Card
            className={`min-w-[300px] max-w-md shadow-lg ${
              alertMessage.type === 'success'
                ? 'border-l-4 border-success bg-success-50'
                : 'border-l-4 border-danger bg-danger-50'
            }`}
          >
            <CardBody className="flex flex-row items-start gap-3 p-4">
              <Icon
                icon={
                  alertMessage.type === 'success'
                    ? 'solar:check-circle-bold'
                    : 'solar:close-circle-bold'
                }
                className={alertMessage.type === 'success' ? 'text-success' : 'text-danger'}
                width={24}
              />
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  alertMessage.type === 'success' ? 'text-success-800' : 'text-danger-800'
                }`}>
                  {alertMessage.type === 'success' ? 'Success' : 'Error'}
                </p>
                <p className={`text-sm ${
                  alertMessage.type === 'success' ? 'text-success-700' : 'text-danger-700'
                }`}>
                  {alertMessage.message}
                </p>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={() => setAlertMessage(null)}
              >
                <Icon icon="solar:close-square-bold" width={18} />
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2 items-center">
              <h1 className="text-2xl font-bold">New Address List</h1>
              <Button
                color="primary"
                size="sm"
                onPress={handleCreateNew}
                startContent={<Icon icon="solar:add-circle-bold" />}
              >
                Create New
              </Button>
              <Button
                color="primary"
                variant="flat"
                size="sm"
                onPress={handleForceRefresh}
                isLoading={isLoading}
                startContent={!isLoading && <Icon icon="solar:refresh-bold" />}
              >
                Refresh
              </Button>
              <Button
                color="success"
                variant="flat"
                size="sm"
                onPress={handleExportAll}
                isLoading={isExportingAll}
                startContent={!isExportingAll && <Icon icon="solar:download-minimalistic-bold" />}
              >
                Export All
              </Button>
              <Button
                color="secondary"
                variant="flat"
                size="sm"
                onPress={handleExportTemplate}
                isLoading={isExportingTemplate}
                startContent={!isExportingTemplate && <Icon icon="solar:document-add-bold" />}
              >
                Export Template
              </Button>
              <Button
                color="warning"
                variant="flat"
                size="sm"
                onPress={onImportOpen}
                startContent={<Icon icon="solar:upload-minimalistic-bold" />}
              >
                Import
              </Button>
            </div>
            <Input
              placeholder="Search by company, city, contact..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="solar:magnifer-bold" />}
              variant="bordered"
              className="max-w-md"
              isClearable
              onClear={() => setSearchQuery('')}
            />
            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'solid' : 'flat'}
                color={statusFilter === 'all' ? 'primary' : 'default'}
                onPress={() => handleStatusFilterChange('all')}
              >
                All ({allAddresses.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'active' ? 'solid' : 'flat'}
                color={statusFilter === 'active' ? 'success' : 'default'}
                onPress={() => handleStatusFilterChange('active')}
              >
                Active ({activeAddresses.length})
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'inactive' ? 'solid' : 'flat'}
                color={statusFilter === 'inactive' ? 'danger' : 'default'}
                onPress={() => handleStatusFilterChange('inactive')}
              >
                Inactive ({inactiveAddresses.length})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardBody className="overflow-visible p-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" label="Loading addresses..." />
            </div>
          ) : (
            <>
              <Table
                aria-label="Address list table"
                classNames={{
                  wrapper: "min-h-[400px]",
                  table: "min-w-full",
                }}
                isStriped
              >
                <TableHeader>
                  <TableColumn className="w-16">
                    <SortableHeader columnKey="addressID" label="No." />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader columnKey="CardCode" label="CODE" />
                  </TableColumn>
                  <TableColumn className="min-w-[250px]">
                    <SortableHeader columnKey="company_name" label="COMPANY" />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader columnKey="country" label="COUNTRY" />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader columnKey="CardType" label="TYPE" />
                  </TableColumn>
                  <TableColumn className="min-w-[300px]">
                    <SortableHeader columnKey="full_address" label="ADDRESS" />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader columnKey="contact_name" label="CONTACT" />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader columnKey="bind_incoterms" label="BIND INCOTERMS" />
                  </TableColumn>
                  <TableColumn className="w-40">
                    <SortableHeader columnKey="phone" label="PHONE" />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader columnKey="active" label="STATUS" />
                  </TableColumn>
                </TableHeader>
                <TableBody emptyContent="No addresses found">
                  {currentItems.map((address, index) => (
                    <TableRow
                      key={address.addressID}
                      onClick={() => handleViewDetail(address.addressID)}
                      className="cursor-pointer hover:bg-yellow-100 transition-colors"
                    >
                      <TableCell>
                        <span className="text-sm font-medium text-default-600">
                          {startIndex + index + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600">
                          {address.CardCode || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {address.company_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {address.country}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={address.CardType === 'S' ? 'primary' : 'secondary'}>
                          {address.CardType}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600 line-clamp-2">
                          {address.full_address || `${address.street1}, ${address.city}, ${address.state} ${address.postal_code}`}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600">
                          {address.contact_name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600">
                          {address.bind_incoterms?.toUpperCase() || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-default-600">
                          {address.phone || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={address.active === '1' ? 'success' : 'danger'}
                        >
                          {address.active === '1' ? 'Active' : 'Inactive'}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex justify-center py-4">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                    showShadow
                    color="primary"
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            Create New Address
          </ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Card Code"
                value={formData.CardCode}
                onValueChange={(value) => setFormData({ ...formData, CardCode: value })}
              />
              <Input
                label="Company Name"
                isRequired
                value={formData.company_name}
                onValueChange={(value) => setFormData({ ...formData, company_name: value })}
                isInvalid={!!formErrors.company_name}
                errorMessage={formErrors.company_name}
              />
              <Select
                label="Card Type"
                isRequired
                selectedKeys={[formData.CardType]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string
                  setFormData({ ...formData, CardType: value })
                }}
              >
                <SelectItem key="S" value="S">S</SelectItem>
                <SelectItem key="C" value="C">C</SelectItem>
              </Select>
              <Input
                label="Street 1"
                isRequired
                value={formData.street1}
                onValueChange={(value) => setFormData({ ...formData, street1: value })}
                isInvalid={!!formErrors.street1}
                errorMessage={formErrors.street1}
              />
              <Input
                label="Street 2"
                value={formData.street2}
                onValueChange={(value) => setFormData({ ...formData, street2: value })}
              />
              <Input
                label="Street 3"
                value={formData.street3}
                onValueChange={(value) => setFormData({ ...formData, street3: value })}
              />
              <Input
                label="City"
                isRequired
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                isInvalid={!!formErrors.city}
                errorMessage={formErrors.city}
              />
              <Input
                label="State"
                isRequired
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
                isInvalid={!!formErrors.state}
                errorMessage={formErrors.state}
              />
              <Autocomplete
                label="Country"
                isRequired
                selectedKey={formData.country}
                onSelectionChange={(key) => {
                  if (key) {
                    const countryCode = key.toString()
                    // Automatically set postal code for Hong Kong
                    if (countryCode === 'HK') {
                      setFormData({ ...formData, country: countryCode, postal_code: '00000' })
                    } else {
                      setFormData({ ...formData, country: countryCode })
                    }
                  }
                }}
              >
                {ISO_2_COUNTRIES.map((country) => (
                  <AutocompleteItem key={country.key} value={country.key}>
                    {country.value}
                  </AutocompleteItem>
                ))}
              </Autocomplete>
              <Input
                label="Postal Code"
                isRequired
                value={formData.postal_code}
                onValueChange={(value) => setFormData({ ...formData, postal_code: value })}
                isInvalid={!!formErrors.postal_code}
                errorMessage={formErrors.postal_code}
              />
              <Input
                label="Contact Name"
                isRequired
                value={formData.contact_name}
                onValueChange={(value) => setFormData({ ...formData, contact_name: value })}
                isInvalid={!!formErrors.contact_name}
                errorMessage={formErrors.contact_name}
              />
              <Input
                label="Contact"
                value={formData.contact}
                onValueChange={(value) => setFormData({ ...formData, contact: value })}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onValueChange={(value) => setFormData({ ...formData, phone: value })}
                isInvalid={!!formErrors.phone}
                errorMessage={formErrors.phone}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onValueChange={(value) => setFormData({ ...formData, email: value })}
              />
              <Input
                label="Tax ID"
                value={formData.tax_id}
                onValueChange={(value) => setFormData({ ...formData, tax_id: value })}
              />
              <Input
                label="Phone 1"
                value={formData.phone1}
                onValueChange={(value) => setFormData({ ...formData, phone1: value })}
                isInvalid={!!formErrors.phone1}
                errorMessage={formErrors.phone1}
              />
              <Input
                label="Website"
                value={formData.website}
                onValueChange={(value) => setFormData({ ...formData, website: value })}
              />
              <Input
                label="EORI Number"
                value={formData.eori_number}
                onValueChange={(value) => setFormData({ ...formData, eori_number: value })}
              />
              <Input
                label="Bind Incoterms"
                value={formData.bind_incoterms}
                onValueChange={(value) => setFormData({ ...formData, bind_incoterms: value })}
              />
              <Input
                label="Full Address (Auto-generated)"
                value={fullAddress}
                isReadOnly
                className="col-span-2"
                description="This field is automatically generated from the address fields above"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" onPress={onClose} isDisabled={isCreating}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              isLoading={isCreating}
            >
              {isCreating ? 'Creating New Address...' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportOpen} onClose={onImportClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            Import Addresses from Excel
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
                <div className="flex items-start gap-2">
                  <Icon icon="solar:info-circle-bold" className="text-warning-600 mt-0.5" width={20} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warning-800">Important Instructions:</p>
                    <ul className="text-sm text-warning-700 mt-2 list-disc list-inside space-y-1">
                      <li>Download the template first using "Export Template" button</li>
                      <li>Fill in the required fields: Card Code, Company Name</li>
                      <li>File must be in .xlsx or .xls format</li>
                      <li>Existing addresses (matching Card Code) will be updated</li>
                      <li>New addresses will be created automatically</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border-2 border-dashed border-default-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Icon icon="solar:cloud-upload-bold-duotone" width={48} className="text-primary" />
                  <span className="text-sm font-medium">
                    {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                  </span>
                  <span className="text-xs text-default-400">
                    Supported formats: .xlsx, .xls (Max 10MB)
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:file-check-bold" className="text-success-600" width={20} />
                    <span className="text-sm font-medium text-success-800">{selectedFile.name}</span>
                    <span className="text-xs text-success-600">
                      ({(selectedFile.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() => setSelectedFile(null)}
                    startContent={<Icon icon="solar:trash-bin-minimalistic-bold" />}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              onPress={() => {
                setSelectedFile(null)
                onImportClose()
              }}
              isDisabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              color="warning"
              onPress={handleImportSubmit}
              isLoading={isImporting}
              isDisabled={!selectedFile}
            >
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AddressList
