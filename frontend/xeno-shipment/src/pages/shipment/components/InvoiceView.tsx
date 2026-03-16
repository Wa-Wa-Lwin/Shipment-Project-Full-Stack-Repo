import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from '@heroui/react'
import { useReactToPrint } from 'react-to-print'
import { Icon } from '@iconify/react'
import { useAuth } from '@context/AuthContext'
import { useNotification } from '@context/NotificationContext'
import UpdateLogisticsModal from './modals/UpdateLogisticsModal'
import { getShipmentById, updateInvoiceData, updateLogisticsInfo } from '../services/shipmentService'
import type { ShipmentGETData } from './shipment-details'

const InvoiceView = () => {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const [shipment, setShipment] = useState<ShipmentGETData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { user, msLoginUser } = useAuth()
  const { success: showSuccess, error: showError } = useNotification()

  // Invoice data modal state
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isLogisticsOpen, onOpen: onLogisticsOpen, onClose: onLogisticsClose } = useDisclosure()
  const [invoiceFormData, setInvoiceFormData] = useState({
    invoice_no: '',
    invoice_date: '',
    invoice_due_date: ''
  })
  const [logisticsFormData, setLogisticsFormData] = useState({
    customs_purpose: '',
    customs_terms_of_trade: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchShipmentData()
  }, [shipmentId])

  const fetchShipmentData = async () => {
    if (!shipmentId) return

    try {
      setLoading(true)
      const data = await getShipmentById(shipmentId)
      setShipment(data)
    } catch (err) {
      console.error('Error fetching shipment:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch shipment data')
    } finally {
      setLoading(false)
    }
  }

  // Get document title
  const getDocumentTitle = () => {
    if (!shipment) return 'Invoice'
    const { shipment_scope_type, shipmentRequestID , payment_terms } = shipment
    const isFOC = payment_terms?.toLowerCase() === 'free_of_charge' 
    const scope = shipment_scope_type?.toLowerCase()

    if (scope.startsWith('domestic') && isFOC) return `Domestic Foc ${shipmentRequestID}`
    if (scope.startsWith('domestic')) return `Domestic ${shipmentRequestID}`
    if (scope === 'international_export' && isFOC) return `Export Foc ${shipmentRequestID}`
    if (scope === 'international_export') return `Export ${shipmentRequestID}`
    if (scope === 'international_import' && isFOC) return `Import Foc ${shipmentRequestID}`
    if (scope === 'international_import') return `Import ${shipmentRequestID}`
    if (scope === 'international' && isFOC) return `International Foc ${shipmentRequestID}`
    if (scope === 'international') return `International ${shipmentRequestID}`
    return `Invoice ${shipmentRequestID}`
  }

  // Set document title
  useEffect(() => {
    document.title = getDocumentTitle()
  }, [shipment])

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: getDocumentTitle(),
  });

  // Open modal and populate with current invoice data
  const handleOpenInvoiceModal = () => {
    if (shipment) {
      setInvoiceFormData({
        invoice_no: shipment.invoice_no || '',
        invoice_date: shipment.invoice_date || '',
        invoice_due_date: shipment.invoice_due_date || ''
      })
      onOpen()
    }
  }

  // Handle invoice data change
  const handleChangeInvoiceData = async () => {
    if (!shipmentId || !user) {
      showError('Missing required information')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        invoice_no: invoiceFormData.invoice_no,
        invoice_date: invoiceFormData.invoice_date,
        invoice_due_date: invoiceFormData.invoice_due_date,
        login_user_id: user.userID,
        login_user_name: msLoginUser?.name,
        login_user_mail: user.email
      }

      await updateInvoiceData(shipmentId, payload)

      showSuccess('Invoice data updated successfully')
      onClose()

      // Refetch shipment data to reflect changes
      await fetchShipmentData()
    } catch (err) {
      console.error('Error updating invoice data:', err)
      showError(err instanceof Error ? err.message : 'Failed to update invoice data')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open logistics modal and populate with current data
  const handleOpenLogisticsModal = () => {
    if (shipment) {
      setLogisticsFormData({
        customs_purpose: shipment.customs_purpose || '',
        customs_terms_of_trade: shipment.customs_terms_of_trade || ''
      })
      onLogisticsOpen()
    }
  }

  // Handle logistics update
  const handleUpdateLogistics = async () => {
    if (!shipmentId || !user || !msLoginUser) {
      showError('Missing required information')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = {
        send_status: 'logistic_updated',
        login_user_id: user.userID,
        login_user_name: msLoginUser.name,
        login_user_mail: msLoginUser.email,
        customs_purpose: logisticsFormData.customs_purpose || shipment?.customs_purpose || '',
        customs_terms_of_trade: logisticsFormData.customs_terms_of_trade || shipment?.customs_terms_of_trade || '',
        parcels: shipment?.parcels?.map((parcel: any) => ({
          parcel_items: parcel.items?.map((item: any) => ({
            parcelItemID: item.parcelItemID,
            item_id: item.item_id || '',
            origin_country: item.origin_country || '',
            hs_code: item.hs_code || ''
          })) || []
        })) || [],
        remark: 'Logistics information updated'
      }

      await updateLogisticsInfo(shipmentId, payload)

      showSuccess('Logistics information updated successfully')
      onLogisticsClose()

      // Refetch shipment data to reflect changes
      await fetchShipmentData()
    } catch (err) {
      console.error('Error updating logistics data:', err)
      showError(err instanceof Error ? err.message : 'Failed to update logistics information')
    } finally {
      setIsSubmitting(false)
    }
  }

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

  // Type definition for parcel items
  type ParcelItem = NonNullable<ShipmentGETData['parcels']>[number]['items'][number]

  // Process all items from all parcels
  const allItems = shipment.parcels?.flatMap(parcel => parcel.items) || []

  // Calculate totals
  const subtotal = allItems.reduce((sum, item) =>
    sum + (parseFloat(item.quantity) * parseFloat(item.price_amount)), 0
  )
  const taxTotal = 0
  const grandTotal = subtotal + taxTotal

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  const addDays = (dateString?: string, days: number = 0) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const isXenoptics = (companyName?: string) => {
    return companyName?.toLowerCase().startsWith('xenoptics') || false
  }

  const isFOC = shipment.payment_terms?.toLowerCase() === 'free_of_charge'
  const currency = allItems[0]?.price_currency || 'THB'

  // Chunk items for pagination - 10 items per page
  const ITEMS_PER_PAGE = 10

  const chunkItemsForPages = (items: ParcelItem[]) => {
    const pages: ParcelItem[][] = []

    if (items.length === 0) return [[]]

    // All pages - 10 items per page
    for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
      pages.push(items.slice(i, i + ITEMS_PER_PAGE))
    }

    return pages
  }

  const itemPages = chunkItemsForPages(allItems)
  const totalPages = itemPages.length

  // Header component (reused on all pages)
  const InvoiceHeader = () => (
    <div style={{ marginBottom: '15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ width: '60%' }}>
          <img
            src="/xeno-shipment/xenoptics_original_logo.png"
            alt="Logo"
            style={{ width: '300px', height: 'auto' }}
          />
        </div>
        <div style={{ width: '40%', textAlign: 'right' }}>
          <p style={{ fontWeight: 'bold', fontSize: '14px', margin: '5px 0' }}>
            Invoice No: <span style={{ fontWeight: 'normal' }}>{shipment.invoice_no}</span>
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Date:</strong> {formatDate(shipment.invoice_date)}
          </p>
          <p style={{ fontSize: '12px', margin: '3px 0' }}>
            <strong>Due Date:</strong> {formatDate(shipment.invoice_due_date)}
            {/* <strong>Due Date:</strong> {addDays(shipment.approver_approved_date_time, 30)} */}
          </p>
          {shipment.topic === 'For Sales' && (
            <p style={{ fontSize: '12px', margin: '3px 0' }}>
              <strong>Sales Person:</strong>{' '}
              {isXenoptics(shipment.ship_from?.company_name)
                ? (shipment.sales_person || 'Nati Neuberger')
                : shipment.ship_from?.contact_name}
            </p>
          )}
        </div>
      </div>
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '10px', fontSize: '10px' }}>
          {/* Shipper */}
          <div style={{ flex: '2', padding: '8px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              Shipper / Exporter:
            </div>
            {isXenoptics(shipment.ship_from?.company_name) ? (
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
                {shipment.ship_to?.street1 && <>{shipment.ship_to.street1}<br /></>}
                {shipment.ship_to?.street2 && <>{shipment.ship_to.street2}<br /></>}
                {shipment.ship_to?.street3 && <>{shipment.ship_to.street3}<br /></>}
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

  // Footer component (reused on all pages)
  const InvoiceFooter = ({ pageNumber }: { pageNumber: number }) => (
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
      <div className="no-print flex gap-4 items-center justify-center" style={{ padding: '20px', textAlign: 'center', background: '#f0f0f0' }}>
        <Button
          color="default"
          size="md"
          onPress={() => navigate(-1)}
          startContent={<Icon icon="solar:arrow-left-bold" />}
        >
          Back
        </Button>
        <h2 className="text-lg font-semibold">Shipment Request ID - {shipment.shipmentRequestID} | Invoice </h2>
        <Button
          color="secondary"
          size="md"
          onPress={handleOpenLogisticsModal}
          startContent={<Icon icon="solar:document-text-bold" />}
        >
          Update Logistics Info
        </Button>
        <Button
          color="secondary"
          size="md"
          onPress={handleOpenInvoiceModal}
          startContent={<Icon icon="solar:document-text-bold" />}
        >
          Change Invoice Data
        </Button>
        <Button
          color="primary"
          size="md"
          onPress={() => handlePrint()}
          startContent={<Icon icon="solar:download-bold" />}
        >
          Download as PDF
        </Button>
      </div>

      {/* Change Invoice Data Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Change Invoice Data</ModalHeader>
          <ModalBody>
            <div className="flex flex-col gap-4">
              <Input
                label="Invoice Number"
                value={invoiceFormData.invoice_no}
                onValueChange={(value) =>
                  setInvoiceFormData({ ...invoiceFormData, invoice_no: value })
                }
                placeholder="Enter invoice number"
              />
              <Input
                label="Invoice Date"
                type="date"
                value={invoiceFormData.invoice_date}
                onValueChange={(value) =>
                  setInvoiceFormData({ ...invoiceFormData, invoice_date: value })
                }
              />
              <Input
                label="Invoice Due Date"
                type="date"
                value={invoiceFormData.invoice_due_date}
                onValueChange={(value) =>
                  setInvoiceFormData({ ...invoiceFormData, invoice_due_date: value })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleChangeInvoiceData}
              isLoading={isSubmitting}
              isDisabled={isSubmitting}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Update Logistics Info Modal */}
      <UpdateLogisticsModal
        isOpen={isLogisticsOpen}
        onClose={onLogisticsClose}
        shipment={shipment}
        editedParcelItems={shipment?.parcels?.flatMap((parcel: any, parcelIndex: number) =>
          parcel.items?.map((item: any, itemIndex: number) => ({
            ...item,
            parcelIndex,
            itemIndex,
            id: `${parcelIndex}-${itemIndex}`,
            parcelItemID: item.parcelItemID
          })) || []
        ) || []}
        editCustomsPurpose={logisticsFormData.customs_purpose}
        editCustomsTermsOfTrade={logisticsFormData.customs_terms_of_trade}
        isUpdatingLogistics={isSubmitting}
        onEditCustomsPurposeChange={(value) =>
          setLogisticsFormData({ ...logisticsFormData, customs_purpose: value })
        }
        onEditCustomsTermsOfTradeChange={(value) =>
          setLogisticsFormData({ ...logisticsFormData, customs_terms_of_trade: value })
        }
        onParcelItemUpdate={() => {
          // Note: For InvoiceView, we're not persisting parcel item changes
          // This is a read-only view for now. Implement as needed.
        }}
        onSubmit={handleUpdateLogistics}
      />

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
            }

            @media screen {
              .invoice-page {
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                margin-bottom: 20px;
              }
            }
          `}
        </style>

        {itemPages.map((pageItems, pageIndex) => {
          const isLastPage = pageIndex === totalPages - 1
          const startItemNumber = pageIndex * ITEMS_PER_PAGE

          return (
            <div
              key={pageIndex}
              className={`invoice-page ${pageIndex < totalPages - 1 ? 'page-break' : ''}`}
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
              <InvoiceHeader />

              {/* Items Table */}
              <div style={{ marginBottom: isLastPage ? '80px' : '60px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '30px', textAlign: 'center' }}>No.</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '125px' }}>Material Code</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px' }}>Description</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '70px', textAlign: 'center' }}>HS Code</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '35px', textAlign: 'center' }}>Qty</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '60px', textAlign: 'right' }}>Unit Price<br />({currency})</th>
                      <th style={{ border: '1px solid #ccc', padding: '6px', width: '70px', textAlign: 'right' }}>Amount<br />({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                          {startItemNumber + idx + 1}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.material_code || item.sku}</td>
                        <td style={{ border: '1px solid #ccc', padding: '6px' }}>{item.description}</td>
                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                          {item.hs_code || '-'}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center' }}>
                          {item.quantity}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>
                          {parseFloat(item.price_amount).toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>
                          {(parseFloat(item.quantity) * parseFloat(item.price_amount)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* To be continued or Last Page indicator */}
                {totalPages > 1 && (
                  <div style={{ marginTop: '10px', textAlign: 'right', fontSize: '12px', fontStyle: 'italic' }}>
                    {isLastPage ? (
                      <strong>Last Page</strong>
                    ) : (
                      'To be continued...'
                    )}
                  </div>
                )}
              </div>

              {/* Summary and Terms - Only on last page */}
              {isLastPage && (
                <div style={{ display: 'flex', marginBottom: '60px' }}>
                  {/* Terms Section */}
                  <div style={{ 
                    flex: '2', 
                    borderTop: '1px solid black', 
                    borderBottom: '1px solid black', 
                    borderLeft: '1px solid black', 
                    padding: '10px', 
                    fontSize: '10px' 
                    }}>
                    {isFOC ? (
                      <>
                        <strong>Purpose of Shipment: </strong>{shipment?.customs_purpose?.toUpperCase()}<br /><br />
                        <strong>Incoterm:</strong> {shipment?.customs_terms_of_trade?.toUpperCase()}<br /><br />
                        NO COMMERCIAL VALUE, "VALUE FOR CUSTOMS PURPOSE ONLY"<br /><br />
                        This is to certify that the above named materials are properly classified,
                        described, marked, labeled and in good order and condition for transportation.
                      </>
                    ) : (
                      <>
                        <strong>Customer PO No.</strong> {shipment.po_number}<br />
                        <strong>PO Date:</strong> {shipment.po_date}<br />
                        <strong>Incoterm:</strong> {shipment?.customs_terms_of_trade?.toUpperCase()}<br /><br />
                        {shipment.shipment_scope_type?.toLowerCase().includes('import') && (
                          <>
                            <strong>Bank Details</strong><br />
                            <strong>Please make all cheques and EFT payable To:</strong> Xenoptics Limited.<br />
                            <strong>For Overseas customers:</strong> Bangkok Bank Public Company Limited<br />
                            <strong>Bank Account No:</strong> 8401010019125962501<br />
                            <strong>Bank SWIFT Code:</strong> BKKBTHBKXX<br />
                            <strong>Payment:</strong> {grandTotal.toFixed(2)} ({currency})<br />
                            <strong>Due Date:</strong> {addDays(shipment.approver_approved_date_time, 30)}
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Summary Box */}
                  <div style={{ flex: '1', border: '1px solid black', padding: '10px' }}>
                    <table style={{ width: '100%', fontSize: '11px' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding: '5px 0' }}><strong>Sub Total ({currency})</strong></td>
                          <td style={{ textAlign: 'right', padding: '5px 0' }}>{subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px 0' }}><strong>Tax Total ({currency})</strong></td>
                          <td style={{ textAlign: 'right', padding: '5px 0' }}>{taxTotal.toFixed(2)}</td>
                        </tr>
                        <tr style={{ borderTop: '2px solid #000' }}>
                          <td style={{ padding: '5px 0' }}><strong>Total ({currency})</strong></td>
                          <td style={{ textAlign: 'right', padding: '5px 0', fontWeight: 'bold' }}>
                            {grandTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Footer on every page */}
              <InvoiceFooter pageNumber={pageIndex + 1} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default InvoiceView
