import { Card, CardBody, Button } from '@heroui/react'
import { Icon } from '@iconify/react'

interface AlertToastProps {
  message: string
  type: 'success' | 'error'
  onClose: () => void
}

export const AlertToast = ({ message, type, onClose }: AlertToastProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5">
      <Card
        className={`min-w-[300px] max-w-md shadow-lg ${
          type === 'success'
            ? 'border-l-4 border-success bg-success-50'
            : 'border-l-4 border-danger bg-danger-50'
        }`}
      >
        <CardBody className="flex flex-row items-start gap-3 p-4">
          <Icon
            icon={
              type === 'success'
                ? 'solar:check-circle-bold'
                : 'solar:close-circle-bold'
            }
            className={type === 'success' ? 'text-success' : 'text-danger'}
            width={24}
          />
          <div className="flex-1">
            <p className={`text-sm font-medium ${
              type === 'success' ? 'text-success-800' : 'text-danger-800'
            }`}>
              {type === 'success' ? 'Success' : 'Error'}
            </p>
            <p className={`text-sm ${
              type === 'success' ? 'text-success-700' : 'text-danger-700'
            }`}>
              {message}
            </p>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
          >
            <Icon icon="solar:close-square-bold" width={18} />
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
