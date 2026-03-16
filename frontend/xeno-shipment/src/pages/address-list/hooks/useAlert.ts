import { useState } from 'react'

interface AlertMessage {
  message: string
  type: 'success' | 'error'
}

export const useAlert = () => {
  const [alertMessage, setAlertMessage] = useState<AlertMessage | null>(null)
  const [isAlertOpen, setIsAlertOpen] = useState(false)

  const showAlert = (message: string, type: 'success' | 'error') => {
    setAlertMessage({ message, type })
    setIsAlertOpen(true)
  }

  const closeAlert = () => {
    setIsAlertOpen(false)
    // Delay clearing the message to allow modal close animation
    setTimeout(() => {
      setAlertMessage(null)
    }, 300)
  }

  return {
    alertMessage,
    isAlertOpen,
    showAlert,
    closeAlert
  }
}
