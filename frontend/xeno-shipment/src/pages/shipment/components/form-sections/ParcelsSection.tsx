import { useFieldArray, Controller } from 'react-hook-form'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select, SelectItem, Checkbox } from '@heroui/react'
import { Icon } from '@iconify/react'
import { DEFAULT_PARCEL } from '../../constants/form-defaults'
import { DIMENSION_UNITS, WEIGHT_UNITS } from '../../constants/form-defaults'
import ParcelItems from './ParcelItems'
import type { FormSectionProps } from '../../types/shipment-form.types'
import { ParcelBoxTypeSelectModal } from '@components/ParcelBoxTypeSelectModal'
import parcelBoxTypesService from '@pages/parcel-box-types/parcelBoxTypesService'
import type { ParcelBoxType } from '@pages/parcel-box-types/types'

interface ParcelsSectionProps extends FormSectionProps {
    watch: any
    validationMode?: 'shipment' | 'rate-calculator'
    onClearRates?: () => void
}

const ParcelsSection = ({ register, errors, control, setValue, watch, validationMode = 'shipment', onClearRates }: ParcelsSectionProps) => {
    // Watch the send_to field to conditionally apply validation (only for shipment mode)
    const sendTo = validationMode === 'shipment' ? watch('send_to') : null;

    // Watch ship from and ship to countries for conditional validation (only for shipment mode)
    const shipFromCountry = validationMode === 'shipment' ? watch('ship_from_country') : null;
    const shipToCountry = validationMode === 'shipment' ? watch('ship_to_country') : null;

    // Watch shipment_scope_type for conditional display of HS Code and Origin Country
    const shipmentScopeType = validationMode === 'shipment' ? watch('shipment_scope_type') : null;

    // Helper function to determine if a field should be required based on validation mode
    const isFieldRequired = (fieldName: string) => {
        if (validationMode === 'rate-calculator') {
            // For rate calculator, only parcel dimensions and weight are required
            const rateCalculatorRequiredFields = ['width', 'height', 'depth', 'parcel_weight_value'];
            return rateCalculatorRequiredFields.includes(fieldName);
        }

        if (sendTo === 'Logistic') {
            // For logistics, only specific parcel fields are required
            const logisticRequiredFields = ['box_type_name', 'width', 'height', 'depth', 'parcel_weight_value'];
            return logisticRequiredFields.includes(fieldName);
        }
        // For Approver or default, all fields are required as before
        return true;
    };
    const { fields: parcelFields, append: appendParcel, remove: removeParcel } = useFieldArray({
        control,
        name: 'parcels'
    })

    const [manualDescriptionParcels, setManualDescriptionParcels] = useState<Set<number>>(new Set())
    const [modalState, setModalState] = useState<{ isOpen: boolean; parcelIndex: number | null }>({
        isOpen: false,
        parcelIndex: null
    })
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Box types state
    const [boxTypes, setBoxTypes] = useState<ParcelBoxType[]>([])
    const [isLoadingBoxTypes, setIsLoadingBoxTypes] = useState(false)

    // Watch all parcel data for weight calculations
    const watchedParcels = watch('parcels')

    // Fetch box types on component mount
    useEffect(() => {
        const fetchBoxTypes = async () => {
            setIsLoadingBoxTypes(true)
            try {
                const response = await parcelBoxTypesService.getAllParcelBoxTypes()
                console.log('ParcelsSection - Box types response:', response)
                if (response.status === 'success' && response.data) {
                    // Filter to show only active box types (active === 1 or true or null)
                    const activeBoxTypes = Array.isArray(response.data)
                        ? response.data.filter((boxType: ParcelBoxType) =>
                            boxType.active === 1 || boxType.active === true || boxType.active === null
                          )
                        : [response.data].filter((boxType: ParcelBoxType) =>
                            boxType.active === 1 || boxType.active === true || boxType.active === null
                          )
                    console.log('ParcelsSection - Active box types:', activeBoxTypes)
                    setBoxTypes(activeBoxTypes)
                }
            } catch (error) {
                console.error('Failed to fetch box types:', error)
                setBoxTypes([])
            } finally {
                setIsLoadingBoxTypes(false)
            }
        }

        fetchBoxTypes()
    }, [])

    // Watch customize invoice fields
    const useCustomizeInvoice = watch('use_customize_invoice')
    const customizeInvoiceUrl = watch('customize_invoice_url')
    const customizeInvoiceFile = watch('customize_invoice_file')

    // Calculate net weight from all items in a parcel
    const calculateNetWeight = useCallback((parcelIndex: number): number => {
        const parcel = watchedParcels?.[parcelIndex]
        if (!parcel?.parcel_items) {
            return 0
        }

        return parcel.parcel_items.reduce((total: number, item: any) => {
            const weight = parseFloat(item.weight_value) || 0
            const quantity = parseInt(item.quantity) || 0
            return total + (weight * quantity)
        }, 0)
    }, [watchedParcels])

    // Calculate gross weight (parcel weight + net weight)
    const calculateGrossWeight = useCallback((parcelIndex: number): number => {
        const parcelWeight = parseFloat(watchedParcels?.[parcelIndex]?.parcel_weight_value) || 0
        const netWeight = calculateNetWeight(parcelIndex)
        return parcelWeight + netWeight
    }, [watchedParcels, calculateNetWeight])

    // Generate parcel description from item descriptions
    const generateParcelDescription = useCallback((parcelIndex: number): string => {
        const parcel = watchedParcels?.[parcelIndex]
        if (!parcel?.parcel_items || !Array.isArray(parcel.parcel_items)) {
            return ''
        }

        // Get all non-empty item descriptions
        const itemDescriptions = parcel.parcel_items
            .map((item: any) => item.description?.trim())
            .filter((desc: string) => desc && desc.length > 0)

        if (itemDescriptions.length === 0) {
            return ''
        }

        // Join descriptions with comma and space
        const fullDescription = itemDescriptions.join(', ')

        // Truncate to 200 characters with "etc." if needed
        if (fullDescription.length > 200) {
            // Find the last complete item before 195 characters (leaving space for ", etc.")
            const truncated = fullDescription.substring(0, 195)
            const lastCommaIndex = truncated.lastIndexOf(', ')

            if (lastCommaIndex > 0) {
                return truncated.substring(0, lastCommaIndex) + ', etc.'
            } else {
                // If no comma found, just truncate and add etc.
                return truncated.substring(0, 195) + ', etc.'
            }
        }

        return fullDescription
    }, [watchedParcels])

    // Update weights and description automatically
    const updateWeights = useCallback((parcelIndex: number) => {
        const netWeight = calculateNetWeight(parcelIndex)
        const grossWeight = calculateGrossWeight(parcelIndex)

        setValue(`parcels.${parcelIndex}.net_weight_value`, netWeight.toFixed(5), {
            shouldValidate: false,
            shouldDirty: true
        })
        setValue(`parcels.${parcelIndex}.weight_value`, grossWeight.toFixed(5), {
            shouldValidate: false,
            shouldDirty: true
        })

        // Only update description if not in manual mode
        if (!manualDescriptionParcels.has(parcelIndex)) {
            const description = generateParcelDescription(parcelIndex)
            setValue(`parcels.${parcelIndex}.description`, description, {
                shouldValidate: false,
                shouldDirty: true
            })
        }
    }, [calculateNetWeight, calculateGrossWeight, generateParcelDescription, setValue, manualDescriptionParcels])

    // Watch for changes in item weights, quantities, and descriptions
    useEffect(() => {
        if (watchedParcels && Array.isArray(watchedParcels)) {
            watchedParcels.forEach((parcel: any, parcelIndex: number) => {
                // Update weights and description for all parcels
                // This includes parcels with no items (to clear description) and parcels with items
                if (parcel) {
                    updateWeights(parcelIndex)
                }
            })
        }
    }, [watchedParcels, updateWeights])

    // Sync selectedFile with form state to persist file across section navigation
    useEffect(() => {
        if (customizeInvoiceFile instanceof File) {
            setSelectedFile(customizeInvoiceFile)
        } else if (!customizeInvoiceFile) {
            setSelectedFile(null)
        }
    }, [customizeInvoiceFile])

    const handleBoxTypeSelect = (boxType: any) => {
        const parcelIndex = modalState.parcelIndex
        if (parcelIndex === null) return

        console.log('handleBoxTypeSelect called with:', { parcelIndex, boxType })

        // Clear rates since parcel dimensions/weight are changing
        if (onClearRates) {
            console.log('Parcel box type changed, clearing rates...')
            onClearRates()
        }

        // Set form values with shouldValidate and shouldDirty options
        setValue(`parcels.${parcelIndex}.box_type_name`, boxType.box_type_name, {
            shouldValidate: true,
            shouldDirty: true
        })
        setValue(`parcels.${parcelIndex}.width`, boxType.width, { shouldValidate: true, shouldDirty: true })
        setValue(`parcels.${parcelIndex}.height`, boxType.height, { shouldValidate: true, shouldDirty: true })
        setValue(`parcels.${parcelIndex}.depth`, boxType.depth, { shouldValidate: true, shouldDirty: true })
        setValue(`parcels.${parcelIndex}.dimension_unit`, boxType.dimension_unit, {
            shouldValidate: true,
            shouldDirty: true
        })
        setValue(`parcels.${parcelIndex}.parcel_weight_value`, boxType.parcel_weight, {
            shouldValidate: true,
            shouldDirty: true
        })
        setValue(`parcels.${parcelIndex}.weight_unit`, boxType.weight_unit, {
            shouldValidate: true,
            shouldDirty: true
        })

        console.log("selectedBoxType.width ", boxType.width)
        console.log('Form values set for parcel:', parcelIndex)

        // Trigger weight recalculation after parcel weight is set
        setTimeout(() => updateWeights(parcelIndex), 100)
    }

    const openBoxTypeModal = (parcelIndex: number) => {
        setModalState({ isOpen: true, parcelIndex })
    }

    const closeBoxTypeModal = () => {
        setModalState({ isOpen: false, parcelIndex: null })
    }

    const handleToggleDescriptionMode = (parcelIndex: number) => {
        setManualDescriptionParcels(prev => {
            const updated = new Set(prev)
            if (updated.has(parcelIndex)) {
                // Switching back to auto mode - generate description
                updated.delete(parcelIndex)
                setTimeout(() => {
                    const description = generateParcelDescription(parcelIndex)
                    setValue(`parcels.${parcelIndex}.description`, description, {
                        shouldValidate: true,
                        shouldDirty: true
                    })
                }, 100)
            } else {
                // Switching to manual mode
                updated.add(parcelIndex)
            }
            return updated
        })
    }


    const handleRemoveParcel = (parcelIndex: number) => {
        // Clear rates since parcels are being removed
        if (onClearRates) {
            console.log('Parcel removed, clearing rates...')
            onClearRates()
        }

        removeParcel(parcelIndex)
        // Clean up state for removed parcel
        // @ts-expect-error - no type
        setManualDescriptionParcels(prev => {
            const updated = new Set()
            prev.forEach(index => {
                if (index < parcelIndex) {
                    updated.add(index)
                } else if (index > parcelIndex) {
                    updated.add(index - 1)
                }
            })
            return updated
        })
    }

    return (
        <>
            <CardBody className="m-0 p-0 space-y-3 py-1">
                {parcelFields.map((parcel, parcelIndex) => (
                    <>
                        <Card key={parcel.id} className="p-3 m-1">
                            <CardHeader className="px-0 pt-0 pb-1 flex-row items-center justify-left">
                                <h3 className="text-base font-medium pr-3">
                                    Parcel {parcelIndex + 1}
                                </h3>
                                {/* Right side */}
                                <div className="flex gap-2 flex-wrap justify-end">
                                    {parcelFields.length > 1 && (
                                        <Button
                                            type="button"
                                            color="danger"
                                            size="sm"
                                            startContent={<Icon icon="solar:trash-bin-minimalistic-bold" />}
                                            onPress={() => handleRemoveParcel(parcelIndex)}
                                        >
                                            Remove Parcel
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardBody className="px-0 pt-0 pb-0">
                                {/* Parcel Information */}
                                <div className="space-y-3 mb-4">

                                    {/* Box Type and Description Row */}
                                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                                        <div className="space-y-2 col-span-2">
                                            <Controller
                                                name={`parcels.${parcelIndex}.box_type_name`}
                                                control={control}
                                                rules={{ required: isFieldRequired('box_type_name') ? 'Box type is required' : false }}
                                                render={({ field }) => (
                                                    <div className="space-y-2">
                                                        <Button
                                                            type="button"
                                                            variant="bordered"
                                                            color={!field.value ? "warning" : "default"}
                                                            className="w-full justify-between h-14"
                                                            startContent={<Icon icon="solar:box-linear" />}
                                                            endContent={<Icon icon="solar:alt-arrow-down-linear" />}
                                                            onPress={() => openBoxTypeModal(parcelIndex)}
                                                        >
                                                            <span className="truncate">
                                                                Select : {field.value || "box type"}
                                                            </span>
                                                        </Button>
                                                        {errors.parcels?.[parcelIndex]?.box_type_name && (
                                                            <p className="text-xs text-red-500">
                                                                {errors.parcels?.[parcelIndex]?.box_type_name?.message}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Controller
                                                name={`parcels.${parcelIndex}.depth`}
                                                control={control}
                                                rules={{ required: isFieldRequired('depth') ? 'Length/depth is required' : false, min: { value: 0, message: 'Length must be at least 1' } }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        isRequired={isFieldRequired('depth')}
                                                        type="number"
                                                        step="0.01"
                                                        label={<span>Length (cm)</span>}
                                                        placeholder="Enter length/depth"
                                                        errorMessage={errors.parcels?.[parcelIndex]?.depth?.message}
                                                        isInvalid={!!errors.parcels?.[parcelIndex]?.depth}
                                                        color={!watch(`parcels.${parcelIndex}.depth`) ? "warning" : "default"}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            // Clear rates since parcel dimensions are changing
                                                            if (onClearRates) {
                                                                console.log('Parcel length/depth changed, clearing rates...')
                                                                onClearRates()
                                                            }
                                                        }}
                                                        min={1}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Controller
                                                name={`parcels.${parcelIndex}.width`}
                                                control={control}
                                                rules={{ required: isFieldRequired('width') ? 'Width is required' : false, min: { value: 0, message: 'Width must be at least 1' } }}
                                                render={({ field }) => (
                                                    <Input
                                                        isRequired={isFieldRequired('width')}
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        label={<span>Width (cm)</span>}
                                                        placeholder="Enter width"
                                                        errorMessage={errors.parcels?.[parcelIndex]?.width?.message}
                                                        isInvalid={!!errors.parcels?.[parcelIndex]?.width}
                                                        color={!watch(`parcels.${parcelIndex}.width`) ? "warning" : "default"}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            // Clear rates since parcel dimensions are changing
                                                            if (onClearRates) {
                                                                console.log('Parcel width changed, clearing rates...')
                                                                onClearRates()
                                                            }
                                                        }}
                                                        min={1}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <div className="relative">
                                            <Controller
                                                name={`parcels.${parcelIndex}.height`}
                                                control={control}
                                                rules={{ required: isFieldRequired('height') ? 'Height is required' : false, min: { value: 0, message: 'Height must be at least 1' } }}
                                                render={({ field }) => (
                                                    <Input
                                                        isRequired={isFieldRequired('height')}
                                                        {...field}
                                                        type="number"
                                                        step="0.01"
                                                        label={<span>Height (cm)</span>}
                                                        placeholder="Enter height"
                                                        errorMessage={errors.parcels?.[parcelIndex]?.height?.message}
                                                        isInvalid={!!errors.parcels?.[parcelIndex]?.height}
                                                        color={!watch(`parcels.${parcelIndex}.height`) ? "warning" : "default"}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            // Clear rates since parcel dimensions are changing
                                                            if (onClearRates) {
                                                                console.log('Parcel height changed, clearing rates...')
                                                                onClearRates()
                                                            }
                                                        }}
                                                        min={1}
                                                    />
                                                )}
                                            />
                                        </div>
                                        <Controller
                                            name={`parcels.${parcelIndex}.dimension_unit`}
                                            control={control}
                                            defaultValue="cm"
                                            rules={{ required: isFieldRequired('dimension_unit') ? 'Dimension unit is required' : false }}
                                            render={({ field }) => (
                                                <Select
                                                    {...field}
                                                    isRequired={isFieldRequired('dimension_unit')}
                                                    label={<span>Dimension Unit</span>}
                                                    defaultSelectedKeys={['cm']}
                                                    errorMessage={errors.parcels?.[parcelIndex]?.dimension_unit?.message}
                                                    isInvalid={!!errors.parcels?.[parcelIndex]?.dimension_unit}
                                                    className="hidden"
                                                    color={!watch(`parcels.${parcelIndex}.dimension_unit`) ? "warning" : "default"}
                                                    onSelectionChange={(keys) => {
                                                        const selectedKey = Array.from(keys)[0] as string
                                                        if (selectedKey) {
                                                            field.onChange(selectedKey)
                                                        }
                                                    }}
                                                >
                                                    {DIMENSION_UNITS.map((unit) => (
                                                        <SelectItem key={unit.key} value={unit.value}>
                                                            {unit.label}
                                                        </SelectItem>
                                                    ))}
                                                </Select>
                                            )}
                                        />
                                        <div className="relative">
                                            <Controller
                                                name={`parcels.${parcelIndex}.parcel_weight_value`}
                                                control={control}
                                                rules={{ required: isFieldRequired('parcel_weight_value') ? 'Parcel weight is required' : false, min: { value: 0, message: 'Weight must be at least 0' } }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        isRequired={isFieldRequired('parcel_weight_value')}
                                                        type="number"
                                                        step="0.00001"
                                                        label={<span>Parcel Weight (kg)</span>}
                                                        placeholder="0.00000"
                                                        errorMessage={errors.parcels?.[parcelIndex]?.parcel_weight_value?.message}
                                                        isInvalid={!!errors.parcels?.[parcelIndex]?.parcel_weight_value}
                                                        color={!watch(`parcels.${parcelIndex}.parcel_weight_value`) ? "warning" : "default"}
                                                        onChange={(e) => {
                                                            field.onChange(e)
                                                            // Clear rates since parcel weight is changing
                                                            if (onClearRates) {
                                                                console.log('Parcel weight changed, clearing rates...')
                                                                onClearRates()
                                                            }
                                                            // Trigger weight recalculation when parcel weight changes
                                                            setTimeout(() => updateWeights(parcelIndex), 100)
                                                        }}
                                                        min={0}
                                                    />
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {/* Parcel Items */}
                                <ParcelItems parcelIndex={parcelIndex} control={control} register={register} errors={errors}
                                    setValue={setValue} watch={watch} onWeightChange={() => updateWeights(parcelIndex)} sendTo={sendTo}
                                    shipFromCountry={shipFromCountry} shipToCountry={shipToCountry} shipmentScopeType={shipmentScopeType}
                                    validationMode={validationMode} onClearRates={onClearRates} />
                                {/* Dimensions Row */}
                                <div className="grid grid-cols-1 md:grid-cols-6 sm:grid-cols-3 gap-3">
                                    <div className='col-span-4 flex gap-3'>
                                        <div>
                                            {/* Description mode toggle */}
                                            {!manualDescriptionParcels.has(parcelIndex) ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="bordered"
                                                    color="primary"
                                                    startContent={<Icon icon="solar:pen-bold" />}
                                                    onPress={() => handleToggleDescriptionMode(parcelIndex)}
                                                >
                                                    Edit Description Manually
                                                </Button>
                                            ) : (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="bordered"
                                                    color="success"
                                                    startContent={<Icon icon="solar:magic-stick-3-bold" />}
                                                    onPress={() => handleToggleDescriptionMode(parcelIndex)}
                                                >
                                                    Use Auto Description
                                                </Button>
                                            )}
                                        </div>
                                        <Controller
                                            name={`parcels.${parcelIndex}.description`}
                                            control={control}
                                            rules={{ required: isFieldRequired('description') ? 'Parcel description is required' : false }}
                                            render={({ field }) => (
                                                <Textarea
                                                    maxLength={255}
                                                    isRequired={isFieldRequired('description')}
                                                    {...field}
                                                    label={
                                                        <span>
                                                            Parcel Description {!manualDescriptionParcels.has(parcelIndex) && '(Auto-generated)'}
                                                        </span>}
                                                    placeholder={manualDescriptionParcels.has(parcelIndex) ? "Enter parcel description manually" : "Auto-generated from item descriptions"}
                                                    errorMessage={errors.parcels?.[parcelIndex]?.description?.message}
                                                    isInvalid={!!errors.parcels?.[parcelIndex]?.description}
                                                    isReadOnly={!manualDescriptionParcels.has(parcelIndex)}
                                                    //border-transparent focus:border-transparent
                                                    classNames={{
                                                        inputWrapper: [
                                                            !manualDescriptionParcels.has(parcelIndex)
                                                                ? "bg-transparent hover:bg-transparent focus:bg-transparent focus-within:bg-transparent data-[hover=true]:bg-transparent border-transparent focus:border-transparent"
                                                                : "",
                                                            "shadow-none",
                                                        ].join(" "),
                                                        input: !manualDescriptionParcels.has(parcelIndex)
                                                            ? "text-default-700 cursor-not-allowed select-none"
                                                            : "",
                                                    }}
                                                    color={!watch(`parcels.${parcelIndex}.description`) ? "warning" : "default"}
                                                    endContent={
                                                        !manualDescriptionParcels.has(parcelIndex) ? (
                                                            <>
                                                                <Icon icon="solar:magic-stick-3-bold" className="text-gray-400" />
                                                                <Icon icon="solar:lock-keyhole-minimalistic-bold" className="text-gray-400" />
                                                            </>
                                                        ) : (
                                                            <Icon icon="solar:pen-bold" className="text-gray-400" />
                                                        )
                                                    }
                                                    minRows={1}
                                                />
                                            )}
                                        />

                                    </div>
                                    <div className="relative">
                                        <Controller
                                            name={`parcels.${parcelIndex}.net_weight_value`}
                                            control={control}
                                            rules={{ required: isFieldRequired('net_weight_value') ? 'Net weight is required' : false }}
                                            render={({ field }) => (
                                                <Input
                                                    isRequired={isFieldRequired('net_weight_value')}
                                                    {...field}
                                                    type="number"
                                                    step="0.00001"
                                                    label={
                                                        <span>
                                                            Net Weight (kg)
                                                        </span>}
                                                    placeholder="0.00000"
                                                    errorMessage={errors.parcels?.[parcelIndex]?.net_weight_value?.message}
                                                    isInvalid={!!errors.parcels?.[parcelIndex]?.net_weight_value}
                                                    isReadOnly={true}
                                                    color={!watch(`parcels.${parcelIndex}.net_weight_value`) ? "warning" : "default"}
                                                    className="bg-gray-50"
                                                    endContent={
                                                        <>
                                                            <Icon icon="solar:calculator-bold" className="text-gray-400" />
                                                            <Icon icon="solar:lock-keyhole-minimalistic-bold" className="text-gray-400" />
                                                        </>
                                                    }
                                                    min={1}
                                                />
                                            )}
                                        />
                                    </div>
                                    <div className="relative">
                                        <Controller
                                            name={`parcels.${parcelIndex}.weight_value`}
                                            control={control}
                                            rules={{ required: isFieldRequired('weight_value') ? 'Gross weight is required' : false }}
                                            render={({ field }) => (
                                                <Input
                                                    {...field}
                                                    isRequired={isFieldRequired('weight_value')}
                                                    type="number"
                                                    step="0.00001"
                                                    label={<span>Gross Weight (kg)</span>}
                                                    placeholder="0.00000"
                                                    errorMessage={errors.parcels?.[parcelIndex]?.weight_value?.message}
                                                    isInvalid={!!errors.parcels?.[parcelIndex]?.weight_value}
                                                    isReadOnly={true}
                                                    color={!watch(`parcels.${parcelIndex}.weight_value`) ? "warning" : "default"}
                                                    className="bg-gray-50"
                                                    endContent={
                                                        <>
                                                            <Icon icon="solar:calculator-bold" className="text-gray-400" />
                                                            <Icon icon="solar:lock-keyhole-minimalistic-bold" className="text-gray-400" />
                                                        </>
                                                    }
                                                    min={1}
                                                />
                                            )}
                                        />
                                    </div>
                                    <Controller
                                        name={`parcels.${parcelIndex}.weight_unit`}
                                        control={control}
                                        defaultValue="kg"
                                        rules={{ required: isFieldRequired('weight_unit') ? 'Weight unit is required' : false }}
                                        render={({ field }) => (
                                            <Select
                                                {...field}
                                                isRequired={isFieldRequired('weight_unit')}
                                                label={<span>Weight Unit</span>}
                                                defaultSelectedKeys={['kg']}
                                                errorMessage={errors.parcels?.[parcelIndex]?.weight_unit?.message}
                                                isInvalid={!!errors.parcels?.[parcelIndex]?.weight_unit}
                                                className="hidden"
                                                color={!watch(`parcels.${parcelIndex}.weight_unit`) ? "warning" : "default"}
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
                                </div>
                            </CardBody>
                        </Card>
                    </>
                ))}

                <Button
                    type="button"
                    color="primary"
                    size="sm"
                    startContent={<Icon icon="solar:add-circle-bold" />}
                    onPress={() => {
                        // Clear rates since new parcel is being added
                        if (onClearRates) {
                            console.log('New parcel added, clearing rates...')
                            onClearRates()
                        }
                        appendParcel(DEFAULT_PARCEL)
                    }}
                >
                    Add Parcel
                </Button>

                {/* Customize Invoice Section */}
                <Card className="p-3 m-1">
                    <CardBody className="px-0 pt-0 pb-0">
                        <div className="flex flex-col gap-3">
                            {/* Show existing uploaded invoice if editing AND no new file selected */}
                            {customizeInvoiceUrl && !selectedFile && (
                                <a
                                    href={`${import.meta.env.VITE_APP_BACKEND_BASE_URL}/${customizeInvoiceUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 text-sm underline"
                                >
                                    View Existing Invoice
                                </a>
                            )}
                            <Controller
                                name="use_customize_invoice"
                                control={control}
                                render={({ field }) => (
                                    <Checkbox
                                        isSelected={field.value}
                                        onValueChange={(isSelected) => {
                                            field.onChange(isSelected);
                                            if (!isSelected) {
                                                // Clear file when unchecked
                                                setValue?.('customize_invoice_file', null);
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            } else {
                                                // If enabling and there's no file (and no existing URL), open file dialog
                                                if (!selectedFile && !customizeInvoiceUrl && fileInputRef.current) {
                                                    fileInputRef.current.click();
                                                }
                                            }
                                        }}
                                        classNames={{
                                            label: "text-sm font-normal text-gray-700"
                                        }}
                                    >
                                        {customizeInvoiceUrl ? 'Update Customize Invoice' : 'Upload Customize Invoice'}
                                    </Checkbox>
                                )}
                            />

                            {/* If user enabled upload but no file chosen (and no existing URL), show error */}
                            {useCustomizeInvoice && !selectedFile && !customizeInvoiceUrl && (
                                <p className="text-xs text-red-500">
                                    Please upload a PDF file (required when "Upload Customize Invoice" is enabled).
                                </p>
                            )}

                            {useCustomizeInvoice && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium">
                                        Invoice File (PDF only, max 10MB)
                                    </label>
                                    {selectedFile && (
                                        <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs text-green-700 font-semibold mb-1">
                                                        ✓ File Selected:
                                                    </p>
                                                    <p className="text-xs text-gray-700">
                                                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        color="primary"
                                                        variant="flat"
                                                        startContent={<Icon icon="solar:eye-bold" />}
                                                        onPress={() => {
                                                            const fileUrl = URL.createObjectURL(selectedFile)
                                                            window.open(fileUrl, '_blank')
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        color="danger"
                                                        variant="flat"
                                                        startContent={<Icon icon="solar:trash-bin-minimalistic-bold" />}
                                                        onPress={() => {
                                                            setSelectedFile(null)
                                                            setValue?.('customize_invoice_file', null)
                                                            if (fileInputRef.current) {
                                                                fileInputRef.current.value = ''
                                                            }
                                                        }}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) {
                                                // Validate file type
                                                if (file.type !== 'application/pdf') {
                                                    alert('Please upload a PDF file only')
                                                    e.target.value = ''
                                                    return
                                                }
                                                // Validate file size (10MB = 10 * 1024 * 1024 bytes)
                                                if (file.size > 10 * 1024 * 1024) {
                                                    alert('File size must be less than 10MB')
                                                    e.target.value = ''
                                                    return
                                                }
                                                setSelectedFile(file)
                                                setValue?.('customize_invoice_file', file)
                                            } else {
                                                setSelectedFile(null)
                                                setValue?.('customize_invoice_file', null)
                                            }
                                        }}
                                        className="block w-full text-sm text-gray-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-md file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-blue-50 file:text-blue-700
                                            hover:file:bg-blue-100
                                            cursor-pointer"
                                    />
                                    {selectedFile && (
                                        <p className="text-xs text-gray-500 italic">
                                            Note: The file input may appear empty due to browser security, but your file is still selected (shown above).
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </CardBody>
                </Card>

            </CardBody>

            <ParcelBoxTypeSelectModal
                isOpen={modalState.isOpen}
                onClose={closeBoxTypeModal}
                onSelect={handleBoxTypeSelect}
                selectedBoxType={modalState.parcelIndex !== null ?
                    (() => {
                        const found = boxTypes.find(boxType =>
                            boxType.box_type_name === watch(`parcels.${modalState.parcelIndex}.box_type_name`)
                        )
                        return found ? { ...found, remark: found.remark ?? null } : null
                    })() : null
                }
                boxTypes={boxTypes.map(boxType => ({ ...boxType, remark: boxType.remark ?? null }))}
                isLoading={isLoadingBoxTypes}
            />
        </>
    )
}

export default ParcelsSection