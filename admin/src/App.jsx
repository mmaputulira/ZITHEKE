import { AdminPageGuard } from "./AdminRoutes/AdminAccessContext.jsx";
import MarketplaceOrders from "./Components/Dashboard/MarketplaceOrders.jsx";
import MarketplaceAccounts from "./Components/Dashboard/MarketplaceAccounts.jsx";
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

/* 🔐 Guard */
import AdminRoutes from "./AdminRoutes/AdminRoutes";

/* 🔓 Login */
import AdminLogin from "./Components/pages/AdminLogin";

/* 🧱 Layout */
import Sidebar from "./Components/Sidebar/Sidebar";

/* 📊 Pages */
import Dashboard from "./Components/Dashboard/Dashboard";
import Users from "./Components/Dashboard/Users";
import AllAds from "./Components/Dashboard/AllAds";
import Messages from "./Components/Dashboard/Messages";
import AdminReports from "./Components/Dashboard/AdminReports";
import AdminReportDetail from "./Components/Dashboard/AdminReportDetail";
import AdminOverview from "./Components/Dashboard/AdminOverview";
import CategoryInsight from "./Components/Dashboard/CategoryInsight";
import UserGrowth from "./Components/Dashboard/UserGrowth";
import AdminSettings from "./Components/Dashboard/AdminSettings";
import AdminContactInbox from "./Components/Dashboard/AdminContactInbox";
import RevenueSubscriptions from "./Components/Dashboard/RevenueSubscriptions";
import PaymentVerification from "./Components/Dashboard/PaymentVerification";
import Categories from "./Components/Dashboard/Categories";
import OperationsDashboard from "./Components/Dashboard/OperationsDashboard.jsx";
import Reconciliation from "./Components/Dashboard/Reconciliation.jsx";
import PlansPricing from "./Components/Dashboard/PlansPricing.jsx";
import UserOperations from "./Components/Dashboard/UserOperations.jsx";
import Seller360 from "./Components/Dashboard/Seller360.jsx";
import AdvertModeration from "./Components/Dashboard/AdvertModeration.jsx";
import AuditLog from "./Components/Dashboard/AuditLog.jsx";
import SystemHealth from "./Components/Dashboard/SystemHealth.jsx";
import RiskFlags from "./Components/Dashboard/RiskFlags.jsx";
import NotificationsCentre from "./Components/Dashboard/NotificationsCentre.jsx";
import AdminAccess from "./Components/Dashboard/AdminAccess.jsx";
import SupportCentre from "./Components/Dashboard/SupportCentre.jsx";



/* 🔹 ADMIN LAYOUT */
const AdminLayout = () => {
  return (
    <div className="flex min-h-screen font-[Poppins] bg-[#F8FAFC] text-gray-800">
      <Sidebar />

      <div className="flex-1 ml-0 lg:ml-[260px] p-4 sm:p-6 min-w-0">
        <Routes>
          {/* 👇 THIS IS THE KEY */}
          <Route index element={<AdminPageGuard page=""><OperationsDashboard /></AdminPageGuard>} />

          <Route path="users" element={<AdminPageGuard page="users"><MarketplaceAccounts /></AdminPageGuard>} />
          <Route path="orders" element={<AdminPageGuard page="orders"><MarketplaceOrders /></AdminPageGuard>} />
          <Route path="users-legacy" element={<AdminPageGuard page="users-legacy"><Users /></AdminPageGuard>} />
          <Route path="seller-360/:id" element={<AdminPageGuard page="seller-360"><Seller360 /></AdminPageGuard>} />
          <Route path="ads" element={<AdminPageGuard page="ads"><AdvertModeration /></AdminPageGuard>} />
          <Route path="ads-library" element={<AdminPageGuard page="ads-library"><AllAds /></AdminPageGuard>} />
          <Route path="categories" element={<AdminPageGuard page="categories"><Categories /></AdminPageGuard>} />
          <Route path="messages" element={<AdminPageGuard page="messages"><Messages /></AdminPageGuard>} />
                    <Route path="contact-inbox" element={<AdminPageGuard page="contact-inbox"><AdminContactInbox /></AdminPageGuard>} />

          <Route path="reports" element={<AdminPageGuard page="reports"><AdminReports /></AdminPageGuard>} />
          <Route path="reports/:id" element={<AdminPageGuard page="reports"><AdminReportDetail /></AdminPageGuard>} />
          <Route path="overview" element={<AdminPageGuard page="overview"><AdminOverview /></AdminPageGuard>} />
          <Route path="revenue-subscriptions" element={<AdminPageGuard page="revenue-subscriptions"><RevenueSubscriptions /></AdminPageGuard>} />
          <Route path="payment-verification" element={<AdminPageGuard page="payment-verification"><PaymentVerification /></AdminPageGuard>} />
          <Route path="reconciliation" element={<AdminPageGuard page="reconciliation"><Reconciliation /></AdminPageGuard>} />
          <Route path="plans-pricing" element={<AdminPageGuard page="plans-pricing"><PlansPricing /></AdminPageGuard>} />
          <Route path="support" element={<AdminPageGuard page="support"><SupportCentre /></AdminPageGuard>} />
          <Route path="risk-flags" element={<AdminPageGuard page="risk-flags"><RiskFlags /></AdminPageGuard>} />
          <Route path="notifications" element={<AdminPageGuard page="notifications"><NotificationsCentre /></AdminPageGuard>} />
          <Route path="audit-log" element={<AdminPageGuard page="audit-log"><AuditLog /></AdminPageGuard>} />
          <Route path="system-health" element={<AdminPageGuard page="system-health"><SystemHealth /></AdminPageGuard>} />
          <Route path="admin-access" element={<AdminPageGuard page="admin-access"><AdminAccess /></AdminPageGuard>} />
          <Route path="category-insight" element={<AdminPageGuard page="category-insight"><CategoryInsight /></AdminPageGuard>} />
          <Route path="user-growth" element={<AdminPageGuard page="user-growth"><UserGrowth /></AdminPageGuard>} />
          <Route path="settings" element={<AdminPageGuard page="settings"><AdminSettings /></AdminPageGuard>} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* ROOT */}
      <Route path="/" element={<Navigate to="/admin/login" replace />} />

      {/* LOGIN */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* PROTECTED */}
      <Route path="/admin/*" element={<AdminRoutes />}>
        {/* 👇 THIS FIXES BLANK PAGE */}
        <Route path="*" element={<AdminLayout />} />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}

export default App;
