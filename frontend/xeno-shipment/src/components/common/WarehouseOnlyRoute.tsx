import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@context/AuthContext';
import { isWarehouseOnlyUser } from '@config/userRoles';

interface WarehouseOnlyRouteProps {
  children: React.ReactNode;
}

const WarehouseOnlyRoute: React.FC<WarehouseOnlyRouteProps> = ({ children }) => {
  const { userRoleList } = useAuth();
  const location = useLocation();

  // Check if the current user is a warehouse-only user
  const isWarehouseOnly = isWarehouseOnlyUser(userRoleList);

  // Allow warehouse users to access warehouse routes and packing slip
  const allowedPaths = ['/warehouse', '/shipment/packing-slip'];
  const isAllowedPath = allowedPaths.some(path => location.pathname.includes(path));

  // If warehouse-only user tries to access non-allowed routes, redirect to warehouse
  if (isWarehouseOnly && !isAllowedPath) {
    return <Navigate to="/warehouse" replace />;
  }

  return <>{children}</>;
};

export default WarehouseOnlyRoute;
