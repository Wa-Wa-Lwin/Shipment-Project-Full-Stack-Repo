import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';
import UserForm from './components/UserForm';
import { userApi } from './api/userApi';
import type { CreateUserData, UpdateUserData } from './types';

export default function CreateUser() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: CreateUserData | UpdateUserData) => {
    try {
      setIsLoading(true);
      await userApi.createUser(data as CreateUserData);
      navigate('/user-list');
    } catch (error) {
      console.error('Failed to create user:', error);
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/user-list');
  };

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
          <h1 className="text-2xl font-bold">Create New User</h1>
          <p className="text-sm text-default-500">
            Add a new user to the system
          </p>
        </div>
      </div>

      {/* Form */}
      <UserForm
        isLoading={isLoading}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}
