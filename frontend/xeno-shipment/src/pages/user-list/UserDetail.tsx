import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Chip,
  Spinner,
  Divider,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { userApi } from './api/userApi';
import type { User } from './types';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(parseInt(id));
    }
  }, [id]);

  const fetchUser = async (userId: number) => {
    try {
      setIsLoading(true);
      const data = await userApi.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!user) return;

    try {
      if (user.active) {
        await userApi.deactivateUser(user.userID);
      } else {
        await userApi.activateUser(user.userID);
      }
      fetchUser(user.userID);
    } catch (error) {
      console.error('Failed to toggle user status:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/user-list/${id}/edit`);
  };

  const handleBack = () => {
    navigate('/user-list');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" label="Loading user details..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Icon icon="solar:user-cross-linear" width={64} className="text-default-300" />
        <p className="text-lg text-default-500">User not found</p>
        <Button onPress={handleBack}>Back to List</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
          >
            <Icon icon="solar:arrow-left-linear" width={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Details</h1>
            <p className="text-sm text-default-500">
              View and manage user information
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color={user.active ? 'danger' : 'success'}
            variant="flat"
            onPress={handleToggleActive}
            startContent={
              <Icon
                icon={user.active ? 'solar:lock-linear' : 'solar:unlock-linear'}
                width={20}
              />
            }
          >
            {user.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            color="primary"
            onPress={handleEdit}
            startContent={<Icon icon="solar:pen-linear" width={20} />}
          >
            Edit User
          </Button>
        </div>
      </div>

      {/* User Information Card */}
      <Card>
        <CardHeader className="flex gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
            <Icon icon="solar:user-bold" width={24} className="text-primary" />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-lg font-semibold">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-sm text-default-500">@{user.username}</p>
          </div>
          <Chip color={user.active ? 'success' : 'danger'} variant="flat">
            {user.active ? 'Active' : 'Inactive'}
          </Chip>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="User ID" value={user.userID.toString()} />
            <InfoItem label="Username" value={user.username} />
            <InfoItem label="Email" value={user.email} />
            <InfoItem label="Phone" value={user.phone || '-'} />
            <InfoItem label="Gender" value={user.gender || '-'} />
            <InfoItem label="User Code" value={user.user_code || '-'} />
          </div>
        </CardBody>
      </Card>

      {/* Role Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Icon icon="solar:shield-user-linear" width={24} className="text-primary" />
            <p className="text-lg font-semibold">Role & Permissions</p>
          </div>
        </CardHeader>
        <Divider />
        <CardBody className="gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoItem label="Role" value={user.role || '-'} />
            <div className="flex flex-col gap-1">
              <p className="text-sm text-default-500">Logistic Role</p>
              <Chip color={Number(user.logisticRole) === 1 ? 'primary' : 'default'} size="sm" variant="flat" className="w-fit">
                {Number(user.logisticRole) === 1 ? 'Enabled' : 'Disabled'}
              </Chip>
            </div>
            <InfoItem label="Level" value={user.level?.toString() || '-'} />
            <InfoItem label="Department ID" value={user.departmentID?.toString() || '-'} />
            <InfoItem label="Section Index" value={user.section_index?.toString() || '-'} />
            <InfoItem label="Position ID" value={user.postitionID?.toString() || '-'} />
          </div>
        </CardBody>
      </Card>

      {/* Hierarchy Information Card */}
      {(user.supervisor || user.approver) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icon icon="solar:users-group-rounded-linear" width={24} className="text-primary" />
              <p className="text-lg font-semibold">Reporting Structure</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.supervisor && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-default-500">Supervisor</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                      <Icon icon="solar:user-linear" width={16} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {user.supervisor.firstName} {user.supervisor.lastName}
                      </p>
                      <p className="text-xs text-default-400">@{user.supervisor.username}</p>
                    </div>
                  </div>
                </div>
              )}
              {user.approver && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-default-500">Approver</p>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-100">
                      <Icon icon="solar:user-check-linear" width={16} className="text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {user.approver.firstName} {user.approver.lastName}
                      </p>
                      <p className="text-xs text-default-400">@{user.approver.username}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

interface InfoItemProps {
  label: string;
  value: string;
}

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm text-default-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
