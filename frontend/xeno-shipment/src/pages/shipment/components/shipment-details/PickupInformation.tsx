import { Button, Card } from '@heroui/react';
import { Icon } from '@iconify/react';
import type { ShipmentGETData } from './types';
import { isRateChosen } from '../../utils/rateUtils';

interface PickupInformationProps {
  shipment: ShipmentGETData;
  onCreatePickup: () => void;
  onChangePickupDateTime?: () => void;
  formattedPickupError: string;
}

const PickupInformation = ({
  shipment,
  onCreatePickup,
  onChangePickupDateTime,
  formattedPickupError
}: PickupInformationProps) => {

  // -------------------------------
  // Derived data & condition helpers
  // -------------------------------
  const chosenRate = shipment.rates?.find(rate => isRateChosen(rate.chosen));
  const isDHLAsia = chosenRate?.shipper_account_description === 'DHL eCommerce Asia';
  const isDHLExpress = chosenRate?.service_name === 'DHL Express Worldwide';
  const isGrabPickup = shipment.shipping_options?.toLowerCase() === 'grab_pickup';
  const isSupplierPickup = shipment.shipping_options?.toLowerCase() === 'supplier_pickup';
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

  // -------------------------------
  // UI helper functions
  // -------------------------------
  const pickupColors: Record<string, string> = {
    created_success: 'text-green-600',
    created_failed: 'text-red-600',
    default: 'text-blue-600',
  };

  const pickupLabels: Record<string, string> = {
    created_success: 'Success',
    created_failed: 'Failed',
    default: 'Pending',
  };

  const getPickupColor = () => {
    if (isFedExAutoPickup) return 'text-green-600';
    if (isExternalCall) return 'text-blue-600';
    return pickupColors[shipment.pick_up_created_status || 'default'];
  };

  const getPickupText = () => {
    if (isFedExAutoPickup && shipment.pick_up_created_status !== 'created_success' && shipment.pick_up_created_status !== 'created_failed') return 'Auto-Scheduled';
    if (isExternalCall) return 'Call';
    return pickupLabels[shipment.pick_up_created_status || 'default'];
  };

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

  // -------------------------------
  // Reusable UI snippets
  // -------------------------------
  const pickupDetails = (
    <>
      <div>
        <span className="text-gray-600">Date(Time): </span>
        <span className="font-medium">{pickupDateTime}</span>
      </div>
      <div>
        <span className="text-gray-600">| Instruction: </span>
        <span className="font-medium">
          {shipment.pick_up_instructions || 'Not specified.'}
        </span>
      </div>
    </>
  );

  const errorBox = (
    <>
      <div className="col-span-full">
        <p className="text-red-600 font-semibold bg-yellow-50 p-2 rounded break-words max-w-full whitespace-normal">
          ⚠️ Error Detail: {formattedPickupError}
        </p>
        <Button color="primary" size="sm" onPress={onCreatePickup}>
          Retry Create Pickup
        </Button>
      </div>

      {onChangePickupDateTime && (
        <div className="col-span-full">
          <Button
            color="warning"
            size="sm"
            onPress={onChangePickupDateTime}
            startContent={<Icon icon="solar:calendar-bold" width={16} />}
          >
            Change Pickup Date/Time
          </Button>
        </div>
      )}
    </>
  );

  const externalCallNotice = (message: string) => (
    <p className="text-blue-600 text-xs font-semibold bg-blue-50 p-2 rounded">
      📞 {message} <br /> 📇 Contact Logistic Team for further information.
    </p>
  );

  const fedexAutoPickupNotice = (
    <p className="text-blue-600 text-xs font-semibold bg-blue-50 p-2 rounded">
      Automated Pickup: 🤖 System will automatically schedule pickup and the Pickup Confirmation Number will be available on {new Date(new Date(shipment.pick_up_date).getTime() - 86400000).toLocaleDateString()}.
    </p>
  );

  // -------------------------------
  // Render logic
  // -------------------------------
  if (isGrabPickup || isSupplierPickup) {
    return (
      <>
        <div className="flex items-center gap-2 mb-2">
          <Icon icon="solar:calendar-bold" width={24} className="text-blue-600" />
          <h3 className="font-semibold">Pickup Information</h3>
        </div>
        <div
          className="grid gap-2 text-sm mb-3"
          style={{
            gridTemplateColumns: 'repeat(8, fit-content(300px))',
            justifyContent: 'start',
            alignItems: 'start',
            textAlign: 'left',
          }}
        >
          {pickupDetails}
        </div>
      </>
    );
  }

  return (
    <Card shadow="none">
      <div className="flex items-center gap-2 mb-2">
        <Icon icon="solar:calendar-bold" width={24} className={getPickupColor()} />
        <h3 className={`font-semibold ${getPickupColor()}`}>
          Pickup Information ({getPickupText()})
        </h3>
      </div>

      <div
        className="grid gap-2 text-sm mb-3"
        style={{
          gridTemplateColumns: 'repeat(8, fit-content(300px))',
          justifyContent: 'start',
          alignItems: 'start',
          textAlign: 'left',
        }}
      >
        {pickupDetails}

        {!isExternalCall && (
          <>
            {shipment.pick_up_created_status === 'created_success' && (
              <div>
                <span className="text-gray-600">| Confirmation No: </span>
                <span className="font-medium">
                  {shipment.pickup_confirmation_numbers}
                </span>
              </div>
            )}

            {shipment.pick_up_created_status === 'created_failed' && errorBox}
          </>
        )}
      </div>

      {isDHLAsia &&
        externalCallNotice('Please call DHL eCommerce Asia customer service to arrange pickup for this package.')}

      {isDHLExpress &&
        externalCallNotice('Please call DHL Express Worldwide customer service to arrange pickup for this package (Aftership not supported yet).')}

      {shouldShowFedexAutoPickupNotice && fedexAutoPickupNotice}
    </Card>
  );
};

