import React from "react";
import Navbar from "../Components/Navbar/Navbar.jsx";
import Footer from "../Components/Footer/Footer.jsx";

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="pt-18 min-h-screen">{children}</main>
      <Footer />
    </>
  );
};

export default MainLayout;
