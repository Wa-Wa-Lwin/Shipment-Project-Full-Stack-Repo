export interface DetailRowProps {
  label: string
  value: React.ReactNode | null | undefined
}

export interface ShipmentGETData {
  send_to?: string
  due_date?: string
  shipmentRequestID: number
  service_options: string
  shipping_options?: string
  request_status: string
  created_user_name: string
  created_user_mail: string
  created_date_time: string
  topic: string
  po_number: string
  po_date: string
  sales_person?: string
  other_topic?: string
  approver_user_name: string
  approver_user_mail: string
  approver_approved_date_time?: string
  approver_rejected_date_time?: string
  remark?: string
  shipment_scope_type: string
  customs_purpose: string
  customs_terms_of_trade: string
  payment_terms?: string
  urgent_reason?: string
  label_id?: string
  label_status?: string
  files_label_url?: string
  tracking_numbers?: string
  pick_up_created_status?: string
  pickup_confirmation_numbers?: string
  invoice_no?: string
  files_invoice_url?: string
  invoice_date?: string
  invoice_due_date?: string
  files_packing_slip?: string
  error_msg?: string
  label_error_msg?: string
  pick_up_error_msg?: string
  grab_rate_amount?: string
  grab_rate_currency?: string
  billing?: string
  recipient_shipper_account_number?: string
  recipient_shipper_account_country_code?: string
  // Customize Invoice
  use_customize_invoice?: boolean
  customize_invoice_url?: string
  // Flattened ship_from properties
  ship_from_contact_name: string
  ship_from_company_name: string
  ship_from_street1: string
  ship_from_street2?: string
  ship_from_street3?: string
  ship_from_city: string
  ship_from_state: string
  ship_from_postal_code: string
  ship_from_country: string
  ship_from_phone: string
  ship_from_email: string
  ship_from_tax_id: string
  ship_from_eori_number: string

  // Flattened ship_to properties
  ship_to_contact_name: string
  ship_to_company_name: string
  ship_to_street1: string
  ship_to_street2?: string
  ship_to_street3?: string
  ship_to_city: string
  ship_to_state: string
  ship_to_postal_code: string
  ship_to_country: string
  ship_to_phone: string
  ship_to_email: string
  ship_to_tax_id: string
  ship_to_eori_number: string

  ship_from?: {
  contact_name: string
  company_name: string
  street1: string
  street2?: string
  street3?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  email: string
  tax_id: string
  eori_number: string
  }

  ship_to?: {
  contact_name: string
  company_name: string
  street1: string
  street2?: string
  street3?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone: string
  email: string
  tax_id: string
  eori_number: string
  }  

  // Pickup info
  pick_up_status: boolean
  pick_up_date: string
  pick_up_start_time: string
  pick_up_end_time: string
  pick_up_instructions: string

  rates?: Array<{
    chosen: boolean
    past_chosen: boolean
    shipper_account_id?: string
    shipper_account_slug?: string
    shipper_account_description: string
    service_type?: string
    service_name: string
    transit_time: string
    total_charge_amount: string
    total_charge_currency: string
    active: number
    created_user_name: string
  }>
  parcels: Array<{
    description: string
    box_type_name: string
    width: string
    height: string
    depth: string
    dimension_unit: string
    weight_value: string
    net_weight_value: string
    parcel_weight_value: string
    weight_unit: string
    items: Array<{
      description: string
      quantity: string      
      price_currency: string
      price_amount: string
      weight_value: string
      weight_unit: string
      sku: string
      material_code: string
      hs_code: string
      origin_country: string
      parcelItemID: string
      item_id: string
    }>
  }>
  shipment_request_histories?: Array<{
    shipmentRequestHistoryID: number
    user_name: string
    user_role: string
    status: string
    remark?: string
    history_record_date_time?: string
    shipment_request_created_date_time?: string
  }>
}