export default PickupInformation;
// import { Button, Card, Chip } from '@heroui/react';
// import { Icon } from '@iconify/react';
// import type { ShipmentGETData } from './types';

// interface PickupInformationProps {
//   shipment: ShipmentGETData;
//   onCreatePickup: () => void;
//   onChangePickupDateTime?: () => void;
//   formattedPickupError: string;
// }

// const PickupInformation = ({
//   shipment,
//   onCreatePickup,
//   onChangePickupDateTime,
//   formattedPickupError
// }: PickupInformationProps) => {

//   // -------------------------------
//   // Derived data & condition helpers
//   // -------------------------------
//   const chosenRate = shipment.rates?.find(rate => String(rate.chosen) === "1");
//   const isDHLAsia = chosenRate?.shipper_account_description === 'DHL eCommerce Asia';
//   const isDHLExpress = chosenRate?.service_name === 'DHL Express Worldwide';
//   const isGrabPickup = shipment.service_options?.toLowerCase() === 'grab';
//   const isFedEx = chosenRate?.shipper_account_description?.toLowerCase().includes('fedex') ||
//     chosenRate?.service_name?.toLowerCase().includes('fedex');
//   const isFedExAutoPickup = isFedEx && shipment.label_status === 'created';
//   const isExternalCall = isDHLAsia || isDHLExpress;

//   // -------------------------------
//   // UI helper functions
//   // -------------------------------
//   const formatDate = (dateString: string) => {
//     if (!dateString) return 'Not specified';
//     try {
//       return new Date(dateString).toLocaleDateString('en-US', {
//         year: '2-digit',
//         month: 'short',
//         day: 'numeric'
//       });
//     } catch {
//       return 'Invalid Date';
//     }
//   };

//   const formatTime = (timeString?: string) => {
//     if (!timeString) return '';
//     const [hours, minutes] = timeString.split(':');
//     return `${parseInt(hours, 10)}:${minutes}`;
//   };

//   const pickupDateTime = shipment.pick_up_date
//     ? `${formatDate(shipment.pick_up_date)} (${formatTime(shipment.pick_up_start_time)} - ${formatTime(shipment.pick_up_end_time)})`
//     : 'Not specified';

//   // -------------------------------
//   // Get status chip config
//   const getStatusChipConfig = () => {
//     if (isFedExAutoPickup && shipment.pick_up_created_status !== 'created_success' && shipment.pick_up_created_status !== 'created_failed') {
//       return { color: 'success' as const, icon: 'solar:check-circle-bold', text: 'Auto-Scheduled' };
//     }
//     if (isExternalCall) {
//       return { color: 'primary' as const, icon: 'solar:phone-bold', text: 'Call' };
//     }
//     if (shipment.pick_up_created_status === 'created_success') {
//       return { color: 'success' as const, icon: 'solar:check-circle-bold', text: 'Success' };
//     }
//     if (shipment.pick_up_created_status === 'created_failed') {
//       return { color: 'danger' as const, icon: 'solar:close-circle-bold', text: 'Failed' };
//     }
//     return { color: 'warning' as const, icon: 'solar:clock-circle-bold', text: 'Pending' };
//   };

