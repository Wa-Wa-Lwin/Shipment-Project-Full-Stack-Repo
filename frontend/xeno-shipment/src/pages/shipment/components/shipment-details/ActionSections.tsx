import { Button, Card, Modal, ModalContent, ModalBody, ModalHeader, ModalFooter, Spinner, useDisclosure, Textarea } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { isRateChosen } from '../../utils/rateUtils';
import { useAuth } from '@context/AuthContext';
import type { ShipmentGETData } from './types';
import { useState } from 'react';

interface ActionSectionsProps {
  shipment: ShipmentGETData;
  onDuplicateShipment?: () => void;
  onOpenLogisticsModal?: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  onApprovalAction?: (action: 'approver_approved' | 'approver_rejected', remark?: string) => void;
  onViewInvoice?: () => void;
  onViewLabel?: () => void;
  onViewPackingSlip?: () => void;
  onCancelShipment?: () => void;
}

const ActionSections = ({
  shipment,
  onDuplicateShipment,
  onOpenLogisticsModal,
  isApproving,
  isRejecting,
  onApprovalAction,
  onViewInvoice,
  onViewLabel,
  onViewPackingSlip,
  onCancelShipment,
}: ActionSectionsProps) => {
  const navigate = useNavigate();
  const { user, msLoginUser } = useAuth();
  const [rejectRemark, setRejectRemark] = useState("");
  const { isOpen: isRejectModalOpen, onOpen: onRejectModalOpen, onClose: onRejectModalClose } = useDisclosure();
  const { isOpen: isWarningOpen, onOpen: onWarningOpen, onClose: onWarningClose } = useDisclosure();

  const canEdit =
    (user?.logisticRole === "1" &&
      shipment.request_status !== "approver_approved" &&
      shipment.request_status !== "approver_rejected") ||
    (shipment.created_user_mail?.toLowerCase() === msLoginUser?.email?.toLowerCase() &&
      shipment.request_status !== "approver_approved" &&
      shipment.request_status !== "approver_rejected") ||
    (shipment.approver_user_mail?.toLowerCase() === msLoginUser?.email?.toLowerCase() &&
      shipment.request_status !== "approver_approved" &&
      shipment.request_status !== "approver_rejected");

  const canUpdateLogistics = [
    "requestor_requested",
    "logistic_updated",
    "logistic_edited",
    "approver_edited"
  ].includes(shipment.request_status) &&
    shipment?.label_status !== "created" &&
    shipment?.label_status !== "failed";

  const canApprove = [
    "requestor_requested",
    "logistic_updated",
    "logistic_edited",
    "approver_edited"
  ].includes(shipment.request_status) &&
    shipment?.approver_user_mail?.toLowerCase() === msLoginUser?.email?.toLowerCase() &&
    shipment?.label_status !== "created";
    // shipment?.label_status !== "created" &&
    // shipment?.label_status !== "failed";

  // Check if pickup date is in the past
  const checkPickupDate = () => {
    if (!shipment.pick_up_date) return true;

    const pickupDate = new Date(shipment.pick_up_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    pickupDate.setHours(0, 0, 0, 0);

    return pickupDate >= today;
  };

  const isPickupDateValid = checkPickupDate();

  const handleApprovalClick = () => {
    if (!isPickupDateValid) {
      onWarningOpen();
      return;
    }
    onApprovalAction?.("approver_approved");
  };

  const handleRejectClick = () => {
    setRejectRemark("");
    onRejectModalOpen();
  };

  const handleConfirmReject = () => {
    if (!rejectRemark.trim()) {
      alert("⚠️ Please enter a remark before rejecting.");
      return;
    }
    onRejectModalClose();
    onApprovalAction?.("approver_rejected", rejectRemark);
  };

  // Check if shipping option is grab_pickup or supplier_pickup
  const isGrabPickup = shipment.shipping_options?.toLowerCase() === 'grab_pickup';
  const isSupplierPickup = shipment.shipping_options?.toLowerCase() === 'supplier_pickup';

  // Get tracking numbers and chosen rate
  const trackingNumbers = shipment.tracking_numbers
    ? shipment.tracking_numbers.split(',').map(id => id.trim()).filter(id => id.length > 0)
    : [];
  const chosenRate = shipment.rates?.find(rate => isRateChosen(rate.chosen));
  const masterTrackingNumber = trackingNumbers.length > 0 ? trackingNumbers[0] : null;

  const cannotCancelStatuses = ['cancelled', 'approver_rejected', 'approver_approved'];
  const canCancel = !cannotCancelStatuses.includes(shipment.request_status?.toLowerCase()) && msLoginUser?.email?.toLowerCase() === shipment.created_user_mail?.toLowerCase();

  return (
    <>
      <Card shadow="none" className="rounded-none">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            {canEdit && (
              <Button
                color="primary"
                size="md"
                startContent={<Icon icon="solar:pen-bold" />}
                onPress={() => navigate(`/shipment/edit/${shipment.shipmentRequestID}`)}
              >
                Edit
              </Button>
            )}
            {canUpdateLogistics && onOpenLogisticsModal && (
              <Button
                color="primary"
                size="md"
                variant="shadow"
                className="font-bold"
                startContent={<Icon icon="solar:box-bold-duotone" width={18} />}
                onPress={onOpenLogisticsModal}
              >
                Update Logistics Info
              </Button>
            )}
            <Button
              color="secondary"
              size="md"
              startContent={<Icon icon="solar:copy-bold" />}
              onPress={onDuplicateShipment}
            >
              Duplicate
            </Button>
            {onViewInvoice && shipment.invoice_no && Number(shipment.use_customize_invoice) === 0 && (
              // {onViewInvoice && shipment.invoice_no && (
              <Button
                color="primary"
                size="md"
                startContent={<Icon icon="solar:document-text-bold" />}
                onPress={onViewInvoice}
              >
                View Invoice
              </Button>
            )}
            {onViewPackingSlip && shipment.invoice_no && (
              <Button
                color="primary"
                size="md"
                startContent={<Icon icon="solar:document-bold" />}
                onPress={onViewPackingSlip}
              >
                View Packing Slip
              </Button>
            )}
            {!isGrabPickup && !isSupplierPickup && onViewLabel && shipment.label_status === "created" && shipment.files_label_url && (
              <Button
                color="primary"
                size="md"
                startContent={<Icon icon="solar:tag-bold" />}
                onPress={onViewLabel}
              >
                View Label
              </Button>
            )}
            {/* Track buttons for each tracking number */}
            {!isGrabPickup && !isSupplierPickup && trackingNumbers.length > 0 && chosenRate?.shipper_account_slug && (
              <>
                {trackingNumbers.map((trackingId, index) => (
                  <Button
                    key={index}
                    color="secondary"
                    size="md"
                    startContent={<Icon icon="solar:map-point-wave-bold" width={16} />}
                    onPress={() => {
                      const trackingUrl = `https://www.aftership.com/track?c=${chosenRate.shipper_account_slug}&t=${trackingId}`;
                      window.open(trackingUrl, "_blank");
                    }}
                  >
                    Track {trackingNumbers.length > 1 ? `#${index + 1}` : ''}
                  </Button>
                ))}
              </>
            )}
            {/* Master tracking button if multiple tracking numbers */}
            {!isGrabPickup && !isSupplierPickup && trackingNumbers.length > 1 && masterTrackingNumber && chosenRate?.shipper_account_slug && (
              <Button
                color="primary"
                size="md"
                startContent={<Icon icon="solar:map-point-wave-bold" width={16} />}
                onPress={() => {
                  const trackingUrl = `https://www.aftership.com/track?c=${chosenRate.shipper_account_slug}&t=${masterTrackingNumber}`;
                  window.open(trackingUrl, "_blank");
                }}
              >
                Track Master
              </Button>
            )}
          </div>
          {onCancelShipment && canCancel && (
            <Button
              color="danger"
              size="md"
              variant="shadow"
              startContent={<Icon icon="solar:forbidden-circle-bold" />}
              onPress={onCancelShipment}
            >
              Cancel
            </Button>
          )}

          {/* Approval Actions - Top Right Corner */}
          {canApprove && onApprovalAction && (
            <div className="flex items-center gap-2">
              {!isPickupDateValid && (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1 mr-2">
                  <Icon icon="solar:danger-triangle-bold" width={16} />
                  Invalid Pickup Date
                </div>
              )}
              {shipment.request_status?.toLowerCase() === 'requestor_requested' && shipment.label_status === "failed"  && 
              (
                <div className="text-xs text-red-600 font-semibold flex items-center gap-1 mr-2">
                  <span>
                    Cannot Approve the shipment with error in creating label. 
                    Check the error and contact to Logistic team.
                  </span>
                </div>
              )}
              <Button
                color="success"
                size="md"
                variant="shadow"
                className="font-bold"
                onPress={handleApprovalClick}
                isLoading={isApproving}
                disabled={isApproving || isRejecting || !isPickupDateValid}
                startContent={!isApproving && <Icon icon="solar:check-circle-bold" width={18} />}
              >
                {isApproving ? "Approving..." : "Approve"}
              </Button>
              <Button
                color="danger"
                size="md"
                variant="shadow"
                className="font-bold"
                onPress={handleRejectClick}
                isLoading={isRejecting}
                disabled={isApproving || isRejecting}
                startContent={!isRejecting && <Icon icon="solar:close-circle-bold" width={18} />}
              >
                {isRejecting ? "Rejecting..." : "Reject"}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Rejection Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={onRejectModalClose}
        size="lg"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-danger border-b-2 border-red-200">
                <Icon icon="solar:close-circle-bold" width={24} />
                Reject Shipment Request
              </ModalHeader>
              <ModalBody className="py-6">
                <div className="space-y-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      <Icon icon="solar:danger-triangle-bold" width={20} />
                      You are about to reject this shipment request
                    </p>
                    <p className="text-xs text-red-700 mt-2">
                      Please provide a reason for rejection. This action cannot be easily undone.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Icon icon="solar:notes-bold" width={16} />
                      Rejection Remark <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Enter the reason for rejecting this shipment request..."
                      value={rejectRemark}
                      onValueChange={setRejectRemark}
                      size="md"
                      variant="bordered"
                      minRows={4}
                      classNames={{
                        input: "text-sm",
                        inputWrapper: "border-red-300 hover:border-red-400 focus-within:border-red-500"
                      }}
                      isRequired
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter className="border-t-2 border-gray-200">
                <Button
                  variant="light"
                  onPress={onClose}
                >
                  Cancel
                </Button>
                <Button
                  color="danger"
                  onPress={handleConfirmReject}
                  className="font-bold"
                  startContent={<Icon icon="solar:close-circle-bold" width={18} />}
                >
                  Confirm Rejection
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Pickup Date Warning Modal */}
      <Modal
        isOpen={isWarningOpen}
        onClose={onWarningClose}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center text-danger">
                <Icon icon="solar:danger-triangle-bold" width={24} />
                Cannot Approve Shipment
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <p className="text-sm">
                    The pickup date ({new Date(shipment.pick_up_date || '').toLocaleDateString()}) is earlier than today.
                  </p>
                  <p className="text-sm font-semibold">
                    Please change the pickup date before approving this shipment.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="danger"
                  variant="light"
                  onPress={onClose}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Loading Modal for Approval/Rejection */}
      <Modal
        isOpen={isApproving || isRejecting}
        hideCloseButton
        isDismissable={false}
        size="md"
        backdrop="blur"
      >
        <ModalContent>
          <ModalBody className="flex flex-col items-center justify-center py-8 space-y-4">
            <Spinner
              size="lg"
              color={isApproving ? "success" : "danger"}
              label={isApproving ? "Approving shipment..." : "Rejecting shipment..."}
              labelColor={isApproving ? "success" : "danger"}
            />
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                Please wait while we process your request...
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ActionSections;
