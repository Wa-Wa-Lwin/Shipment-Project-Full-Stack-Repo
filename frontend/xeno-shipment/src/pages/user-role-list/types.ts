// User Role List Types

export interface UserRoleList {
  userRoleListID: number;
  Email: string;
  Logistic: boolean;
  Developer: boolean;
  Approver: boolean;
  Supervisor: boolean;
  Warehouse: boolean;
  created_user_email?: string;
  updated_user_email?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRoleListFormData {
  userRoleListID?: number;
  Email: string;
  Logistic: boolean;
  Developer: boolean;
  Approver: boolean;
  Supervisor: boolean;
  Warehouse: boolean;
  created_user_email?: string;
  updated_user_email?: string;
}

export interface UserRoleListApiResponse {
  success: boolean;
  message?: string;
  data?: UserRoleList | UserRoleList[];
  errors?: Record<string, string[]>;
  error?: string;
}
