import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Chip,
  Spinner,
  Input,
} from '@heroui/react'
import { Icon } from '@iconify/react'
import { userApi } from './api/userApi'
import type { User } from './types'

export default function UserList() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = users.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      )
      setFilteredUsers(filtered)
    }
  }, [searchQuery, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const data = await userApi.getAllUsers()
      setUsers(data)
      setFilteredUsers(data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = () => {
    navigate('/user-list/create')
  }

  const handleRowClick = (userId: number) => {
    navigate(`/user-list/${userId}`)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-default-500">
            Manage users, roles, and permissions
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="solar:user-plus-linear" width={20} />}
          onPress={handleCreateUser}
        >
          Create User
        </Button>
      </div>

      <div className="flex justify-between items-center gap-4">
        <Input
          isClearable
          className="w-full sm:max-w-[44%]"
          placeholder="Search by name, username, or email..."
          startContent={<Icon icon="solar:magnifer-linear" width={20} />}
          value={searchQuery}
          onClear={() => setSearchQuery('')}
          onValueChange={setSearchQuery}
        />
        <div className="flex gap-2 items-center">
          <span className="text-sm text-default-500">
            Total: {filteredUsers.length} users
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={fetchUsers}
          >
            <Icon icon="solar:refresh-linear" width={20} />
          </Button>
        </div>
      </div>

      <Table aria-label="User list table">
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>Username</TableColumn>
          <TableColumn>Name</TableColumn>
          <TableColumn>Email</TableColumn>
          <TableColumn>Phone</TableColumn>
          <TableColumn>Role</TableColumn>
          <TableColumn>Logistic Role</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>

        <TableBody
          items={filteredUsers}
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading users..." />}
          emptyContent={<div className="text-center py-8">No users found</div>}
        >
          {filteredUsers.map((user) => (
            <TableRow
              key={user.userID}
              className="cursor-pointer hover:bg-warning-100 transition-colors"
              onClick={() => handleRowClick(user.userID)}
            >
              <TableCell>{user.userID}</TableCell>
              <TableCell className="font-semibold">{user.username}</TableCell>
              <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || '-'}</TableCell>
              <TableCell>{user.role || '-'}</TableCell>
              <TableCell>
                <Chip color={Number(user.logisticRole) === 1 ? 'primary' : 'default'} size="sm" variant="flat">
                  {Number(user.logisticRole) === 1 ? 'Enabled' : 'Disabled'}
                </Chip>
              </TableCell>
              <TableCell>
                <Chip color={user.active ? 'success' : 'danger'} size="sm" variant="flat">
                  {user.active ? 'Active' : 'Inactive'}
                </Chip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
