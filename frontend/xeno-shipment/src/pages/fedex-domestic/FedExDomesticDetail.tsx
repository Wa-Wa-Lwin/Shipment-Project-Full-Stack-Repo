import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Chip,
  Button,
  Divider,
} from "@heroui/react";
import axios from "axios";

interface FedExShipmentDetail {
  fedExApiShipmentID: number;
  masterTrackingNumber: string;
  serviceType: string;
  shipDatestamp: string;
  serviceName: string;
  netRateAmount: string;
  currency: string;
  customerReferenceValue: string;
  created_status: string;
  transactionId: string;
  totalNetChargeAmount: string;
  totalNetChargeCurrency: string;
  totalVatChargeAmount: string;
  totalVatChargeCurrency: string;
  totalDutiesAndTaxesAmount: string;
  totalDutiesAndTaxesCurrency: string;
  shipperAccountNumber: string;
  shipperPersonName: string;
  shipperCompanyName: string;
  shipperPhoneNumber: string;
  shipperAddressLine1: string;
  shipperAddressLine2: string;
  shipperCity: string;
  shipperStateOrProvinceCode: string;
  shipperPostalCode: string;
  shipperCountryCode: string;
  recipientPersonName: string;
  recipientCompanyName: string;
  recipientPhoneNumber: string;
  recipientAddressLine1: string;
  recipientAddressLine2: string;
  recipientCity: string;
  recipientStateOrProvinceCode: string;
  recipientPostalCode: string;
  recipientCountryCode: string;
  pickupType: string;
  requestedPickupTimestamp: string;
  latestPickupTimestamp: string;
  packageSequenceNumber: string;
  packageTrackingNumber: string;
  packageWeight: string;
  packageWeightUnit: string;
  packageLength: string;
  packageWidth: string;
  packageHeight: string;
  packageDimensionUnit: string;
  packageDocument_url: string;
  packageDocument_type: string;
  shipment_request?: {
    shipmentRequestID: number;
    request_status: string;
    created_user_name: string;
    created_at: string;
    updated_at: string;
  };
}

const FedExDomesticDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<FedExShipmentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchShipmentDetail = useCallback(async () => {
    try {
      setLoading(true);
      const BASE = (import.meta as any).env.VITE_APP_BACKEND_BASE_URL;
      const response = await axios.get(`${BASE}/api/logistics/fedex_api/get_one/${id}`);
      setShipment(response.data.data || null);
    } catch (error) {
      console.error("Error fetching FedEx shipment details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchShipmentDetail();
    }
  }, [id, fetchShipmentDetail]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
        return "success";
      case "cancelled":
        return "danger";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadLabel = () => {
    if (shipment?.packageDocument_url) {
      const link = document.createElement("a");
      link.href = `data:application/pdf;base64,${shipment.packageDocument_url}`;
      link.download = `FedEx_Label_${shipment.masterTrackingNumber}.pdf`;
      link.click();
    }
  };

  const handleViewLabel = () => {
    if (shipment?.packageDocument_url) {
      const pdfWindow = window.open("");
      pdfWindow?.document.write(
        `<iframe width='100%' height='100%' src='data:application/pdf;base64,${shipment.packageDocument_url}'></iframe>`
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">Shipment not found</p>
            <div className="flex justify-center mt-4">
              <Button color="primary" onPress={() => navigate("/fedex-domestic")}>
                Back to List
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">
            FedEx Shipment #{shipment.fedExApiShipmentID}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tracking: {shipment.masterTrackingNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="bordered" onPress={() => navigate("/fedex-domestic")}>
            Back to List
          </Button>
        </div>
      </div>

      {/* Status and Basic Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Shipment Information</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Chip
                color={getStatusColor(shipment.created_status)}
                size="sm"
                variant="flat"
                className="mt-1"
              >
                {shipment.created_status}
              </Chip>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transaction ID</p>
              <p className="font-mono text-sm">{shipment.transactionId || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Invoice/Reference</p>
              <p className="font-medium">{shipment.customerReferenceValue || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service</p>
              <p className="font-medium">{shipment.serviceName}</p>
              <p className="text-xs text-gray-500">{shipment.serviceType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ship Date</p>
              <p className="font-medium">{formatDate(shipment.shipDatestamp)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Account Number</p>
              <p className="font-mono text-sm">{shipment.shipperAccountNumber}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Charges & Rates</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Net Rate</p>
              <p className="text-lg font-bold text-blue-600">
                {parseFloat(shipment.netRateAmount).toFixed(2)} {shipment.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Net Charge</p>
              <p className="text-lg font-semibold">
                {parseFloat(shipment.totalNetChargeAmount).toFixed(2)}{" "}
                {shipment.totalNetChargeCurrency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">VAT Charge</p>
              <p className="text-lg font-semibold">
                {parseFloat(shipment.totalVatChargeAmount || "0").toFixed(2)}{" "}
                {shipment.totalVatChargeCurrency || shipment.currency}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duties & Taxes</p>
              <p className="text-lg font-semibold">
                {parseFloat(shipment.totalDutiesAndTaxesAmount || "0").toFixed(2)}{" "}
                {shipment.totalDutiesAndTaxesCurrency || shipment.currency}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipper Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Shipper Information</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{shipment.shipperPersonName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{shipment.shipperCompanyName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{shipment.shipperPhoneNumber}</p>
              </div>
              <Divider />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{shipment.shipperAddressLine1}</p>
                {shipment.shipperAddressLine2 && (
                  <p className="font-medium">{shipment.shipperAddressLine2}</p>
                )}
                <p className="font-medium">
                  {shipment.shipperCity}, {shipment.shipperStateOrProvinceCode}{" "}
                  {shipment.shipperPostalCode}
                </p>
                <p className="font-medium">{shipment.shipperCountryCode}</p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recipient Information */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Recipient Information</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{shipment.recipientPersonName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{shipment.recipientCompanyName || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{shipment.recipientPhoneNumber}</p>
              </div>
              <Divider />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{shipment.recipientAddressLine1}</p>
                {shipment.recipientAddressLine2 && (
                  <p className="font-medium">{shipment.recipientAddressLine2}</p>
                )}
                <p className="font-medium">
                  {shipment.recipientCity}, {shipment.recipientStateOrProvinceCode}{" "}
                  {shipment.recipientPostalCode}
                </p>
                <p className="font-medium">{shipment.recipientCountryCode}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Package Details */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Package Details</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Tracking Number</p>
              <p className="font-mono text-sm">{shipment.packageTrackingNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Sequence Number</p>
              <p className="font-medium">{shipment.packageSequenceNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium">
                {shipment.packageWeight} {shipment.packageWeightUnit}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Dimensions</p>
              <p className="font-medium">
                {shipment.packageLength} x {shipment.packageWidth} x{" "}
                {shipment.packageHeight} {shipment.packageDimensionUnit}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Pickup Information */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Pickup Information</h2>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Pickup Type</p>
              <p className="font-medium">{shipment.pickupType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Requested Pickup Time</p>
              <p className="font-medium">
                {formatDate(shipment.requestedPickupTimestamp)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Latest Pickup Time</p>
              <p className="font-medium">
                {formatDate(shipment.latestPickupTimestamp)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Shipping Label */}
      {shipment.packageDocument_url && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Shipping Label</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            {/* <p>
              {shipment?.packageDocument_url}
            </p> */}
            <div className="flex gap-3">
              <Button color="primary" onPress={handleViewLabel}>
                View Label
              </Button>
              <Button color="primary" variant="bordered" onPress={handleDownloadLabel}>
                Download Label
              </Button>
              <div className="ml-auto">
                <p className="text-sm text-gray-500">Document Type</p>
                <p className="font-medium">{shipment.packageDocument_type}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Request Information */}
      {shipment.shipment_request && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Request Information</h2>
          </CardHeader>
          <Divider />
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Request ID</p>
                <p className="font-medium">
                  #{shipment.shipment_request.shipmentRequestID}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Request Status</p>
                <Chip
                  color={getStatusColor(shipment.shipment_request.request_status)}
                  size="sm"
                  variant="flat"
                >
                  {shipment.shipment_request.request_status}
                </Chip>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">
                  {shipment.shipment_request.created_user_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">
                  {formatDate(shipment.shipment_request.created_at)}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default FedExDomesticDetail;
