import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Button,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import type { AddressListData } from './types'
import { useAuth } from '@context/AuthContext'
import { ISO_2_COUNTRIES } from '@pages/shipment/constants/iso2countries'

const AddressListDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [address, setAddress] = useState<AddressListData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure()
  const { isOpen: isInactiveOrActiveOpen, onOpen: onInactiveOrActiveOpen, onClose: onInactiveOrActiveClose } = useDisclosure()
  const { user, msLoginUser } = useAuth();

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

  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({})

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

  const fetchAddressDetail = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_APP_NEW_ADDRESS_LIST_GET_ONE}/${id}`)
      if (response.data?.status === 'success' && response.data?.address) {
        setAddress(response.data.address)
      }
    } catch (error) {
      console.error('Failed to fetch address details:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchAddressDetail()
    }
  }, [id])

  const handleEdit = () => {
    if (!address) return
    setFormData({
      CardCode: address.CardCode || '',
      company_name: address.company_name,
      CardType: address.CardType,
      street1: address.street1,
      street2: address.street2 || '',
      street3: address.street3 || '',
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      contact_name: address.contact_name,
      contact: address.contact || '',
      phone: address.phone || '',
      email: address.email || '',
      tax_id: address.tax_id || '',
      phone1: address.phone1 || '',
      website: address.website || '',
      eori_number: address.eori_number || '',
      bind_incoterms: address.bind_incoterms || '',      
    })
    setValidationErrors({}) // Clear any previous validation errors
    onEditOpen()
  }

  const handleSubmit = async () => {
    if (!address) return
    setIsSubmitting(true)
    setValidationErrors({})

    try {
      const payload = {
        ...formData,
        full_address: fullAddress,
        active: 1,
        updated_userID: user?.userID,
        updated_user_name: msLoginUser?.name
      }

      const response = await axios.post(
        `${import.meta.env.VITE_APP_NEW_ADDRESS_LIST_UPDATE}/${address.addressID}`,
        payload
      )

      // ✅ If success
      if (response.data?.status === 'success') {
        localStorage.removeItem('address_list_cache')
        onEditClose()
        fetchAddressDetail()
      }
    } catch (error: any) {
      console.error('Failed to update address:', error)

      // ✅ Handle validation errors without refreshing
      if (error.response?.data?.errors) {
        setValidationErrors(error.response.data.errors)
      } else if (error.response?.data?.message) {
        alert(error.response.data.message) // optional UX improvement
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmInactivate = async () => {
    if (!address) return
    setIsLoading(true)
    try {
      await axios.post(`${import.meta.env.VITE_APP_NEW_ADDRESS_LIST_INACTIVE_OR_ACTIVE}/${address.addressID}`, {
        updated_userID: user?.userID,
        updated_user_name: msLoginUser?.name
      })

      // Clear cache to force refresh on list page
      localStorage.removeItem('address_list_cache')

      onInactiveOrActiveClose()

      // Refresh the address detail to show updated status
      fetchAddressDetail()
    } catch (error) {
      console.error('Failed to inactivate address:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" label="Loading address details..." />
      </div>
    )
  }

  if (!address) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Icon icon="solar:sad-circle-bold" className="text-6xl text-danger" />
        <h2 className="text-2xl font-bold">Address Not Found</h2>
        <Button color="primary" onPress={() => navigate('/local/address-list')}>
          Back to Address List
        </Button>
      </div>
    )
  }

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="grid grid-cols-3 gap-4 py-2">
      <div className="text-sm font-semibold text-default-600">{label}</div>
      <div className="col-span-2 text-sm">{value || '-'}</div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 max-w-full">
      <div className="flex items-center gap-4 mb-6">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate('/local/address-list')}
        >
          <Icon icon="solar:arrow-left-bold" className="text-xl" />
        </Button>
        <h1 className="text-2xl font-bold">Address Details</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 my-3">
        <Button
          color="warning"
          onPress={handleEdit}
          startContent={<Icon icon="solar:pen-bold" />}
        >
          Edit Address
        </Button>
        <Button
          color={address.active === "1" ? "danger" : "success"}
          onPress={onInactiveOrActiveOpen}
          startContent={<Icon icon="solar:trash-bin-trash-bold" />}
        >
          {address.active === "1" ? "Inactivate" : "Activate"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">{address.company_name}</h2>
              <p className="text-sm text-default-600">Code: {address.CardCode || 'N/A'}</p>
            </div>
            <div className="flex gap-2">
              <Chip
                size="sm"
                variant="flat"
                color={address.CardType === 'S' ? 'primary' : 'secondary'}
              >
                Type: {address.CardType}
              </Chip>
              <Chip
                size="sm"
                variant="flat"
                color={address.active === '1' ? 'success' : 'danger'}
              >
                {address.active === '1' ? 'Active' : 'Inactive'}
              </Chip>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold mb-3">Address Information</h3>
              <InfoRow label="Full Address" value={address.full_address} />
              <InfoRow label="Street 1" value={address.street1} />
              <InfoRow label="Street 2" value={address.street2} />
              <InfoRow label="Street 3" value={address.street3} />
              <InfoRow label="City" value={address.city} />
              <InfoRow label="State/Province" value={address.state} />
              <InfoRow label="Country" value={address.country} />
              <InfoRow label="Postal Code" value={address.postal_code} />
            </div>
          </CardBody>
        </Card>

        {/* Contact Information Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Contact Information</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-default-500 mb-1">Contact Name</p>
                <p className="font-medium">{address.contact_name || '-'}</p>
              </div>

              {address.contact && (
                <div>
                  <p className="text-xs text-default-500 mb-1">Contact</p>
                  <p className="font-medium">{address.contact}</p>
                </div>
              )}

              {address.phone && (
                <div>
                  <p className="text-xs text-default-500 mb-1">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Icon icon="solar:phone-bold" />
                    {address.phone}
                  </p>
                </div>
              )}

              {address.phone1 && (
                <div>
                  <p className="text-xs text-default-500 mb-1">Phone 1</p>
                  <p className="font-medium flex items-center gap-2">
                    <Icon icon="solar:phone-bold" />
                    {address.phone1}
                  </p>
                </div>
              )}

              {address.email && (
                <div>
                  <p className="text-xs text-default-500 mb-1">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Icon icon="solar:letter-bold" />
                    {address.email}
                  </p>
                </div>
              )}

              {address.website && (
                <div>
                  <p className="text-xs text-default-500 mb-1">Website</p>
                  <p className="font-medium flex items-center gap-2">
                    <Icon icon="solar:globe-bold" />
                    <a href={address.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {address.website}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Additional Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="text-lg font-semibold">Additional Information</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-1">
              <InfoRow label="Tax ID" value={address.tax_id} />
              <InfoRow label="EORI Number" value={address.eori_number} />
              <InfoRow label="Bind Incoterms" value={address.bind_incoterms} />
            </div>
          </CardBody>
        </Card>

        {/* Audit Information Card */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">History Information</h3>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-default-500 mb-1">Created By</p>
                <p className="font-medium">{address.created_user_name || '-'}</p>
                <p className="text-xs text-default-400">
                  {address.created_time ? new Date(address.created_time).toLocaleString() : '-'}
                </p>
              </div>

              <Divider />

              <div>
                <p className="text-xs text-default-500 mb-1">Last Updated By</p>
                <p className="font-medium">{address.updated_user_name || '-'}</p>
                <p className="text-xs text-default-400">
                  {address.updated_time ? new Date(address.updated_time).toLocaleString() : '-'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* InactiveOrActive Confirmation Modal */}
      <Modal isOpen={isInactiveOrActiveOpen} onClose={onInactiveOrActiveClose} size="md">
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div
              className={`flex items-center gap-2 ${address.active === "1" ? "text-danger" : "text-success"
                }`}
            >
              <Icon icon="solar:danger-circle-bold" className="text-3xl" />
              <span>
                Confirm {address.active === "1" ? "Inactivation" : "Activation"}
              </span>
            </div>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Are you sure you want to {address.active === "1" ? "inactivate" : "activate"}  this address?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={onInactiveOrActiveClose}
            >
              Cancel
            </Button>
            <Button
              color={address.active === "1" ? "danger" : "success"}
              onPress={confirmInactivate}
              isLoading={isLoading}
            >
              {address.active === "1" ? "Inactivate" : "Activate"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="3xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>Edit Address</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Card Code"
                value={formData.CardCode}
                onValueChange={(value) => setFormData({ ...formData, CardCode: value })}
                isInvalid={!!validationErrors.CardCode}
                errorMessage={validationErrors.CardCode?.[0]}
              />
              <Input
                label="Company Name"
                isRequired
                value={formData.company_name}
                onValueChange={(value) => setFormData({ ...formData, company_name: value })}
                isInvalid={!!validationErrors.company_name}
                errorMessage={validationErrors.company_name?.[0]}
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
                isInvalid={!!validationErrors.street1}
                errorMessage={validationErrors.street1?.[0]}
              />
              <Input
                label="Street 2"
                value={formData.street2}
                onValueChange={(value) => setFormData({ ...formData, street2: value })}
                isInvalid={!!validationErrors.street2}
                errorMessage={validationErrors.street2?.[0]}
              />
              <Input
                label="Street 3"
                value={formData.street3}
                onValueChange={(value) => setFormData({ ...formData, street3: value })}
                isInvalid={!!validationErrors.street3}
                errorMessage={validationErrors.street3?.[0]}
              />
              <Input
                label="City"
                isRequired
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                isInvalid={!!validationErrors.city}
                errorMessage={validationErrors.city?.[0]}
              />
              <Input
                label="State"
                isRequired
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
                isInvalid={!!validationErrors.state}
                errorMessage={validationErrors.state?.[0]}
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
                isInvalid={!!validationErrors.country}
                errorMessage={validationErrors.country?.[0]}
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
                isInvalid={!!validationErrors.postal_code}
                errorMessage={validationErrors.postal_code?.[0]}
              />
              <Input
                label="Contact Name"
                isRequired
                value={formData.contact_name}
                onValueChange={(value) => setFormData({ ...formData, contact_name: value })}
                isInvalid={!!validationErrors.contact_name}
                errorMessage={validationErrors.contact_name?.[0]}
              />
              <Input
                label="Contact"
                value={formData.contact}
                onValueChange={(value) => setFormData({ ...formData, contact: value })}
                isInvalid={!!validationErrors.contact}
                errorMessage={validationErrors.contact?.[0]}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onValueChange={(value) => setFormData({ ...formData, phone: value })}
                isInvalid={!!validationErrors.phone}
                errorMessage={validationErrors.phone?.[0]}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onValueChange={(value) => setFormData({ ...formData, email: value })}
                isInvalid={!!validationErrors.email}
                errorMessage={validationErrors.email?.[0]}
              />
              <Input
                label="Tax ID"
                value={formData.tax_id}
                onValueChange={(value) => setFormData({ ...formData, tax_id: value })}
                isInvalid={!!validationErrors.tax_id}
                errorMessage={validationErrors.tax_id?.[0]}
              />
              <Input
                label="Phone 1"
                value={formData.phone1}
                onValueChange={(value) => setFormData({ ...formData, phone1: value })}
                isInvalid={!!validationErrors.phone1}
                errorMessage={validationErrors.phone1?.[0]}
              />
              <Input
                label="Website"
                value={formData.website}
                onValueChange={(value) => setFormData({ ...formData, website: value })}
                isInvalid={!!validationErrors.website}
                errorMessage={validationErrors.website?.[0]}
              />
              <Input
                label="EORI Number"
                value={formData.eori_number}
                onValueChange={(value) => setFormData({ ...formData, eori_number: value })}
                isInvalid={!!validationErrors.eori_number}
                errorMessage={validationErrors.eori_number?.[0]}
              />
              <Input
                label="Bind Incoterms"
                value={formData.bind_incoterms}
                onValueChange={(value) => setFormData({ ...formData, bind_incoterms: value })}
                isInvalid={!!validationErrors.bind_incoterms}
                errorMessage={validationErrors.bind_incoterms?.[0]}
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
            <Button color="default" onPress={onEditClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={isSubmitting} type="button">
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

export default AddressListDetail
