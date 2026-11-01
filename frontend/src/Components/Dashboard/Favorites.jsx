import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Components/Sidebar/Sidebar.jsx";
import { Heart, MapPin, Trash2, FolderOpen } from "lucide-react";
import api from "../../api/axios"; // ✅ interceptor
import { useAuth } from "../../context/AuthContext";
import {
  getCardImageOrFallback,
  getPrimaryImage,
  handleImageFallback,
} from "../../utils/imageVariants";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const Favorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  /* ✅ Fetch Favorites */
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?.uid) return;

      try {
        setLoading(true);
        const res = await api.get(`/favorites/${user.uid}`);
        setFavorites(res.data || []);
      } catch (error) {
        console.error("❌ Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user?.uid]);

  /* ✅ Remove Favorite */
  const removeFavorite = async (adId) => {
    try {
      if (!user?.uid) {
        await Swal.fire({ icon: "info", title: "Sign in required", text: "Please sign in to manage your saved items.", confirmButtonColor: "#2E3192" });
        return;
      }

      const res = await api.put("/favorites/toggle", {
        userId: user.uid,
        adId,
      });

      // backend false bhejta hai jab remove hota hai
      if (res.data?.status === false) {
        setFavorites((prev) => prev.filter((f) => f._id !== adId));
      }
    } catch (error) {
      console.error("❌ Error removing favorite:", error);
    }
  };

  /* ✅ Loading */
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-[#2E3192] font-semibold text-xl bg-gradient-to-br from-[#E9EDFF] via-[#F2F4FF] to-[#ffffff] animate-pulse">
        Loading saved items...
      </div>
    );
  }

  const totalFavorites = favorites.length;
  const uniqueCities = [
    ...new Set(favorites.map((f) => f.city).filter(Boolean)),
  ];

  return (
    <div className="flex bg-gradient-to-br from-[#E9EDFF] via-[#F2F4FF] to-[#ffffff] min-h-screen font-[Poppins] text-gray-800 relative">
      {/* blobs */}
      <div className="pointer-events-none absolute -top-24 right-[-6rem] w-80 h-80 bg-[#2E3192]/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] left-[-4rem] w-72 h-72 bg-[#A3A8E8]/25 rounded-full blur-3xl" />

      <Sidebar />

      <main className="relative flex-1 lg:ml-64 p-6 md:p-10 z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-4 mb-10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-3xl font-semibold text-[#1F2370] flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-[#E9EDFF] flex items-center justify-center">
                  <Heart className="w-5 h-5 text-[#2E3192]" />
                </span>
                Saved Items
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                Your shortlist of listings worth coming back to.
              </p>
            </div>

            {totalFavorites > 0 && (
              <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md border rounded-2xl px-4 py-2 shadow-sm">
                <div>
                  <p className="text-[11px] text-gray-400 uppercase">
                    Saved Items
                  </p>
                  <p className="text-lg font-semibold text-[#1F2370]">
                    {totalFavorites}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-200" />
                <div>
                  <p className="text-[11px] text-gray-400 uppercase">
                    Locations
                  </p>
                  <p className="text-sm font-medium">
                    {uniqueCities.length || "Multiple"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* EMPTY */}
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FolderOpen className="w-12 h-12 text-[#2E3192] mb-3" />
            <h2 className="text-xl font-semibold">No Saved Items Yet</h2>
            <p className="text-gray-500 text-sm mt-2">
              Save ads to see them here
            </p>
            <button
              onClick={() => navigate("/")}
              className="mt-4 px-5 py-2 rounded-full bg-[#2E3192] text-white"
            >
              Browse Listings
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-7">
            {favorites.map((item) => (
              <div
                key={item._id}
                className="group bg-white/80 rounded-3xl shadow-md overflow-hidden cursor-pointer"
                onClick={() => navigate(`/ad/${item._id}`)}
              >
                <div className="relative h-52">
                  <img
                    src={getCardImageOrFallback(item)}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    onError={(e) =>
                      handleImageFallback(e, getPrimaryImage(item), "medium")
                    }
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(item._id);
                    }}
                    className="absolute top-3 right-3 bg-white p-2 rounded-full"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {item.city || "Unknown"}
                  </p>
                  <p className="mt-2 font-semibold text-[#1A1D64]">
                    MK  {item.price?.toLocaleString("en-MW")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;
