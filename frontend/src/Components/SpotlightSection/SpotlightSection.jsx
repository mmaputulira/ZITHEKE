import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, Layers3 } from "lucide-react";
import useMarketplaceCategories from "../../hooks/useMarketplaceCategories.js";

const SpotlightSection = () => {
  const navigate = useNavigate();
  const { categories, loading } = useMarketplaceCategories();
  const spotlight = categories.slice(0, 8);

  if (loading && !spotlight.length) {
    return (
      <section className="w-full py-12 px-6 bg-white">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-12 font-[Poppins] bg-white">
      <div className="px-6 mb-7 flex items-end justify-between gap-5">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#2E3192]/60">
            Discover Zitheke
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-[#2E3192] mt-2">
            Explore Marketplace Categories
          </h2>
        </div>
        <button
          type="button"
          onClick={() => navigate("/browse-listings")}
          className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-[#2E3192]"
        >
          View all <ArrowUpRight size={16} />
        </button>
      </div>

      <div className="flex gap-5 overflow-x-auto px-6 hide-scrollbar scroll-smooth snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-6 lg:overflow-visible">
        {spotlight.map((item) => (
          <motion.button
            type="button"
            key={item.key}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.25 }}
            onClick={() => navigate(`/category/${encodeURIComponent(item.name)}`)}
            className="relative text-left cursor-pointer rounded-2xl overflow-hidden snap-start flex-shrink-0 w-[220px] sm:w-[240px] md:w-[260px] lg:w-full aspect-[4/5] shadow-md bg-gradient-to-br from-[#1A1D64] to-[#4F52C9] group"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/80">
                <Layers3 size={54} />
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#11144F]/90 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white z-10">
              <span className="inline-flex px-2.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-[11px] font-semibold mb-3">
                {item.subcategories?.length || 0} subcategories
              </span>
              <h3 className="text-xl md:text-2xl font-bold">{item.name}</h3>
              <p className="text-sm text-white/80 mt-1">Browse listings →</p>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
};

export default SpotlightSection;
