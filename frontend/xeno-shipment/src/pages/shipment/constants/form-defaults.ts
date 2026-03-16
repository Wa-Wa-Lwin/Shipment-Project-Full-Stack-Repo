import type { ShipmentFormData } from '../types/shipment-form.types'

// Calculate default pickup date time based on current time
export const getDefaultPickupValues = () => {
  const todayDate = new Date().toISOString().split("T")[0]
  const defaultPickupDate = todayDate
  const defaultExpectedDeliveryDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  // Default pickup times: 9 AM to 5 PM
  const startTime = "09:00"
  const endTime = "17:00"

  return {
    pickupDate: defaultPickupDate,
    startTime,
    endTime,
    minDate: todayDate,
    expectedDeliveryDate: defaultExpectedDeliveryDate,
  }
}

const defaultPickupValues = getDefaultPickupValues()

export const DEFAULT_FORM_VALUES: ShipmentFormData = {
  shipmentRequestID: 0,
  shipment_scope_type: '',
  request_status: 'requestor_requested',
  service_options: 'Normal',
  shipping_options: 'calculate_rates',
  urgent_reason: '',
  remark: '',
  topic: '',
  po_number: '',
  other_topic: '',
  due_date: defaultPickupValues.expectedDeliveryDate, // Not Same as pickup date . It is expectedDeliveryDate
  sales_person: '',
  po_date: '', //new Date().toISOString().split('T')[0], // today
  send_to: 'Approver',

  label_status:'',
  pick_up_created_status: '', 

  // Flattened ship_from properties
  ship_from_country: 'THA',
  ship_from_contact_name: 'Ms. Sasipimol',
  ship_from_phone: '+66896345885',
  ship_from_email: 'sasipimol@xenoptics.com',
  ship_from_company_name: 'XENOptics Limited',
  ship_from_street1: '195 Moo.3 Bypass Chiangmai-Hangdong Rd.',
  ship_from_street2: 'T. Namphrae, A. Hangdong',
  ship_from_street3: '',
  ship_from_city: 'Hang Dong',
  ship_from_state: 'Chiang Mai',
  ship_from_postal_code: '50230',
  ship_from_tax_id: '0505559000723',
  ship_from_eori_number: '',

  // Flattened ship_to properties
  ship_to_country: '',
  ship_to_contact_name: '',
  ship_to_phone: '',
  ship_to_email: '',
  ship_to_company_name: '',
  ship_to_street1: '',
  ship_to_street2: '',
  ship_to_street3: '',
  ship_to_city: '',
  ship_to_state: '',
  ship_to_postal_code: '',
  ship_to_tax_id: '',
  ship_to_eori_number: '',
  
  // Customs
  customs_purpose: '', // 'sample',
  customs_terms_of_trade: '', // 'exw',
  payment_terms: '',
  
  parcels: [{
    box_type_name: '',
    width: 0,
    height: 0,
    depth: 0,
    dimension_unit: 'cm',
    weight_value: 0,
    net_weight_value: 0,
    parcel_weight_value: 0,
    weight_unit: 'kg',
    description: '',
    parcel_items: [{
      description: '',
      quantity: 1,
      price_currency: 'THB',
      price_amount: 1,
      item_id: '',
      origin_country: 'THA',
      weight_unit: 'kg',
      weight_value: 0,
      sku: '',
      material_code:'',
      hs_code: '12345678',
      return_reason: ''
    }]
  }],
  rates: [{
    shipper_account_id: '',
    shipper_account_slug: '',
    shipper_account_description: '',
    service_type: '',
    service_name: '',
    pickup_deadline: new Date().toISOString().split('T')[0],
    booking_cut_off: new Date().toISOString().split('T')[0],
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // week from now
    transit_time: '',
    error_message: '',
    info_message: '',
    charge_weight_value: 0,
    charge_weight_unit: 'kg',
    total_charge_amount: 0,
    total_charge_currency: '',
    chosen: false,
    unique_id:'',
    detailed_charges: '',
    past_chosen: true,
    created_user_name: ''
  }],

  // Grab rate fields (for manual Grab delivery rate entry)
  grab_rate_amount: '',
  grab_rate_currency: 'THB',

  // Billing
  billing: '',
  recipient_shipper_account_number: '',
  recipient_shipper_account_country_code: '',

  // Customize Invoice
  use_customize_invoice: false,
  customize_invoice_file: null,
  customize_invoice_url: '',

  pick_up_status: true,
  pick_up_date: defaultPickupValues.pickupDate,
  pick_up_start_time: defaultPickupValues.startTime,
  pick_up_end_time: defaultPickupValues.endTime,
  pick_up_instructions: '',
  insurance_enabled: false,
  insurance_insured_value_amount: 0,
  insurance_insured_value_currency: '',

  created_user_id: '',
  created_user_name: '',
  created_user_mail: '',
  created_date_time: '',

  approver_user_id: null,
  approver_user_name: '',
  approver_user_mail: null,
  approver_approved_date_time: null,
  approver_rejected_date_time: null
}

