import apiClient from '@api/config';
import type { ParcelBoxTypeApiResponse } from './types';

export interface CreateParcelBoxTypePayload {
  parcelBoxTypeID: number;
  type: string;
  box_type_name: string;
  depth: number;
  width: number;
  height: number;
  dimension_unit: string;
  parcel_weight: number;
  weight_unit: string;
  remark?: string;
  active?: number;
}

export interface UpdateParcelBoxTypePayload {
  type?: string;
  box_type_name?: string;
  depth?: number;
  width?: number;
  height?: number;
  dimension_unit?: string;
  parcel_weight?: number;
  weight_unit?: string;
  remark?: string;
  active?: number;
}

const parcelBoxTypesService = {
  getAllParcelBoxTypes: async (): Promise<ParcelBoxTypeApiResponse> => {
    const endpoint = import.meta.env.VITE_APP_PARCEL_BOX_TYPES_GET_ALL || '/api/logistics/parcel-box-types/';
    console.log('Fetching parcel box types from:', endpoint);
    const response = await apiClient.get(endpoint);
    return response.data;
  },

  getParcelBoxType: async (id: number): Promise<ParcelBoxTypeApiResponse> => {
    const baseUrl = import.meta.env.VITE_APP_PARCEL_BOX_TYPES_GET_ONE || '/api/logistics/parcel-box-types/';
    const response = await apiClient.get(`${baseUrl}${id}`);
    return response.data;
  },

  createParcelBoxType: async (payload: CreateParcelBoxTypePayload): Promise<ParcelBoxTypeApiResponse> => {
    const response = await apiClient.post(
      import.meta.env.VITE_APP_PARCEL_BOX_TYPES_CREATE ||
      '/api/logistics/parcel-box-types',
      payload
    );
    return response.data;
  },

  updateParcelBoxType: async (id: number, payload: UpdateParcelBoxTypePayload): Promise<ParcelBoxTypeApiResponse> => {
    const baseUrl = import.meta.env.VITE_APP_PARCEL_BOX_TYPES_UPDATE || '/api/logistics/parcel-box-types/';
    const response = await apiClient.put(`${baseUrl}${id}`, payload);
    return response.data;
  }
};

export default parcelBoxTypesService;
