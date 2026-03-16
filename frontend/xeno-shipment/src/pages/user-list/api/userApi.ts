import axios from 'axios';
import type { User, ApiResponse, CreateUserData, UpdateUserData } from '../types';

export const userApi = {
  // Get all users with relations
  getAllUsers: async (): Promise<User[]> => {
    const response = await axios.get<ApiResponse<User[]>>(import.meta.env.VITE_APP_USER_GET_ALL);
    return response.data.data;
  },

  // Get single user by ID
  getUser: async (id: number): Promise<User> => {
    const response = await axios.get<ApiResponse<User>>(`${import.meta.env.VITE_APP_USER_GET_BY_ID}${id}`);
    return response.data.data;
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<User> => {
    const response = await axios.post<ApiResponse<User>>(import.meta.env.VITE_APP_USER_CREATE, userData);
    return response.data.data;
  },

  // Update user
  updateUser: async (id: number, userData: UpdateUserData): Promise<User> => {
    const response = await axios.put<ApiResponse<User>>(`${import.meta.env.VITE_APP_USER_UPDATE}${id}`, userData);
    return response.data.data;
  },

  // Activate user
  activateUser: async (id: number): Promise<User> => {
    const response = await axios.patch<ApiResponse<User>>(`${import.meta.env.VITE_APP_USER_ACTIVATE}${id}`);
    return response.data.data;
  },

  // Deactivate user
  deactivateUser: async (id: number): Promise<User> => {
    const response = await axios.patch<ApiResponse<User>>(`${import.meta.env.VITE_APP_USER_DEACTIVATE}${id}`);
    return response.data.data;
  },
};
