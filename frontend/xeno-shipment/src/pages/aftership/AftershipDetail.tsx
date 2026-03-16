import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Chip,
  Divider
} from '@heroui/react'
import { Icon } from '@iconify/react'
import axios from 'axios'

interface AftershipLabelDetail {
  id: string
  tracking_numbers: string[]
  status: string
  created_at: string
  updated_at: string
  ship_date: string
  delivery_date?: string
  shipper_account: {
    id: string
    slug: string
  }
  service_type: string
  service_name?: string
  shipment?: {
    parcels: Array<{
      box_type: string
      dimension: {
        width: number
        height: number
        depth: number
        unit: string
      }
      weight: {
        value: number
        unit: string
      }
      items: unknown[]
    }>
    ship_from: {
      company_name: string
      contact_name: string
      street1: string
      street2?: string
      city: string
      state: string
      postal_code: string
      country: string
      phone: string
      email: string
    }
    ship_to: {
      company_name: string
      contact_name: string
      street1: string
      street2?: string
      city: string
      state: string
      postal_code: string
      country: string
      phone: string
      email: string
    }
  }
  rate?: {
    shipper_account?: {
      id: string
      slug: string
      description: string
    }
    service_type?: string
    service_name?: string
    charge_weight: {
      value: number
      unit: string
    }
    total_charge: {
      amount: number
      currency: string
    }
    dimensional_weight?: {
      value: number
      unit: string
    }
  }
  files?: {
    label?: {
      paper_size: string
      url: string
    }
    invoice?: {
      paper_size: string
      url: string
    }
    packing_slip?: {
      paper_size: string
      url: string
    }
  }
  metadata?: Record<string, unknown>
}

const AftershipDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [label, setLabel] = useState<AftershipLabelDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchLabelDetail()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const fetchLabelDetail = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await axios.get(`${import.meta.env.VITE_APP_AFTERSHIP_GET_LABEL_BY_ID}${id}`)

      if (response.data && response.data.data) {
        setLabel(response.data.data)
      }
    } catch (err) {
      console.error('Error fetching label detail:', err)
      setError((err as Error).message || 'Failed to fetch label details')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex gap-2 py-1">
      <span className="font-semibold text-sm min-w-[150px]">{label}:</span>
      <span className="text-sm text-default-600">{value || '-'}</span>
    </div>
  )

  const AddressCard = ({
    title,
    address
  }: {
    title: string;
    address: {
      company_name?: string;
      contact_name?: string;
      street1?: string;
      street2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      phone?: string;
      email?: string;
    }
  }) => (
    <Card className="flex-1">
      <CardHeader>
        <h3 className="text-lg font-semibold">{title}</h3>
      </CardHeader>
      <CardBody className="space-y-1">
        <DetailRow label="Company" value={address?.company_name} />
        <DetailRow label="Contact" value={address?.contact_name} />
        <DetailRow label="Street 1" value={address?.street1} />
        {address?.street2 && <DetailRow label="Street 2" value={address?.street2} />}
        <DetailRow label="City" value={address?.city} />
        <DetailRow label="State" value={address?.state} />
        <DetailRow label="Postal Code" value={address?.postal_code} />
        <DetailRow label="Country" value={address?.country} />
        <DetailRow label="Phone" value={address?.phone} />
        <DetailRow label="Email" value={address?.email} />
      </CardBody>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !label) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-600">Error: {error || 'Label not found'}</p>
        <div className="flex gap-2">
          <Button color="primary" onPress={() => navigate('/aftership')}>
            Back to List
          </Button>
          <Button color="secondary" onPress={fetchLabelDetail}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              isIconOnly
              variant="light"
              onPress={() => navigate('/aftership')}
            >
              <Icon icon="solar:arrow-left-linear" width={24} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Label Details</h1>
              <p className="text-small text-default-400 font-mono">{label.id}</p>
            </div>
          </div>
          <Chip
            color={
              label.status === 'delivered' ? 'success' :
              label.status === 'in_transit' ? 'primary' :
              label.status === 'created' ? 'warning' :
              'default'
            }
            variant="flat"
            size="lg"
          >
            {label.status.toUpperCase()}
          </Chip>
        </CardHeader>
        <CardBody className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold mb-2">General Information</h2>
            <div className="grid md:grid-cols-2 gap-x-8">
              <DetailRow label="Created Date" value={formatDate(label.created_at)} />
              <DetailRow label="Updated Date" value={formatDate(label.updated_at)} />
              <DetailRow label="Ship Date" value={formatDate(label.ship_date)} />
              {label.delivery_date && (
                <DetailRow label="Delivery Date" value={formatDate(label.delivery_date)} />
              )}
              <DetailRow
                label="Shipper Account"
                value={label.rate?.shipper_account?.description || label.shipper_account?.slug}
              />
              <DetailRow
                label="Carrier Slug"
                value={label.rate?.shipper_account?.slug || label.shipper_account?.slug}
              />
              <DetailRow label="Service Type" value={label.service_type} />
              <DetailRow
                label="Service Name"
                value={label.rate?.service_name || label.service_name}
              />
            </div>
          </section>

          <Divider />

          <section>
            <h2 className="text-lg font-semibold mb-2">Tracking Numbers</h2>
            <div className="flex flex-wrap gap-2">
              {label.tracking_numbers?.map((tn, idx) => (
                <Chip key={idx} variant="bordered" className="font-mono">
                  {tn}
                </Chip>
              ))}
            </div>
          </section>

          {label.rate && (
            <>
              <Divider />
              <section>
                <h2 className="text-lg font-semibold mb-2">Rate Information</h2>
                <div className="grid md:grid-cols-2 gap-x-8">
                  <DetailRow
                    label="Charge Weight"
                    value={label.rate.charge_weight ? `${label.rate.charge_weight.value} ${label.rate.charge_weight.unit}` : '-'}
                  />
                  {label.rate.dimensional_weight && (
                    <DetailRow
                      label="Dimensional Weight"
                      value={label.rate.dimensional_weight ? `${label.rate.dimensional_weight.value} ${label.rate.dimensional_weight.unit}` : '-'}
                    />
                  )}
                  <DetailRow
                    label="Total Charge"
                    value={
                      label.rate.total_charge ? (
                        <span className="font-bold text-primary">
                          {label.rate.total_charge.currency} {label.rate.total_charge.amount}
                        </span>
                      ) : '-'
                    }
                  />
                </div>
              </section>
            </>
          )}

          {label.files && (
            <>
              <Divider />
              <section>
                <h2 className="text-lg font-semibold mb-3">Files</h2>
                <div className="flex flex-wrap gap-2">
                  {label.files.label && (
                    <Button
                      color="primary"
                      startContent={<Icon icon="solar:document-text-bold" />}
                      onPress={() => window.open(label.files?.label?.url, '_blank')}
                    >
                      View Label ({label.files.label.paper_size})
                    </Button>
                  )}
                  {label.files.invoice && (
                    <Button
                      color="secondary"
                      startContent={<Icon icon="solar:bill-list-bold" />}
                      onPress={() => window.open(label.files?.invoice?.url, '_blank')}
                    >
                      View Invoice ({label.files.invoice.paper_size})
                    </Button>
                  )}
                  {label.files.packing_slip && (
                    <Button
                      color="success"
                      startContent={<Icon icon="solar:clipboard-list-bold" />}
                      onPress={() => window.open(label.files?.packing_slip?.url, '_blank')}
                    >
                      View Packing Slip ({label.files.packing_slip.paper_size})
                    </Button>
                  )}
                </div>
              </section>
            </>
          )}
        </CardBody>
      </Card>

      {label.shipment && (
        <>
          <div className="flex gap-4">
            <AddressCard title="Ship From" address={label.shipment.ship_from} />
            <AddressCard title="Ship To" address={label.shipment.ship_to} />
          </div>

          {label.shipment.parcels && label.shipment.parcels.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Parcels</h2>
              </CardHeader>
              <CardBody>
                {label.shipment.parcels.map((parcel, idx) => (
                  <div key={idx} className="mb-4 last:mb-0">
                    <h3 className="font-semibold text-sm mb-2">Parcel #{idx + 1}</h3>
                    <div className="grid md:grid-cols-2 gap-x-8">
                      <DetailRow label="Box Type" value={parcel.box_type} />
                      <DetailRow
                        label="Weight"
                        value={parcel.weight ? `${parcel.weight.value} ${parcel.weight.unit}` : '-'}
                      />
                      <DetailRow
                        label="Dimensions"
                        value={parcel.dimension ? `${parcel.dimension.width} × ${parcel.dimension.height} × ${parcel.dimension.depth} ${parcel.dimension.unit}` : '-'}
                      />
                    </div>
                    {label?.shipment?.parcels && idx < label.shipment.parcels.length - 1 && (
                      <Divider className="mt-4" />
                    )}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {label.metadata && Object.keys(label.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Metadata</h2>
          </CardHeader>
          <CardBody>
            <pre className="text-xs bg-default-100 p-4 rounded overflow-auto">
              {JSON.stringify(label.metadata, null, 2)}
            </pre>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

export default AftershipDetail
