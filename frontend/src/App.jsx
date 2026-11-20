import AccountGuard from "./Components/AccountGuard.jsx";
import BuyerHome from "./Components/Buyer/BuyerHome.jsx";
import BuyerLayout from "./Components/Buyer/BuyerLayout.jsx";
import BuyerOverview from "./Components/Buyer/BuyerOverview.jsx";
import BuyerCart from "./Components/Buyer/BuyerCart.jsx";
import MyPurchases from "./Components/Dashboard/MyPurchases.jsx";
import SalesOrders from "./Components/Dashboard/SalesOrders.jsx";
import SellerDirectory from "./Components/SellerDirectory/SellerDirectory.jsx";
// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, homeForMode } from "./context/AuthContext.jsx";
import ModePicker from "./Components/AccountMode/ModePicker.jsx";

import MainLayout from "./layouts/MainLayout.jsx";

import Home from "./Components/Home/Home.jsx";
import Login from "./Components/Pages/Login.jsx";
import Signup from "./Components/Pages/Signup.jsx";
import CheckEmail from "./Components/Pages/CheckEmail.jsx";
import ResetPasswordOtp from "./Components/Pages/ResetPasswordOtp.jsx";

import About from "./Components/Footercontent/About.jsx";
import PrivacyPolicy from "./Components/Footercontent/PrivacyPolicy.jsx";
import Terms from "./Components/Footercontent/Terms.jsx";
import Contact from "./Components/Footercontent/Contact.jsx";

import Dashboard from "./Components/Dashboard/Dashboard.jsx";
import MyAds from "./Components/Dashboard/MyAds.jsx";
import Favorites from "./Components/Dashboard/Favorites.jsx";
import Profile from "./Components/Dashboard/Profile.jsx";
import CreateAd from "./Components/Dashboard/CreateAd.jsx";
import ReportAd from "./Components/Dashboard/ReportAd.jsx";
import Chats from "./Components/Dashboard/Chats.jsx";
import DashboardLayout from "./Components/Dashboard/DashboardLayout";
import MyReports from "./Components/Dashboard/MyReports";
import MyPayments from "./Components/Dashboard/MyPayments.jsx";
import MyMarketplace from "./Components/Dashboard/MyMarketplace.jsx";
import Offers from "./Components/Dashboard/MarketplaceOffers.jsx";
import PriceAlerts from "./Components/Dashboard/PriceAlerts.jsx";
import Following from "./Components/Dashboard/Following.jsx";
import BoostPerformance from "./Components/Dashboard/BoostPerformance.jsx";
import Notifications from "./Components/Dashboard/Notifications.jsx";
import Settings from "./Components/Setting/Settings.jsx";
import SetPassword from "./Components/Setting/SetPassword.jsx";
import VerifyEmail from "./Components/Setting/VerifyEmail.jsx";

import ProductDetails from "./Components/ProductDetails/ProductDetails.jsx";
import CategoryPage from "./Components/CategoryPage/CategoryPage.jsx";
import SearchResults from "./Components/SearchResults/SearchResults.jsx";
import Listings from "./Components/Listings/Listings.jsx";
import SellerProfile from "./Components/SellerProfile/SellerProfile";
import PricingPage from "./Components/BoostAdSection/PricingPage.jsx";
import CheckoutPage from "./Components/BoostAdSection/CheckoutPage.jsx";
import MastercardCheckoutPage from "./Components/BoostAdSection/MastercardCheckoutPage.jsx";
import NepgReturnPage from "./Components/BoostAdSection/NepgReturnPage.jsx";
import SafetyTipsPage from "./Components/SafetyTips/SafetyTipsPage.jsx";
import BrowseListings from "./Components/BrowseListings/BrowseListings.jsx";
import BoostedPage from "./Components/BoostedPage/BoostedPage.jsx";

