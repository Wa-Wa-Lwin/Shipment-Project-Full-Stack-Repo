import { Card, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ShipmentGETData } from './types';

interface AddressInformationProps {
  shipment: ShipmentGETData;
}

const AddressInformation = ({ shipment }: AddressInformationProps) => {
  return (
    <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-gray-200">
        <Icon icon="solar:map-point-bold" width={22} className="text-blue-600" />
        <h3 className="font-semibold text-blue-900 text-base">Addresses</h3>
      </div>

      {/* Address Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        {/* Ship From */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Chip color="primary" size="sm" variant="flat" startContent={<Icon icon="solar:export-bold" width={14} />}>
              From
            </Chip>
            <span className="font-bold text-gray-900">{shipment.ship_from?.company_name || '-'}</span>
          </div>

          <div className="space-y-1.5 text-gray-700 pl-2 border-l-2 border-blue-200">
            <p className="leading-relaxed">
              {[shipment.ship_from?.country, shipment.ship_from?.city, shipment.ship_from?.state, shipment.ship_from?.postal_code]
                .filter(Boolean)
                .join(', ')}
            </p>

            {shipment.ship_from?.street1 && (
              <p><span className="font-medium text-gray-600">Street 1:</span> {shipment.ship_from.street1}</p>
            )}
            {shipment.ship_from?.street2 && (
              <p><span className="font-medium text-gray-600">Street 2:</span> {shipment.ship_from.street2}</p>
            )}
            {shipment.ship_from?.street3 && (
              <p><span className="font-medium text-gray-600">Street 3:</span> {shipment.ship_from.street3}</p>
            )}
            {shipment.ship_from?.tax_id && (
              <p><span className="font-medium text-gray-600">Tax ID:</span> {shipment.ship_from.tax_id}</p>
            )}
            {shipment.ship_from?.eori_number && (
              <p><span className="font-medium text-gray-600">EORI:</span> {shipment.ship_from.eori_number}</p>
            )}

            <div className="pt-1 mt-2 border-t border-gray-100">
              <p className="flex items-center gap-1">
                <Icon icon="solar:user-bold" width={14} className="text-gray-500" />
                <span className="font-medium">{shipment.ship_from?.contact_name || '-'}</span>
              </p>
              <p className="flex items-center gap-1">
                <Icon icon="solar:phone-bold" width={14} className="text-gray-500" />
                {shipment.ship_from?.phone || '-'}
              </p>
              <p className="flex items-center gap-1">
                <Icon icon="solar:letter-bold" width={14} className="text-gray-500" />
                {shipment.ship_from?.email || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Ship To */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Chip color="success" size="sm" variant="flat" startContent={<Icon icon="solar:import-bold" width={14} />}>
              To
            </Chip>
            <span className="font-bold text-gray-900">{shipment.ship_to?.company_name || '-'}</span>
          </div>

          <div className="space-y-1.5 text-gray-700 pl-2 border-l-2 border-green-200">
            <p className="leading-relaxed">
              {[shipment.ship_to?.country, shipment.ship_to?.city, shipment.ship_to?.state, shipment.ship_to?.postal_code]
                .filter(Boolean)
                .join(', ')}
            </p>

            {shipment.ship_to?.street1 && (
              <p><span className="font-medium text-gray-600">Street 1:</span> {shipment.ship_to.street1}</p>
            )}
            {shipment.ship_to?.street2 && (
              <p><span className="font-medium text-gray-600">Street 2:</span> {shipment.ship_to.street2}</p>
            )}
            {shipment.ship_to?.street3 && (
              <p><span className="font-medium text-gray-600">Street 3:</span> {shipment.ship_to.street3}</p>
            )}
            {shipment.ship_to?.tax_id && (
              <p><span className="font-medium text-gray-600">Tax ID:</span> {shipment.ship_to.tax_id}</p>
            )}
            {shipment.ship_to?.eori_number && (
              <p><span className="font-medium text-gray-600">EORI:</span> {shipment.ship_to.eori_number}</p>
            )}

            <div className="pt-1 mt-2 border-t border-gray-100">
              <p className="flex items-center gap-1">
                <Icon icon="solar:user-bold" width={14} className="text-gray-500" />
                <span className="font-medium">{shipment.ship_to?.contact_name || '-'}</span>
              </p>
              <p className="flex items-center gap-1">
                <Icon icon="solar:phone-bold" width={14} className="text-gray-500" />
                {shipment.ship_to?.phone || '-'}
              </p>
              <p className="flex items-center gap-1">
                <Icon icon="solar:letter-bold" width={14} className="text-gray-500" />
                {shipment.ship_to?.email || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AddressInformation;
