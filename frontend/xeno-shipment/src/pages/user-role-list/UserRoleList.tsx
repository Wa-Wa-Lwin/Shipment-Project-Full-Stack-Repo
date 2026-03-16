import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Spinner,
  Chip,
  useDisclosure,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { userRoleListService } from './userRoleListService';
import type { UserRoleList as UserRoleListType } from './types';
import UserRoleListFormModal from './components/UserRoleListFormModal';

const UserRoleList: React.FC = () => {
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<UserRoleListType[]>([]);
  const [filteredData, setFilteredData] = useState<UserRoleListType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { isOpen: isCreateModalOpen, onOpen: onCreateModalOpen, onClose: onCreateModalClose } = useDisclosure();

  // Fetch user roles
  const fetchUserRoles = async () => {
    try {
      setIsLoading(true);
      const data = await userRoleListService.getAllUserRoles();
      setUserRoles(data);
      setFilteredData(data);
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  // Filter data based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredData(userRoles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = userRoles.filter((role) =>
      role.Email.toLowerCase().includes(query) ||
      role.userRoleListID.toString().includes(query)
    );
    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchQuery, userRoles]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredData.slice(startIndex, endIndex);

  // Get role chips for a user
  const getRoleChips = (role: UserRoleListType) => {
    const roles = [];
    if (role.Logistic) roles.push({ label: 'Logistic', color: 'primary' as const });
    if (role.Developer) roles.push({ label: 'Developer', color: 'secondary' as const });
    if (role.Approver) roles.push({ label: 'Approver', color: 'success' as const });
    if (role.Supervisor) roles.push({ label: 'Supervisor', color: 'warning' as const });
    if (role.Warehouse) roles.push({ label: 'Warehouse', color: 'danger' as const });

    return roles.length > 0 ? roles : [{ label: 'None', color: 'default' as const }];
  };

  const handleRowClick = (id: number) => {
    navigate(`/local/user-role-list/${id}`);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex space-x-3">
            <div>
              <h1 className="text-2xl font-bold">User Role List</h1>
            </div>
            <Button
              size='sm'
              color="primary"
              startContent={<Icon icon="mdi:plus" width={20} />}
              onPress={onCreateModalOpen}
            >
              Add User Role
            </Button>
          </div>
          {/* Search */}
          <Input
            placeholder="Search by email or ID..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Icon icon="mdi:magnify" width={20} />}
            isClearable
            onClear={() => setSearchQuery('')}
            className="max-w-md"
          />
        </CardHeader>

        <CardBody>
          {/* Results count */}
          <div className="mb-2 text-sm text-gray-600">
            Showing {currentItems.length} of {filteredData.length} user roles
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <Table
                aria-label="User roles table"
                isStriped
                selectionMode="none"
                className="mb-4"
              >
                <TableHeader>
                  <TableColumn>ID</TableColumn>
                  <TableColumn>EMAIL</TableColumn>
                  <TableColumn>ROLES</TableColumn>
                  <TableColumn>CREATED AT</TableColumn>
                </TableHeader>
                <TableBody emptyContent="No user roles found">
                  {currentItems.map((role) => (
                    <TableRow
                      key={role.userRoleListID}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleRowClick(role.userRoleListID)}
                    >
                      <TableCell>{role.userRoleListID}</TableCell>
                      <TableCell>{role.Email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {getRoleChips(role).map((chip, index) => (
                            <Chip key={index} color={chip.color} size="sm" variant="flat">
                              {chip.label}
                            </Chip>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {role.created_at
                          ? new Date(role.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            timeZone: 'Asia/Bangkok',
                          })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={totalPages}
                    page={currentPage}
                    onChange={setCurrentPage}
                    showControls
                  />
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* Create Modal */}
      <UserRoleListFormModal
        isOpen={isCreateModalOpen}
        onClose={onCreateModalClose}
        onSuccess={fetchUserRoles}
        mode="create"
      />
    </div>
  );
};

export default UserRoleList;
