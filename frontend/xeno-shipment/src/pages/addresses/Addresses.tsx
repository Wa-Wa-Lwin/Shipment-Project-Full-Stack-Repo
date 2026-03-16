import { useState, useEffect } from 'react'
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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Divider
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import type { AddressData } from './types'

const Addresses = () => {
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<AddressData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null)
  const itemsPerPage = 15
  const STORAGE_KEY = 'addresses_data'

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

  useEffect(() => {
    fetchAddresses()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAddresses(addresses)
    } else {
      const filtered = addresses.filter(address =>
        address.CardCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.CardName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.City?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.Country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.E_Mail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.CntctPrsn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.Phone1?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        address.TaxID?.toLowerCase().includes(searchQuery.toLowerCase()) 
      )
      setFilteredAddresses(filtered)
    }
    setCurrentPage(1)
  }, [searchQuery, addresses])

  // Pagination calculations
  const totalPages = Math.ceil(filteredAddresses.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAddresses.slice(startIndex, endIndex)

  const getCardTypeInfo = (type: string) => {
    switch (type) {
      case 'C':
        return { label: 'Customer', color: 'primary' as const, icon: 'solar:user-bold' }
      case 'S':
        return { label: 'Supplier', color: 'secondary' as const, icon: 'solar:shop-bold' }
      default:
        return { label: 'Other', color: 'default' as const, icon: 'solar:buildings-bold' }
    }
  }

  const formatAddress = (address: AddressData) => {
    const parts = [
      address.StreetNo || address.MailStrNo,
      address.Address || address.MailAddres,
      address.Building || address.MailBuildi,
      address.City || address.MailCity,
      address.ZipCode || address.MailZipCod
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(', ') : 'No address available'
  }

  const handleAddressClick = (address: AddressData) => {
    setSelectedAddress(address)
    setIsDetailModalOpen(true)
  }

  return (
    <div>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4 pb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">Addresses & Contacts</h1>
                <Button
                  size="sm"
                  variant="flat"
                  color="primary"
                  onPress={() => fetchAddresses(true)}
                  isLoading={isLoading}
                  startContent={!isLoading && <Icon icon="solar:refresh-bold" />}
                >
                  {isLoading ? 'Refreshing...' : 'Refresh'}
                </Button>
              </div>
              <p className="text-small text-default-600">
                {filteredAddresses.length} addresses found
              </p>
            </div>
            {/* Search Bar */}
            <Input
              placeholder="Search by name, code, city, email, contact..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="solar:magnifer-bold" />}
              variant="bordered"
              className="max-w-md"
              isClearable
              onClear={() => setSearchQuery('')}
            />
            <div className="flex gap-2">
              <Chip color="primary" variant="flat">
                Customers: {addresses.filter(a => a.CardType === 'C').length}
              </Chip>
              <Chip color="secondary" variant="flat">
                Suppliers: {addresses.filter(a => a.CardType === 'S').length}
              </Chip>
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
                aria-label="Addresses table"
                classNames={{
                  wrapper: "min-h-[400px]",
                  table: "min-w-full",
                }}
                isStriped
                selectionMode="single"
              >
                <TableHeader>
                  <TableColumn className="w-16">No.</TableColumn>
                  <TableColumn className="w-32">CODE</TableColumn>
                  <TableColumn className="w-20">TYPE</TableColumn>
                  <TableColumn className="min-w-[250px]">COMPANY NAME</TableColumn>
                  <TableColumn className="min-w-[300px]">ADDRESS</TableColumn>
                  <TableColumn className="w-24">COUNTRY</TableColumn>
                  <TableColumn className="w-20">CURRENCY</TableColumn>
                  <TableColumn className="min-w-[180px]">CONTACT PERSON</TableColumn>
                  <TableColumn className="min-w-[200px]">EMAIL</TableColumn>
                  <TableColumn className="min-w-[150px]">PHONE</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No addresses found">
                  {currentItems.map((address, index) => {
                    const typeInfo = getCardTypeInfo(address.CardType)
                    return (
                      <TableRow
                        key={address.CardCode}
                        className="cursor-pointer hover:bg-default-100 transition-colors"
                        onClick={() => handleAddressClick(address)}
                      >
                        <TableCell>
                          <span className="text-sm font-medium text-default-600">
                            {startIndex + index + 1}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary text-sm">
                            {address.CardCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            variant="flat"
                            color={typeInfo.color}
                            startContent={<Icon icon={typeInfo.icon} width={14} />}
                          >
                            {typeInfo.label}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col max-w-[250px]">
                            <span className="text-sm font-medium text-foreground truncate">
                              {address.CardName}
                            </span>
                            {address.BillToDef && address.BillToDef !== address.CardName && (
                              <span className="text-tiny text-default-500 truncate">
                                Bill to: {address.BillToDef}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col max-w-[300px]">
                            <span className="text-sm text-default-600 truncate">
                              {formatAddress(address)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-default-600">
                              {address.Country || address.MailCountr || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" variant="bordered" color="warning">
                            {address.Currency || 'N/A'}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-default-600">
                            {address.CntctPrsn || 'Not specified'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {address.E_Mail ? (
                            <div className="flex items-center gap-2">
                              <Icon icon="solar:letter-bold" className="text-default-400" width={14} />
                              <span className="text-sm text-default-600 truncate max-w-[180px]">
                                {address.E_Mail}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-default-400">No email</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {address.Phone1 ? (
                            <div className="flex items-center gap-2">
                              <Icon icon="solar:phone-bold" className="text-default-400" width={14} />
                              <span className="text-sm text-default-600">
                                {address.Phone1}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-default-400">No phone</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
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

      {/* Address Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <Icon icon="solar:buildings-bold" className="text-primary" width={24} />
                  <div>
                    <h3 className="text-xl font-bold">{selectedAddress?.CardName}</h3>
                    <p className="text-small text-default-600">Address Details - {selectedAddress?.CardCode}</p>
                  </div>
                </div>
              </ModalHeader>
              <ModalBody>
                {selectedAddress && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <Card className="shadow-none border">
                      <CardHeader>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Icon icon="solar:info-circle-bold" className="text-primary" width={20} />
                          Basic Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-default-700">Card Code</label>
                            <p className="text-sm text-default-600 font-mono bg-default-100 px-2 py-1 rounded">
                              {selectedAddress.CardCode}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-default-700">Card Type</label>
                            <div className="mt-1">
                              {(() => {
                                const typeInfo = getCardTypeInfo(selectedAddress.CardType)
                                return (
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    color={typeInfo.color}
                                    startContent={<Icon icon={typeInfo.icon} width={14} />}
                                  >
                                    {typeInfo.label}
                                  </Chip>
                                )
                              })()}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-default-700">Company Name</label>
                            <p className="text-sm text-default-600">{selectedAddress.CardName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-default-700">Currency</label>
                            <div className="mt-1">
                              <Chip size="sm" variant="bordered" color="warning">
                                {selectedAddress.Currency || 'Not specified'}
                              </Chip>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-default-700">Country</label>
                            <p className="text-sm text-default-600">
                              {selectedAddress.Country || selectedAddress.MailCountr || 'Not specified'}
                            </p>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Contact Information */}
                    <Card className="shadow-none border">
                      <CardHeader>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Icon icon="solar:user-bold" className="text-secondary" width={20} />
                          Contact Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-default-700">Contact Person</label>
                            <p className="text-sm text-default-600">
                              {selectedAddress.CntctPrsn || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-default-700">Phone</label>
                            <div className="flex items-center gap-2">
                              {selectedAddress.Phone1 ? (
                                <>
                                  <Icon icon="solar:phone-bold" className="text-success" width={16} />
                                  <p className="text-sm text-default-600">{selectedAddress.Phone1}</p>
                                </>
                              ) : (
                                <p className="text-sm text-default-400">Not provided</p>
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-default-700">Email</label>
                            <div className="flex items-center gap-2">
                              {selectedAddress.E_Mail ? (
                                <>
                                  <Icon icon="solar:letter-bold" className="text-primary" width={16} />
                                  <p className="text-sm text-default-600">{selectedAddress.E_Mail}</p>
                                </>
                              ) : (
                                <p className="text-sm text-default-400">Not provided</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Address Information */}
                    <Card className="shadow-none border">
                      <CardHeader>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Icon icon="solar:map-point-bold" className="text-warning" width={20} />
                          Address Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-4">
                        {/* Primary Address */}
                        <div>
                          <h5 className="text-md font-medium text-default-800 mb-2">Primary Address</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-primary">
                            <div>
                              <label className="text-sm font-medium text-default-700">Street Number</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.StreetNo || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Building</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.Building || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Address</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.Address || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">City</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.City || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">County</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.County || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Zip Code</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.ZipCode || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Divider />

                        {/* Mail Address */}
                        <div>
                          <h5 className="text-md font-medium text-default-800 mb-2">Mail Address</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-secondary">
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail Street Number</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailStrNo || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail Building</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailBuildi || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail Address</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailAddres || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail City</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailCity || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail County</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailCounty || 'Not provided'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-default-700">Mail Zip Code</label>
                              <p className="text-sm text-default-600">
                                {selectedAddress.MailZipCod || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>

                    {/* Billing Information */}
                    <Card className="shadow-none border">
                      <CardHeader>
                        <h4 className="text-lg font-semibold flex items-center gap-2">
                          <Icon icon="solar:bill-list-bold" className="text-success" width={20} />
                          Billing & Shipping Information
                        </h4>
                      </CardHeader>
                      <CardBody className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-default-700">Bill To Default</label>
                            <p className="text-sm text-default-600">
                              {selectedAddress.BillToDef || 'Not specified'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-default-700">Ship To Default</label>
                            <p className="text-sm text-default-600">
                              {selectedAddress.ShipToDef || 'Not specified'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-default-700">TaxID</label>
                          <p className="text-sm text-default-600">
                            {selectedAddress.TaxID || 'Not specified'}
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default Addresses