function App() {
  const { user, loading, mode, pickingMode } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-xl text-[#2E3192] font-semibold">
        Loading...
      </div>
    );
  }

  return (
    <>
    {user && pickingMode && <ModePicker />}
    <Routes>
      <Route path="/buyer" element={<MainLayout><BuyerHome /></MainLayout>} />
      <Route path="/sellers" element={<MainLayout><SellerDirectory /></MainLayout>} />
      <Route path="/buyer/login" element={!user ? <Login accountType="buyer" /> : <Navigate to={homeForMode(mode)} replace />} />
      <Route path="/buyer/signup" element={!user ? <Signup accountType="buyer" /> : <Navigate to={homeForMode(mode)} replace />} />
      <Route path="/buyer/account" element={<AccountGuard type="buyer"><MainLayout><BuyerLayout /></MainLayout></AccountGuard>}>
        <Route index element={<BuyerOverview />} />
        <Route path="cart" element={<BuyerCart />} />
        <Route path="purchases" element={<MyPurchases />} />
        <Route path="offers" element={<Offers />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="following" element={<Following />} />
        <Route path="price-alerts" element={<PriceAlerts />} />



        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="myreports" element={<MyReports />} />
      </Route>
      <Route
        path="/"
        element={
          <MainLayout>
            <Home />
          </MainLayout>
        }
      />

      <Route
        path="/about"
        element={
          <MainLayout>
            <About />
          </MainLayout>
        }
      />
      <Route
        path="/privacy-policy"
        element={
          <MainLayout>
            <PrivacyPolicy />
          </MainLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <MainLayout>
            <Terms />
          </MainLayout>
        }
      />
      <Route
        path="/contact"
        element={
          <MainLayout>
            <Contact />
          </MainLayout>
        }
      />

      <Route
        path="/chats"
        element={user ? <Chats /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/chats/:receiverId"
        element={user ? <Chats /> : <Navigate to="/login" replace />}
      />

      <Route
        path="/search"
        element={
          <MainLayout>
            <SearchResults />
          </MainLayout>
        }
      />

      <Route
        path="/ad/:id"
        element={
          <MainLayout>
            <ProductDetails key={window.location.pathname} />
          </MainLayout>
        }
      />

      <Route
        path="/profile/:sellerId"
        element={
          <MainLayout>
            <SellerProfile key={window.location.pathname} />
          </MainLayout>
        }
      />

      <Route
        path="/category/:category"
        element={
          <MainLayout>
            <CategoryPage />
          </MainLayout>
        }
      />

      <Route
        path="/all-ads"
        element={
          <MainLayout>
            <Listings />
          </MainLayout>
        }
      />
      <Route
        path="/pricing"
        element={
          <MainLayout>
            <PricingPage />
          </MainLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <MainLayout>
            <AccountGuard type="merchant"><CheckoutPage /></AccountGuard>
          </MainLayout>
        }
      />
      <Route
        path="/checkout/nepg/return"
        element={
          <MainLayout>
            <NepgReturnPage />
          </MainLayout>
        }
      />
      <Route
        path="/checkout/mastercard"
        element={
          <MainLayout>
            <AccountGuard type="merchant"><MastercardCheckoutPage mode="checkout" /></AccountGuard>
          </MainLayout>
        }
      />
      <Route
        path="/checkout/mastercard/return"
        element={
          <MainLayout>
            <MastercardCheckoutPage mode="return" />
          </MainLayout>
        }
      />
      <Route
        path="/checkout/mastercard/cancel"
        element={
          <MainLayout>
            <MastercardCheckoutPage mode="cancel" />
          </MainLayout>
        }
      />
      <Route
        path="/checkout/mastercard/error"
        element={
          <MainLayout>
            <MastercardCheckoutPage mode="error" />
          </MainLayout>
        }
      />
      <Route
        path="/safety-tips"
        element={
          <MainLayout>
            <SafetyTipsPage />
          </MainLayout>
        }
      />
      <Route
        path="/browse-listings"
        element={
          <MainLayout>
            <BrowseListings />
          </MainLayout>
        }
      />
      <Route
        path="/boosted-ads"
        element={
          <MainLayout>
            <BoostedPage />
          </MainLayout>
        }
      />

      <Route
        path="/dashboard/*"
        element={<AccountGuard type="merchant"><DashboardLayout /></AccountGuard>}
      >
        <Route index element={<MyMarketplace />} />
        <Route path="my-ads" element={<MyAds />} />
        <Route path="sales" element={<SalesOrders />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
        <Route path="createAd" element={<CreateAd />} />
        <Route path="ReportAd" element={<ReportAd />} />
        <Route path="ReportAd/:id" element={<ReportAd />} />
        <Route path="myreports" element={<MyReports />} />
        <Route path="payments" element={<MyPayments />} />
        <Route path="boost-performance" element={<BoostPerformance />} />
        <Route path="offers" element={<Offers />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>

      <Route
        path="/login"
        element={!user ? <Login /> : <Navigate to={homeForMode(mode)} replace />}
      />
      <Route
        path="/signup"
        element={!user ? <Signup /> : <Navigate to={homeForMode(mode)} replace />}
      />
      <Route
        path="/check-email"
        element={!user ? <CheckEmail /> : <Navigate to="/" replace />}
      />
      <Route path="/set-password" element={<SetPassword />} />
      <Route path="/reset-password-otp" element={<ResetPasswordOtp />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route
        path="*"
        element={
          <div className="flex items-center justify-center h-screen text-gray-500">
            Page not found
          </div>
        }
      />
    </Routes>
    </>
  );
}

export default App;
