import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { useState, useRef } from 'react'

interface AddressImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File) => Promise<void>
  isImporting: boolean
}

export const AddressImportModal = ({
  isOpen,
  onClose,
  onImport,
  isImporting
}: AddressImportModalProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ]
      if (!validTypes.includes(file.type)) {
        setFileError('Please select a valid Excel file (.xlsx or .xls)')
        setSelectedFile(null)
        return
      }
      setFileError(null)
      setSelectedFile(file)
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setFileError('Please select a file to import')
      return
    }

    try {
      await onImport(selectedFile)
    } finally {
      // Always reset file selection after import attempt (success or failure)
      setSelectedFile(null)
      setFileError(null)
      // Reset the file input element so user can select the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setFileError(null)
    // Reset the file input element
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <ModalHeader>
          Import Addresses from Excel
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-warning-50 rounded-lg border border-warning-200">
              <div className="flex items-start gap-2">
                <Icon icon="solar:info-circle-bold" className="text-warning-600 mt-0.5" width={20} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-warning-800">Important Instructions:</p>
                  <ul className="text-sm text-warning-700 mt-2 list-disc list-inside space-y-1">
                    <li>Download the template first using "Export Template" button</li>
                    <li>Fill in the required fields: Card Code, Company Name</li>
                    <li>File must be in .xlsx or .xls format</li>
                    <li>Existing addresses (matching Card Code) will be updated</li>
                    <li>New addresses will be created automatically</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-2 border-dashed border-default-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                id="file-upload"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Icon icon="solar:cloud-upload-bold-duotone" width={48} className="text-primary" />
                <span className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select Excel file'}
                </span>
                <span className="text-xs text-default-400">
                  Supported formats: .xlsx, .xls (Max 10MB)
                </span>
              </label>
            </div>

            {fileError && (
              <div className="p-3 bg-danger-50 rounded-lg border border-danger-200">
                <p className="text-sm text-danger-700">{fileError}</p>
              </div>
            )}

            {selectedFile && !fileError && (
              <div className="flex items-center justify-between p-3 bg-success-50 rounded-lg border border-success-200">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:file-check-bold" className="text-success-600" width={20} />
                  <span className="text-sm font-medium text-success-800">{selectedFile.name}</span>
                  <span className="text-xs text-success-600">
                    ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="light"
                  color="danger"
                  onPress={() => setSelectedFile(null)}
                  startContent={<Icon icon="solar:trash-bin-minimalistic-bold" />}
                >
                  Remove
                </Button>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="default"
            onPress={handleClose}
            isDisabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            color="warning"
            onPress={handleImport}
            isLoading={isImporting}
            isDisabled={!selectedFile || !!fileError}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
