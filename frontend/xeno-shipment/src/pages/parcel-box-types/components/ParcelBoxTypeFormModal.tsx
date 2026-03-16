import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Switch
} from '@heroui/react';
import { Icon } from '@iconify/react';
import parcelBoxTypesService from '../parcelBoxTypesService';
import type { ParcelBoxType } from '../types';
import type { CreateParcelBoxTypePayload, UpdateParcelBoxTypePayload } from '../parcelBoxTypesService';

interface ParcelBoxTypeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editData?: ParcelBoxType | null;
  mode: 'create' | 'edit';
}

const DIMENSION_UNITS = ['cm', 'm', 'in'];
const WEIGHT_UNITS = ['kg', 'g', 'lb'];

export const ParcelBoxTypeFormModal: React.FC<ParcelBoxTypeFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  editData,
  mode
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    parcelBoxTypeID: '',
    type: '',
    box_type_name: '',
    depth: '',
    width: '',
    height: '',
    dimension_unit: 'cm',
    parcel_weight: '',
    weight_unit: 'kg',
    remark: '',
    active: true
  });

  useEffect(() => {
    if (editData && mode === 'edit') {
      setFormData({
        parcelBoxTypeID: editData?.parcelBoxTypeID?.toString(),
        type: editData.type,
        box_type_name: editData.box_type_name,
        depth: editData.depth?.toString(),
        width: editData.width?.toString(),
        height: editData.height?.toString(),
        dimension_unit: editData.dimension_unit,
        parcel_weight: editData.parcel_weight?.toString(),
        weight_unit: editData.weight_unit,
        remark: editData.remark || '',
        active: (editData.active === 1 || editData.active === true || editData.active === null)
      });
    } else {
      setFormData({
        parcelBoxTypeID: '',
        type: '',
        box_type_name: '',
        depth: '',
        width: '',
        height: '',
        dimension_unit: 'cm',
        parcel_weight: '',
        weight_unit: 'kg',
        remark: '',
        active: true
      });
    }
    setErrors({});
  }, [editData, mode, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (mode === 'create' && !formData.parcelBoxTypeID) {
      newErrors.parcelBoxTypeID = 'Box Type ID is required';
    }
    if (mode === 'create' && isNaN(parseInt(formData.parcelBoxTypeID))) {
      newErrors.parcelBoxTypeID = 'Box Type ID must be a number';
    }
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.box_type_name) newErrors.box_type_name = 'Box Type Name is required';
    if (!formData.depth || parseFloat(formData.depth) < 0) {
      newErrors.depth = 'Valid depth is required';
    }
    if (!formData.width || parseFloat(formData.width) < 0) {
      newErrors.width = 'Valid width is required';
    }
    if (!formData.height || parseFloat(formData.height) < 0) {
      newErrors.height = 'Valid height is required';
    }
    if (!formData.parcel_weight || parseFloat(formData.parcel_weight) < 0) {
      newErrors.parcel_weight = 'Valid weight is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (mode === 'edit' && editData) {
        const payload: UpdateParcelBoxTypePayload = {
          type: formData.type,
          box_type_name: formData.box_type_name,
          depth: parseFloat(formData.depth),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          dimension_unit: formData.dimension_unit,
          parcel_weight: parseFloat(formData.parcel_weight),
          weight_unit: formData.weight_unit,
          remark: formData.remark,
          active: formData.active ? 1 : 0
        };
        const id = typeof editData.parcelBoxTypeID === 'string'
          ? parseInt(editData.parcelBoxTypeID)
          : editData.parcelBoxTypeID;
        await parcelBoxTypesService.updateParcelBoxType(id, payload);
      } else {
        const payload: CreateParcelBoxTypePayload = {
          parcelBoxTypeID: parseInt(formData.parcelBoxTypeID),
          type: formData.type,
          box_type_name: formData.box_type_name,
          depth: parseFloat(formData.depth),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          dimension_unit: formData.dimension_unit,
          parcel_weight: parseFloat(formData.parcel_weight),
          weight_unit: formData.weight_unit,
          remark: formData.remark,
          active: formData.active ? 1 : 0
        };
        await parcelBoxTypesService.createParcelBoxType(payload);
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to save box type:', error);
      if (error.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          serverErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(serverErrors);
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <Icon icon="solar:box-linear" width={24} className="text-primary" />
          {mode === 'edit' ? 'Edit Box Type' : 'Create New Box Type'}
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Box Type ID - Only for create mode */}
            {mode === 'create' && (
              <Input
                type="number"
                label="Box Type ID"
                placeholder="e.g., 1001"
                value={formData.parcelBoxTypeID}
                onValueChange={(value) => {
                  setFormData({ ...formData, parcelBoxTypeID: value });
                  setErrors({ ...errors, parcelBoxTypeID: '' });
                }}
                isInvalid={!!errors.parcelBoxTypeID}
                errorMessage={errors.parcelBoxTypeID}
                isRequired
                description="Unique identifier for the box type"
              />
            )}

            {/* Type */}
            <Input
              type="text"
              label="Type"
              placeholder="e.g., FedEx Box, Custom Box"
              value={formData.type}
              onValueChange={(value) => {
                setFormData({ ...formData, type: value });
                setErrors({ ...errors, type: '' });
              }}
              isInvalid={!!errors.type}
              errorMessage={errors.type}
              isRequired
            />

            {/* Box Type Name */}
            <Input
              type="text"
              label="Box Type Name"
              placeholder="e.g., FedEx Small Box"
              value={formData.box_type_name}
              onValueChange={(value) => {
                setFormData({ ...formData, box_type_name: value });
                setErrors({ ...errors, box_type_name: '' });
              }}
              isInvalid={!!errors.box_type_name}
              errorMessage={errors.box_type_name}
              isRequired
            />

            {/* Dimensions */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Dimensions</label>
              <div className="grid grid-cols-4 gap-3">
                <Input
                  type="number"
                  label="Depth"
                  placeholder="0"
                  step="0.01"
                  value={formData.depth}
                  onValueChange={(value) => {
                    setFormData({ ...formData, depth: value });
                    setErrors({ ...errors, depth: '' });
                  }}
                  isInvalid={!!errors.depth}
                  errorMessage={errors.depth}
                  isRequired
                />
                <Input
                  type="number"
                  label="Width"
                  placeholder="0"
                  step="0.01"
                  value={formData.width}
                  onValueChange={(value) => {
                    setFormData({ ...formData, width: value });
                    setErrors({ ...errors, width: '' });
                  }}
                  isInvalid={!!errors.width}
                  errorMessage={errors.width}
                  isRequired
                />
                <Input
                  type="number"
                  label="Height"
                  placeholder="0"
                  step="0.01"
                  value={formData.height}
                  onValueChange={(value) => {
                    setFormData({ ...formData, height: value });
                    setErrors({ ...errors, height: '' });
                  }}
                  isInvalid={!!errors.height}
                  errorMessage={errors.height}
                  isRequired
                />
                <Select
                  label="Unit"
                  selectedKeys={[formData.dimension_unit]}
                  onSelectionChange={(keys) => {
                    const value = Array.from(keys)[0] as string;
                    setFormData({ ...formData, dimension_unit: value });
                  }}
                >
                  {DIMENSION_UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Weight */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="number"
                label="Weight"
                placeholder="0"
                step="0.01"
                value={formData.parcel_weight}
                onValueChange={(value) => {
                  setFormData({ ...formData, parcel_weight: value });
                  setErrors({ ...errors, parcel_weight: '' });
                }}
                isInvalid={!!errors.parcel_weight}
                errorMessage={errors.parcel_weight}
                isRequired
              />
              <Select
                label="Weight Unit"
                selectedKeys={[formData.weight_unit]}
                onSelectionChange={(keys) => {
                  const value = Array.from(keys)[0] as string;
                  setFormData({ ...formData, weight_unit: value });
                }}
              >
                {WEIGHT_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Remark */}
            <Textarea
              label="Remark"
              placeholder="Enter any additional notes..."
              value={formData.remark}
              onValueChange={(value) => setFormData({ ...formData, remark: value })}
              minRows={3}
            />

            {/* Active Status */}
            <Switch
              isSelected={formData.active}
              onValueChange={(value) => setFormData({ ...formData, active: value })}
              color="success"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">Active</span>
                <span className="text-xs text-default-500">
                  {formData.active ? 'This box type is active and available for use' : 'This box type is inactive and hidden from selection'}
                </span>
              </div>
            </Switch>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isLoading}
            startContent={!isLoading && <Icon icon="solar:check-circle-linear" width={20} />}
          >
            {mode === 'edit' ? 'Update' : 'Create'} Box Type
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
