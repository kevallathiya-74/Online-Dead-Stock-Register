import React, { Suspense, lazy } from "react";
import { Navigate } from "react-router-dom";
import Loading from "../../../components/common/Loading";
import { useAuth } from "../../../context/AuthContext";
import { UserRole } from "../../../types";

const AuditorDashboard = lazy(() => import("../../auditing/pages/AuditorDashboard"));
const VendorDashboard = lazy(() => import("../../vendor-portal/pages/VendorDashboard"));
const InventoryManagerDashboard = lazy(
  () => import("./InventoryManagerDashboard"),
);

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading dashboard..." fullScreen />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600 font-semibold">
          No user found. Please log in.
        </p>
      </div>
    );
  }

  let roleComponent;
  switch (user.role) {
    case UserRole.ADMIN:
      // Redirect Admins to their dedicated dashboard workspace
      return <Navigate to="/admin/dashboard" replace />;
    case UserRole.INVENTORY_MANAGER:
    case UserRole.IT_MANAGER:
      roleComponent = <InventoryManagerDashboard />;
      break;
    case UserRole.AUDITOR:
      roleComponent = <AuditorDashboard />;
      break;
    case UserRole.VENDOR:
      roleComponent = <VendorDashboard />;
      break;
    default:
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-red-600 font-semibold">
            Invalid user role. Please contact administrator.
          </p>
        </div>
      );
  }

  return (
    <Suspense
      fallback={<Loading message="Loading dashboard module..." fullScreen />}
    >
      {roleComponent}
    </Suspense>
  );
};

export default Dashboard;
