export const SHIPMENT_EDIT_STEPS = [
  { id: 0, name: 'Basic Information', icon: 'solar:box-bold' },
  { id: 1, name: 'Addresses', icon: 'solar:map-point-bold' },
  { id: 2, name: 'Pickup Information', icon: 'solar:calendar-bold' },
  { id: 3, name: 'Parcels & Items', icon: 'solar:box-minimalistic-bold' },
  { id: 4, name: 'Shipping Rates', icon: 'solar:dollar-bold' }
] as const

export const COMPLETED_STEPS = new Set([0, 1, 2, 3])