//   // -------------------------------
//   // Render logic
//   // -------------------------------
//   if (isGrabPickup) {
//     return (
//       <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
//         <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200">
//           <Icon icon="solar:calendar-bold" width={22} className="text-blue-600" />
//           <h3 className="font-semibold text-blue-900 text-base">Pickup Information</h3>
//         </div>
//         <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
//           <div>
//             <span className="font-medium text-gray-600">Date & Time: </span>
//             <span className="font-semibold text-gray-900">{pickupDateTime}</span>
//           </div>
//           <div>
//             <span className="font-medium text-gray-600">Instruction: </span>
//             <span className="font-semibold text-gray-900">
//               {shipment.pick_up_instructions || 'Not specified'}
//             </span>
//           </div>
//         </div>
//       </Card>
//     );
//   }

//   const statusChipConfig = getStatusChipConfig();

//   return (
//     <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
//       <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
//         <div className="flex items-center gap-2">
//           <Icon icon="solar:calendar-bold" width={22} className="text-blue-600" />
//           <h3 className="font-semibold text-blue-900 text-base">Pickup Information</h3>
//         </div>
//         <Chip
//           color={statusChipConfig.color}
//           variant="flat"
//           size="sm"
//           startContent={<Icon icon={statusChipConfig.icon} width={16} />}
//           className="font-semibold"
//         >
//           {statusChipConfig.text}
//         </Chip>
//       </div>

//       <div className="space-y-3">
//         <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
//           <div>
//             <span className="font-medium text-gray-600">Date & Time: </span>
//             <span className="font-semibold text-gray-900">{pickupDateTime}</span>
//           </div>
//           <div>
//             <span className="font-medium text-gray-600">Instruction: </span>
//             <span className="font-semibold text-gray-900">
//               {shipment.pick_up_instructions || 'Not specified'}
//             </span>
//           </div>

//           {!isExternalCall && shipment.pick_up_created_status === 'created_success' && (
//             <div>
//               <span className="font-medium text-gray-600">Confirmation No: </span>
//               <span className="font-semibold text-gray-900">
//                 {shipment.pickup_confirmation_numbers}
//               </span>
//             </div>
//           )}
//         </div>

//         {!isExternalCall && shipment.pick_up_created_status === 'created_failed' && (
//           <div className="space-y-2 mt-3">
//             <div className="bg-red-50 border border-red-200 rounded-lg p-3">
//               <p className="text-red-700 text-sm font-medium flex items-start gap-2">
//                 <Icon icon="solar:danger-triangle-bold" width={18} className="flex-shrink-0 mt-0.5" />
//                 <span><strong>Error Detail:</strong> {formattedPickupError}</span>
//               </p>
//             </div>
//             <div className="flex gap-2">
//               <Button color="primary" size="sm" onPress={onCreatePickup}>
//                 Retry Create Pickup
//               </Button>
//               {onChangePickupDateTime && (
//                 <Button
//                   color="warning"
//                   size="sm"
//                   onPress={onChangePickupDateTime}
//                   startContent={<Icon icon="solar:calendar-bold" width={16} />}
//                 >
//                   Change Pickup Date/Time
//                 </Button>
//               )}
//             </div>
//           </div>
//         )}

//         {isDHLAsia && (
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
//             <p className="text-blue-700 text-sm flex items-start gap-2">
//               <Icon icon="solar:phone-bold" width={18} className="flex-shrink-0 mt-0.5" />
//               <span>
//                 Please call DHL eCommerce Asia customer service to arrange pickup for this package.
//                 <br />
//                 <span className="font-medium">Contact Logistic Team for further information.</span>
//               </span>
//             </p>
//           </div>
//         )}

//         {isDHLExpress && (
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
//             <p className="text-blue-700 text-sm flex items-start gap-2">
//               <Icon icon="solar:phone-bold" width={18} className="flex-shrink-0 mt-0.5" />
//               <span>
//                 Please call DHL Express Worldwide customer service to arrange pickup for this package (Aftership not supported yet).
//                 <br />
//                 <span className="font-medium">Contact Logistic Team for further information.</span>
//               </span>
//             </p>
//           </div>
//         )}

//         {isFedExAutoPickup && (
//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
//             <p className="text-blue-700 text-sm flex items-start gap-2">
//               <Icon icon="solar:settings-bold" width={18} className="flex-shrink-0 mt-0.5" />
//               <span>
//                 <strong>Automated Pickup:</strong> System will automatically schedule pickup and the Pickup Confirmation Number will be available on {new Date(new Date(shipment.pick_up_date).getTime() - 86400000).toLocaleDateString()}.
//               </span>
//             </p>
//           </div>
//         )}
//       </div>
//     </Card>
//   );
// };

// export default PickupInformation;
