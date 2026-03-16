import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Button, Spinner } from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'
import { countries } from '@utils/countries'
import { isRateChosen } from '../../shipment/utils/rateUtils'
import { useAuth } from '@context/AuthContext'
import type { ShipmentGETData } from '@pages/shipment/components/shipment-details/types'
import { ParcelsSection } from '@pages/shipment/components/shipment-details'

const WarehouseShipmentDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { msLoginUser } = useAuth()
  const [shipment, setShipment] = useState<ShipmentGETData | null>(null)
  const [rawResponse, setRawResponse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchShipmentDetail = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID
        if (!apiUrl) {
          throw new Error('API URL not configured')
        }

        const response = await axios.get<any>(`${apiUrl}${id}`)
        console.log('Full API Response:', response)
        console.log('Response Data:', response.data)
        console.log('Shipment Request:', response.data?.shipment_request)
        setRawResponse(response.data)
        setShipment(response.data.shipment_request)
      } catch (err) {
        console.error('Error fetching shipment detail:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch shipment detail')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchShipmentDetail()
    }
  }, [id])

  const getCountryName = (countryCode: string): string => {
    const country = countries.find(c => c.code === countryCode)
    return country ? country.name : countryCode
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return 'Invalid Date'
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ""
    const [hours, minutes] = timeString.split(":")
    return `${parseInt(hours, 10)}:${minutes}`
  }

  if (loading) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </>
    )
  }

  if (error || !shipment) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <p className="text-danger">Error: {error || 'Shipment not found'}</p>
          <Button
            color="primary"
            onPress={() => navigate('/warehouse')}
          >
            Back to Warehouse
          </Button>
        </div>
      </>
    )
  }

  const chosenRate = shipment.rates?.find(rate => isRateChosen(rate.chosen))

  return (
    <>
      <div className="max-w-full mx-auto p-3 space-y-3">
        {/* Header */}
        <div className="flex justify-left gap-3 items-center">          
          <Button
            color="default"
            variant="bordered"
            startContent={<Icon icon="solar:arrow-left-linear" />}
            onPress={() => navigate('/warehouse')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Shipment Details ID - {shipment.shipmentRequestID} - Warehouse</h1>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            color="primary"
            startContent={<Icon icon="solar:eye-bold" />}
            onPress={() => {
              if (!shipment.files_label_url) return

              // Detect base64-encoded labels or special FedEx cases (label returned as base64 string)
              const isBase64Label = !shipment.files_label_url.startsWith('http') ||
                (chosenRate?.shipper_account_slug === 'fedex' && chosenRate?.shipper_account_description === 'FedEx Domestic Thailand')

              if (isBase64Label) {
                // Open a blank window and write an iframe with the base64 PDF
                const pdfWindow = window.open('')
                pdfWindow?.document.write(
                  `<iframe width='100%' height='100%' src='data:application/pdf;base64,${shipment.files_label_url}'></iframe>`
                )
                return
              }

              // Regular URL label - open in new tab
              window.open(shipment.files_label_url, '_blank')
            }}
            isDisabled={!shipment.files_label_url}
          >
            View Label
          </Button>
          <Button
            color="secondary"
            startContent={<Icon icon="solar:document-text-bold" />}
            onPress={() => {
              navigate(`/shipment/packing-slip/${shipment.shipmentRequestID}`)
            }}
          >
            View Packing Slip
          </Button>
        </div>

        {/* Main Details Card */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-lg font-semibold">Shipment Information</h2>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Requestor */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Requestor</p>
                <p className="font-medium text-base">{shipment.created_user_name}</p>
                <p className="text-sm text-gray-500">{shipment.created_user_mail}</p>
              </div>

              {/* Pickup Date & Time */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Pickup Date & Time</p>
                <p className="font-medium text-base">{formatDate(shipment.pick_up_date)}</p>
                <p className="text-sm text-gray-500">
                  {formatTime(shipment.pick_up_start_time)} - {formatTime(shipment.pick_up_end_time)}
                </p>
              </div>

              {/* Scope */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Scope</p>
                <p className="font-medium text-base">{shipment.shipment_scope_type?.toUpperCase()}</p>
              </div>

              {/* Topic & PO */}
              <div>
                <p className="text-sm text-gray-600 mb-1">Topic (PO)</p>
                <p className="font-medium text-base">{shipment.topic}</p>
                {shipment.po_number && (
                  <p className="text-sm text-gray-500">PO: {shipment.po_number}</p>
                )}
              </div>

              {/* From */}
              <div>
                <p className="text-sm text-gray-600 mb-1">From</p>
                <p className="font-medium text-base">{shipment.ship_from?.company_name}</p>
                <p className="text-sm text-gray-500">
                  {shipment.ship_from?.city}, {shipment.ship_from?.state}
                </p>
                <p className="text-sm text-gray-500">
                  {shipment.ship_from?.country ? getCountryName(shipment.ship_from.country) : ''}
                </p>
              </div>

              {/* To */}
              <div>
                <p className="text-sm text-gray-600 mb-1">To</p>
                <p className="font-medium text-base">{shipment.ship_to?.company_name}</p>
                <p className="text-sm text-gray-500">
                  {shipment.ship_to?.city}, {shipment.ship_to?.state}
                </p>
                <p className="text-sm text-gray-500">
                  {shipment.ship_to?.country ? getCountryName(shipment.ship_to.country) : ''}
                </p>
              </div>

              {/* Carrier */}
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600 mb-1">Carrier</p>
                {(() => {
                  if (shipment?.shipping_options?.toLowerCase() === 'grab_pickup') {
                    return <p className="font-medium text-base text-blue-500">Grab Pickup</p>
                  }
                  if (shipment?.shipping_options?.toLowerCase() === 'supplier_pickup') {
                    return <p className="font-medium text-base text-blue-500">Supplier Pickup</p>
                  }
                  if (chosenRate) {
                    return (
                      <div>
                        <p className="font-medium text-base">{chosenRate.shipper_account_description}</p>
                        <p className="text-sm text-gray-500">Service: {chosenRate.service_name}</p>
                      </div>
                    )
                  }
                  return <p className="text-sm text-gray-400">No carrier selected</p>
                })()}
              </div>
            </div>
          </CardBody>
        </Card>

        <ParcelsSection shipment={shipment} />

        {/* Raw API Response Card - Only for wawa@xenoptics.com */}
        {msLoginUser?.email?.toLowerCase() === 'wawa@xenoptics.com' && (
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-lg font-semibold">Raw API Response</h2>
            </CardHeader>
            <CardBody>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-[600px]">
                <pre className="text-xs font-mono">
                  {rawResponse === null
                    ? 'No response data (rawResponse is null)'
                    : JSON.stringify(rawResponse, null, 2)}
                </pre>
              </div>
            </CardBody>
          </Card>
        )}

      </div>
    </>
  )
}

export default WarehouseShipmentDetail
