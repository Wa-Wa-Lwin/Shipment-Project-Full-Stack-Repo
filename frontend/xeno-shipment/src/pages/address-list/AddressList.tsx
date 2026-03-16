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
  useDisclosure
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import type { AddressListData } from './types'
import { useAuth } from '@context/AuthContext'
import { useAlert } from './hooks/useAlert'
import { addressService } from './services/addressService'
import {
  AlertModal,
  SortableHeader,
  AddressCreateModal,
  AddressImportModal,
  ImportValidationErrorModal
} from './components'

const STORAGE_KEY = 'address_list_cache'

const AddressList = () => {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure()
  const { isOpen: isValidationErrorOpen, onOpen: onValidationErrorOpen, onClose: onValidationErrorClose } = useDisclosure()
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
  const [importValidationError, setImportValidationError] = useState<{
    message: string
    missingColumns?: string[]
    requiredColumns?: string[]
  } | null>(null)
  const { user, msLoginUser } = useAuth()
  const { alertMessage, isAlertOpen, showAlert, closeAlert } = useAlert()
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

  const itemsPerPage = 15

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

  const fetchAddresses = async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          setAllAddresses(cachedData.all_address_list || [])
          setActiveAddresses(cachedData.all_active_address_list || [])
          setInactiveAddresses(cachedData.all_inactive_address_list || [])

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

        if (statusFilter === 'active') {
          setAddresses(activeData)
        } else if (statusFilter === 'inactive') {
          setAddresses(inactiveData)
        } else {
          setAddresses(allData)
        }

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
        return {
          key,
          direction: currentConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      return { key, direction: 'asc' }
    })
  }

  const sortedAddresses = useMemo(() => {
    if (!sortConfig.key) {
      return filteredAddresses
    }

    const sorted = [...filteredAddresses].sort((a, b) => {
      const aValue = a[sortConfig.key!]
      const bValue = b[sortConfig.key!]

      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1

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

      localStorage.removeItem(STORAGE_KEY)
      onClose()
      setFormErrors({})
      await fetchAddresses(true)
    } catch (error: any) {
      console.error('Failed to save address:', error)

      if (error.response?.status === 422 && error.response?.data?.errors) {
        const backendErrors: Record<string, string> = {}
        Object.keys(error.response.data.errors).forEach(key => {
          backendErrors[key] = error.response.data.errors[key][0]
        })
        setFormErrors(backendErrors)
      } else {
        showAlert('Failed to create address. Please try again.', 'error')
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleExportAll = async () => {
    setIsExportingAll(true)
    try {
      const blob = await addressService.exportAll()
      addressService.downloadFile(blob, `address_list_${new Date().toISOString().split('T')[0]}.xlsx`)
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
      const blob = await addressService.exportTemplate()
      addressService.downloadFile(blob, `address_list_template_${new Date().toISOString().split('T')[0]}.xlsx`)
      showAlert('Template exported successfully!', 'success')
    } catch (error) {
      console.error('Failed to export template:', error)
      showAlert('Failed to export template. Please try again.', 'error')
    } finally {
      setIsExportingTemplate(false)
    }
  }

  const handleImport = async (file: File) => {
    setIsImporting(true)
    setImportValidationError(null) // Clear previous validation errors

    try {
      const response = await addressService.importAddresses(
        file,
        user?.userID || 0,
        msLoginUser?.name || 'System'
      )

      showAlert(`Import successful! Imported: ${response.imported_count}, Updated: ${response.updated_count}`, 'success')

      localStorage.removeItem(STORAGE_KEY)
      await fetchAddresses(true)
      setImportValidationError(null)
      onImportClose()
    } catch (error: any) {
      console.error('Failed to import addresses:', error)

      // Check if this is a column validation error (422 status)
      if (error.response?.status === 422 && error.response?.data?.missing_columns) {
        setImportValidationError({
          message: error.response.data.message || 'Import file is missing required columns',
          missingColumns: error.response.data.missing_columns,
          requiredColumns: error.response.data.required_columns
        })
        // Open the centered error modal (import modal stays open in background)
        onValidationErrorOpen()
      } else {
        // Other errors - show alert
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to import addresses. Please try again.'
        showAlert(errorMessage, 'error')
      }
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div>
      {/* Alert Modal */}
      {alertMessage && (
        <AlertModal
          isOpen={isAlertOpen}
          onClose={closeAlert}
          message={alertMessage.message}
          type={alertMessage.type}
        />
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
                    <SortableHeader
                      columnKey="addressID"
                      label="No."
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader
                      columnKey="CardCode"
                      label="CODE"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="min-w-[250px]">
                    <SortableHeader
                      columnKey="company_name"
                      label="COMPANY"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader
                      columnKey="country"
                      label="COUNTRY"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader
                      columnKey="CardType"
                      label="TYPE"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="min-w-[300px]">
                    <SortableHeader
                      columnKey="full_address"
                      label="ADDRESS"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader
                      columnKey="contact_name"
                      label="CONTACT"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-32">
                    <SortableHeader
                      columnKey="bind_incoterms"
                      label="BIND INCOTERMS"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-40">
                    <SortableHeader
                      columnKey="phone"
                      label="PHONE"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
                  </TableColumn>
                  <TableColumn className="w-24">
                    <SortableHeader
                      columnKey="active"
                      label="STATUS"
                      currentSortKey={sortConfig.key}
                      sortDirection={sortConfig.direction}
                      onSort={handleSort}
                    />
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
      <AddressCreateModal
        isOpen={isOpen}
        onClose={onClose}
        formData={formData}
        setFormData={setFormData}
        formErrors={formErrors}
        onSubmit={handleSubmit}
        isCreating={isCreating}
      />

      {/* Import Modal */}
      <AddressImportModal
        isOpen={isImportOpen}
        onClose={() => {
          setImportValidationError(null)
          onImportClose()
        }}
        onImport={handleImport}
        isImporting={isImporting}
      />

      {/* Validation Error Modal - Centered on screen, top layer */}
      {importValidationError && (
        <ImportValidationErrorModal
          isOpen={isValidationErrorOpen}
          onClose={() => {
            onValidationErrorClose()
            setImportValidationError(null)
          }}
          validationError={importValidationError}
        />
      )}
    </div>
  )
}

export default AddressList
