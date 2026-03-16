// Base interface for DHL Domestic Rate fields
interface DHLDomesticRateFields {
  min_weight_kg: number;
  max_weight_kg: number;
  bkk_charge_thb: number;
  upc_charge_thb: number;
}

// Full rate with ID
export interface DHLDomesticRate extends DHLDomesticRateFields {
  dhlEcommerceDomesticRateListID: number;
}

// Create request: same fields as base
export type CreateDHLDomesticRate = DHLDomesticRateFields;

// Update request: all fields optional
export type UpdateDHLDomesticRate = Partial<DHLDomesticRateFields>;

// Generic API response
export interface ApiResponse<T> {
  data: T;
  message?: string;
  count?: number;
}
