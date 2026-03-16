import axios from 'axios';
import type { DHLDomesticRate, CreateDHLDomesticRate, UpdateDHLDomesticRate, ApiResponse } from '../types';

export const dhlRatesApi = {
  // Get all rates
  getAllRates: async (): Promise<DHLDomesticRate[]> => {
    const response = await axios.get<ApiResponse<DHLDomesticRate[]>>(
      import.meta.env.VITE_APP_DHL_DOMESTIC_RATES_GET_ALL
    );
    return response.data.data;
  },

  // Create new rate
  createRate: async (rateData: CreateDHLDomesticRate): Promise<DHLDomesticRate> => {
    const response = await axios.post<ApiResponse<DHLDomesticRate>>(
      import.meta.env.VITE_APP_DHL_DOMESTIC_RATES_CREATE,
      rateData
    );
    return response.data.data;
  },

  // Update rate
  updateRate: async (id: number, rateData: UpdateDHLDomesticRate): Promise<DHLDomesticRate> => {
    const response = await axios.put<ApiResponse<DHLDomesticRate>>(
      `${import.meta.env.VITE_APP_DHL_DOMESTIC_RATES_UPDATE}${id}`,
      rateData
    );
    return response.data.data;
  },

  // Delete rate
  deleteRate: async (id: number): Promise<void> => {
    await axios.delete(
      `${import.meta.env.VITE_APP_DHL_DOMESTIC_RATES_DELETE}${id}`
    );
  },
};
