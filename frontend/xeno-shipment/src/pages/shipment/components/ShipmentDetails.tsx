import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Spinner, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure, Chip, Card } from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useAuth } from "@context/AuthContext";
import { useNotification } from "@context/NotificationContext";
import {
  AddressInformation,
  RatesSection,
  ParcelsSection,
  RequestHistory,
  ActionSections,
  type ShipmentGETData,
  BasicInformation,
  LabelAndInvoiceInformation
} from "./shipment-details";
import UpdateLogisticsModal from './modals/UpdateLogisticsModal';

const ShipmentDetails = () => {
  const { shipmentId } = useParams<{ shipmentId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [shipment, setShipment] = useState<ShipmentGETData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showAllRates, setShowAllRates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isUpdatingLogistics, setIsUpdatingLogistics] = useState(false);
  const [editCustomsPurpose, setEditCustomsPurpose] = useState("");
  const [editCustomsTermsOfTrade, setEditCustomsTermsOfTrade] = useState("");
  const [editedParcelItems, setEditedParcelItems] = useState<any[]>([]);
  const { isOpen: isPickupModalOpen, onOpen: onPickupModalOpen, onClose: onPickupModalClose } = useDisclosure();
  const { isOpen: isLogisticsModalOpen, onOpen: onLogisticsModalOpen, onClose: onLogisticsModalClose } = useDisclosure();
  const [pickupFormData, setPickupFormData] = useState({
    pick_up_date: "",
    pick_up_start_time: "09:00",
    pick_up_end_time: "16:00",
    pick_up_instructions: ""
  });
  const [isUpdatingPickup, setIsUpdatingPickup] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);

  const { user, msLoginUser } = useAuth();
  const { success, error: showNotificationError } = useNotification();

  const fetchShipment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!shipmentId) {
        throw new Error("Invalid shipment ID");
      }

      const baseUrl = import.meta.env.VITE_APP_GET_SHIPMENT_REQUEST_BY_ID;
      if (!baseUrl) {
        throw new Error("API URL for Shipment Details not configured");
      }

      const apiUrl = `${baseUrl}${shipmentId}`;
      const response = await axios.get(apiUrl);

      const shipmentData = response.data.shipment_request;
      setShipment(shipmentData);

      setEditCustomsPurpose(shipmentData.customs_purpose || "");
      setEditCustomsTermsOfTrade(shipmentData.customs_terms_of_trade || "");

      // Helper to convert time from H:i:s format to HH:mm for input type="time"
      const convertToInputTime = (time: string) => {
        if (!time) return "";
        // If time is in H:i:s format (e.g., "09:00:00"), extract HH:mm
        return time.substring(0, 5);
      };

      // Set pickup form data from shipment
      setPickupFormData({
        pick_up_date: shipmentData.pick_up_date || "",
        pick_up_start_time: convertToInputTime(shipmentData.pick_up_start_time) || "09:00",
        pick_up_end_time: convertToInputTime(shipmentData.pick_up_end_time) || "16:00",
        pick_up_instructions: shipmentData.pick_up_instructions || "Not Specified."
      });

      const allItems: any[] = [];
      shipmentData.parcels?.forEach((parcel: any, parcelIndex: number) => {
        parcel.items?.forEach((item: any, itemIndex: number) => {
          allItems.push({
            ...item,
            parcelIndex,
            itemIndex,
            id: `${parcelIndex}-${itemIndex}`,
            parcelItemID: item.parcelItemID
          });
        });
      });
      setEditedParcelItems(allItems);
    } catch (err) {
      console.error("Error fetching shipment details:", err);
      setError(err instanceof Error ? err.message : "Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipment();
  }, [shipmentId, location.key]); // location.key changes on every navigation

  const handleApprovalAction = async (action: 'approver_approved' | 'approver_rejected', remarkParam?: string) => {
    if (!msLoginUser || !shipmentId) {
      showNotificationError('Missing user information or shipment ID', 'Authentication Error');
      return;
    }

    const isApprove = action === 'approver_approved';
    const setLoadingState = isApprove ? setIsApproving : setIsRejecting;

    // Use the remark parameter (provided by ActionSections for rejections)
    const remarkToUse = remarkParam || "";

    if (!isApprove && !remarkToUse.trim()) {
      showNotificationError('Remark is required when rejecting a shipment request.', 'Missing Remark');
      return;
    }

    try {
      setLoadingState(true);

      const approvalUrl = import.meta.env.VITE_APP_APPROVAL_SHIPMENT_REQUEST;
      if (!approvalUrl) {
        throw new Error("Approval API URL not configured");
      }

      const apiUrl = `${approvalUrl}${shipmentId}`;

      const payload = {
        login_user_id: user?.userID || 0,
        login_user_name: msLoginUser.name,
        login_user_mail: msLoginUser.email,
        remark: remarkToUse.trim() || (isApprove ? "Approved" : "Rejected"),
        send_status: action
      };

      const response = await axios.put(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        const responseData = response.data;
        const labelResponse = responseData.create_label_response;
        const hasLabelErrors = labelResponse?.$create_label_response_body?.meta?.details?.length > 0;

        if (responseData.status === 'success') {
          const actionText = isApprove ? 'approved' : 'rejected';

          if (hasLabelErrors || responseData.response_message === 'Label created failed.') {
            const labelErrors = labelResponse?.$create_label_response_body?.meta?.details || [];

            if (labelErrors.length > 0) {
              const errorDetails = labelErrors.map((error: any) => {
                const field = error.path || 'Unknown field';
                const message = error.info || 'Unknown error';
                return `• ${field}: ${message}`;
              }).join('\n');

              const alertMessage = `✅ Shipment ${actionText} successfully!\n\n❌ However, shipping label creation failed:\n\n${errorDetails}\n\n📞 Please contact the logistics team to resolve these label creation issues before the shipment can proceed.`;
              showNotificationError(alertMessage, 'Partial Success');
            } else {
              const labelMessage = responseData.label_message || responseData.response_message || 'Unknown label creation error';
              showNotificationError(`✅ Shipment ${actionText} successfully!\n\n❌ However, shipping label creation failed: ${labelMessage}\n\n📞 Please contact the logistics team.`, 'Partial Success');
            }
          } else {
            success(`Shipment ${actionText} successfully!\n\nShipping label has been created and is ready for use.`, 'Success');
          }
        } else {
          const actionText = isApprove ? 'approved' : 'rejected';
          success(`Shipment ${actionText} successfully!`, 'Success');
        }

        window.location.reload();
      }
    } catch (error) {
      console.error('Error during approval action:', error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        if (errorData.meta?.message) {
          showNotificationError(`Action failed: ${errorData.meta.message}`, 'Action Failed');
        } else {
          showNotificationError('Failed to process approval action. Please try again.', 'Action Failed');
        }
      } else {
        showNotificationError('Failed to process approval action. Please check your connection and try again.', 'Connection Error');
      }
    } finally {
      setLoadingState(false);
    }
  };

  const handleLogisticsUpdate = async () => {
    if (!shipmentId || !msLoginUser) return;

    try {
      setIsUpdatingLogistics(true);

      const logisticUrl = import.meta.env.VITE_APP_LOGISTIC_EDIT_SHIPMENT_REQUEST;
      if (!logisticUrl) {
        throw new Error("Logistics API URL not configured");
      }

      const apiUrl = `${logisticUrl}${shipmentId}`;

      const parcelsData = shipment!.parcels?.map((parcel: any) => ({
        parcel_items: parcel.items?.map((originalItem: any) => {
          const editedItem = editedParcelItems.find(
            (edited) => edited.parcelItemID === originalItem.parcelItemID
          );

          return {
            parcelItemID: originalItem.parcelItemID,
            item_id: editedItem?.item_id || originalItem.item_id || '',
            origin_country: editedItem?.origin_country || originalItem.origin_country || '',
            hs_code: editedItem?.hs_code || originalItem.hs_code || ''
          };
        }) || []
      })) || [];

      const payload = {
        send_status: 'logistic_updated',
        login_user_id: user?.userID || 0,
        login_user_name: msLoginUser.name,
        login_user_mail: msLoginUser.email,
        customs_purpose: editCustomsPurpose || shipment!.customs_purpose,
        customs_terms_of_trade: editCustomsTermsOfTrade || shipment!.customs_terms_of_trade,
        parcels: parcelsData,
        remark: 'Logistics information updated'
      };

      const response = await axios.put(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData.status === 'success') {
          success('Logistics information updated successfully!', 'Success');
          onLogisticsModalClose();
          window.location.reload();
        } else {
          showNotificationError('Failed to update logistics information. Please try again.', 'Update Failed');
        }
      }
    } catch (error) {
      console.error('Error updating logistics information:', error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        console.error('Full API Error Response:', errorData);

        if (errorData.message && errorData.message.includes('parcel_items')) {
          showNotificationError('Database configuration issue detected. The parcel_items table may not exist or be accessible. Please contact the development team.', 'Database Error');
        } else if (errorData.message) {
          showNotificationError(`Update failed: ${errorData.message}`, 'Update Failed');
        } else if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join('\n');
          showNotificationError(`Validation failed:\n${errorMessages}`, 'Validation Error');
        } else {
          showNotificationError('Failed to update logistics information. Please try again.', 'Update Failed');
        }
      } else {
        showNotificationError('Failed to update logistics information. Please check your connection and try again.', 'Connection Error');
      }
    } finally {
      setIsUpdatingLogistics(false);
    }
  };

  const cancelShipmentRequest = async () => {
    if (!shipmentId || !msLoginUser) return;

    try {
      setLoading(true);

      const cancelRequestUrl = import.meta.env.VITE_APP_CANCEL_REQUEST;
      if (!cancelRequestUrl) {
        throw new Error("Cancel Request API URL not configured");
      }
      const apiUrl = `${cancelRequestUrl}${shipmentId}`;

      const payload = {
        send_status: 'cancelled',
        login_user_id: user?.userID || 0,
        login_user_name: msLoginUser.name,
        login_user_mail: msLoginUser.email,
      };

      const response = await axios.put(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData.status === 'success') {
          success('Cancelled successfully!', 'Success');
          // stop loading 
          window.location.reload();
        } else {
          showNotificationError('Failed to cancelled the shipment request. Please try again.', 'Cancel Failed');
        }
      }
    } catch (error) {
      console.error("Error cancelling shipment request:", error);

      if (axios.isAxiosError(error)) {
        const apiError = error.response?.data;

        if (!apiError) {
          showNotificationError(
            "No response from server. Please try again.",
            "Network Error"
          );
          return;
        }

        // Fallback
        showNotificationError(
          "Failed to cancel the shipment. Please try again.",
          "Cancel Failed"
        );
      } else {
        // Non-Axios error (JS error)
        showNotificationError(
          "Unexpected error occurred. Please try again.",
          "Error"
        );
      }
    }
    finally {
      setLoading(false);
    }
  };

  const handleParcelItemUpdate = (itemId: string, field: string, value: string) => {
    setEditedParcelItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCreateLabel = async () => {
    if (!shipmentId) return;

    try {
      setIsCreatingLabel(true);
      const baseUrl = import.meta.env.VITE_APP_CREATE_LABEL;
      if (!baseUrl) {
        throw new Error("Create Label API URL not configured");
      }

      const apiUrl = `${baseUrl}${shipmentId}`;

      const response = await axios.post(apiUrl, null, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200 && response.data?.$create_label_response_body?.meta?.code === 200) {
        success('Label created successfully!', 'Success');
        // window.location.reload();
        await fetchShipment();
      } else {
        showNotificationError(`Failed to create label (HTTP ${response.data?.$create_label_response_body?.meta?.code}).`, 'Label Creation Failed');
        await fetchShipment();
      }
    } catch (error) {
      console.error("Error creating label:", error);

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const meta = errorData?.$create_label_response_body?.meta;
        const details = meta?.details;

        let msg = errorData?.message || meta?.message || "Unknown error";

        if (Array.isArray(details) && details.length > 0) {
          const formattedDetails = details
            .map((d: any) => `• ${d.path}: ${d.info}`)
            .join("\n");
          msg += `\n\nDetails:\n${formattedDetails}`;
        }

        showNotificationError(`Failed to create label:\n${msg}`, 'Label Creation Failed');
      } else {
        showNotificationError('Failed to create label. Please check your connection.', 'Connection Error');
      }
    } finally {
      setIsCreatingLabel(false);
    }
  };

  const handleCreatePickup = async () => {
    if (!shipmentId) return;

    try {
      const baseUrl = import.meta.env.VITE_APP_CREATE_PICKUP;
      if (!baseUrl) {
        throw new Error("Create Pickup API URL not configured");
      }

      const apiUrl = `${baseUrl}${shipmentId}`;

      const response = await axios.post(apiUrl, null, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 200) {
        const responseData = response.data;
        const pickupStatus = responseData?.pickup_created_status;
        const metaCode = responseData?.data_body?.meta?.code;
        const details = responseData?.data_body?.meta?.details;

        // Check if pickup was actually created successfully
        if (pickupStatus === 'created_success' || (metaCode === 200 && !details?.length)) {
          success('Pickup created successfully!', 'Success');
          await fetchShipment();
        } else {
          // Pickup creation failed - show detailed error
          const errorMessage = responseData?.message || 'Unknown error';
          let detailedError = errorMessage;

          if (Array.isArray(details) && details.length > 0) {
            const formattedDetails = details
              .map((d: any) => `• ${d.path}: ${d.info}`)
              .join("\n");
            detailedError = `${errorMessage}\n\nDetails:\n${formattedDetails}`;
          }

          showNotificationError(`Failed to create pickup:\n${detailedError}`, 'Pickup Creation Failed');
          await fetchShipment();
        }
      } else {
        showNotificationError(`Failed to create pickup (HTTP ${response.status}).`, 'Pickup Creation Failed');
        await fetchShipment();
      }
    } catch (error) {
      console.error("Error creating pickup:", error);

      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const meta = errorData?.$data_body?.meta;
        const details = meta?.details;

        let msg = errorData?.message || meta?.message || "Unknown error";

        if (Array.isArray(details) && details.length > 0) {
          const formattedDetails = details
            .map((d: any) => `• ${d.path}: ${d.info}`)
            .join("\n");
          msg += `\n\nDetails:\n${formattedDetails}`;
        }

        showNotificationError(`Failed to create pickup:\n${msg}`, 'Label Creation Failed');
      } else {
        showNotificationError('Failed to create pickup. Please check your connection.', 'Connection Error');
      }
    }
  };

  const handleDuplicateShipment = () => {
    if (!shipment || !shipmentId) return;

    navigate(`/shipment/duplicate/${shipmentId}`);
  };

  const handleViewInvoice = () => {
    if (!shipment || !shipmentId) return;
    navigate(`/shipment/invoice/${shipmentId}`);
  };

  const handleViewPackingSlip = () => {
    if (!shipment || !shipmentId) return;
    navigate(`/shipment/packing-slip/${shipmentId}`);
  };

  const handleViewLabel = () => {
    if (!shipment?.files_label_url) return;

    // Check if the label URL is base64 encoded (for FedEx Domestic Thailand)
    const isBase64Label = !shipment.files_label_url.startsWith('http');

    if (isBase64Label) {
      // For base64 encoded labels (FedEx Domestic Thailand)
      const pdfWindow = window.open("");
      pdfWindow?.document.write(
        `<iframe width='100%' height='100%' src='data:application/pdf;base64,${shipment.files_label_url}'></iframe>`
      );
    } else {
      // For regular URL labels
      window.open(shipment.files_label_url, "_blank");
    }
  };

  const handleOpenPickupModal = () => {
    // Helper to convert time from H:i:s format to HH:mm for input type="time"
    const convertToInputTime = (time: string) => {
      if (!time) return "";
      // If time is in H:i:s format (e.g., "09:00:00"), extract HH:mm
      return time.substring(0, 5);
    };

    // Reset form data with current shipment values or defaults (9 AM to 4 PM)
    setPickupFormData({
      pick_up_date: shipment?.pick_up_date || "",
      pick_up_start_time: convertToInputTime(shipment?.pick_up_start_time || "") || "09:00",
      pick_up_end_time: convertToInputTime(shipment?.pick_up_end_time || "") || "16:00",
      pick_up_instructions: shipment?.pick_up_instructions || ""
    });
    onPickupModalOpen();
  };
  const formatTime = (time: string) => {
    if (!time) return "";
    // If time is in HH:mm format, append :00 for seconds
    if (time.length === 5) return `${time}:00`;
    // If time already has seconds, keep only HH:mm:ss
    return time.length > 8 ? time.substring(0, 8) : time;
  };


  const handleChangePickupDateTime = async () => {
    if (!shipmentId || !msLoginUser) return;

    const shouldRetryPickup = shipment?.request_status === "approver_approved" && shipment?.pick_up_created_status === "created_failed";

    try {
      setIsUpdatingPickup(true);

      const pickupUrl = import.meta.env.VITE_APP_CHANGE_PICKUP_DATETIME;
      if (!pickupUrl) {
        throw new Error("Change Pickup DateTime API URL not configured");
      }

      const apiUrl = `${pickupUrl}${shipmentId}`;

      const payload = {
        pick_up_date: pickupFormData.pick_up_date,
        pick_up_start_time: formatTime(pickupFormData.pick_up_start_time),
        pick_up_end_time: formatTime(pickupFormData.pick_up_end_time),
        pick_up_instructions: pickupFormData.pick_up_instructions,
        login_user_id: user?.userID || 0,
        login_user_name: msLoginUser.name,
        login_user_mail: msLoginUser.email,
      };

      const response = await axios.put(apiUrl, payload, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.status === 200) {
        const responseData = response.data;

        if (responseData.status === 'success') {
          success('Pickup date/time updated successfully!', 'Success');
          onPickupModalClose();
          await fetchShipment();

          // If approved and pickup failed, automatically retry pickup creation
          if (shouldRetryPickup) {
            await handleCreatePickup();
          }
        } else {
          showNotificationError('Failed to update pickup date/time. Please try again.', 'Update Failed');
        }
      }
    } catch (error) {
      console.error('Error updating pickup date/time:', error);

      if (axios.isAxiosError(error) && error.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          showNotificationError(`Update failed: ${errorData.message}`, 'Update Failed');
        } else if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join('\n');
          showNotificationError(`Validation failed:\n${errorMessages}`, 'Validation Error');
        } else {
          showNotificationError('Failed to update pickup date/time. Please try again.', 'Update Failed');
        }
      } else {
        showNotificationError('Failed to update pickup date/time. Please check your connection and try again.', 'Connection Error');
      }
    } finally {
      setIsUpdatingPickup(false);
    }
  };

  const formattedLabelError = shipment?.label_error_msg ? shipment.label_error_msg.replace(/\|/g, '\n|') : "";
  const formattedError = shipment?.error_msg ? shipment.error_msg.replace(/\|/g, '\n|') : "";
  const formattedPickupError = shipment?.pick_up_error_msg ? shipment.pick_up_error_msg.replace(/\|/g, '\n|') : "";

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
        <p className="text-danger">Error: {error}</p>
        <Link to="/shipment">
          <Button color="primary">Back to Shipments</Button>
        </Link>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px]">
        <p>No details found for shipment ID {shipmentId}</p>
        <Link to="/shipment">
          <Button color="primary">Back to Shipments</Button>
        </Link>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const statusLower = status.toLowerCase();

    if (statusLower.includes('approved')) {
      return { color: 'success' as const, icon: 'solar:check-circle-bold' };
    }
    if (statusLower.includes('rejected') || statusLower.includes('cancel')) {
      return { color: 'danger' as const, icon: 'solar:close-circle-bold' };
    }
    if (statusLower.includes('logistic')) {
      return { color: 'warning' as const, icon: 'solar:box-bold' };
    }
    if (statusLower.includes('requested')) {
      return { color: 'primary' as const, icon: 'solar:document-add-bold' };
    }
    if (statusLower.includes('edited')) {
      return { color: 'secondary' as const, icon: 'solar:pen-bold' };
    }
    return { color: 'default' as const, icon: 'solar:info-circle-bold' };
  };


  const statusConfig = getStatusConfig(shipment.request_status);

  return (
    <div className="mx-auto w-full p-6 space-y-3">
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">
          Shipment #{shipment.shipmentRequestID}
        </h1>
        <Chip
          color={statusConfig.color}
          variant="flat"
          size="md"
          startContent={<Icon icon={statusConfig.icon} width={18} />}
          className="font-semibold"
        >
          {shipment.request_status.replace(/_/g, ' ').toUpperCase()}
        </Chip>
      </div>
      <ActionSections
        shipment={shipment}
        onDuplicateShipment={handleDuplicateShipment}
        onOpenLogisticsModal={onLogisticsModalOpen}
        isApproving={isApproving}
        isRejecting={isRejecting}
        onApprovalAction={handleApprovalAction}
        onCancelShipment={cancelShipmentRequest}
        onViewInvoice={handleViewInvoice}
        onViewLabel={handleViewLabel}
        onViewPackingSlip={handleViewPackingSlip}
      />
      <BasicInformation
        shipment={shipment}
        onCreatePickup={handleCreatePickup}
        onChangePickupDateTime={handleOpenPickupModal}
        formattedPickupError={formattedPickupError}
      />

      <LabelAndInvoiceInformation
        shipment={shipment}
        showError={showError}
        setShowError={setShowError}
        onCreateLabel={handleCreateLabel}
        formattedError={formattedError}
        formattedLabelError={formattedLabelError}
        isCreatingLabel={isCreatingLabel}
      />

      <AddressInformation shipment={shipment} />


      {
        shipment?.shipping_options === 'grab_pickup' ? (
          <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-3 border-gray-200">
              <Icon icon="solar:delivery-bold" width={22} className="text-purple-600" />
              <h3 className="font-semibold text-blue-900 text-base">Grab Delivery Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                <Icon icon="solar:wallet-bold" width={20} className="text-purple-600" />
                <div className="flex-1">
                  <span className="text-xs text-gray-600 font-medium">Total Charge</span>
                  <p className="text-lg font-bold text-purple-700">
                    {shipment?.grab_rate_amount} {shipment?.grab_rate_currency}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : shipment?.shipping_options === 'supplier_pickup' ? (
          <Card className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-2 mb-3 border-gray-200">
              <Icon icon="solar:box-minimalistic-bold" width={22} className="text-green-600" />
              <h3 className="font-semibold text-blue-900 text-base">Shipping Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-green-50 p-4 rounded-lg border border-green-100">
                <Icon icon="solar:check-circle-bold" width={24} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800 mb-1">Free Supplier Pickup</p>
                  <p className="text-sm text-gray-700">
                    The supplier will arrange the pickup and delivery of the shipment at no additional cost.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <RatesSection
            shipment={shipment}
            showAllRates={showAllRates}
            setShowAllRates={setShowAllRates}
          />
        )
      }


      <ParcelsSection shipment={shipment} />

      <RequestHistory
        shipment={shipment}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />

      {/* Change Pickup DateTime Modal */}
      <Modal isOpen={isPickupModalOpen} onClose={onPickupModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Change Pickup Date & Time</ModalHeader>
          <ModalBody>
            <div className="grid grid-cols-1 gap-4">
              <Input
                type="date"
                label="Pickup Date"
                value={pickupFormData.pick_up_date}
                onChange={(e) => setPickupFormData({ ...pickupFormData, pick_up_date: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Start Time"
                  value={pickupFormData.pick_up_start_time}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, pick_up_start_time: e.target.value })}
                />
                <Input
                  type="time"
                  label="End Time"
                  value={pickupFormData.pick_up_end_time}
                  onChange={(e) => setPickupFormData({ ...pickupFormData, pick_up_end_time: e.target.value })}
                />
              </div>
              <Input
                label="Pickup Instructions"
                placeholder="Enter any special instructions..."
                value={pickupFormData.pick_up_instructions}
                onChange={(e) => setPickupFormData({ ...pickupFormData, pick_up_instructions: e.target.value })}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onPickupModalClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleChangePickupDateTime}
              isLoading={isUpdatingPickup}
            >
              {shipment?.request_status === "approver_approved" && shipment?.pick_up_created_status === "created_failed"
                ? "Update and Retry"
                : "Update Pickup DateTime"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Logistics Information Update Modal */}
      <UpdateLogisticsModal
        isOpen={isLogisticsModalOpen}
        onClose={onLogisticsModalClose}
        shipment={shipment}
        editedParcelItems={editedParcelItems}
        editCustomsPurpose={editCustomsPurpose}
        editCustomsTermsOfTrade={editCustomsTermsOfTrade}
        isUpdatingLogistics={isUpdatingLogistics}
        onEditCustomsPurposeChange={setEditCustomsPurpose}
        onEditCustomsTermsOfTradeChange={setEditCustomsTermsOfTrade}
        onParcelItemUpdate={handleParcelItemUpdate}
        onSubmit={handleLogisticsUpdate}
      />
    </div>
  );
};

export default ShipmentDetails;