// src/constants/dhlEcommerceRates.ts

export interface DHLEcommerceRateSlab {
  dhlEcommerceDomesticRateListID: number
  min_weight_kg: string
  max_weight_kg: string
  bkk_charge_thb: string
  upc_charge_thb: string
}

export const DEFAULT_DHL_RATE_SLABS: DHLEcommerceRateSlab[] = [
  { dhlEcommerceDomesticRateListID: 1,  min_weight_kg: '0',      max_weight_kg: '0.25', bkk_charge_thb: '37',  upc_charge_thb: '42' },
  { dhlEcommerceDomesticRateListID: 2,  min_weight_kg: '0.251',  max_weight_kg: '0.50', bkk_charge_thb: '37',  upc_charge_thb: '47' },
  { dhlEcommerceDomesticRateListID: 3,  min_weight_kg: '0.501',  max_weight_kg: '0.75', bkk_charge_thb: '37',  upc_charge_thb: '57' },
  { dhlEcommerceDomesticRateListID: 4,  min_weight_kg: '0.751',  max_weight_kg: '1.00', bkk_charge_thb: '37',  upc_charge_thb: '62' },

  { dhlEcommerceDomesticRateListID: 5,  min_weight_kg: '1.001',  max_weight_kg: '1.50', bkk_charge_thb: '62',  upc_charge_thb: '77' },
  { dhlEcommerceDomesticRateListID: 6,  min_weight_kg: '1.501',  max_weight_kg: '2.00', bkk_charge_thb: '77',  upc_charge_thb: '87' },
  { dhlEcommerceDomesticRateListID: 7,  min_weight_kg: '2.001',  max_weight_kg: '3.00', bkk_charge_thb: '77',  upc_charge_thb: '87' },
  { dhlEcommerceDomesticRateListID: 8,  min_weight_kg: '3.001',  max_weight_kg: '4.00', bkk_charge_thb: '87',  upc_charge_thb: '97' },
  { dhlEcommerceDomesticRateListID: 9,  min_weight_kg: '4.001',  max_weight_kg: '5.00', bkk_charge_thb: '87',  upc_charge_thb: '97' },
  { dhlEcommerceDomesticRateListID: 10, min_weight_kg: '5.001',  max_weight_kg: '6.00', bkk_charge_thb: '87',  upc_charge_thb: '97' },

  { dhlEcommerceDomesticRateListID: 11, min_weight_kg: '6.001',  max_weight_kg: '7.00', bkk_charge_thb: '128', upc_charge_thb: '142' },
  { dhlEcommerceDomesticRateListID: 12, min_weight_kg: '7.001',  max_weight_kg: '8.00', bkk_charge_thb: '128', upc_charge_thb: '142' },
  { dhlEcommerceDomesticRateListID: 13, min_weight_kg: '8.001',  max_weight_kg: '9.00', bkk_charge_thb: '128', upc_charge_thb: '142' },

  { dhlEcommerceDomesticRateListID: 14, min_weight_kg: '9.001',  max_weight_kg: '10.00', bkk_charge_thb: '169', upc_charge_thb: '187' },
  { dhlEcommerceDomesticRateListID: 15, min_weight_kg: '10.001', max_weight_kg: '11.00', bkk_charge_thb: '169', upc_charge_thb: '187' },
  { dhlEcommerceDomesticRateListID: 16, min_weight_kg: '11.001', max_weight_kg: '12.00', bkk_charge_thb: '169', upc_charge_thb: '187' },
  { dhlEcommerceDomesticRateListID: 17, min_weight_kg: '12.001', max_weight_kg: '13.00', bkk_charge_thb: '169', upc_charge_thb: '187' },

  { dhlEcommerceDomesticRateListID: 18, min_weight_kg: '13.001', max_weight_kg: '14.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 19, min_weight_kg: '14.001', max_weight_kg: '15.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 20, min_weight_kg: '15.001', max_weight_kg: '16.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 21, min_weight_kg: '16.001', max_weight_kg: '17.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 22, min_weight_kg: '17.001', max_weight_kg: '18.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 23, min_weight_kg: '18.001', max_weight_kg: '19.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 24, min_weight_kg: '19.001', max_weight_kg: '20.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 25, min_weight_kg: '20.001', max_weight_kg: '21.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 26, min_weight_kg: '21.001', max_weight_kg: '22.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 27, min_weight_kg: '22.001', max_weight_kg: '23.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 28, min_weight_kg: '23.001', max_weight_kg: '24.00', bkk_charge_thb: '249', upc_charge_thb: '283' },
  { dhlEcommerceDomesticRateListID: 29, min_weight_kg: '24.001', max_weight_kg: '25.00', bkk_charge_thb: '249', upc_charge_thb: '283' },

  { dhlEcommerceDomesticRateListID: 30, min_weight_kg: '25.001', max_weight_kg: '26.00', bkk_charge_thb: '325', upc_charge_thb: '359' },
  { dhlEcommerceDomesticRateListID: 31, min_weight_kg: '26.001', max_weight_kg: '27.00', bkk_charge_thb: '325', upc_charge_thb: '359' },
  { dhlEcommerceDomesticRateListID: 32, min_weight_kg: '27.001', max_weight_kg: '28.00', bkk_charge_thb: '325', upc_charge_thb: '359' },
  { dhlEcommerceDomesticRateListID: 33, min_weight_kg: '28.001', max_weight_kg: '29.00', bkk_charge_thb: '325', upc_charge_thb: '359' },
  { dhlEcommerceDomesticRateListID: 34, min_weight_kg: '29.001', max_weight_kg: '30.00', bkk_charge_thb: '325', upc_charge_thb: '359' },

  { dhlEcommerceDomesticRateListID: 35, min_weight_kg: '30.001', max_weight_kg: '31.00', bkk_charge_thb: '350', upc_charge_thb: '384' },
  { dhlEcommerceDomesticRateListID: 36, min_weight_kg: '31.001', max_weight_kg: '32.00', bkk_charge_thb: '375', upc_charge_thb: '409' },
  { dhlEcommerceDomesticRateListID: 37, min_weight_kg: '32.001', max_weight_kg: '33.00', bkk_charge_thb: '400', upc_charge_thb: '434' },
  { dhlEcommerceDomesticRateListID: 38, min_weight_kg: '33.001', max_weight_kg: '34.00', bkk_charge_thb: '425', upc_charge_thb: '459' },
  { dhlEcommerceDomesticRateListID: 39, min_weight_kg: '34.001', max_weight_kg: '35.00', bkk_charge_thb: '450', upc_charge_thb: '484' },
]
