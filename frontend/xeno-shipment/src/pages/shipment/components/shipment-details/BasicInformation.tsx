import { Button, Card, Chip } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ShipmentGETData } from './types';
import { formatDateTime } from './utils';
import { isRateChosen } from '../../utils/rateUtils';

interface BasicInformationProps {
  shipment: ShipmentGETData;
  onCreatePickup?: () => void;
  onChangePickupDateTime?: () => void;
  formattedPickupError?: string;
}

const getPickupStatusConfig = (shipment: ShipmentGETData) => {
  const chosenRate = shipment.rates?.find(rate => isRateChosen(rate.chosen));
  const isDHLAsia = chosenRate?.shipper_account_description === 'DHL eCommerce Asia';
  const isDHLExpress = chosenRate?.service_name === 'DHL Express Worldwide';
  const isFedEx = chosenRate?.shipper_account_description?.toLowerCase().includes('fedex') ||
    chosenRate?.service_name?.toLowerCase().includes('fedex');
  const isFedExAutoPickup = isFedEx && shipment.label_status === 'created';
  const isExternalCall = isDHLAsia || isDHLExpress;

  if (isFedExAutoPickup && shipment.pick_up_created_status !== 'created_success' && shipment.pick_up_created_status !== 'created_failed') {
    return { color: 'success' as const, icon: 'solar:check-circle-bold', text: 'Auto-Scheduled' };
  }
  if (isExternalCall) {
    return { color: 'primary' as const, icon: 'solar:phone-bold', text: 'Call Required' };
  }
  if (shipment.pick_up_created_status === 'created_success') {
    return { color: 'success' as const, icon: 'solar:check-circle-bold', text: 'Confirmed' };
  }
  if (shipment.pick_up_created_status === 'created_failed') {
    return { color: 'danger' as const, icon: 'solar:close-circle-bold', text: 'Failed' };
  }
  return { color: 'warning' as const, icon: 'solar:clock-circle-bold', text: 'Pending' };
};

