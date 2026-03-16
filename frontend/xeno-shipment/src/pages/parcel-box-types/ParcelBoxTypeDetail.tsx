import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Button,
  Chip,
  Divider,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from '@heroui/react';
import { Icon } from '@iconify/react';
import parcelBoxTypesService from './parcelBoxTypesService';
import type { ParcelBoxType } from './types';
import { ParcelBoxTypeFormModal } from './components/ParcelBoxTypeFormModal';

const ParcelBoxTypeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [boxType, setBoxType] = useState<ParcelBoxType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchBoxTypeDetail = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const response = await parcelBoxTypesService.getParcelBoxType(parseInt(id));
      if (response.status === 'success' && response.data) {
        setBoxType(response.data as ParcelBoxType);
      }
    } catch (error) {
      console.error('Failed to fetch box type detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBoxTypeDetail();
  }, [id]);

  const formatDimensions = (box: ParcelBoxType) => {
    return `${box.depth} × ${box.width} × ${box.height} ${box.dimension_unit}`;
  };

  const formatWeight = (box: ParcelBoxType) => {
    return `${box.parcel_weight} ${box.weight_unit}`;
  };

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleToggleStatus = async () => {
    if (!boxType) return;

    setIsTogglingStatus(true);
    try {
      const newStatus = (boxType.active === 1 || boxType.active === true || boxType.active === null) ? 0 : 1;
      const response = await parcelBoxTypesService.updateParcelBoxType(
        typeof boxType.parcelBoxTypeID === 'string' ? parseInt(boxType.parcelBoxTypeID) : boxType.parcelBoxTypeID,
        { active: newStatus }
      );

      if (response.status === 'success') {
        await fetchBoxTypeDetail();
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Failed to toggle status:', error);
      alert(error.response?.data?.message || error.message || 'Failed to update status. Please try again.');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" label="Loading box type details..." />
      </div>
    );
  }

  if (!boxType) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Icon icon="solar:inbox-linear" width={64} className="text-default-300" />
        <p className="text-default-500">Box type not found</p>
        <Button color="primary" onPress={() => navigate('/local/parcel-box-types')}>
          Back to Box Types List
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          isIconOnly
          variant="light"
          onPress={() => navigate('/local/parcel-box-types')}
        >
          <Icon icon="solar:arrow-left-bold" className="text-xl" />
        </Button>
        <h1 className="text-2xl font-bold">Box Type Name: {boxType.box_type_name}</h1>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-between">
        <div className="flex gap-3">
          <Button
            color={(boxType.active === 1 || boxType.active === true || boxType.active === null) ? 'danger' : 'success'}
            variant="flat"
            startContent={<Icon icon={(boxType.active === 1 || boxType.active === true || boxType.active === null) ? 'solar:close-circle-linear' : 'solar:check-circle-linear'} width={20} />}
            onPress={handleToggleStatus}
            isLoading={isTogglingStatus}
          >
            {(boxType.active === 1 || boxType.active === true || boxType.active === null) ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            color="primary"
            variant="flat"
            startContent={<Icon icon="solar:pen-linear" width={20} />}
            onPress={() => setIsEditModalOpen(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon="solar:box-linear" width={24} className="text-primary" />
            <h2 className="text-xl font-semibold">Basic Information</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            hideHeader
            removeWrapper
            aria-label="Basic information"
          >
            <TableHeader>
              <TableColumn>Field</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-default-700 w-1/3">Box Type ID</TableCell>
                <TableCell>{boxType.parcelBoxTypeID}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Type</TableCell>
                <TableCell>{boxType.type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Box Type Name</TableCell>
                <TableCell>{boxType.box_type_name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Remark</TableCell>
                <TableCell>{boxType.remark || '-'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Status</TableCell>
                <TableCell>
                  <Chip
                    size="lg"
                    variant="flat"
                    color={(boxType.active === 1 || boxType.active === true || boxType.active === null) ? 'success' : 'danger'}
                  >
                    {(boxType.active === 1 || boxType.active === true || boxType.active === null) ? 'Active' : 'Inactive'}
                  </Chip>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Dimensions & Weight */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon="solar:ruler-linear" width={24} className="text-primary" />
            <h2 className="text-xl font-semibold">Dimensions & Weight</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            hideHeader
            removeWrapper
            aria-label="Dimensions and weight"
          >
            <TableHeader>
              <TableColumn>Field</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-default-700 w-1/3">Depth</TableCell>
                <TableCell>{boxType.depth} {boxType.dimension_unit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Width</TableCell>
                <TableCell>{boxType.width} {boxType.dimension_unit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Height</TableCell>
                <TableCell>{boxType.height} {boxType.dimension_unit}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Dimensions (D × W × H)</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:ruler-linear" width={16} className="text-default-400" />
                    <span className="font-medium">{formatDimensions(boxType)}</span>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Weight</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon icon="solar:scale-linear" width={16} className="text-default-400" />
                    <span className="font-medium">{formatWeight(boxType)}</span>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon="solar:history-linear" width={24} className="text-primary" />
            <h2 className="text-xl font-semibold">Timestamps</h2>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <Table
            hideHeader
            removeWrapper
            aria-label="Timestamp information"
          >
            <TableHeader>
              <TableColumn>Field</TableColumn>
              <TableColumn>Value</TableColumn>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-semibold text-default-700 w-1/3">Created At</TableCell>
                <TableCell>{formatDateTime(boxType.created_at)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-semibold text-default-700">Updated At</TableCell>
                <TableCell>{formatDateTime(boxType.updated_at)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      {boxType && (
        <ParcelBoxTypeFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchBoxTypeDetail}
          editData={boxType}
          mode="edit"
        />
      )}
    </div>
  );
};

export default ParcelBoxTypeDetail;
