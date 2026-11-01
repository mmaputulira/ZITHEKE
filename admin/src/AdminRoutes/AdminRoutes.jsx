import { Navigate, Outlet } from "react-router-dom";
import { AdminAccessProvider } from "./AdminAccessContext.jsx";

const AdminRoutes = () => {
  const token = localStorage.getItem("adminToken");

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminAccessProvider><Outlet /></AdminAccessProvider>;
};

export default AdminRoutes;
