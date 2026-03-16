import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Button,
} from "@heroui/react";
import apiClient, { FEDEX_GET_ALL } from "../../api/config";

interface FedExShipment {
  fedExApiShipmentID: number;
  masterTrackingNumber: string;
  serviceType: string;
  shipDatestamp: string;
  serviceName: string;
  netRateAmount: string;
  currency: string;
  customerReferenceValue: string;
  created_status: string;
  shipment_request?: {
    created_user_name: string;
    request_status: string;
  };
}

const FedExDomestic = () => {
  const [shipments, setShipments] = useState<FedExShipment[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(FEDEX_GET_ALL);
      setShipments(response.data.data || []);
    } catch (error) {
      console.error("Error fetching FedEx shipments:", error);
    } finally {
      setLoading(false);
    }
  };

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
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">FedEx Domestic Shipments</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage FedEx domestic shipments
          </p>
        </div>
        <Button color="primary" onPress={() => navigate("/shipment/request-form")}>
          Create New Shipment
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table aria-label="FedEx Domestic Shipments Table">
          <TableHeader>
            <TableColumn>SHIPMENT ID</TableColumn>
            <TableColumn>TRACKING NUMBER</TableColumn>
            <TableColumn>INVOICE NO</TableColumn>
            <TableColumn>SERVICE</TableColumn>
            <TableColumn>SHIP DATE</TableColumn>
            <TableColumn>AMOUNT</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>CREATED BY</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody
            items={shipments}
            isLoading={loading}
            loadingContent={<Spinner />}
            emptyContent="No FedEx shipments found"
          >
            {(item) => (
              <TableRow key={item.fedExApiShipmentID}>
                <TableCell>#{item.fedExApiShipmentID}</TableCell>
                <TableCell>
                  <span className="font-mono text-sm">
                    {item.masterTrackingNumber}
                  </span>
                </TableCell>
                <TableCell>{item.customerReferenceValue || "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {item.serviceName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.serviceType}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{formatDate(item.shipDatestamp)}</TableCell>
                <TableCell>
                  <span className="font-semibold">
                    {parseFloat(item.netRateAmount).toFixed(2)} {item.currency}
                  </span>
                </TableCell>
                <TableCell>
                  <Chip
                    color={getStatusColor(item.created_status)}
                    size="sm"
                    variant="flat"
                  >
                    {item.created_status}
                  </Chip>
                </TableCell>
                <TableCell>
                  {item.shipment_request?.created_user_name || "-"}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    color="primary"
                    variant="light"
                    onPress={() =>
                      navigate(`/fedex-domestic/${item.fedExApiShipmentID}`)
                    }
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default FedExDomestic;
