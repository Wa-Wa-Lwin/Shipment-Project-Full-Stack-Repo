import axios from 'axios'
import type { ShipmentGETData } from '../components/shipment-details'

interface InvoiceResponse {
  shipment_request: ShipmentGETData
}

/**
 * Fetch shipment details by ID
 */
export const getShipmentById = async (shipmentId: string): Promise<ShipmentGETData> => {
  const apiUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID
  if (!apiUrl) {
    throw new Error('API URL for GET_SHIPMENT_REQUEST_BY_ID not configured')
  }

  const { data } = await axios.get<InvoiceResponse>(`${apiUrl}${shipmentId}`)
  return data.shipment_request
}

/**
 * Update invoice data for a shipment
 */
interface UpdateInvoiceDataPayload {
  invoice_no: string
  invoice_date: string
  invoice_due_date: string
  login_user_id: number
  login_user_name?: string
  login_user_mail: string
}

export const updateInvoiceData = async (
  shipmentId: string,
  payload: UpdateInvoiceDataPayload
): Promise<void> => {
  const apiUrl = import.meta.env.VITE_APP_CHANGE_INVOICE_DATA
  if (!apiUrl) {
    throw new Error('API URL for CHANGE_INVOICE_DATA not configured')
  }

  await axios.put(`${apiUrl}${shipmentId}`, payload)
}

/**
 * Update logistics information for a shipment
 */
interface ParcelItem {
  parcelItemID: string
  item_id: string
  origin_country: string
  hs_code: string
}

interface ParcelData {
  parcel_items: ParcelItem[]
}

interface UpdateLogisticsPayload {
  send_status: string
  login_user_id: number
  login_user_name: string
  login_user_mail: string
  customs_purpose: string
  customs_terms_of_trade: string
  parcels: ParcelData[]
  remark: string
}

export const updateLogisticsInfo = async (
  shipmentId: string,
  payload: UpdateLogisticsPayload
): Promise<void> => {
  const apiUrl = import.meta.env.VITE_APP_LOGISTIC_EDIT_SHIPMENT_REQUEST
  if (!apiUrl) {
    throw new Error('API URL for LOGISTIC_EDIT_SHIPMENT_REQUEST not configured')
  }

  await axios.put(`${apiUrl}${shipmentId}`, payload)
}
