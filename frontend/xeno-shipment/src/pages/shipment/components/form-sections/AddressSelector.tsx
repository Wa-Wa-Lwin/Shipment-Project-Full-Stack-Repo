import { useState, useEffect, useMemo } from 'react'
import { Controller } from 'react-hook-form'
import {
  Card,
  CardHeader,
  CardBody,
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Spinner,
  Alert,
  Pagination
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import type { FormSectionProps } from '../../types/shipment-form.types'
import type { AddressListData } from '@pages/address-list/types'
import { ISO_3_COUNTRIES } from '@pages/shipment/constants/iso3countries'
import { ISO2_TO_ISO3 } from '@pages/shipment/constants/change-iso-country-codes'


interface AddressSelectorProps extends FormSectionProps {
  title: string
  prefix: 'ship_from' | 'ship_to'
  forceRefresh?: number
  watch: (name?: string) => any
  onClearRates?: () => void
}

const AddressSelector = ({ register, errors, control, title, prefix, setValue, forceRefresh, watch, onClearRates }: AddressSelectorProps) => {
  // Helper function to determine if a field should be required based on send_to value
  const isFieldRequired = (_fieldName: string) => {
    // All address fields are required regardless of send_to value
    return true;
  };
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [addresses, setAddresses] = useState<AddressListData[]>([])
  const [filteredAddresses, setFilteredAddresses] = useState<AddressListData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [formKey, setFormKey] = useState(0)
  const [selectedAddressInfo, setSelectedAddressInfo] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const rowsPerPage = 10

  // European countries that require EORI number
  const europeanCountries = [
    'AUT', 'BEL', 'BGR', 'HRV', 'CYP', 'CZE', 'DNK', 'EST', 'FIN', 'FRA',
    'DEU', 'GRC', 'HUN', 'IRL', 'ITA', 'LVA', 'LTU', 'LUX', 'MLT', 'NLD',
    'POL', 'PRT', 'ROU', 'SVK', 'SVN', 'ESP', 'SWE', 'GBR', 'NOR', 'ISL', 'CHE'
  ]

  // Check if selected country is European
  const selectedCountry = watch(`${prefix}_country`)
  const isEuropeanCountry = selectedCountry && europeanCountries.includes(selectedCountry)

  const fetchAddresses = async () => {
    setIsLoading(true)
    try {
      // Try to get from cache first
      const cachedData = localStorage.getItem('address_list_cache')
      if (cachedData) {
        const parsedData = JSON.parse(cachedData)
        // Get all_active_address_list from the cache
        const activeAddresses = parsedData.all_active_address_list || []
        setAddresses(activeAddresses)
        setFilteredAddresses(activeAddresses)
        setIsLoading(false)
        return
      }

      // Fetch from API if no cache
      const response = await axios.get(import.meta.env.VITE_APP_NEW_ADDRESS_LIST_GET_ALL)
      if (response.data) {
        const activeAddresses = response.data.all_active_address_list || []
        setAddresses(activeAddresses)
        setFilteredAddresses(activeAddresses)
        // Cache the entire response
        localStorage.setItem('address_list_cache', JSON.stringify(response.data))
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAddresses(addresses)
    } else {
      const q = searchQuery.toLowerCase()
      const filtered = addresses.filter(address =>
        (address.CardCode ?? "").toLowerCase().includes(q) ||
        (address.company_name ?? "").toLowerCase().includes(q) ||
        (address.CardType ?? "").toLowerCase().includes(q) ||
        (address.full_address ?? "").toLowerCase().includes(q) ||
        (address.street1 ?? "").toLowerCase().includes(q) ||
        (address.street2 ?? "").toLowerCase().includes(q) ||
        (address.street3 ?? "").toLowerCase().includes(q) ||
        (address.city ?? "").toLowerCase().includes(q) ||
        (address.state ?? "").toLowerCase().includes(q) ||
        (address.country ?? "").toLowerCase().includes(q) ||
        (address.postal_code ?? "").toLowerCase().includes(q) ||
        (address.contact_name ?? "").toLowerCase().includes(q) ||
        (address.contact ?? "").toLowerCase().includes(q) ||
        (address.phone ?? "").toLowerCase().includes(q) ||
        (address.email ?? "").toLowerCase().includes(q) ||
        (address.tax_id ?? "").toLowerCase().includes(q) ||
        (address.phone1 ?? "").toLowerCase().includes(q) ||
        (address.website ?? "").toLowerCase().includes(q) ||
        (address.active ?? "").toLowerCase().includes(q) ||
        (address.created_user_name ?? "").toLowerCase().includes(q) ||
        (address.updated_user_name ?? "").toLowerCase().includes(q) ||
        (address.eori_number ?? "").toLowerCase().includes(q) ||
        (address.bind_incoterms ?? "").toLowerCase().includes(q)
      )
      setFilteredAddresses(filtered)
    }
    // Reset to page 1 when search changes
    setPage(1)
  }, [searchQuery, addresses])

  // Calculate pagination
  const pages = Math.ceil(filteredAddresses.length / rowsPerPage)

  const paginatedAddresses = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    const end = start + rowsPerPage
    return filteredAddresses.slice(start, end)
  }, [page, filteredAddresses, rowsPerPage])

  // Watch for forceRefresh prop changes to trigger form re-render
  useEffect(() => {
    if (forceRefresh !== undefined && forceRefresh > 0) {
      setFormKey(prev => prev + 1)
    }
  }, [forceRefresh])

  const handleSelectFromAddresses = () => {
    if (addresses.length === 0) {
      fetchAddresses()
    }
    setIsModalOpen(true)
  }

  const handleAddressSelect = (address: AddressListData) => {
    // Clear rates since address is changing
    if (onClearRates) {
      console.log(`${prefix} address selected, clearing rates...`)
      onClearRates()
    }

    // Fill form fields with selected address data
    if (setValue) {
      // Use setValue with shouldDirty and shouldTouch options to trigger form updates
      const setValueOptions = { shouldDirty: true, shouldTouch: true, shouldValidate: true }

      // Convert ISO2 country code to ISO3 if needed
      const countryCode = address.country || '';
      const countryISO3 = countryCode.length === 2
        ? (ISO2_TO_ISO3[countryCode.toUpperCase()] || countryCode)
        : countryCode;

      // Map address data using new AddressData fields
      const fieldMappings = [
        { field: `${prefix}_company_name`, value: address.company_name || '' },
        { field: `${prefix}_contact_name`, value: address.contact_name || '' },
        {
          field: `${prefix}_phone`, value: (() => {
            let phone = address.phone || '';
            // Remove all non-digit and non-plus characters (including -, (), and spaces)
            phone = phone.replace(/[^0-9+]/g, "");
            // Ensure only one + and it's at the beginning
            const plusCount = (phone.match(/\+/g) || []).length;
            if (plusCount > 1) {
              const firstPlusIndex = phone.indexOf('+');
              phone = phone.charAt(firstPlusIndex) + phone.replace(/\+/g, '');
            }
            if (phone.includes('+') && !phone.startsWith('+')) {
              phone = '+' + phone.replace(/\+/g, '');
            }
            // Limit to 15 characters total
            return phone.slice(0, 15);
          })()
        },
        { field: `${prefix}_email`, value: address.email || '' },
        { field: `${prefix}_country`, value: countryISO3 },
        { field: `${prefix}_city`, value: address.city || '' },
        { field: `${prefix}_state`, value: address.state || '' },
        { field: `${prefix}_postal_code`, value: address.postal_code || '' },
        { field: `${prefix}_street1`, value: address.street1 || '' },
        { field: `${prefix}_street2`, value: address.street2 || '' },
        { field: `${prefix}_street3`, value: address.street3 || '' },
        { field: `${prefix}_tax_id`, value: address.tax_id || '' },
        { field: `${prefix}_eori_number`, value: address.eori_number || '' }
      ]

      // Set values using setValue
      fieldMappings.forEach(({ field, value }) => {
        console.log('Setting field:', field, 'to value:', value);
        setValue(field, value, setValueOptions)
      })

      // Auto-bind incoterms for ship_to address
      if (prefix === 'ship_to' && address.bind_incoterms) {
        console.log('Auto-binding incoterms:', address.bind_incoterms);
        setValue('customs_terms_of_trade', address.bind_incoterms, setValueOptions)
      }

      // Show success message and force form re-render
      setSelectedAddressInfo(`Address "${address.company_name}" selected and auto-filled`)
      setTimeout(() => {
        setFormKey(prev => prev + 1)
        // Clear success message after a delay
        setTimeout(() => setSelectedAddressInfo(null), 5000)
      }, 100)
    } else {
      console.error('setValue function is not available')
    }

    setIsModalOpen(false)
  }

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

  const formatAddress = (address: AddressListData) => {
    const parts = [
      address.street1,
      address.street2,
      address.street3,
      address.city,
      address.state,
      address.postal_code
    ].filter(Boolean)

    return parts.length > 0 ? parts.join(', ') : address.full_address || 'No address available'
  }

  return (
    <>
      <Card shadow="none">
        {/* <Card shadow="none" className="py-0 px-4 m-0"> */}
        <CardHeader className="px-0 pt-0 pb-3 flex-row items-center gap-6 justify-left">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="flat"
              color="primary"
              startContent={<Icon icon="solar:buildings-2-bold" />}
              onPress={handleSelectFromAddresses}
            >
              Select from Addresses
            </Button>
          </div>
        </CardHeader>
        <CardBody className="px-0 pt-0 pb-0">
          {selectedAddressInfo && (
            <div className="mb-3">
              <Alert
                color="success"
                variant="flat"
                title="Address Selected"
                description={selectedAddressInfo}
              />
            </div>
          )}
          <div key={formKey} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Textarea
              {...register(`${prefix}_company_name`, { required: isFieldRequired('company_name') ? 'Company name is required' : false })}
              isRequired={isFieldRequired('company_name')}
              label={<span>Company Name</span>}
              placeholder="Enter company name"
              errorMessage={errors[`${prefix}_company_name`]?.message}
              isInvalid={!!errors[`${prefix}_company_name`]}
              key={`${formKey}_${prefix}_company_name`}
              color={!watch(`${prefix}_company_name`) ? "warning" : "default"}
              maxLength={255}
              onChange={() => {
                // Clear rates since company name changed
                if (onClearRates) {
                  console.log(`${prefix} company name changed, clearing rates...`)
                  onClearRates()
                }
              }}
              minRows={1}
            />
            <Textarea
              {...register(`${prefix}_contact_name`, { required: isFieldRequired('contact_name') ? 'Contact name is required' : false })}
              isRequired={isFieldRequired('contact_name')}
              label={<span>Contact Name</span>}
              placeholder="Enter contact name"
              errorMessage={errors[`${prefix}_contact_name`]?.message}
              isInvalid={!!errors[`${prefix}_contact_name`]}
              key={`${formKey}_${prefix}_contact_name`}
              color={!watch(`${prefix}_contact_name`) ? "warning" : "default"}
              maxLength={100}
              minRows={1}
            />

            <Textarea
              {...register(`${prefix}_phone`, { required: isFieldRequired('phone') ? 'Phone is required' : false })}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                // Allow only numbers and one + at the beginning
                let sanitized = e.target.value;

                // Remove all non-digit and non-plus characters
                sanitized = sanitized.replace(/[^0-9+]/g, "");

                // Ensure only one + and it's at the beginning
                const plusCount = (sanitized.match(/\+/g) || []).length;
                if (plusCount > 1) {
                  // Keep only the first +
                  const firstPlusIndex = sanitized.indexOf('+');
                  sanitized = sanitized.charAt(firstPlusIndex) + sanitized.replace(/\+/g, '');
                }

                // If + exists, it must be at the beginning
                if (sanitized.includes('+') && !sanitized.startsWith('+')) {
                  sanitized = '+' + sanitized.replace(/\+/g, '');
                }

                // Limit to 15 characters
                sanitized = sanitized.slice(0, 15);

                setValue(`${prefix}_phone`, sanitized, { shouldValidate: true });
              }}
              isRequired={isFieldRequired("phone")}
              label={<span>Phone</span>}
              placeholder="Enter phone (e.g. +1234567890)"
              errorMessage={errors[`${prefix}_phone`]?.message}
              isInvalid={!!errors[`${prefix}_phone`]}
              key={`${formKey}_${prefix}_phone`}
              color={!watch(`${prefix}_phone`) ? "warning" : "default"}
              minRows={1}
            />

            <Textarea
              {...register(`${prefix}_email`, {
                required: isFieldRequired('email') ? 'Email is required' : false,
                validate: (value: string) => {
                  // Trim the value before validation
                  const trimmedValue = value?.trim() || '';
                  // Auto-update the field with trimmed value
                  if (value !== trimmedValue) {
                    setValue(`${prefix}_email`, trimmedValue, { shouldValidate: false });
                  }
                  // Validate the trimmed value
                  if (isFieldRequired('email') && !trimmedValue) {
                    return 'Email is required';
                  }
                  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                  if (trimmedValue && !emailPattern.test(trimmedValue)) {
                    return "Please enter a valid email address (only letters, numbers, dots, hyphens, and underscores allowed)";
                  }
                  return true;
                }
              })}
              onBlur={(e) => {
                // Trim on blur to clean up the field
                const trimmedValue = e.target.value.trim();
                if (e.target.value !== trimmedValue) {
                  setValue(`${prefix}_email`, trimmedValue, { shouldValidate: true, shouldDirty: true });
                }
              }}
              isRequired={isFieldRequired('email')}
              // type="email"
              label={<span>Email</span>}
              placeholder="Enter email"
              errorMessage={errors[`${prefix}_email`]?.message}
              isInvalid={!!errors[`${prefix}_email`]}
              key={`${formKey}_${prefix}_email`}
              color={!watch(`${prefix}_email`) ? "warning" : "default"}
              maxLength={255}
              minRows={1}
            />
            <Controller
              key={`${formKey}_${prefix}_country`}
              name={`${prefix}_country`}
              control={control}
              rules={{ required: isFieldRequired('country') ? 'Country is required' : false }}
              render={({ field }) => (
                <Autocomplete
                  isRequired={isFieldRequired('country')}
                  {...field}
                  defaultItems={ISO_3_COUNTRIES}
                  label={
                    <span>
                      Country
                    </span>
                  }
                  placeholder="Search or select a country"
                  errorMessage={errors[`${prefix}_country`]?.message}
                  isInvalid={!!errors[`${prefix}_country`]}
                  selectedKey={field.value || null}
                  onSelectionChange={(key) => {
                    console.log('Country selected:', key);
                    if (key) {
                      field.onChange(key)

                      // Automatically set postal code for Hong Kong
                      if (key === 'HKG') {
                        console.log('Hong Kong selected, setting postal code to 00000');
                        setValue(`${prefix}_postal_code`, '00000', {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }

                      // Clear rates since country changed
                      if (onClearRates) {
                        console.log(`${prefix} country changed, clearing rates...`)
                        onClearRates()
                      }
                    }
                  }}
                  listboxProps={{
                    emptyContent: "No countries found."
                  }}
                  scrollShadowProps={{
                    isEnabled: false
                  }}
                  classNames={{
                    listbox: "max-h-60"
                  }}
                  color={!watch(`${prefix}_country`) ? "warning" : "default"}
                >
                  {(item) => (
                    <AutocompleteItem key={item.key} value={item.value}>
                      {item.value}
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              )}
            />

            <Textarea
              {...register(`${prefix}_city`, { required: isFieldRequired('city') ? 'City is required' : false })}
              isRequired={isFieldRequired('city')}
              label={<span>City</span>}
              placeholder="Enter city"
              errorMessage={errors[`${prefix}_city`]?.message}
              isInvalid={!!errors[`${prefix}_city`]}
              key={`${formKey}_${prefix}_city`}
              color={!watch(`${prefix}_city`) ? "warning" : "default"}
              maxLength={100}
              onChange={() => {
                // Clear rates since city changed
                if (onClearRates) {
                  console.log(`${prefix} city changed, clearing rates...`)
                  onClearRates()
                }
              }}
              minRows={1}
            />

            <Textarea
              {...register(`${prefix}_state`, { required: isFieldRequired('state') ? 'State is required' : false })}
              isRequired={isFieldRequired('state')}
              label={<span>State</span>}
              placeholder="Enter state"
              errorMessage={errors[`${prefix}_state`]?.message}
              isInvalid={!!errors[`${prefix}_state`]}
              key={`${formKey}_${prefix}_state`}
              color={!watch(`${prefix}_state`) ? "warning" : "default"}
              maxLength={20}
              onChange={() => {
                // Clear rates since state changed
                if (onClearRates) {
                  console.log(`${prefix} state changed, clearing rates...`)
                  onClearRates()
                }
              }}
              minRows={1}
            />

            <Controller
              key={`${formKey}_${prefix}_postal_code`}
              name={`${prefix}_postal_code`}
              control={control}
              rules={{ required: isFieldRequired('postal_code') ? 'Postal code is required' : false }}
              render={({ field }) => (
                <Textarea
                  {...field}
                  isRequired={isFieldRequired('postal_code')}
                  label={<span>Postal Code</span>}
                  placeholder="Enter postal code"
                  errorMessage={errors[`${prefix}_postal_code`]?.message}
                  isInvalid={!!errors[`${prefix}_postal_code`]}
                  color={!watch(`${prefix}_postal_code`) ? "warning" : "default"}
                  maxLength={255}
                  onChange={(e) => {
                    field.onChange(e)
                    // Clear rates since postal code changed
                    if (onClearRates) {
                      console.log(`${prefix} postal code changed, clearing rates...`)
                      onClearRates()
                    }
                  }}
                  minRows={1}
                />
              )}
            />

            <Textarea
              isRequired={isFieldRequired('street1')}
              {...register(`${prefix}_street1`, { required: isFieldRequired('street1') ? "Street 1 is required" : false })}
              label={<span>Street 1</span>}
              placeholder="Enter street line 1"
              errorMessage={errors[`${prefix}_street1`]?.message}
              isInvalid={!!errors[`${prefix}_street1`]}
              minRows={1}
              key={`${formKey}_${prefix}_street1`}
              color={!watch(`${prefix}_street1`) ? "warning" : "default"}
              maxLength={45}
              onChange={() => {
                // Clear rates since street address changed
                if (onClearRates) {
                  console.log(`${prefix} street address changed, clearing rates...`)
                  onClearRates()
                }
              }}
            />

            <Textarea
              {...register(`${prefix}_street2`)}
              label="Street 2"
              placeholder="Enter street line 2"
              errorMessage={errors[`${prefix}_street2`]?.message}
              isInvalid={!!errors[`${prefix}_street2`]}
              minRows={1}
              key={`${formKey}_${prefix}_street2`}
              maxLength={45}
            // color={!watch(`${prefix}_street2`) ? "warning" : "default"}
            />
            <Textarea
              {...register(`${prefix}_street3`)}
              label="Street 3"
              placeholder="Enter street line 3"
              errorMessage={errors[`${prefix}_street3`]?.message}
              isInvalid={!!errors[`${prefix}_street3`]}
              minRows={1}
              key={`${formKey}_${prefix}_street3`}
              maxLength={45}
            />
            <Textarea
              {...register(`${prefix}_tax_id`)}
              label="Tax ID"
              placeholder="Enter tax ID"
              errorMessage={errors[`${prefix}_tax_id`]?.message}
              isInvalid={!!errors[`${prefix}_tax_id`]}
              key={`${formKey}_${prefix}_tax_id`}
              maxLength={255}
              minRows={1}
            />
            {isEuropeanCountry && (
              <Textarea
                {...register(`${prefix}_eori_number`)}
                label="EORI Number"
                placeholder="EORI Number"
                errorMessage={errors[`${prefix}_eori_number`]?.message}
                isInvalid={!!errors[`${prefix}_eori_number`]}
                key={`${formKey}_${prefix}_eori_number`}
                maxLength={255}
                minRows={1}
              />
            )}
          </div>
        </CardBody>
      </Card>

      {/* Address Selection Modal */}
      <Modal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        // size="5xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-w-full w-full h-[90vh]", // full width, nearly full height
          wrapper: "w-full m-0 p-0",          // remove margins
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-row items-center gap-3">
                <Icon icon="solar:buildings-2-bold" className="text-primary" width={24} />
                <h3 className="text-xl font-bold whitespace-nowrap">Select Address</h3>
                <Textarea
                  className="px-5"
                  placeholder="Search by name, code, city..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Icon icon="solar:magnifer-bold" />}
                  variant="bordered"
                  isClearable
                  onClear={() => setSearchQuery('')}
                  minRows={1}
                />
              </ModalHeader>
              <ModalBody>
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Spinner size="lg" label="Loading addresses..." />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <Table
                      aria-label="Address selection table"
                      selectionMode="single"
                      classNames={{
                        wrapper: "min-h-[400px]",
                      }}
                      bottomContent={
                        pages > 1 ? (
                          <div className="flex w-full justify-center">
                            <Pagination
                              isCompact
                              showControls
                              showShadow
                              color="primary"
                              page={page}
                              total={pages}
                              onChange={setPage}
                            />
                          </div>
                        ) : null
                      }
                    >
                      <TableHeader>
                        <TableColumn>CODE</TableColumn>
                        <TableColumn>TYPE</TableColumn>
                        <TableColumn>COMPANY NAME</TableColumn>
                        <TableColumn>ADDRESS</TableColumn>
                        <TableColumn>COUNTRY</TableColumn>
                        <TableColumn>CONTACT</TableColumn>
                      </TableHeader>
                      <TableBody emptyContent="No addresses found">
                        {paginatedAddresses.map((address) => {
                          const typeInfo = getCardTypeInfo(address.CardType)
                          return (
                            <TableRow
                              key={address.addressID}
                              className="cursor-pointer hover:bg-default-100 transition-colors"
                              onClick={() => handleAddressSelect(address)}
                            >
                              <TableCell>
                                <span className="font-medium text-primary text-sm">
                                  {address.CardCode || 'N/A'}
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
                                <div className="flex flex-col max-w-[200px]">
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {address.company_name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col max-w-[250px]">
                                  <span className="text-sm text-default-600 truncate">
                                    {formatAddress(address)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {address.country || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  {address.contact_name && (
                                    <span className="text-tiny text-default-500 truncate">
                                      Contact: {address.contact_name}
                                    </span>
                                  )}
                                  {address.email && (
                                    <span className="text-tiny text-default-600 truncate max-w-[150px]">
                                      {address.email}
                                    </span>
                                  )}
                                  {address.phone && (
                                    <span className="text-tiny text-default-600">
                                      {address.phone}
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    {filteredAddresses.length > 0 && (
                      <div className="flex justify-between items-center px-2">
                        <span className="text-small text-default-500">
                          Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, filteredAddresses.length)} of {filteredAddresses.length} addresses
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancel
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}

export default AddressSelector