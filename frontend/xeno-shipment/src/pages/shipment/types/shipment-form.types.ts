export interface ParcelItem {
  description: string
  quantity: number
  price_currency: string
  price_amount: number
  item_id: string
  origin_country: string
  weight_unit: string
  weight_value: number
  sku: string
  material_code: string
  hs_code: string
  return_reason: string
}

export interface Parcel {
  box_type_name: string
  width: number
  height: number
  depth: number
  dimension_unit: string
  weight_value: number
  net_weight_value: number
  parcel_weight_value: number
  weight_unit: string
  description: string
  parcel_items: ParcelItem[]
}

export interface Rate {
  shipper_account_id: string
  shipper_account_slug: string
  shipper_account_description: string
  service_type: string
  service_name: string
  pickup_deadline: string
  booking_cut_off: string
  delivery_date: string
  transit_time: string
  error_message: string
  info_message: string
  charge_weight_value: number
  charge_weight_unit: string
  total_charge_amount: number
  total_charge_currency: string
  unique_id: string // Unique identifier combining shipper_account_id and service_type
  chosen: boolean
  detailed_charges: string
  past_chosen: boolean
  created_user_name: string
}

export interface ShipmentFormData {
  shipmentRequestID: number
  shipment_scope_type: string

  // Basic shipment info
  service_options: string
  shipping_options: string
  urgent_reason: string
  request_status: string
  remark: string
  topic: string
  po_number: string
  other_topic: string
  due_date: string
  sales_person: string
  po_date: string
  send_to: string

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

  // Dynamic arrays
  parcels: Parcel[]
  rates: Rate[]

  // Grab rate fields (for manual Grab delivery rate entry)
  grab_rate_amount?: string
  grab_rate_currency?: string

  // Pickup info
  pick_up_status: boolean
  pick_up_date: string
  pick_up_start_time: string
  pick_up_end_time: string
  pick_up_instructions: string

  // Insurance
  insurance_enabled: boolean
  insurance_insured_value_amount: number
  insurance_insured_value_currency: string

  // Customs
  customs_purpose: string
  customs_terms_of_trade: string
  payment_terms: string | null

  // Billing
  billing?: string
  recipient_carrier?: string
  recipient_shipper_account_number?: string
  recipient_shipper_account_country_code?: string

  // Customize Invoice
  use_customize_invoice?: boolean
  customize_invoice_file?: File | null
  customize_invoice_url?: string

  created_user_id: string;
  created_user_name: string;
  created_user_mail: string;
  created_date_time: string;

  approver_user_id: string | null;
  approver_user_name: string;
  approver_user_mail: string | null;
  approver_approved_date_time: string | null;
  approver_rejected_date_time: string | null;

  label_status: string | null;
  label_id?: string;
  files_label_url?: string;
  tracking_numbers?: string;
  pick_up_created_status: string | null;
}

export interface FormSectionProps {
  register: any
  errors: any
  control?: any
  setValue?: any
}

export interface ParcelItemsProps {
  parcelIndex: number
  control: any
  register: any
  errors: any
  setValue?: any
  watch?: any
  onWeightChange?: () => void
}

export interface ShipmentRequestsResponse {
  shipment_requests_count: number;
  shipment_requests: ShipmentFormData[];
  shipment_requests_desc: ShipmentFormData[];
}