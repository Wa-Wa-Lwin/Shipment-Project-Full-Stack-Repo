import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Spinner,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { userRoleListService } from './userRoleListService';
import type { UserRoleList } from './types';
import UserRoleListFormModal from './components/UserRoleListFormModal';

const UserRoleListDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<UserRoleList | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onClose: onEditModalClose } = useDisclosure();

  // Fetch user role details
  const fetchUserRole = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const data = await userRoleListService.getUserRole(id);
      setUserRole(data);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this user role?')) return;

    try {
      await userRoleListService.deleteUserRole(id);
      navigate('/local/user-role-list');
    } catch (error) {
      console.error('Failed to delete user role:', error);
      alert('Failed to delete user role. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/local/user-role-list');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="p-6">
        <Card>
          <CardBody>
            <p className="text-center text-gray-500">User role not found</p>
            <div className="flex justify-center mt-4">
              <Button onPress={handleBack}>Back to List</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={handleBack}
          >
            <Icon icon="mdi:arrow-left" width={24} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Email: {userRole.Email}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="primary"
            startContent={<Icon icon="mdi:pencil" width={20} />}
            onPress={onEditModalOpen}
          >
            Edit
          </Button>
          <Button
            color="danger"
            variant="flat"
            startContent={<Icon icon="mdi:delete" width={20} />}
            onPress={handleDelete}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Main Information Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Roles Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Assigned Roles</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">Logistic</span>
                <Chip color={userRole.Logistic ? 'success' : 'default'} variant="flat">
                  {userRole.Logistic ? 'Enabled' : 'Disabled'}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Developer</span>
                <Chip color={userRole.Developer ? 'success' : 'default'} variant="flat">
                  {userRole.Developer ? 'Enabled' : 'Disabled'}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Approver</span>
                <Chip color={userRole.Approver ? 'success' : 'default'} variant="flat">
                  {userRole.Approver ? 'Enabled' : 'Disabled'}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Supervisor</span>
                <Chip color={userRole.Supervisor ? 'success' : 'default'} variant="flat">
                  {userRole.Supervisor ? 'Enabled' : 'Disabled'}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">Warehouse</span>
                <Chip color={userRole.Warehouse ? 'success' : 'default'} variant="flat">
                  {userRole.Warehouse ? 'Enabled' : 'Disabled'}
                </Chip>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Audit Information Card */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">History</h2>
          </CardHeader>
          <CardBody>
            <Table hideHeader removeWrapper aria-label="Audit information">
              <TableHeader>
                <TableColumn>FIELD</TableColumn>
                <TableColumn>VALUE</TableColumn>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Created By</TableCell>
                  <TableCell>{userRole.created_user_email || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Created At</TableCell>
                  <TableCell>
                    {userRole.created_at
                      ? new Date(userRole.created_at).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                        timeZone: 'Asia/Bangkok',
                      })
                      : '-'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Updated By</TableCell>
                  <TableCell>{userRole.updated_user_email || '-'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Updated At</TableCell>
                  <TableCell>
                    {userRole.updated_at
                      ? new Date(userRole.updated_at).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false,
                        timeZone: 'Asia/Bangkok',
                      })
                      : '-'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>



      {/* Edit Modal */}
      <UserRoleListFormModal
        isOpen={isEditModalOpen}
        onClose={onEditModalClose}
        onSuccess={fetchUserRole}
        mode="edit"
        initialData={userRole}
      />
    </div>
  );
};

export default UserRoleListDetail;