export const DEFAULT_PARCEL = {
  box_type_name: '',
  width: 0,
  height: 0,
  depth: 0,
  dimension_unit: 'cm',
  weight_value: 0,
  net_weight_value: 0,
  parcel_weight_value: 0,
  weight_unit: 'kg',
  description: '',
  parcel_items: [{
    description: '',
    quantity: 1,
    price_currency: 'THB',
    price_amount: 1,
    item_id: '',
    origin_country: 'THA',
    weight_unit: 'kg',
    weight_value: 0,
    sku: '',
    hs_code: '12345678',
    return_reason: ''
  }]
}

export const DEFAULT_PARCEL_ITEM = {
  description: '',
  quantity: 1,
  price_currency: 'THB',
  price_amount: 1,
  item_id: '',
  origin_country: 'THA',
  weight_unit: 'kg',
  weight_value: 0,
  sku: '',
  hs_code: '12345678',
  return_reason: ''
}

export const TOPIC_OPTIONS = [
  { key: 'For Sales', value: 'For Sales', label: 'For Sales' },
  { key: 'Sample', value: 'Sample', label: 'Sample' },
  { key: 'Demonstration', value: 'Demonstration', label: 'Demonstration' },
  { key: 'Consign Parts', value: 'Consign Parts', label: 'Consign Parts' },
  { key: 'Return', value: 'Return', label: 'Return' },
  { key: 'Replacement', value: 'Replacement', label: 'Replacement' },
  { key: 'Calibration', value: 'Calibration', label: 'Calibration' },
  { key: 'Others', value: 'Others', label: 'Others' }
];


export const SERVICE_OPTIONS = [
  { key: 'Normal', value: 'Normal', label: 'Normal (Cheapest one)' },
  { key: 'Urgent', value: 'Urgent', label: 'Urgent (Will choose)' },
]

export const SALES_PERSON_OPTIONS = [
  { key: 'Solomon Sokolovsky', value: 'Solomon Sokolovsky', label: 'Solomon Sokolovsky' },
  { key: 'Nati Neuberger', value: 'Nati Neuberger', label: 'Nati Neuberger' },
  { key: 'Allen Koh', value: 'Allen Koh', label: 'Allen Koh' }
]

export const DIMENSION_UNITS = [
  { key: 'cm', value: 'cm', label: 'cm' },
  { key: 'in', value: 'in', label: 'in' },
  { key: 'mm', value: 'mm', label: 'mm' }
]

export const WEIGHT_UNITS = [
  { key: 'kg', value: 'kg', label: 'kg' },
  { key: 'lb', value: 'lb', label: 'lb' },
  { key: 'g', value: 'g', label: 'g' }
]

export const CUSTOM_PURPOSES = [
  { key: 'merchandise', value: 'merchandise', label: 'Merchandise' },
  { key: 'gift', value: 'gift', label: 'Gift' },
  { key: 'sample', value: 'sample', label: 'Sample' },
  { key: 'return', value: 'return', label: 'Return' },
  { key: 'repair', value: 'repair', label: 'Repair' },
  { key: 'personal', value: 'personal', label: 'Personal' }
];

export const INCOTERMS = [
  { key: "dat", value: "DAT (Delivered at Terminal)" },
  { key: "ddu", value: "DDU (Delivered Duty Unpaid)" },
  { key: "ddp", value: "DDP (Delivered Duty Paid)" },
  { key: "dap", value: "DAP (Delivered at Place)" },
  { key: "exw", value: "EXW (Ex Works)" },
  { key: "fca", value: "FCA (Free Carrier)" },
  { key: "fob", value: "FOB (Free on Board)" },
  { key: "cip", value: "CIP (Carriage and Insurance Paid to)" },
  { key: "cif", value: "CIF (Cost, Insurance and Freight)" },
  { key: "cpt", value: "CPT (Carriage Paid To)" },
  { key: "cfr", value: "CFR (Cost and Freight)" },
  { key: "dpu", value: "DPU (Delivered at Place Unloaded)" }
];
