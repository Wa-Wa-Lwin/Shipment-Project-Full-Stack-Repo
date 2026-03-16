import axios from 'axios'

export const addressService = {
  /**
   * Export all active addresses to Excel
   */
  exportAll: async (): Promise<Blob> => {
    const response = await axios.get('/api/logistics/exportAddresses', {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Export empty template for address import
   */
  exportTemplate: async (): Promise<Blob> => {
    const response = await axios.get('/api/logistics/exportAddressTemplate', {
      responseType: 'blob'
    })
    return response.data
  },

  /**
   * Import addresses from Excel file
   */
  importAddresses: async (file: File, userId: number, userName: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId.toString())
    formData.append('user_name', userName)

    const response = await axios.post('/api/logistics/importAddresses', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  /**
   * Download a blob file
   */
  downloadFile: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(new Blob([blob]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}
