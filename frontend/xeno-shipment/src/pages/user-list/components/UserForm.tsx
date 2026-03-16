import { useState, useEffect } from 'react';
import {
  Input,
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Switch,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import type { User, CreateUserData, UpdateUserData } from '../types';
import { userApi } from '../api/userApi';

interface UserFormProps {
  user?: User;
  isLoading: boolean;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
}

export default function UserForm({ user, isLoading, onSubmit, onCancel }: UserFormProps) {
  const [formData, setFormData] = useState<CreateUserData | UpdateUserData>({
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: '',
    phone: '',
    role: '',
    logisticRole: 0,
    user_code: '',
    active: true,
    departmentID: undefined,
    section_index: undefined,
    postitionID: undefined,
    supervisorID: undefined,
    level: undefined,
    headID: undefined,
  });

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        gender: user.gender || '',
        phone: user.phone || '',
        role: user.role || '',
        logisticRole: user.logisticRole || 0,
        user_code: user.user_code || '',
        active: user.active,
        departmentID: user.departmentID,
        section_index: user.section_index,
        postitionID: user.postitionID,
        supervisorID: user.supervisorID,
        level: user.level,
        headID: user.headID,
      });
    }
  }, [user]);

  const fetchAvailableUsers = async () => {
    try {
      const users = await userApi.getAllUsers();
      setAvailableUsers(users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isEditMode = !!user;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Basic Information */}
      <Card>
        <CardBody className="gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon="solar:user-linear" width={24} />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              isRequired
              label="Username"
              placeholder="Enter username"
              value={formData.username}
              onValueChange={(value) => handleInputChange('username', value)}
              isDisabled={isEditMode}
              startContent={<Icon icon="solar:user-linear" width={18} />}
            />
            {!isEditMode && (
              <Input
                isRequired
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={formData.password || ''}
                onValueChange={(value) => handleInputChange('password', value)}
                startContent={<Icon icon="solar:lock-password-linear" width={18} />}
                endContent={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none"
                  >
                    <Icon
                      icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                      width={18}
                    />
                  </button>
                }
              />
            )}
            <Input
              isRequired
              label="First Name"
              placeholder="Enter first name"
              value={formData.firstName}
              onValueChange={(value) => handleInputChange('firstName', value)}
            />
            <Input
              isRequired
              label="Last Name"
              placeholder="Enter last name"
              value={formData.lastName}
              onValueChange={(value) => handleInputChange('lastName', value)}
            />
            <Input
              isRequired
              type="email"
              label="Email"
              placeholder="Enter email"
              value={formData.email}
              onValueChange={(value) => handleInputChange('email', value)}
              startContent={<Icon icon="solar:letter-linear" width={18} />}
            />
            <Input
              label="Phone"
              placeholder="Enter phone number"
              value={formData.phone || ''}
              onValueChange={(value) => handleInputChange('phone', value)}
              startContent={<Icon icon="solar:phone-linear" width={18} />}
            />
            <Select
              label="Gender"
              placeholder="Select gender"
              selectedKeys={formData.gender ? [formData.gender] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleInputChange('gender', value);
              }}
            >
              <SelectItem key="Male" value="Male">Male</SelectItem>
              <SelectItem key="Female" value="Female">Female</SelectItem>
              <SelectItem key="Other" value="Other">Other</SelectItem>
            </Select>
            <Input
              label="User Code"
              placeholder="Enter user code"
              value={formData.user_code || ''}
              onValueChange={(value) => handleInputChange('user_code', value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Role & Department */}
      <Card>
        <CardBody className="gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon="solar:shield-user-linear" width={24} />
            Role & Department
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Role"
              placeholder="Enter role"
              value={formData.role || ''}
              onValueChange={(value) => handleInputChange('role', value)}
            />
            <div className="flex items-center justify-between p-3 border-2 border-default-200 rounded-lg">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">Logistic Role</p>
                <p className="text-xs text-default-500">
                  Enable logistic permissions
                </p>
              </div>
              <Switch
                isSelected={Number(formData.logisticRole) === 1}
                onValueChange={(value) => handleInputChange('logisticRole', value ? 1 : 0)}
                color="primary"
              >
                {Number(formData.logisticRole) === 1 ? 'Enabled' : 'Disabled'}
              </Switch>
            </div>
            <Input
              type="number"
              label="Department ID"
              placeholder="Enter department ID"
              value={formData.departmentID?.toString() || ''}
              onValueChange={(value) =>
                handleInputChange('departmentID', value ? parseInt(value) : undefined)
              }
            />
            <Input
              type="number"
              label="Section Index"
              placeholder="Enter section index"
              value={formData.section_index?.toString() || ''}
              onValueChange={(value) =>
                handleInputChange('section_index', value ? parseInt(value) : undefined)
              }
            />
            <Input
              type="number"
              label="Position ID"
              placeholder="Enter position ID"
              value={formData.postitionID?.toString() || ''}
              onValueChange={(value) =>
                handleInputChange('postitionID', value ? parseInt(value) : undefined)
              }
            />
            <Input
              type="number"
              label="Level"
              placeholder="Enter level"
              value={formData.level?.toString() || ''}
              onValueChange={(value) =>
                handleInputChange('level', value ? parseInt(value) : undefined)
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Reporting Structure */}
      <Card>
        <CardBody className="gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Icon icon="solar:users-group-rounded-linear" width={24} />
            Reporting Structure
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Supervisor"
              placeholder="Select supervisor"
              selectedKeys={formData.supervisorID ? [formData.supervisorID.toString()] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleInputChange('supervisorID', value ? parseInt(value) : undefined);
              }}
            >
              {availableUsers.map((u) => (
                <SelectItem key={u.userID} value={u.userID}>
                  {u.firstName} {u.lastName} (@{u.username})
                </SelectItem>
              ))}
            </Select>
            <Select
              label="Head/Approver"
              placeholder="Select head/approver"
              selectedKeys={formData.headID ? [formData.headID.toString()] : []}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                handleInputChange('headID', value ? parseInt(value) : undefined);
              }}
            >
              {availableUsers.map((u) => (
                <SelectItem key={u.userID} value={u.userID}>
                  {u.firstName} {u.lastName} (@{u.username})
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Status */}
      <Card>
        <CardBody className="gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">Account Status</p>
              <p className="text-xs text-default-500">
                Enable or disable this user account
              </p>
            </div>
            <Switch
              isSelected={formData.active}
              onValueChange={(value) => handleInputChange('active', value)}
              color="success"
            >
              {formData.active ? 'Active' : 'Inactive'}
            </Switch>
          </div>
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="flat" onPress={onCancel}>
          Cancel
        </Button>
        <Button color="primary" type="submit" isLoading={isLoading}>
          {isEditMode ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
