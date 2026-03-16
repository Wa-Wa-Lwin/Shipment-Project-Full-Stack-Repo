import React from 'react'
import { Modal, ModalContent, ModalBody, Button } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useNotification } from '@context/NotificationContext'
import type { NotificationType } from '@context/NotificationContext'

const NotificationContainer: React.FC = () => {
  const { notifications, hideNotification } = useNotification()

  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          icon: 'solar:check-circle-bold',
          iconColor: 'text-green-500',
          titleColor: 'text-green-600'
        }
      case 'error':
        return {
          icon: 'solar:close-circle-bold',
          iconColor: 'text-red-500',
          titleColor: 'text-red-600'
        }
      case 'warning':
        return {
          icon: 'solar:danger-triangle-bold',
          iconColor: 'text-yellow-500',
          titleColor: 'text-yellow-600'
        }
      case 'info':
        return {
          icon: 'solar:info-circle-bold',
          iconColor: 'text-blue-500',
          titleColor: 'text-blue-600'
        }
      default:
        return {
          icon: 'solar:info-circle-bold',
          iconColor: 'text-gray-500',
          titleColor: 'text-gray-600'
        }
    }
  }

  if (notifications.length === 0) return null

  return (
    <>
      {notifications.map((notification) => {
        const config = getNotificationConfig(notification.type)

        return (
          <Modal
            key={notification.id}
            isOpen={true}
            onClose={() => hideNotification(notification.id)}
            isDismissable={false} // auto disappear -> false 
            hideCloseButton={false}
            backdrop="blur"
            classNames={{
              backdrop: "backdrop-blur-md"
            }}
          >
            <ModalContent>
              <ModalBody className="py-8">
                <div className="flex flex-col items-center justify-center gap-4">
                  <Icon
                    icon={config.icon}
                    className={`text-6xl ${config.iconColor} animate-pulse`}
                  />
                  {notification.title && (
                    <h2 className={`text-2xl font-bold ${config.titleColor}`}>
                      {notification.title}
                    </h2>
                  )}
                  <p className="text-gray-500 text-center whitespace-pre-line">
                    {notification.message}
                  </p>

                  {notification.action && (
                    <div className="mt-4">
                      <Button
                        size="lg"
                        variant="solid"
                        color={notification.type === 'error' ? 'danger' : 'primary'}
                        onPress={notification.action.onClick}
                      >
                        {notification.action.label}
                      </Button>
                    </div>
                  )}
                </div>
              </ModalBody>
            </ModalContent>
          </Modal>
        )
      })}
    </>
  )
}

export default NotificationContainer