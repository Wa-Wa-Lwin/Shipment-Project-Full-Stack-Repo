import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react'
import { Icon } from '@iconify/react'

interface ImportValidationErrorModalProps {
  isOpen: boolean
  onClose: () => void
  validationError: {
    message: string
    missingColumns?: string[]
    requiredColumns?: string[]
  }
}

export const ImportValidationErrorModal = ({
  isOpen,
  onClose,
  validationError
}: ImportValidationErrorModalProps) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "z-[9999]",
        wrapper: "z-[10000]"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2 text-danger">
          <Icon icon="solar:danger-triangle-bold" width={24} />
          <span>Import Failed - Missing Required Columns</span>
        </ModalHeader>
        <ModalBody className="max-h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="p-4 bg-danger-50 rounded-lg border-2 border-danger-200">
              <p className="text-sm font-bold text-danger-800 mb-3">
                {validationError.message}
              </p>

              {validationError.missingColumns && validationError.missingColumns.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:close-circle-bold" className="text-danger-600" width={20} />
                    <p className="text-sm font-bold text-danger-700">Missing Columns:</p>
                  </div>
                  <ul className="ml-7 space-y-1">
                    {validationError.missingColumns.map((col, idx) => (
                      <li key={idx} className="text-sm text-danger-600 font-medium">
                        • {col}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationError.requiredColumns && validationError.requiredColumns.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon icon="solar:check-circle-bold" className="text-warning-600" width={20} />
                    <p className="text-sm font-bold text-danger-700">All Required Columns:</p>
                  </div>
                  <div className="ml-7 grid grid-cols-2 gap-2">
                    {validationError.requiredColumns.map((col, idx) => (
                      <div key={idx} className="text-xs text-danger-600">
                        • {col}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-warning-50 rounded-lg border border-warning-300">
              <div className="flex items-start gap-2">
                <Icon icon="solar:lightbulb-bolt-bold" className="text-warning-600 mt-0.5" width={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning-800 mb-2">How to fix this:</p>
                  <ol className="text-sm text-warning-700 space-y-1 list-decimal list-inside">
                    <li>Click "Export Template" button to download the correct template</li>
                    <li>Copy your data to the new template file</li>
                    <li>Make sure all required columns are present</li>
                    <li>Try importing again</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="flat"
            onPress={onClose}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
