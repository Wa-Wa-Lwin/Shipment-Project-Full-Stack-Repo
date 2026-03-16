import type { UserRoleList } from '@pages/user-role-list/types';

/**
 * User role configuration
 * Check user roles dynamically from user_role_list table
 */

/**
 * Check if a user is a warehouse-only user based on their role list
 * A user is warehouse-only if they have Warehouse = true and all other roles = false
 */
export const isWarehouseOnlyUser = (userRoleList?: UserRoleList | null): boolean => {
  if (!userRoleList) return false;

  return (
    userRoleList.Warehouse === true &&
    userRoleList.Logistic === false &&
    userRoleList.Developer === false &&
    userRoleList.Approver === false &&
    userRoleList.Supervisor === false
  );
};
