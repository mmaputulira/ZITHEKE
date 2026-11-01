import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers3 } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import useMarketplaceCategories from "../../hooks/useMarketplaceCategories.js";

const FallbackVisual = ({ label }) => (
  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#EEF0FF] to-[#F9FAFF] text-[#2E3192]">
    <div className="text-center px-5">
      <Layers3 size={38} className="mx-auto mb-2 opacity-70" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  </div>
);

export default function ProductCategoriesNew() {
  const navigate = useNavigate();
  const { categories, loading } = useMarketplaceCategories();
  const [activeKey, setActiveKey] = useState("");

  useEffect(() => {
    if (!categories.length) return;
    if (!categories.some((category) => category.key === activeKey)) {
      setActiveKey(categories[0].key);
    }
  }, [categories, activeKey]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.key === activeKey) || categories[0],
    [categories, activeKey]
  );

  return (
    <section className="px-4 md:px-10 py-16 bg-gradient-to-b from-white to-[#F6F7FB] font-[Poppins]">
      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-[#2E3192]">
          Browse Categories
        </h2>
        <p className="text-gray-500 mt-3 text-sm md:text-base">
          Explore active Zitheke categories and find what you need faster.
        </p>
      </div>

      {loading && !categories.length ? (
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-11 rounded-full bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide justify-start md:justify-center">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() => setActiveKey(category.key)}
                className={`px-5 md:px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                  activeKey === category.key
                    ? "bg-gradient-to-r from-[#2E3192] to-[#4F52C9] text-white shadow-lg scale-[1.03]"
                    : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {activeCategory && (
            <motion.div
              key={activeCategory.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-10"
            >
              {activeCategory.subcategories?.length ? (
                <Swiper
                  spaceBetween={20}
                  breakpoints={{
                    0: { slidesPerView: 1.35 },
                    480: { slidesPerView: 1.9 },
                    640: { slidesPerView: 2.6 },
                    768: { slidesPerView: 3.2 },
                    1024: { slidesPerView: 4.2 },
                    1280: { slidesPerView: 5.2 },
                  }}
                >
                  {activeCategory.subcategories.map((sub) => (
                    <SwiperSlide key={sub.key}>
                      <motion.button
                        type="button"
                        whileHover={{ y: -7 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const query = new URLSearchParams({ sub: sub.name }).toString();
                          navigate(
                            `/category/${encodeURIComponent(activeCategory.name)}?${query}`
                          );
                        }}
                        className="group w-full text-left bg-white rounded-3xl shadow-md hover:shadow-xl overflow-hidden cursor-pointer h-full transition-all duration-300"
                      >
                        <div className="relative h-[180px] bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
                          {sub.image ? (
                            <img
                              src={sub.image}
                              alt={sub.name}
                              loading="lazy"
                              decoding="async"
                              className="max-w-[88%] max-h-[88%] object-contain transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <FallbackVisual label={sub.name} />
                          )}
                        </div>
                        <div className="p-5 text-center">
                          <h4 className="text-base md:text-lg font-semibold text-gray-900">
                            {sub.name}
                          </h4>
                          <p className="text-sm text-[#2E3192] mt-1 font-medium">
                            Explore →
                          </p>
                        </div>
                      </motion.button>
                    </SwiperSlide>
                  ))}
                </Swiper>
              ) : (
                <div className="max-w-xl mx-auto text-center bg-white border rounded-3xl px-6 py-8 shadow-sm">
                  <p className="text-gray-600 mb-4">
                    Explore all listings in {activeCategory.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/category/${encodeURIComponent(activeCategory.name)}`)
                    }
                    className="px-5 py-2.5 rounded-full bg-[#2E3192] text-white font-semibold"
                  >
                    View {activeCategory.name}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </>
      )}
    </section>
  );
}
