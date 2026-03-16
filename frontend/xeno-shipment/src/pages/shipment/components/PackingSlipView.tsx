import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { Spinner, Button } from '@heroui/react'
import { useReactToPrint } from 'react-to-print'
import { Icon } from '@iconify/react'
import type { ShipmentGETData } from './shipment-details'


interface PackingSlipResponse {
  shipment_request: ShipmentGETData
}

const PackingSlipView = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const [shipment, setShipment] = useState<ShipmentGETData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchShipmentData = async () => {
      try {
        setLoading(true)
        const apiUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID
        if (!apiUrl) {
          throw new Error('API URL not configured')
        }

        const response = await axios.get<PackingSlipResponse>(`${apiUrl}${shipmentId}`)
        setShipment(response.data.shipment_request)
      } catch (err) {
        console.error('Error fetching shipment:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch shipment data')
      } finally {
        setLoading(false)
      }
    }

    if (shipmentId) {
      fetchShipmentData()
    }
  }, [shipmentId])

  // Set document title
  useEffect(() => {
    if (shipment) {
      document.title = `Packing List - ${shipment.shipmentRequestID}`
    }
  }, [shipment])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Packing_List_${shipment?.invoice_no || shipmentId}`,
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !shipment) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">Error: {error || 'Shipment not found'}</p>
      </div>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const isXenoptics = (companyName?: string) => {
    return companyName?.toLowerCase().startsWith('xenoptics') || false
  }

  // Calculate totals
  const totalPackages = shipment.parcels.length
  const totalNetWeight = shipment.parcels.reduce(
    (sum, parcel) => sum + parseFloat(parcel.net_weight_value || '0'),
    0
  )
  const totalGrossWeight = shipment.parcels.reduce(
    (sum, parcel) => sum + parseFloat(parcel.weight_value || '0'),
    0
  )
  const weightUnit = shipment.parcels[0]?.weight_unit || 'kg'

  // Chunk parcels into pages based on item count (max 10 items per page)
  // This will split parcels across pages if they have more than 10 items
  const ITEMS_PER_PAGE = 10

  type Parcel = NonNullable<ShipmentGETData['parcels']>[number]
  type ParcelItem = NonNullable<ShipmentGETData['parcels']>[number]['items'][number]

  interface ParcelWithMetadata extends Parcel {
    originalParcelIndex: number
    itemsSubset: ParcelItem[]
    isPartial: boolean
    showParcelInfo: boolean // Show package number, box info only on first occurrence
    startItemIndex: number // Track the starting index of items in the original parcel
  }

  const chunkParcelsByItems = (parcels: Parcel[]) => {
    const pages: ParcelWithMetadata[][] = []
    let currentPage: ParcelWithMetadata[] = []
    let currentItemCount = 0

    parcels.forEach((parcel, parcelIndex) => {
      const items = parcel.items || []

      if (items.length === 0) {
        // Handle parcel with no items
        if (currentItemCount >= ITEMS_PER_PAGE && currentPage.length > 0) {
          pages.push(currentPage)
          currentPage = []
          currentItemCount = 0
        }
        currentPage.push({
          ...parcel,
          originalParcelIndex: parcelIndex,
          itemsSubset: [],
          isPartial: false,
          showParcelInfo: true,
          startItemIndex: 0 // No items, so 0
        })
        currentItemCount += 1
      } else {
        // Split items across pages if needed
        let itemIndex = 0
        let isFirstChunk = true

        while (itemIndex < items.length) {
          const remainingSpace = ITEMS_PER_PAGE - currentItemCount
          const itemsToTake = Math.min(remainingSpace, items.length - itemIndex)

          if (itemsToTake > 0) {
            const itemsSubset = items.slice(itemIndex, itemIndex + itemsToTake)
            currentPage.push({
              ...parcel,
              originalParcelIndex: parcelIndex,
              itemsSubset: itemsSubset,
              isPartial: items.length > itemsToTake || itemIndex > 0,
              showParcelInfo: isFirstChunk,
              startItemIndex: itemIndex // Track where these items start in the original parcel
            })
            currentItemCount += itemsToTake
            itemIndex += itemsToTake
            isFirstChunk = false
          }

          // If page is full or we've processed all items, move to next page
          if (currentItemCount >= ITEMS_PER_PAGE && itemIndex < items.length) {
            pages.push(currentPage)
            currentPage = []
            currentItemCount = 0
          }
        }
      }
    })

    // Add last page if not empty
    if (currentPage.length > 0) {
      pages.push(currentPage)
    }

    return pages.length > 0 ? pages : [[]]
  }

  const parcelPages = chunkParcelsByItems(shipment.parcels)
  const totalPages = parcelPages.length

  // Header component
  const PackingSlipHeader = () => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '55%' }}>
          <img
            src="/xeno-shipment/xenoptics_original_logo.png"
            alt="Logo"
            style={{ width: '300px', height: 'auto' }}
          />
        </div>
        <div style={{ width: '45%', textAlign: 'right' }}>
          <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0' }}>
            Packing List No: <span style={{ fontWeight: 'normal' }}>{shipment.invoice_no}</span>
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Packing List Date:</strong> {formatDate(shipment.approver_approved_date_time)}
          </p>
        </div>
      </div>

      {/* Address Section */}
      <div style={{ marginTop: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
          {/* Shipper */}
          <div style={{ flex: '2', padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              Shipper / Exporter:
            </div>
            {shipment.shipment_scope_type?.toLowerCase().includes('export') || isXenoptics(shipment.ship_from?.company_name) ? (
              <>
                <strong>Xenoptics Limited.</strong><br />
                195 Moo.3 Bypass Chiangmai-Hangdong<br />
                T. Namphrae, A. Hang Dong, Chiang Mai 50230<br />
                Thailand<br />
                Tel: +66 52081400<br />
                Email: info@xenoptics.com
              </>
            ) : (
              <>
                <strong>{shipment.ship_from?.company_name}</strong><br />
                {shipment.ship_from?.street1 && <>{shipment.ship_from.street1}<br /></>}
                {shipment.ship_from?.street2 && <>{shipment.ship_from.street2}<br /></>}
                {shipment.ship_from?.street3 && <>{shipment.ship_from.street3}<br /></>}
                {shipment.ship_from?.city}, {shipment.ship_from?.state} {shipment.ship_from?.postal_code}<br />
                {shipment.ship_from?.country}<br />
                Tel: {shipment.ship_from?.phone}<br />
                Email: {shipment.ship_from?.email}<br />
                Contact: {shipment.ship_from?.contact_name}
              </>
            )}
          </div>

          {/* Bill To */}
          <div style={{ flex: '1.5', padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              Bill To:
            </div>
            <strong>{shipment.ship_to?.company_name}</strong><br />
            {shipment.ship_to?.street1 && <>{shipment.ship_to.street1}<br /></>}
            {shipment.ship_to?.street2 && <>{shipment.ship_to.street2}<br /></>}
            {shipment.ship_to?.street3 && <>{shipment.ship_to.street3}<br /></>}
            {shipment.ship_to?.city}, {shipment.ship_to?.state} {shipment.ship_to?.postal_code}<br />
            {shipment.ship_to?.country}<br />
            Tel: {shipment.ship_to?.phone}<br />
            Email: {shipment.ship_to?.email}<br />
            Contact: {shipment.ship_to?.contact_name}
          </div>

          {/* Delivery To */}
          <div style={{ flex: '1.5', padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              Delivery To:
            </div>
            <strong>{shipment.ship_to?.company_name}</strong><br />
            {shipment.ship_to?.street1 && <>{shipment.ship_to.street1}<br /></>}
            {shipment.ship_to?.street2 && <>{shipment.ship_to.street2}<br /></>}
            {shipment.ship_to?.street3 && <>{shipment.ship_to.street3}<br /></>}
            {shipment.ship_to?.city}, {shipment.ship_to?.state} {shipment.ship_to?.postal_code}<br />
            {shipment.ship_to?.country}<br />
            Tel: {shipment.ship_to?.phone}<br />
            Email: {shipment.ship_to?.email}<br />
            Contact: {shipment.ship_to?.contact_name}
          </div>
        </div>
      </div>
    </div>
  )

  // Footer component
  const PackingSlipFooter = ({ pageNumber }: { pageNumber: number }) => (
    <div style={{
      position: 'absolute',
      bottom: '15mm',
      left: '15mm',
      right: '15mm',
      textAlign: 'center',
      fontSize: '11px',
      borderTop: '1px solid #ccc',
      paddingTop: '5px'
    }}>
      <div>Page {pageNumber} of {totalPages}</div>
      <div style={{ marginTop: '3px' }}>Xenoptics Ltd. All rights reserved.</div>
    </div>
  )

  return (
    <div>
      {/* Download Button - Not printed */}
      <div className="no-print flex gap-10 items-center justify-center" style={{ padding: '20px', textAlign: 'center', background: '#f0f0f0' }}>
        <Button
          color="default"
          size="md"
          onPress={() => navigate(-1)}
          startContent={<Icon icon="solar:arrow-left-bold" />}
        >
          Back
        </Button>
        <h2 className="text-lg font-semibold">Shipment Request ID - {shipment.shipmentRequestID} | Packing Slip</h2>
        <Button
          color="primary"
          size="md"
          onPress={() => handlePrint()}
          startContent={<Icon icon="solar:download-bold" />}
        >
          Download as PDF
        </Button>
      </div>

      {/* Printable Content */}
      <div ref={printRef}>
        <style>
          {`
            @media print {
              @page {
                size: A4;
                margin: 0;
              }

              .no-print {
                display: none !important;
              }

              .page-break {
                page-break-after: always;
                break-after: page;
              }

              body {
                margin: 0;
                padding: 0;
              }

              .packing-table thead {
                display: table-header-group;
              }

              .packing-table tr {
                page-break-inside: avoid;
              }
            }

            @media screen {
              .packing-page {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin-bottom: 20px;
              }
            }
          `}
        </style>

        {parcelPages.map((pageParcels, pageIndex) => {
          const isLastPage = pageIndex === totalPages - 1

          return (
            <div
              key={pageIndex}
              className={`packing-page ${pageIndex < totalPages - 1 ? 'page-break' : ''}`}
              style={{
                width: '210mm',
                minHeight: '297mm',
                height: '297mm',
                margin: '0 auto',
                padding: '15mm',
                background: 'white',
                position: 'relative',
                fontFamily: 'Arial, sans-serif',
                fontSize: '11px',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              {/* Header on every page */}
              <PackingSlipHeader />

              {/* Parcels Table */}
              <div style={{ marginBottom: '80px' }}>
                <table className="packing-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0', textAlign: 'center' }}>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '60px' }}>Package No.</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '120px' }}>Material Code</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>Description</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '40px' }}>Qty</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '120px' }}>Box Type</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '80px' }}>Dimension<br />LxWxH<br />(cm)</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '70px' }}>Net Weight<br />(kg)</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '70px' }}>Gross Weight<br />(kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageParcels.map((parcelData, parcelChunkIndex) => {
                      const items = parcelData.itemsSubset
                      const rowspan = items.length || 1
                      const packageNumber = parcelData.originalParcelIndex + 1
                      const showParcelInfo = parcelData.showParcelInfo
                      const startItemIndex = parcelData.startItemIndex

                      return items.length > 0 ? (
                        items.map((item, itemIndex) => (
                          <tr key={`${parcelChunkIndex}-${itemIndex}`}>
                            {itemIndex === 0 && showParcelInfo && (
                              <td
                                rowSpan={rowspan}
                                style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}
                              >
                                {packageNumber}
                              </td>
                            )}
                            {itemIndex === 0 && !showParcelInfo && (
                              <td
                                rowSpan={rowspan}
                                style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top', fontStyle: 'italic', color: '#666' }}
                              >
                                {packageNumber}
                                <br />
                                (cont.)
                              </td>
                            )}
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                              {startItemIndex + itemIndex + 1} - {item.material_code || item.sku}
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.sku}</td>
                            <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                              {item.quantity || 1}
                            </td>
                            {itemIndex === 0 && showParcelInfo && (
                              <>
                                <td
                                  rowSpan={rowspan}
                                  style={{ border: '1px solid #ccc', padding: '6px', verticalAlign: 'top' }}
                                >
                                  {parcelData.box_type_name}
                                </td>
                                <td
                                  rowSpan={rowspan}
                                  style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}
                                >
                                  {Math.round(parseFloat(parcelData.depth))} x{' '}
                                  {Math.round(parseFloat(parcelData.height))} x{' '}
                                  {Math.round(parseFloat(parcelData.width))}
                                </td>
                                <td
                                  rowSpan={rowspan}
                                  style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}
                                >
                                  {parseFloat(parcelData.net_weight_value || '0') < 0.01
                                    ? "0.01"
                                    : parseFloat(parcelData.net_weight_value || '0').toFixed(2)}
                                </td>
                                <td
                                  rowSpan={rowspan}
                                  style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top' }}
                                >
                                  {parseFloat(parcelData.weight_value || '0').toFixed(2)}
                                </td>
                              </>
                            )}
                            {itemIndex === 0 && !showParcelInfo && (
                              <>
                                <td
                                  rowSpan={rowspan}
                                  colSpan={4}
                                  style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', verticalAlign: 'top', fontStyle: 'italic', color: '#666' }}
                                >
                                  (Continued from previous page)
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr key={parcelChunkIndex}>
                          <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                            {packageNumber}
                          </td>
                          <td colSpan={3} style={{ border: '1px solid #ccc', padding: '6px' }}>
                            No items
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '6px' }}>{parcelData.box_type_name}</td>
                          <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                            {Math.round(parseFloat(parcelData.width))} x{' '}
                            {Math.round(parseFloat(parcelData.height))} x{' '}
                            {Math.round(parseFloat(parcelData.depth))}
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                            {parseFloat(parcelData.net_weight_value || '0') < 0.01
                              ? "0.01"
                              : parseFloat(parcelData.net_weight_value || '0').toFixed(2)}
                          </td>
                          <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                            {parseFloat(parcelData.weight_value || '0').toFixed(2)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Summary - show on last page or "to be continued" */}
                <div style={{ marginTop: '15px', fontSize: '12px' }}>
                  {isLastPage ? (
                    <>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Total:</strong> {totalPackages} {totalPackages === 1 ? 'Package' : 'Packages'}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Total Net Weight:</strong> {totalNetWeight.toFixed(2)} {weightUnit}
                        {Math.ceil(totalNetWeight) > 1 ? 's' : ''}
                      </p>
                      <p style={{ margin: '5px 0' }}>
                        <strong>Total Gross Weight:</strong> {totalGrossWeight.toFixed(2)} {weightUnit}
                        {Math.ceil(totalGrossWeight) > 1 ? 's' : ''}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: '5px 0', fontStyle: 'italic' }}>
                      To be continued on next page...
                    </p>
                  )}
                </div>
              </div>

              {/* Footer on every page */}
              <PackingSlipFooter pageNumber={pageIndex + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PackingSlipView
