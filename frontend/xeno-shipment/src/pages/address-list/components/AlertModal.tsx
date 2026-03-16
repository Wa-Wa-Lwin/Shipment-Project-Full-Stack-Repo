import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@heroui/react'
import { Icon } from '@iconify/react'

interface AlertModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
  type: 'success' | 'error'
}

export const AlertModal = ({
  isOpen,
  onClose,
  message,
  type
}: AlertModalProps) => {
  const isSuccess = type === 'success'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      placement="center"
      backdrop="blur"
      classNames={{
        backdrop: "z-[9999]",
        wrapper: "z-[10000]"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3 pb-2">
          <div className={`p-2 rounded-full ${
            isSuccess ? 'bg-success-100' : 'bg-danger-100'
          }`}>
            <Icon
              icon={isSuccess ? 'solar:check-circle-bold' : 'solar:close-circle-bold'}
              className={isSuccess ? 'text-success-600' : 'text-danger-600'}
              width={32}
            />
          </div>
          <span className={`text-lg font-bold ${
            isSuccess ? 'text-success-700' : 'text-danger-700'
          }`}>
            {isSuccess ? 'Success!' : 'Error!'}
          </span>
        </ModalHeader>
        <ModalBody className="pt-2 pb-4">
          <p className={`text-base ${
            isSuccess ? 'text-success-800' : 'text-danger-800'
          }`}>
            {message}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button
            color={isSuccess ? 'success' : 'danger'}
            onPress={onClose}
            className="w-full"
            size="lg"
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
