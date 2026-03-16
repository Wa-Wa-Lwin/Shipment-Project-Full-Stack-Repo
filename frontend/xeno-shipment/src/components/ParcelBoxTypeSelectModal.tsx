import React, { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Card,
  CardBody,
  Chip,
  Divider,
  Spinner
} from '@heroui/react'
import { Icon } from '@iconify/react'

interface BoxType {
  parcelBoxTypeID?: number | string
  type: string
  box_type_name: string
  depth: number
  width: number
  height: number
  dimension_unit: string
  parcel_weight: number
  weight_unit: string
  remark: string | null
  active?: number | boolean | null
}

interface ParcelBoxTypeSelectModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (boxType: BoxType) => void
  selectedBoxType?: BoxType | null
  boxTypes: BoxType[]
  isLoading?: boolean
}

export const ParcelBoxTypeSelectModal: React.FC<ParcelBoxTypeSelectModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  selectedBoxType,
  boxTypes,
  isLoading = false
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const categories = ['ALL', ...Array.from(new Set(boxTypes.map(boxType => boxType.type)))]

  const filteredBoxTypes = boxTypes.filter(boxType => {
    const matchesSearch = boxType.box_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (boxType.remark && boxType.remark.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'ALL' || boxType.type === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleSelect = (boxType: BoxType) => {
    onSelect(boxType)
    onClose()
  }

  const formatDimensions = (boxType: BoxType) => {
    if (boxType.depth === 0 && boxType.width === 0 && boxType.height === 0) {
      return 'Custom dimensions'
    }
    return `${boxType.depth} × ${boxType.width} × ${boxType.height} ${boxType.dimension_unit}`
  }

  const formatWeight = (boxType: BoxType) => {
    if (boxType.parcel_weight === 0) return 'Custom weight'
    // return `Max ${boxType.parcel_weight} ${boxType.weight_unit}`
    return `${boxType.parcel_weight} ${boxType.weight_unit}`
  }

  return (

    <Modal
      isOpen={isOpen}
      onClose={onClose}
      scrollBehavior="inside"
      classNames={{
        base: "max-w-full w-full h-[90vh]", // full width, nearly full height
        wrapper: "w-full m-0 p-0",          // remove margins
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <Icon icon="solar:box-linear" width={24} className="text-primary" />
          Select Parcel Box Type
        </ModalHeader>

        <ModalBody className="py-4">
          {/* Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Spinner size="lg" label="Loading box types..." />
            </div>
          ) : (
            <>
              {/* Search and Category Filter */}
              <div className="flex gap-3 mb-4">
                <Input
                  placeholder="Search box types by name or remark..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  startContent={<Icon icon="solar:magnifer-linear" width={20} />}
                  isClearable
                  onClear={() => setSearchQuery('')}
                  className="flex-1"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {categories.map((category) => (
                  <Chip
                    key={category}
                    size="sm"
                    variant={selectedCategory === category ? "solid" : "flat"}
                    color={selectedCategory === category ? "primary" : "default"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Chip>
                ))}
              </div>

              {/* Results Info */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  {filteredBoxTypes.length > 0
                    ? `${filteredBoxTypes.length} box type${filteredBoxTypes.length === 1 ? '' : 's'} found`
                    : 'No box types found'
                  }
                </p>
                {selectedBoxType && (
                  <Chip size="sm" color="success" variant="flat">
                    Current: {selectedBoxType.box_type_name}
                  </Chip>
                )}
              </div>

              {/* No Results */}
              {filteredBoxTypes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Icon icon="solar:inbox-linear" width={48} className="text-default-300 mb-4" />
                  <p className="text-default-500">No box types found</p>
                  <p className="text-default-400 text-sm">Try adjusting your search terms or category filter</p>
                </div>
              )}

              {/* Box Types Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {filteredBoxTypes.map((boxType) => {
                  const isSelected =
                    selectedBoxType?.parcelBoxTypeID !== undefined &&
                    boxType.parcelBoxTypeID !== undefined &&
                    String(selectedBoxType.parcelBoxTypeID) === String(boxType.parcelBoxTypeID)

                  return (
                    <Card
                      key={boxType.parcelBoxTypeID}
                      isPressable
                      isHoverable
                      className={`transition-all ${isSelected ? 'ring-2 ring-primary bg-primary-50' : ''
                        }`}
                      onPress={() => handleSelect(boxType)}
                    >
                      <CardBody className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-lg bg-primary-100">
                            <Icon
                              icon="solar:box-linear"
                              width={24}
                              className="text-primary-600"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-sm">{boxType.box_type_name}</h3>
                              {isSelected && (
                                <Chip size="sm" color="success" variant="solid">
                                  <Icon icon="solar:check-circle-bold" width={14} />
                                </Chip>
                              )}
                            </div>

                            <div className="mb-2 flex gap-2">
                              <Chip size="sm" color="secondary" variant="flat" className="text-xs">
                                {boxType.type}
                              </Chip>
                              {boxType.remark && (
                                <p className="text-xs text-default-600 mb-3">
                                  {boxType.remark}
                                </p>
                              )}
                            </div>

                            <Divider className="my-2" />

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-default-600">
                                  L x W x H
                                </span>
                                <Icon icon="solar:ruler-linear" width={14} className="text-default-400" />
                                <span className="text-xs text-default-600">
                                  {formatDimensions(boxType)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs text-default-600">
                                  Weight
                                </span>
                                <Icon icon="solar:scale-linear" width={14} className="text-default-400" />
                                <span className="text-xs text-default-600">
                                  {formatWeight(boxType)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  )
                })}
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
          >
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}