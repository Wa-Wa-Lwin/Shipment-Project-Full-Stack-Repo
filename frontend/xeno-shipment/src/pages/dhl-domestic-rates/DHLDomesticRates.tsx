import { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Spinner,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { dhlRatesApi } from './api/dhlRatesApi'
import type { DHLDomesticRate, CreateDHLDomesticRate } from './types'

export default function DHLDomesticRates() {
  const [rates, setRates] = useState<DHLDomesticRate[]>([])
  const [filteredRates, setFilteredRates] = useState<DHLDomesticRate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const { isOpen: isAddEditOpen, onOpen: onAddEditOpen, onClose: onAddEditClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()

  // Form states
  const [editingRate, setEditingRate] = useState<DHLDomesticRate | null>(null)
  const [deletingRate, setDeletingRate] = useState<DHLDomesticRate | null>(null)
  // Default values for form
  const defaultFormData: CreateDHLDomesticRate = {
    min_weight_kg: 0,
    max_weight_kg: 0,
    bkk_charge_thb: 0,
    upc_charge_thb: 0,
  };

  // Form states
  const [formData, setFormData] = useState<CreateDHLDomesticRate>(defaultFormData);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchRates()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRates(rates)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = rates.filter(
        (rate) =>
          rate.min_weight_kg.toString().includes(query) ||
          rate.max_weight_kg.toString().includes(query) ||
          rate.bkk_charge_thb.toString().includes(query) ||
          rate.upc_charge_thb.toString().includes(query)
      )
      setFilteredRates(filtered)
    }
  }, [searchQuery, rates])

  const fetchRates = async () => {
    try {
      setIsLoading(true)
      const data = await dhlRatesApi.getAllRates()
      // Sort by min_weight_kg ascending
      const sortedData = data.sort((a, b) => a.min_weight_kg - b.min_weight_kg)
      setRates(sortedData)
      setFilteredRates(sortedData)
    } catch (error) {
      console.error('Failed to fetch DHL domestic rates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingRate(null)
    setFormData({
      min_weight_kg: 0,
      max_weight_kg: 0,
      bkk_charge_thb: 0,
      upc_charge_thb: 0,
    })
    setFormErrors({})
    onAddEditOpen()
  }

  const handleEdit = (rate: DHLDomesticRate) => {
    setEditingRate(rate)
    setFormData({
      min_weight_kg: rate.min_weight_kg,
      max_weight_kg: rate.max_weight_kg,
      bkk_charge_thb: rate.bkk_charge_thb,
      upc_charge_thb: rate.upc_charge_thb,
    })
    setFormErrors({})
    onAddEditOpen()
  }

  const handleDelete = (rate: DHLDomesticRate) => {
    setDeletingRate(rate)
    onDeleteOpen()
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (formData.min_weight_kg < 0) {
      errors.min_weight_kg = 'Min weight must be 0 or greater'
    }
    if (formData.max_weight_kg <= formData.min_weight_kg) {
      errors.max_weight_kg = 'Max weight must be greater than min weight'
    }
    if (formData.bkk_charge_thb < 0) {
      errors.bkk_charge_thb = 'BKK charge must be 0 or greater'
    }
    if (formData.upc_charge_thb < 0) {
      errors.upc_charge_thb = 'UPC charge must be 0 or greater'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      setIsSubmitting(true)
      if (editingRate) {
        await dhlRatesApi.updateRate(editingRate.dhlEcommerceDomesticRateListID, formData)
      } else {
        await dhlRatesApi.createRate(formData)
      }
      await fetchRates()
      onAddEditClose()
    } catch (error) {
      console.error('Failed to save rate:', error)
      alert('Failed to save rate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    if (!deletingRate) return

    try {
      setIsSubmitting(true)
      await dhlRatesApi.deleteRate(deletingRate.dhlEcommerceDomesticRateListID)
      await fetchRates()
      onDeleteClose()
    } catch (error) {
      console.error('Failed to delete rate:', error)
      alert('Failed to delete rate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
    }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">DHL eCommerce Domestic Rates</h1>
          <p className="text-sm text-default-500">
            Manage shipping rates for domestic DHL eCommerce deliveries
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="solar:add-circle-linear" width={20} />}
          onPress={handleAddNew}
        >
          Add New Rate
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex justify-between items-center gap-4">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="Search by weight or charge..."
          startContent={<Icon icon="solar:magnifer-linear" width={20} />}
          value={searchQuery}
          onClear={() => setSearchQuery('')}
          onValueChange={setSearchQuery}
        />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-default-500">
            Total: {filteredRates.length} rate tiers
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={fetchRates}
            disabled={isLoading}
          >
            <Icon icon="solar:refresh-linear" width={18} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg max-h-[600px] overflow-y-auto relative">
        <Table
          aria-label="DHL Domestic Rates table"
          isHeaderSticky
          classNames={{
            wrapper: 'min-h-[400px]',
          }}
        >
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableColumn align="center">No.</TableColumn>
            <TableColumn>MIN WEIGHT (KG)</TableColumn>
            <TableColumn>MAX WEIGHT (KG)</TableColumn>
            <TableColumn>BKK CHARGE (THB)</TableColumn>
            <TableColumn>UPC CHARGE (THB)</TableColumn>
            <TableColumn align="center">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            items={filteredRates.map((item, idx) => ({ ...item, _index: idx + 1 }))}
            isLoading={isLoading}
            loadingContent={<Spinner label="Loading rates..." />}
            emptyContent={
              <div className="text-center py-8">
                <Icon
                  icon="solar:box-linear"
                  className="mx-auto mb-2 text-default-400"
                  width={48}
                />
                <p className="text-default-500">No rates found</p>
              </div>
            }
          >
            {(item) => (
              <TableRow key={item.dhlEcommerceDomesticRateListID}>
                <TableCell align="center">{item._index}</TableCell> 
                <TableCell>{item.min_weight_kg != null ? Number(item.min_weight_kg).toFixed(3) : '0.000'} kg</TableCell>
                <TableCell>{item.max_weight_kg != null ? Number(item.max_weight_kg).toFixed(3) : '0.000'} kg</TableCell>
                <TableCell>{formatCurrency(item.bkk_charge_thb)}</TableCell>
                <TableCell>{formatCurrency(item.upc_charge_thb)}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleEdit(item)}
                    >
                      <Icon icon="solar:pen-linear" width={18} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      color="danger"
                      onPress={() => handleDelete(item)}
                    >
                      <Icon icon="solar:trash-bin-trash-linear" width={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={onAddEditClose}
        size="lg"
        isDismissable={!isSubmitting}
      >
        <ModalContent>
          <ModalHeader>
            {editingRate ? 'Edit Rate' : 'Add New Rate'}
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Weight (kg)"
                  type="number"
                  step="0.01"
                  value={formData.min_weight_kg.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, min_weight_kg: parseFloat(e.target.value) || 0 })
                  }
                  errorMessage={formErrors.min_weight_kg}
                  isInvalid={!!formErrors.min_weight_kg}
                  isRequired
                />
                <Input
                  label="Max Weight (kg)"
                  type="number"
                  step="0.01"
                  value={formData.max_weight_kg.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, max_weight_kg: parseFloat(e.target.value) || 0 })
                  }
                  errorMessage={formErrors.max_weight_kg}
                  isInvalid={!!formErrors.max_weight_kg}
                  isRequired
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="BKK Charge (THB)"
                  type="number"
                  step="1"
                  value={formData.bkk_charge_thb.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, bkk_charge_thb: parseInt(e.target.value) || 0 })
                  }
                  errorMessage={formErrors.bkk_charge_thb}
                  isInvalid={!!formErrors.bkk_charge_thb}
                  isRequired
                />
                <Input
                  label="UPC Charge (THB)"
                  type="number"
                  step="1"
                  value={formData.upc_charge_thb.toString()}
                  onChange={(e) =>
                    setFormData({ ...formData, upc_charge_thb: parseInt(e.target.value) || 0 })
                  }
                  errorMessage={formErrors.upc_charge_thb}
                  isInvalid={!!formErrors.upc_charge_thb}
                  isRequired
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="flat"
              onPress={onAddEditClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSubmit}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              {editingRate ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        size="sm"
        isDismissable={!isSubmitting}
      >
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete this rate tier?
            </p>
            {deletingRate && (
              <div className="mt-2 p-3 bg-default-100 rounded-lg">
                <p className="text-sm">
                  <strong>Weight Range:</strong> {deletingRate.min_weight_kg} kg - {deletingRate.max_weight_kg} kg
                </p>
                <p className="text-sm">
                  <strong>BKK Charge:</strong> {formatCurrency(deletingRate.bkk_charge_thb)}
                </p>
                <p className="text-sm">
                  <strong>UPC Charge:</strong> {formatCurrency(deletingRate.upc_charge_thb)}
                </p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              variant="flat"
              onPress={onDeleteClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={confirmDelete}
              disabled={isSubmitting}
              isLoading={isSubmitting}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
