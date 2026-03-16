import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react'
import { ISO_2_COUNTRIES } from '@pages/shipment/constants/iso2countries'

interface AddressFormData {
  CardCode: string
  company_name: string
  CardType: string
  street1: string
  street2: string
  street3: string
  city: string
  state: string
  country: string
  postal_code: string
  contact_name: string
  contact: string
  phone: string
  email: string
  tax_id: string
  phone1: string
  website: string
  eori_number: string
  bind_incoterms: string
}

interface AddressCreateModalProps {
  isOpen: boolean
  onClose: () => void
  formData: AddressFormData
  setFormData: (data: AddressFormData) => void
  formErrors: Record<string, string>
  onSubmit: () => Promise<void>
  isCreating: boolean
}

export const AddressCreateModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  formErrors,
  onSubmit,
  isCreating
}: AddressCreateModalProps) => {
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

  return (
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
            onPress={onSubmit}
            isLoading={isCreating}
          >
            {isCreating ? 'Creating New Address...' : 'Create'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
