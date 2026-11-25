// src/Components/Dashboard/DashboardLayout.jsx
import React from "react";
import Sidebar from "../../Components/Sidebar/Sidebar.jsx";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => (
  <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-[Poppins]">
    {/* Sidebar (fixed). It sets --sidebar-width: 0 on phones, 80px collapsed, 260px open. */}
    <Sidebar />

    {/* Main content sits beside the sidebar. On phones it leaves room for the menu button. */}
    <main
      className="min-w-0 px-3 pb-6 pt-16 sm:px-5 lg:p-8 transition-[margin] duration-300"
      style={{ marginLeft: "var(--sidebar-width, 0px)" }}
    >
      <Outlet />
    </main>
  </div>
);

export default DashboardLayout;
