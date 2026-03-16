export interface User {
  userID: number;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender?: string;
  phone?: string;
  email: string;
  departmentID?: number;
  section_index?: number;
  postitionID?: number;
  active: boolean;
  role?: string;
  user_code?: string;
  supervisorID?: number;
  level?: number;
  headID?: number;
  logisticRole?: number;
  approver?: User;
  supervisor?: User;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
  error?: string;
}

export interface CreateUserData extends Partial<User> {}
export interface UpdateUserData extends Partial<User> {}

export interface UserListTableProps {
  users: User[];
  isLoading: boolean;
  onViewUser: (userId: number) => void;
  onEditUser: (userId: number) => void;
  onToggleActive: (userId: number, active: boolean) => void;
}

export interface UserFormProps {
  user?: User;
  isLoading: boolean;
  onSubmit: (data: CreateUserData | UpdateUserData) => void;
  onCancel: () => void;
}
