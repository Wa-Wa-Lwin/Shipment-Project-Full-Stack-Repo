import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react'
import { Icon } from '@iconify/react'

interface ErrorDetail {
  path: string
  info: string
}

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  details?: ErrorDetail[]
}

const ErrorModal = ({ isOpen, onClose, title, message, details }: ErrorModalProps) => {
  // Function to provide user-friendly error messages
  const getUserFriendlyMessage = (path: string, info: string): { field: string; message: string; suggestion: string } => {
    // Parse the API path to extract field information
    if (path.includes('parcels') && path.includes('items') && path.includes('description')) {
      return {
        field: 'Item Description',
        message: 'Item description is required for all parcel items',
        suggestion: 'Please add a description for each item in your parcels'
      }
    }

    if (path.includes('parcels') && path.includes('dimension')) {
      if (path.includes('width')) {
        return {
          field: 'Parcel Width',
          message: 'Parcel width must be greater than 0',
          suggestion: 'Please enter a valid width for your parcel dimensions'
        }
      }
      if (path.includes('height')) {
        return {
          field: 'Parcel Height',
          message: 'Parcel height must be greater than 0',
          suggestion: 'Please enter a valid height for your parcel dimensions'
        }
      }
      if (path.includes('depth')) {
        return {
          field: 'Parcel Length',
          message: 'Parcel length must be greater than 0',
          suggestion: 'Please enter a valid depth for your parcel dimensions'
        }
      }
    }

    if (path.includes('parcels') && path.includes('weight')) {
      return {
        field: 'Parcel Item Weight',
        message: 'Parcel Item weight must be greater than 0',
        suggestion: 'Please enter a valid weight for your parcel items'
      }
    }

    if (path.includes('ship_from')) {
      return {
        field: 'Ship From Address',
        message: 'Ship from address information is incomplete',
        suggestion: 'Please complete all required ship from address fields'
      }
    }

    if (path.includes('ship_to')) {
      return {
        field: 'Ship To Address',
        message: 'Ship to address information is incomplete',
        suggestion: 'Please complete all required ship to address fields'
      }
    }

    if (path.includes('items') && path.includes('quantity')) {
      return {
        field: 'Item Quantity',
        message: 'Item quantity must be at least 1',
        suggestion: 'Please enter a valid quantity for each item'
      }
    }

    if (path.includes('items') && path.includes('weight')) {
      return {
        field: 'Item Weight',
        message: 'Item weight must be greater than 0',
        suggestion: 'Please enter a valid weight for each item'
      }
    }

    if (path.includes('items') && path.includes('price')) {
      return {
        field: 'Item Price',
        message: 'Item price must be greater than 0',
        suggestion: 'Please enter a valid price for each item'
      }
    }

    // Default fallback
    return {
      field: path.split('.').pop() || 'Field',
      message: info,
      suggestion: 'Please check and correct this field'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[80vh]",
        body: "p-6"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Icon icon="solar:danger-circle-bold" className="text-red-500 text-2xl" />
          <div>
            <h2 className="text-xl font-semibold text-red-600">{title}</h2>
            <p className="text-sm text-gray-600">Please review and fix the following issues</p>
          </div>
        </ModalHeader>

        <ModalBody>
          {message && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{message}</p>
            </div>
          )}

          {details && details.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">Validation Errors:</h3>
              {details.map((detail, index) => {
                const friendlyError = getUserFriendlyMessage(detail.path, detail.info)
                return (
                  <div key={index} className="p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                    <div className="flex items-start">
                      <Icon icon="solar:close-circle-bold" className="text-red-400 text-lg mt-0.5 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-red-800">{friendlyError.field}</h4>
                          <code className="bg-red-100 px-2 py-1 rounded text-xs text-red-600">{detail.path}</code>
                        </div>
                        <p className="text-red-700 mb-2 whitespace-pre-line">
                          {friendlyError.message}
                        </p>
                        <div className="flex items-start">
                          <Icon icon="solar:lightbulb-bold" className="text-amber-500 text-sm mt-0.5 mr-2 flex-shrink-0" />
                          <p className="text-amber-700 text-sm font-medium">{friendlyError.suggestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Icon icon="solar:info-circle-bold" className="text-blue-500 text-lg mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Quick Fix Checklist:</h4>
                <ul className="text-blue-700 space-y-1 text-sm">
                  <li>• <strong>Item Descriptions:</strong> Add descriptions for all items in every parcel</li>
                  <li>• <strong>Parcel Dimensions:</strong> Ensure width, height, and depth are greater than 0</li>
                  <li>• <strong>Weights:</strong> Verify all item and parcel weights are positive numbers</li>
                  <li>• <strong>Quantities:</strong> Make sure all item quantities are at least 1</li>
                  <li>• <strong>Addresses:</strong> Complete all required address fields for ship from and ship to</li>
                  <li>• <strong>Pricing:</strong> Enter valid prices for all items</li>
                </ul>
              </div>
            </div>
          </div> */}
        </ModalBody>

        <ModalFooter>
          <Button
            color="primary"
            onPress={onClose}
            startContent={<Icon icon="solar:check-circle-bold" />}
          >
            I'll Fix These Issues
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default ErrorModal