import apiClient from '@api/config';
import type { UserRoleList, UserRoleListFormData, UserRoleListApiResponse } from './types';

export const userRoleListService = {
  // Get all user roles
  getAllUserRoles: async (): Promise<UserRoleList[]> => {
    try {
      const endpoint = import.meta.env.VITE_APP_USER_ROLE_LIST_GET_ALL || '/api/logistics/user_role_list';
      const response = await apiClient.get<UserRoleListApiResponse>(endpoint);
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  },

  // Get single user role by ID
  getUserRole: async (id: number | string): Promise<UserRoleList | null> => {
    try {
      const baseUrl = import.meta.env.VITE_APP_USER_ROLE_LIST_GET_ONE || '/api/logistics/user_role_list/';
      const response = await apiClient.get<UserRoleListApiResponse>(`${baseUrl}${id}`);
      if (response.data.success && response.data.data && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      throw error;
    }
  },

  // Get user role by email
  getUserRoleByEmail: async (email: string): Promise<UserRoleList | null> => {
    try {
      const baseUrl = import.meta.env.VITE_APP_USER_ROLE_LIST_GET_BY_EMAIL || '/api/logistics/user_role_list/email/';
      const response = await apiClient.get<UserRoleListApiResponse>(`${baseUrl}${email}`);
      if (response.data.success && response.data.data && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching user role by email:', error);
      throw error;
    }
  },

  // Create new user role
  createUserRole: async (payload: UserRoleListFormData): Promise<UserRoleList> => {
    try {
      const endpoint = import.meta.env.VITE_APP_USER_ROLE_LIST_CREATE || '/api/logistics/user_role_list';
      const response = await apiClient.post<UserRoleListApiResponse>(endpoint, payload);
      if (response.data.success && response.data.data && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create user role');
    } catch (error: any) {
      console.error('Error creating user role:', error);
      throw error;
    }
  },

  // Update user role
  updateUserRole: async (id: number | string, payload: UserRoleListFormData): Promise<UserRoleList> => {
    try {
      const baseUrl = import.meta.env.VITE_APP_USER_ROLE_LIST_UPDATE || '/api/logistics/user_role_list/';
      const response = await apiClient.put<UserRoleListApiResponse>(`${baseUrl}${id}`, payload);
      if (response.data.success && response.data.data && !Array.isArray(response.data.data)) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update user role');
    } catch (error: any) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  // Delete user role
  deleteUserRole: async (id: number | string): Promise<void> => {
    try {
      const baseUrl = import.meta.env.VITE_APP_USER_ROLE_LIST_DELETE || '/api/logistics/user_role_list/';
      const response = await apiClient.delete<UserRoleListApiResponse>(`${baseUrl}${id}`);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete user role');
      }
    } catch (error: any) {
      console.error('Error deleting user role:', error);
      throw error;
    }
  },
};
