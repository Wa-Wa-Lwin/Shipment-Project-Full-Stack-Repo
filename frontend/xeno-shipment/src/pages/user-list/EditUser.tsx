import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Spinner } from '@heroui/react';
import { Icon } from '@iconify/react';
import UserForm from './components/UserForm';
import { userApi } from './api/userApi';
import type { User, CreateUserData, UpdateUserData } from './types';

export default function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUser(parseInt(id));
    }
  }, [id]);

  const fetchUser = async (userId: number) => {
    try {
      setIsFetching(true);
      const data = await userApi.getUser(userId);
      setUser(data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
    if (!id) return;

    try {
      setIsLoading(true);
      await userApi.updateUser(parseInt(id), data as UpdateUserData);
      navigate(`/user-list/${id}`);
    } catch (error) {
      console.error('Failed to update user:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/user-list/${id}`);
  };

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" label="Loading user..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Icon icon="solar:user-cross-linear" width={64} className="text-default-300" />
        <p className="text-lg text-default-500">User not found</p>
        <Button onPress={() => navigate('/user-list')}>Back to List</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          isIconOnly
          variant="light"
          onPress={handleCancel}
        >
          <Icon icon="solar:arrow-left-linear" width={24} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit User</h1>
          <p className="text-sm text-default-500">
            Update user information for {user.firstName} {user.lastName}
          </p>
        </div>
      </div>

      {/* Form */}
      <UserForm
        user={user}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
