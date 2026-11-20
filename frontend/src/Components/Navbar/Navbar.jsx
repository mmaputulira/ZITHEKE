import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bookmark,
  MessageSquare,
  Menu,
  X,
  Search,
  Sparkles,
  PlusCircle,
  LogOut,
  User,
  Home,
  Layers,
  Info,
  Phone,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth, homeForMode } from "../../context/AuthContext.jsx";
import { ModeSwitch } from "../AccountMode/ModePicker.jsx";
import useMembershipAccess from "../../hooks/useMembershipAccess.js";
import SearchBar from "../SearchBar/SearchBar.jsx";
import Swal from "sweetalert2";
import {
  getUserAvatarSrc,
  handleAvatarFallback,
} from "../../utils/avatar.js";

const Navbar = () => {
  const { user, logout, mode, setMode } = useAuth();
  // "Sell" is always one tap away: same account, switch to the seller side.
  const goSell = () => {
    if (user?.canSell) setMode("seller");
    navigate("/dashboard/createAd");
  };
  const { access } = useMembershipAccess();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* =========================
     SCROLL EFFECT
  ========================= */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Log out?",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, log out",
      cancelButtonText: "Keep me logged in",
      confirmButtonColor: "#2E3192",
      cancelButtonColor: "#9CA3AF",
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      await logout();
      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Logged out successfully",
        showConfirmButton: false,
        timer: 1300,
        timerProgressBar: true,
      });
      window.location.href = "/";
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Logout failed",
        text: "Please try again.",
        confirmButtonColor: "#2E3192",
      });
    }
  };

  const navigateFromSidebar = (path) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const displayName =
    user?.displayName ||
    user?.name ||
    (user?.email ? user.email.split("@")[0] : "") ||
    "";

  const showMembershipBadge = Boolean(user);

  /* =========================
     AVATAR
  ========================= */
  const getAvatar = () => {
    const avatarSrc = getUserAvatarSrc(user);
    return (
      <img
        src={avatarSrc}
        alt={user ? displayName || "User" : "Guest User"}
        onError={handleAvatarFallback}
        className="w-10 h-10 rounded-full object-cover border border-[#2E3192]/30 shadow-sm bg-white"
      />
    );
  };

  return (
    <>
      {/* ================= TOP NAVBAR ================= */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 w-full z-50 border-b border-white/10 ${
          scrolled
            ? "bg-[#2E3192]/95 backdrop-blur-xl shadow-md"
            : "bg-[#2E3192]"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          {/* LOGO */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="#F4B400"
              viewBox="0 0 24 24"
              className="w-8 h-8 flex-shrink-0 -mt-[4px] -mr-[1px] transform scale-x-[-1]"
            >
              <path d="M21 11l-9-9H3v9l9 9 9-9zM7 7a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
            <div className="flex flex-col leading-tight">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Zitheke
            </h1>
            <p className="hidden sm:block text-sm font-semibold text-[#F4B400] ml-[6px] mt-[-2px]">
              Buy. Sell. Connect.
            </p>
            </div>
          </div>
          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex flex-1 justify-center px-6">
            <SearchBar />
          </div>

          <button onClick={() => navigate("/buyer")} className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white">For Buyers</button>
          {/* DESKTOP RIGHT */}
          <div className="hidden md:flex items-center gap-3">
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="text-white font-semibold"
                >
                  Sign in
                </button>
                <button
                  onClick={() => navigate("/signup")}
                  className="bg-[#2E3192] text-white px-4 py-2 rounded-full shadow hover:bg-[#1F2370]"
                >
                  Join Now
                </button>
              </>
            ) : (
              <>
                {mode === "seller" && showMembershipBadge && (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/my-ads")}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                      access?.isPremium
                        ? "border-[#f6c96b]/40 bg-[#f6c96b]/12 text-[#f6c96b]"
                        : "border-white/10 bg-white/8 text-slate-200 hover:bg-white/12"
                    }`}
                  >
                    <Sparkles size={14} />
                    Boost an Ad
                  </button>
                )}
                {[
                  { Icon: Bookmark, onClick: () => navigate(mode === "buyer" ? "/buyer/account/favorites" : "/dashboard/sales") },
                  { Icon: MessageSquare, onClick: () => navigate("/chats") },
                  { Icon: Bell, onClick: () => navigate(mode === "buyer" ? "/buyer/account/notifications" : "/dashboard/notifications") },
                ].map(({ Icon, onClick }, i) => (
                  <button
                    key={i}
                    onClick={onClick}
                    className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition"
                  >
                    <Icon size={18} />
                  </button>
                ))}

                <div className="relative">
                  <button onClick={() => setDropdownOpen(!dropdownOpen)}>
                    {getAvatar()}
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 top-12 bg-white rounded-xl shadow-xl w-60 overflow-hidden"
                      >
                        <div className="border-b border-gray-100">
                          <ModeSwitch onSwitched={() => setDropdownOpen(false)} />
                        </div>
                        <ul className="text-sm">
                          <li
                            onClick={() => navigate(homeForMode(mode))}
                            className="px-4 py-3 hover:bg-[#2E3192]/10 cursor-pointer flex gap-2"
                          >
                            <User size={16} /> Dashboard
                          </li>
                          <li
                            onClick={() => navigate(mode === "buyer" ? "/buyer/account/cart" : "/dashboard/my-ads")}
                            className="px-4 py-3 hover:bg-[#2E3192]/10 cursor-pointer flex gap-2"
                          >
                            <Bookmark size={16} /> {mode === "buyer" ? "My Cart" : "My Ads"}
                          </li>
                          <li
                            onClick={handleLogout}
                            className="px-4 py-3 text-red-500 hover:bg-red-50 cursor-pointer flex gap-2"
                          >
                            <LogOut size={16} /> Logout
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={goSell}
                  className="flex items-center gap-2 bg-[#F4B400] text-[#1A237E] px-5 py-2.5 rounded-full shadow-md hover:bg-[#e2a500] transition"
                >
                  <PlusCircle size={20} />
                  Sell
                </button>
              </>
            )}
          </div>

          {/* MOBILE ICONS */}
          <div className="md:hidden flex items-center gap-3">
            <Search
              size={22}
              className="text-white"
              onClick={() => setMobileSearchOpen(true)}
            />
            <Menu
              size={26}
              className="text-white"
              onClick={() => setSidebarOpen(true)}
            />
          </div>
        </div>
      </motion.nav>

      {/* ================= MOBILE SEARCH OVERLAY ================= */}
      <AnimatePresence>
        {mobileSearchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setMobileSearchOpen(false)}
            />

            <motion.div
              initial={{ y: "-100%" }}
              animate={{ y: 0 }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.3 }}
              className="fixed top-0 left-0 w-full z-50 bg-white shadow-xl px-4 pt-4 pb-6"
            >
              <div className="flex justify-between items-center mb-4">
                <p className="font-semibold text-[#2E3192]">
                  Search on Zitheke
                </p>
                <X onClick={() => setMobileSearchOpen(false)} />
              </div>

              <SearchBar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ================= SIDE DRAWER ================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setSidebarOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {getAvatar()}
                  <div>
                    <p className="font-semibold text-[#2E3192]">
                      {user ? displayName || "User" : "Guest User"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user ? user.email || user.phone || "Logged in" : "Not logged in"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-4 text-gray-700">
                  <button onClick={() => navigateFromSidebar("/")} className="flex gap-2">
                    <Home size={18} /> Home
                  </button>
                  <button onClick={() => navigateFromSidebar("/browse-listings")} className="flex gap-2">
                    <Layers size={18} /> Categories
                  </button>
                  <button onClick={() => navigateFromSidebar("/about")} className="flex gap-2">
                    <Info size={18} /> About
                  </button>
                  <button onClick={() => navigateFromSidebar("/contact")} className="flex gap-2">
                    <Phone size={18} /> Contact
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                {user ? (
                  <>
                    <div className="-mx-3 mb-2">
                      <ModeSwitch onSwitched={() => setSidebarOpen(false)} />
                    </div>
                    <button
                      onClick={() => navigateFromSidebar(homeForMode(mode))}
                      className="w-full bg-[#2E3192]/10 text-[#2E3192] py-2 rounded-full"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => { if (user?.canSell) setMode("seller"); navigateFromSidebar("/dashboard/createAd"); }}
                      className="w-full bg-[#2E3192] text-white py-2 rounded-full mt-2"
                    >
                      + Sell Item
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-red-500 mt-2 py-2 rounded-full hover:bg-red-50 flex gap-2 justify-center"
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigateFromSidebar("/login")}
                    className="w-full bg-[#2E3192] text-white py-2 rounded-full"
                  >
                    Login / Signup
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom mobile nav removed intentionally. Mobile auth/actions are inside sidebar. */}
    </>
  );
};

export default Navbar;
