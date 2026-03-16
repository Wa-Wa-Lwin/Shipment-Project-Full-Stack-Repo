import { useState } from 'react'
import { useFieldArray } from 'react-hook-form'
import {
    Button, Input, Select, SelectItem, Autocomplete, AutocompleteItem,
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Textarea
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { DEFAULT_PARCEL_ITEM, WEIGHT_UNITS } from '../../constants/form-defaults'
import type { ParcelItemsProps } from '../../types/shipment-form.types'
import { CURRENCIES } from '@pages/shipment/constants/currencies'
import { ISO_3_COUNTRIES } from '@pages/shipment/constants/iso3countries'
import { Controller } from 'react-hook-form'
import MaterialsTable, { type MaterialData } from '@pages/items/MaterialsTable'

interface ExtendedParcelItemsProps extends ParcelItemsProps {
    sendTo?: string
    shipFromCountry?: string
    shipToCountry?: string
    validationMode?: 'shipment' | 'rate-calculator'
    onClearRates?: () => void
    shipmentScopeType: string
}

const ParcelItems = ({ parcelIndex, control, register, errors, setValue, watch, onWeightChange, sendTo, shipFromCountry, shipToCountry, validationMode = 'shipment', onClearRates, shipmentScopeType }: ExtendedParcelItemsProps) => {

    const normalizedScope = shipmentScopeType?.toLowerCase?.() || ''
    const isDomestic = normalizedScope === 'domestic'
    const isImportScope = normalizedScope === 'import'

    // Helper function to determine if item fields should be required based on validation mode
    const isItemFieldRequired = (fieldName: string) => {
        if (validationMode === 'rate-calculator') {
            // For rate calculator, only quantity and weight are required
            const rateCalculatorRequiredFields = ['quantity', 'weight_value'];
            return rateCalculatorRequiredFields.includes(fieldName);
        }

        if (isImportScope && (fieldName === 'material_code' || fieldName === 'sku')) {
            // Material code and SKU can stay blank for import shipments
            return false
        }

        if (sendTo === 'Logistic') {
            // For logistics, HS code and origin country are not required
            const logisticNotRequiredFields = ['hs_code', 'origin_country'];
            if (logisticNotRequiredFields.includes(fieldName)) {
                return false;
            }
            // All other fields are still required for logistics
            return true;
        }

        // Additional condition: HS Code and Origin country are optional if both ship from and ship to countries are THA
        if ((fieldName === 'hs_code' || fieldName === 'origin_country') &&
            shipFromCountry === 'THA' && shipToCountry === 'THA') {
            return false;
        }

        // For Approver or default, all other fields are required as before
        return true;
    };
    const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
        control,
        name: `parcels.${parcelIndex}.parcel_items`
    })

    // Modal + lookup state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)

    const openMaterialModal = (itemIndex: number) => {
        setCurrentItemIndex(itemIndex)
        setIsModalOpen(true)
    }

    const handleMaterialSelect = (selectedMaterial: MaterialData) => {
        if (currentItemIndex !== null) {
            // Clear rates since material selection changes multiple fields
            if (onClearRates) {
                console.log('Material selected for item, clearing rates...')
                onClearRates()
            }

            const basePath = `parcels.${parcelIndex}.parcel_items.${currentItemIndex}`
            setValue(`${basePath}.description`, selectedMaterial.description || '', { shouldValidate: false, shouldDirty: true })
            setValue(`${basePath}.sku`, selectedMaterial.sku || '', { shouldValidate: false, shouldDirty: true })
            setValue(`${basePath}.material_code`, selectedMaterial.material_code || '', { shouldValidate: false, shouldDirty: true })

            // Remove Thai wording and any alphabets from HS code, keep only numbers and dots
            const cleanedHsCode = (selectedMaterial.hscode || '').replace(/[^\d.]/g, '')
            // If cleaned HS code is empty, use default value
            setValue(`${basePath}.hs_code`, cleanedHsCode || '12345678', { shouldValidate: false, shouldDirty: true })

            // Trigger weight and description update
            if (onWeightChange) {
                setTimeout(onWeightChange, 100)
            }
        }
        setIsModalOpen(false)
        setCurrentItemIndex(null)
    }

    return (
        <div className="border-t border-b pt-2 pb-2 mb-2 bg-gray-100">
            <div className="flex justify-left items-center mb-4 gap-3">
                <h4 className="text-md font-medium">Parcel Items</h4>
                <Button
                    type="button"
                    color="primary"
                    size="sm"
                    variant="bordered"
                    startContent={<Icon icon="solar:add-circle-bold" />}
                    onPress={() => {
                        // Clear rates since new item is being added
                        if (onClearRates) {
                            console.log('New item added to parcel, clearing rates...')
                            onClearRates()
                        }
                            // Set default currency based on shipment scope: THB for domestic, USD otherwise
                            const newItem = {
                                ...DEFAULT_PARCEL_ITEM,
                                price_currency: isDomestic ? 'THB' : 'USD'
                            }
                            appendItem(newItem)
                        if (onWeightChange) {
                            setTimeout(onWeightChange, 100)
                        }
                    }}
                >
                    Add Item
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table
                    aria-label="Parcel items table"
                    classNames={{
                        wrapper: `${itemFields.length <= 1 ? 'min-h-0' : 'min-h-[50px]'} p-0 border-0 rounded-none`,
                        table: "min-w-[1200px]",
                        td: "px-1 py-1",
                        th: "px-1 py-2",
                    }}
                >
                    <TableHeader>
                        <TableColumn className="w-12">#</TableColumn>
                        <TableColumn className="w-48 min-w-[80px]">DESCRIPTION {isItemFieldRequired('description') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-36">Mat Code {isItemFieldRequired('material_code') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-36">SKU {isItemFieldRequired('sku') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className={isDomestic ? 'hidden' : 'w-24'}>HS CODE {isItemFieldRequired('hs_code') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className={isDomestic ? 'hidden' : 'w-24'}>ORIGIN {isItemFieldRequired('origin_country') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-20">PRICE {isItemFieldRequired('price_amount') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-28">CURRENCY {isItemFieldRequired('price_currency') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-16">WEIGHT(kg) Per Unit {isItemFieldRequired('weight_value') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-16">QTY {isItemFieldRequired('quantity') && <span className="text-red-500">*</span>}</TableColumn>
                        <TableColumn className="w-16">ACTION</TableColumn>
                    </TableHeader>
                    <TableBody emptyContent="No items added yet">
                        {itemFields.map((item, itemIndex) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <span className="text-sm font-medium text-default-600">
                                        {itemIndex + 1}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            color="primary"
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onPress={() => openMaterialModal(itemIndex)}
                                        >
                                            <Icon
                                                icon="solar:database-bold"
                                                width={16}
                                            />
                                        </Button>

                                        <Controller
                                            name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.description`}
                                            control={control}
                                            rules={{ required: isItemFieldRequired('description') ? 'Item description is required' : false }}
                                            render={({ field }) => (
                                                <Textarea
                                                    {...field}                     // makes it controlled + subscribed
                                                    maxLength={255}
                                                    placeholder="Enter item description"
                                                    variant="flat"
                                                    size="sm"
                                                    errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.description?.message}
                                                    isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.description}
                                                    classNames={{
                                                        input: "text-sm",
                                                        inputWrapper: "min-h-unit-8 h-unit-8"
                                                    }}
                                                    color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.description`) ? "warning" : "default"}
                                                    minRows={1}
                                                    onChange={(e) => {
                                                        field.onChange(e)
                                                        // Clear rates since item description changed
                                                        if (onClearRates) {
                                                            console.log('Item description changed, clearing rates...')
                                                            onClearRates()
                                                        }
                                                        if (onWeightChange) {
                                                            setTimeout(onWeightChange, 100)
                                                        }
                                                    }}
                                                />
                                            )}
                                        />
                                    </div>
                                </TableCell>

                                {/* Material Code cell */}
                                <TableCell>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.material_code`}
                                        control={control}
                                        rules={{ required: isItemFieldRequired('material_code') ? 'Material Code is required' : false }}
                                        render={({ field }) => (
                                            <Textarea
                                                {...field}
                                                maxLength={255}
                                                placeholder="Material Code"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.material_code?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.material_code}
                                                classNames={{
                                                    input: "text-sm",
                                                    inputWrapper: "min-h-unit-8 h-unit-8"
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.material_code`) ? "warning" : "default"}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    // Clear rates since material_code changed
                                                    if (onClearRates) {
                                                        console.log('Item Material Code changed, clearing rates...')
                                                        onClearRates()
                                                    }
                                                }}
                                                minRows={1}
                                            />
                                        )}
                                    />
                                </TableCell>

                                {/* SKU cell */}
                                <TableCell>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.sku`}
                                        control={control}
                                        rules={{ required: isItemFieldRequired('sku') ? 'SKU is required' : false }}
                                        render={({ field }) => (
                                            <Textarea
                                                {...field}
                                                maxLength={45}
                                                placeholder="SKU"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.sku?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.sku}
                                                classNames={{
                                                    input: "text-sm",
                                                    inputWrapper: "min-h-unit-8 h-unit-8"
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.sku`) ? "warning" : "default"}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    // Clear rates since SKU changed
                                                    if (onClearRates) {
                                                        console.log('Item SKU changed, clearing rates...')
                                                        onClearRates()
                                                    }
                                                }}
                                                minRows={1}
                                            />
                                        )}
                                    />
                                </TableCell>

                                <TableCell className={isDomestic ? 'hidden' : ''}>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.hs_code`}
                                        control={control}
                                        rules={{
                                            required: isItemFieldRequired('hs_code') ? 'HS Code is Required' : false,
                                            pattern: {
                                                value: /^[\d.]+$/,
                                                message: 'HS Code must contain only numbers and dots'
                                            },
                                            validate: (value) => {
                                                if (!value) return true;
                                                const digitsOnly = value.replace(/\./g, '');
                                                if (digitsOnly.length < 6) return 'HS Code must have at least 6 digits';
                                                if (digitsOnly.length > 12) return 'HS Code must have at most 12 digits';
                                                return true;
                                            }
                                        }}
                                        render={({ field: { onChange, value, ...restField } }) => (
                                            <Input
                                                isRequired={isItemFieldRequired('hs_code')}
                                                {...restField}
                                                value={value || ''}
                                                type="text"
                                                maxLength={12}
                                                placeholder="HS CODE"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.hs_code?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.hs_code}
                                                classNames={{
                                                    input: "text-sm",
                                                    inputWrapper: "min-h-unit-8 h-unit-8"
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.hs_code`) ? "warning" : "default"}
                                                onChange={(e) => {
                                                    // Only allow numeric input and dots
                                                    const cleanValue = e.target.value.replace(/[^\d.]/g, '')
                                                    onChange(cleanValue)
                                                    // Clear rates since HS code changed
                                                    if (onClearRates) {
                                                        console.log('Item HS code changed, clearing rates...')
                                                        onClearRates()
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell className={isDomestic ? 'hidden' : ''}>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.origin_country`}
                                        control={control}
                                        rules={{ required: isItemFieldRequired('origin_country') ? 'Origin country is required' : false }}
                                        render={({ field }) => (
                                            <Autocomplete
                                                isRequired={isItemFieldRequired('origin_country')}
                                                {...field}
                                                defaultItems={ISO_3_COUNTRIES}
                                                placeholder="country"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.origin_country?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.origin_country}
                                                selectedKey={field.value || null}
                                                onSelectionChange={(key) => {
                                                    if (key) {
                                                        field.onChange(key)
                                                        // Clear rates since origin country changed
                                                        if (onClearRates) {
                                                            console.log('Item origin country changed, clearing rates...')
                                                            onClearRates()
                                                        }
                                                    }
                                                }}
                                                listboxProps={{
                                                    emptyContent: "No countries found."
                                                }}
                                                classNames={{
                                                    base: "min-h-unit-8 h-unit-8",
                                                    listbox: "max-h-60"
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.origin_country`) ? "warning" : "default"}
                                            >
                                                {(item) => (
                                                    <AutocompleteItem key={item.key} value={item.value}>
                                                        {item.key}
                                                    </AutocompleteItem>
                                                )}
                                            </Autocomplete>
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Input
                                        {...register(
                                            `parcels.${parcelIndex}.parcel_items.${itemIndex}.price_amount`,
                                            {
                                                required: isItemFieldRequired('price_amount') ? 'Price is required' : false,
                                                min: { value: 0, message: 'Price must be at least 0' },
                                                pattern: {
                                                    value: /^\d*\.?\d*$/,
                                                    message: 'Only numbers and decimals allowed',
                                                },
                                            }
                                        )}
                                        type="number"
                                        step="0.0001"
                                        variant="flat"
                                        size="sm"
                                        errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.price_amount?.message}
                                        isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.price_amount}
                                        classNames={{
                                            input: "text-sm",
                                            inputWrapper: "min-h-unit-8 h-unit-8"
                                        }}
                                        color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.price_amount`) ? "warning" : "default"}
                                        onChange={() => {
                                            if (onClearRates) {
                                                console.log('Item price changed, clearing rates...')
                                                onClearRates()
                                            }
                                        }}
                                        min={0}
                                    />
                                </TableCell>

                                <TableCell>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.price_currency`}
                                        control={control}
                                        rules={{ required: isItemFieldRequired('price_currency') ? 'Currency is required' : false }}
                                        defaultValue={isDomestic ? 'THB' : 'USD'}
                                        render={({ field }) => (
                                            <Autocomplete
                                                {...field}
                                                defaultItems={CURRENCIES}
                                                placeholder="Select currency"
                                                variant="flat"
                                                size="sm"
                                                selectedKey={field.value || (isDomestic ? 'THB' : 'USD')}
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.price_currency?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.price_currency}
                                                onSelectionChange={(key) => {
                                                    if (key) {
                                                        field.onChange(key.toString());
                                                        // Clear rates since currency changed
                                                        if (onClearRates) {
                                                            console.log('Item currency changed, clearing rates...')
                                                            onClearRates()
                                                        }
                                                    } else {
                                                        field.onChange(isDomestic ? 'THB' : 'USD');
                                                    }
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.price_currency`) ? "warning" : "default"}
                                            >
                                                {(currency) => (
                                                    <AutocompleteItem key={currency.key} value={currency.value}>
                                                        {currency.key}
                                                    </AutocompleteItem>
                                                )}
                                            </Autocomplete>
                                        )}
                                    />
                                </TableCell>

                                <TableCell>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.weight_value`}
                                        control={control}
                                        rules={{
                                            required: isItemFieldRequired("weight_value") ? "Weight is required" : false,
                                            min: 0,
                                        }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                step="0.00001" // allow up to 5 decimals
                                                placeholder="0.00000"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={
                                                    errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.weight_value?.message
                                                }
                                                isInvalid={
                                                    !!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.weight_value
                                                }
                                                classNames={{
                                                    input: "text-sm",
                                                    inputWrapper: "min-h-unit-8 h-unit-8",
                                                }}
                                                color={
                                                    !watch(
                                                        `parcels.${parcelIndex}.parcel_items.${itemIndex}.weight_value`
                                                    )
                                                        ? "warning"
                                                        : "default"
                                                }
                                                // let user type freely
                                                onChange={(e) => {
                                                    field.onChange(e.target.value);
                                                    // Clear rates since item weight changed
                                                    if (onClearRates) {
                                                        console.log('Item weight changed, clearing rates...')
                                                        onClearRates()
                                                    }
                                                }}
                                                // only format when user leaves input
                                                onBlur={(e) => {
                                                    let val = e.target.value;
                                                    if (val && !isNaN(Number(val))) {
                                                        val = parseFloat(val).toFixed(5); // format to 5 decimals
                                                        field.onChange(val);
                                                    }
                                                    if (onWeightChange) {
                                                        setTimeout(onWeightChange, 100);
                                                    }
                                                }}
                                                min={0}
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    <Controller
                                        name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.quantity`}
                                        control={control}
                                        rules={{ required: isItemFieldRequired('quantity') ? 'Quantity is required' : false, min: 1 }}
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                type="number"
                                                placeholder="1"
                                                variant="flat"
                                                size="sm"
                                                errorMessage={errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.quantity?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_items?.[itemIndex]?.quantity}
                                                classNames={{
                                                    input: "text-sm",
                                                    inputWrapper: "min-h-unit-8 h-unit-8"
                                                }}
                                                color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.quantity`) ? "warning" : "default"}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    if (onWeightChange) {
                                                        setTimeout(onWeightChange, 100)
                                                    }
                                                }}
                                            />
                                        )}
                                    />
                                </TableCell>
                                <TableCell>
                                    {itemFields.length > 1 && (
                                        <Button
                                            type="button"
                                            color="danger"
                                            size="sm"
                                            variant="light"
                                            isIconOnly
                                            onPress={() => {
                                                // Clear rates since item is being removed
                                                if (onClearRates) {
                                                    console.log('Item removed from parcel, clearing rates...')
                                                    onClearRates()
                                                }
                                                removeItem(itemIndex)
                                                if (onWeightChange) {
                                                    setTimeout(onWeightChange, 100)
                                                }
                                            }}
                                        >
                                            <Icon icon="solar:trash-bin-minimalistic-bold" width={16} />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>

                </Table>

            </div>

            {/* Hidden weight unit field */}
            {itemFields.map((item, itemIndex) => (
                <Controller
                    key={`weight-unit-${item.id}`}
                    name={`parcels.${parcelIndex}.parcel_items.${itemIndex}.weight_unit`}
                    control={control}
                    rules={{ required: isItemFieldRequired('weight_unit') ? 'Weight unit is required' : false }}
                    defaultValue="kg"
                    render={({ field }) => (
                        <Select
                            {...field}
                            defaultSelectedKeys={['kg']}
                            className="hidden"
                            color={!watch(`parcels.${parcelIndex}.parcel_items.${itemIndex}.weight_unit`) ? "warning" : "default"}
                            onSelectionChange={(keys) => {
                                const selectedKey = Array.from(keys)[0] as string
                                if (selectedKey) {
                                    field.onChange(selectedKey)
                                }
                            }}
                        >
                            {WEIGHT_UNITS.map((unit) => (
                                <SelectItem key={unit.key} value={unit.value}>
                                    {unit.label}
                                </SelectItem>
                            ))}
                        </Select>
                    )}
                />
            ))}

            {/* Material Lookup Modal */}
            <Modal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                className="min-w-[90svw]"
                scrollBehavior="inside"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h3>Material Lookup</h3>
                            </ModalHeader>
                            <ModalBody className="p-4">
                                <MaterialsTable
                                    onMaterialSelect={handleMaterialSelect}
                                    showRefreshButton={true}
                                    showSearch={true}
                                    showRevisionColumn={false}
                                    showNumberColumn={false}
                                    itemsPerPage={25}
                                    minHeight="400px"
                                    selectable={true}
                                />
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
        </div>
    )
}

export default ParcelItems
