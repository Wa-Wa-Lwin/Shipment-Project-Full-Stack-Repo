export interface ParcelBoxType {
  parcelBoxTypeID: number | string; // API returns string, but can be number
  type: string;
  box_type_name: string;
  depth: number;
  width: number;
  height: number;
  dimension_unit: string;
  parcel_weight: number;
  weight_unit: string;
  remark?: string | null;
  active?: number | boolean | null; // API can return true/false or 1/0 or null
  created_at?: string;
  updated_at?: string;
}

export interface ParcelBoxTypeFormData {
  parcelBoxTypeID?: number;
  type: string;
  box_type_name: string;
  depth: number | string;
  width: number | string;
  height: number | string;
  dimension_unit: string;
  parcel_weight: number | string;
  weight_unit: string;
  remark?: string;
  active?: number | boolean;
}

export interface ParcelBoxTypeApiResponse {
  status: string;
  data?: ParcelBoxType | ParcelBoxType[];
  count?: number;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}
