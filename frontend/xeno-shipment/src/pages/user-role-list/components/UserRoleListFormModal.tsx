import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Switch,
  Autocomplete,
  AutocompleteItem,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useAuth } from '@context/AuthContext';
import { userRoleListService } from '../userRoleListService';
import { userApi } from '@pages/user-list/api/userApi';
import type { UserRoleList, UserRoleListFormData } from '../types';
import type { User } from '@pages/user-list/types';

interface UserRoleListFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  initialData?: UserRoleList | null;
}

const UserRoleListFormModal: React.FC<UserRoleListFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode,
  initialData,
}) => {
  const { msLoginUser, user } = useAuth();

  // Get logged-in user's email (prefer msLoginUser, fallback to user, then system default)
  const loggedInUserEmail = msLoginUser?.email || user?.email || 'system@example.com';

  const [formData, setFormData] = useState<UserRoleListFormData>({
    Email: '',
    Logistic: false,
    Developer: false,
    Approver: false,
    Supervisor: false,
    Warehouse: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [selectedUserKey, setSelectedUserKey] = useState<string>('');

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && initialData) {
        setFormData({
          userRoleListID: initialData.userRoleListID,
          Email: initialData.Email,
          Logistic: initialData.Logistic,
          Developer: initialData.Developer,
          Approver: initialData.Approver,
          Supervisor: initialData.Supervisor,
          Warehouse: initialData.Warehouse,
        });
        setSelectedUserKey(initialData.Email);
      } else {
        setFormData({
          Email: '',
          Logistic: false,
          Developer: false,
          Approver: false,
          Supervisor: false,
          Warehouse: false,
        });
        setSelectedUserKey('');
      }
      setErrors({});
    }
  }, [isOpen, mode, initialData]);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await userApi.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.Email) {
      newErrors.Email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await userRoleListService.createUserRole({
          ...formData,
          created_user_email: loggedInUserEmail,
        });
      } else if (mode === 'edit' && initialData) {
        await userRoleListService.updateUserRole(initialData.userRoleListID, {
          ...formData,
          updated_user_email: loggedInUserEmail,
        });
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      // Handle Laravel validation errors
      if (error.response?.data?.errors) {
        const serverErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach((key) => {
          serverErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(serverErrors);
      } else {
        setErrors({
          general: error.response?.data?.message || 'An error occurred. Please try again.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!isSubmitting}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          {mode === 'create' ? 'Create New User Role' : 'Edit User Role'}
        </ModalHeader>
        <ModalBody>
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            {/* User Selection */}
            <Autocomplete
              label="Select User"
              placeholder="Search user by name or email"
              selectedKey={selectedUserKey}
              onSelectionChange={(key) => {
                const email = key as string;
                setSelectedUserKey(email);
                setFormData({ ...formData, Email: email });
              }}
              isInvalid={!!errors.Email}
              errorMessage={errors.Email}
              isRequired
              isDisabled={mode === 'edit'}
              isLoading={isLoadingUsers}
              startContent={<Icon icon="mdi:email" />}
            >
              {users
                .filter((user) => user.email && user.email.trim() !== '')
                .map((user) => (
                  <AutocompleteItem
                    key={user.email}
                    value={user.email}
                    textValue={`${user.firstName} ${user.lastName} (${user.email})`}
                  >
                    <span className="font-medium">{user.firstName} {user.lastName} ( {user.email} )</span>
                  </AutocompleteItem>
                ))}
            </Autocomplete>

            {/* Role Switches */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-semibold">Roles & Permissions</h3>

              <div className="flex flex-col space-y-3 max-h-80 overflow-y-auto pr-2">
                <Switch
                  isSelected={formData.Logistic}
                  onValueChange={(value) => setFormData({ ...formData, Logistic: value })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Logistic</span>
                    <span className="text-sm text-gray-500">Access to logistics management features</span>
                  </div>
                </Switch>

                <Switch
                  isSelected={formData.Developer}
                  onValueChange={(value) => setFormData({ ...formData, Developer: value })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Developer</span>
                    <span className="text-sm text-gray-500">Access to development and system settings</span>
                  </div>
                </Switch>

                <Switch
                  isSelected={formData.Approver}
                  onValueChange={(value) => setFormData({ ...formData, Approver: value })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Approver</span>
                    <span className="text-sm text-gray-500">Can approve shipments and orders</span>
                  </div>
                </Switch>

                <Switch
                  isSelected={formData.Supervisor}
                  onValueChange={(value) => setFormData({ ...formData, Supervisor: value })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Supervisor</span>
                    <span className="text-sm text-gray-500">Supervisory access to team management</span>
                  </div>
                </Switch>

                <Switch
                  isSelected={formData.Warehouse}
                  onValueChange={(value) => setFormData({ ...formData, Warehouse: value })}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Warehouse</span>
                    <span className="text-sm text-gray-500">Access to warehouse operations</span>
                  </div>
                </Switch>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            isDisabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserRoleListFormModal;