const BasicInformation = ({
  shipment,
  onCreatePickup,
  onChangePickupDateTime,
  formattedPickupError
}: BasicInformationProps) => {
  const pickupStatusConfig = getPickupStatusConfig(shipment);

  // Pickup-related helpers
  const chosenRate = shipment.rates?.find(rate => isRateChosen(rate.chosen));
  const isDHLAsia = chosenRate?.shipper_account_description === 'DHL eCommerce Asia';
  const isDHLExpress = chosenRate?.service_name === 'DHL Express Worldwide';
  // const isGrabPickup = shipment.shipping_options?.toLowerCase() === 'grab_pickup';
  // const isSupplierPickup = shipment.shipping_options?.toLowerCase() === 'supplier_pickup';
  const isFedEx = chosenRate?.shipper_account_description?.toLowerCase().includes('fedex') ||
    chosenRate?.service_name?.toLowerCase().includes('fedex');
  const isFedExAutoPickup = isFedEx && shipment.label_status === 'created';
  const isExternalCall = isDHLAsia || isDHLExpress;

  // Check if shipment is not domestic and created date is more than 2 days before pickup date
  const isNotDomestic = shipment.shipment_scope_type?.toLowerCase() !== 'domestic';
  const isCreatedMoreThan2DaysBeforePickup = () => {
    if (!shipment.created_date_time || !shipment.pick_up_date) return false;
    const createdDate = new Date(shipment.created_date_time);
    const pickupDate = new Date(shipment.pick_up_date);
    const diffInMs = pickupDate.getTime() - createdDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    return diffInDays > 2;
  };

  const shouldShowFedexAutoPickupNotice = isFedExAutoPickup && isNotDomestic && isCreatedMoreThan2DaysBeforePickup();

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: '2-digit',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    return `${parseInt(hours, 10)}:${minutes}`;
  };

  const pickupDateTime = shipment.pick_up_date
    ? `${formatDate(shipment.pick_up_date)} (${formatTime(shipment.pick_up_start_time)} - ${formatTime(shipment.pick_up_end_time)})`
    : 'Not specified';

  return (
    <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-left gap-3 mb-2 pb-3 border-gray-200">
        <div className="flex items-center gap-2">
          <Icon icon="solar:box-bold" width={22} className="text-blue-600" />
          <h3 className="font-semibold text-blue-900 text-base">
            Basic Information
          </h3>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5 text-sm text-gray-700">
        <InfoRow label="Scope" value={
          shipment.shipment_scope_type
            ? shipment.shipment_scope_type.toLowerCase() === 'international_global'
              ? 'International (Outside Thailand)'
              : shipment.shipment_scope_type.toUpperCase().replace(/_/g, ' ')
            : '-'
        } />

        <InfoRow
          label="Topic"
          value={`${shipment.topic || '-'}${shipment.topic === 'Others'
            ? ` (${shipment.other_topic})`
            : shipment.topic === 'For Sales'
              ? ` (${shipment.sales_person})`
              : ''
            }`}
        />

        <InfoRow
          label="Service"
          value={(() => {
            switch (shipment.service_options?.toLowerCase()) {
              case 'normal':
                return 'Normal (Cheapest One)';
              case 'urgent':
                return `Urgent (${shipment.urgent_reason})`;
              default:
                return shipment.service_options || 'Unknown';
            }
          })()}
        />

        {shipment.po_number && (
          <InfoRow
            label="PO Number (Date)"
            value={`${shipment.po_number || '-'} (${shipment.po_date || '-'})`}
          />
        )}

        <InfoRow label="Requestor" value={shipment.created_user_name || '-'} />
        <InfoRow label="Approver" value={shipment.approver_user_name || '-'} />
        <InfoRow label="Created" value={formatDateTime(shipment.created_date_time) || '-'} />
        <InfoRow label="Payment Terms" value={shipment?.payment_terms?.replace(/_/g, ' ').toUpperCase() || '-'} />
        <InfoRow label="Shipping Option" value={shipment?.shipping_options?.replace(/_/g, ' ').toUpperCase() || '-'} />

        {shipment?.customize_invoice_url && (
          <div>
            <span className="text-gray-600 font-medium">Custom Invoice: </span>
            <a
              href={`${import.meta.env.VITE_APP_BACKEND_BASE_URL}/${shipment.customize_invoice_url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-semibold inline-flex items-center gap-1"
            >
              <Icon icon="solar:document-text-bold" width={14} />
              View PDF
            </a>
          </div>
        )}

        {shipment?.billing !== '' &&
          shipment?.shipping_options?.toLowerCase() !== 'grab_pickup' &&
          shipment?.shipping_options?.toLowerCase() !== 'supplier_pickup' && (
            <InfoRow label="Billing" value={shipment?.billing?.toUpperCase() || 'Not specified'} />
          )}

        {shipment?.billing?.toLowerCase() === 'recipient' && (
          <InfoRow
            label="Recipient Account No"
            value={shipment?.recipient_shipper_account_number?.toUpperCase() || '-'}
          />
        )}

        {shipment.shipment_scope_type?.toLowerCase() !== 'domestic' && (
          <>
            <InfoRow label="Customs Purpose" value={shipment.customs_purpose || '-'} />
            <InfoRow label="Incoterms" value={shipment.customs_terms_of_trade || '-'} />
          </>
        )}

        <div className="col-span-full flex items-center gap-3 mt-2">
          <Icon icon="solar:calendar-bold" width={20} className="text-blue-600" />
          <h4 className="font-semibold text-blue-900 text-sm">Pickup</h4>

          {shipment?.request_status !== 'approver_rejected' && (
            <Chip
              color={pickupStatusConfig.color}
              variant="flat"
              size="sm"
              startContent={<Icon icon={pickupStatusConfig.icon} width={14} />}
              className="font-semibold"
            >
              {pickupStatusConfig.text}
            </Chip>
          )}
        </div>

        <InfoRow label="Pickup Date Time" value={pickupDateTime} />
        <InfoRow label="Pickup Instruction" value={shipment.pick_up_instructions || 'Not specified'} />

        {!isExternalCall && shipment.pick_up_created_status === 'created_success' && (
          <InfoRow label="Confirmation No" value={shipment.pickup_confirmation_numbers || '-'} />
        )}

        {/* Pickup Info - Only show if there's a message */}
        {(isDHLAsia || isDHLExpress || shouldShowFedexAutoPickupNotice) && (

          <div className="flex gap-1">
            <span className="font-medium text-gray-600 min-w-fit whitespace-nowrap">Pickup Info:</span>
            <span className="font-semibold text-blue-700">
              {isDHLAsia && (
                <>
                  Please call DHL eCommerce Asia customer service to arrange pickup for this package.
                  Contact Logistic Team for further information.
                </>
              )}
              {isDHLExpress && (
                <>
                  Please call DHL Express Worldwide customer service to arrange pickup for this package (Aftership not supported yet).
                  <br />
                  Contact Logistic Team for further information.
                </>
              )}
              {shouldShowFedexAutoPickupNotice && (
                <>
                  Automated Pickup: System will automatically schedule pickup and the Pickup Confirmation Number will be available on {new Date(new Date(shipment.pick_up_date).getTime() - 86400000).toLocaleDateString()}.
                </>
              )}
            </span>
          </div>
        )}

        {!isExternalCall && shipment.pick_up_created_status === 'created_failed' && (
          <div className="space-y-2 mt-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm font-medium flex items-start gap-2">
                <Icon icon="solar:danger-triangle-bold" width={18} className="flex-shrink-0 mt-0.5" />
                <span><strong>Error Detail:</strong> {formattedPickupError}</span>
              </p>
            </div>
            <div className="flex gap-2">
              {onCreatePickup && (
                <Button color="primary" size="sm" onPress={onCreatePickup}>
                  Retry Create Pickup
                </Button>
              )}
              {onChangePickupDateTime && (
                <Button
                  color="warning"
                  size="sm"
                  onPress={onChangePickupDateTime}
                  startContent={<Icon icon="solar:calendar-bold" width={16} />}
                >
                  Change Pickup Date/Time
                </Button>
              )}
            </div>
          </div>
        )}

      </div>

    </Card>
  );
};

// Small reusable component for clean info display
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-1.5">
    <span className="font-medium text-gray-600 min-w-fit whitespace-nowrap">{label}:</span>
    <span className="font-semibold text-gray-900 break-words">{value}</span>
  </div>
);

export default BasicInformation;
