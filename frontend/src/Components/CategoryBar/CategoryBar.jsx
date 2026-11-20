import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Layers3, ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Keyboard, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import useMarketplaceCategories from "../../hooks/useMarketplaceCategories.js";

const FallbackVisual = ({ label }) => (
  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#EEF0FF] to-[#F9FAFF] text-[#2E3192]">
    <div className="text-center px-5">
      <Layers3 size={38} className="mx-auto mb-2 opacity-70" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  </div>
);

const ScrollArrow = ({ side, onClick, visible }) => (
  <button
    type="button"
    aria-label={side === "left" ? "Scroll categories left" : "Scroll categories right"}
    onClick={onClick}
    tabIndex={visible ? 0 : -1}
    className={`absolute top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-[#2E3192] shadow-md transition-opacity duration-200 hover:bg-gray-50 md:flex ${
      side === "left" ? "left-0" : "right-0"
    } ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
  >
    {side === "left" ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
  </button>
);

export default function ProductCategoriesNew() {
  const navigate = useNavigate();
  const { categories, loading } = useMarketplaceCategories();
  const [activeKey, setActiveKey] = useState("");

  // Category tabs: smooth horizontal scroll with edge fades and arrows that
  // only show when there is more to see.
  const tabsRef = useRef(null);
  const subSwiperRef = useRef(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const [subEdges, setSubEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const el = tabsRef.current;
    if (!el) return undefined;
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, categories.length, loading]);

  const scrollTabs = (direction) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(el.clientWidth * 0.7, 200), behavior: "smooth" });
  };

  const selectCategory = (key, target) => {
    setActiveKey(key);
    // Bring the chosen tab into the middle so the next ones stay visible.
    target?.scrollIntoView?.({ behavior: "smooth", inline: "center", block: "nearest" });
  };

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
          <div className="relative mx-auto max-w-6xl">
            <ScrollArrow side="left" visible={edges.left} onClick={() => scrollTabs(-1)} />
            <ScrollArrow side="right" visible={edges.right} onClick={() => scrollTabs(1)} />
            <div
              ref={tabsRef}
              className="overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-proximity overscroll-x-contain pb-4 md:px-10 md:scroll-px-10"
              style={{
                WebkitMaskImage: `linear-gradient(to right, ${edges.left ? "transparent" : "#000"} 0, #000 28px, #000 calc(100% - 28px), ${edges.right ? "transparent" : "#000"} 100%)`,
                maskImage: `linear-gradient(to right, ${edges.left ? "transparent" : "#000"} 0, #000 28px, #000 calc(100% - 28px), ${edges.right ? "transparent" : "#000"} 100%)`,
              }}
            >
            {/* w-max + mx-auto centres the tabs when they fit, and lets them
                scroll from the first tab when they don't (justify-center on
                an overflowing row used to hide the first categories). */}
            <div className="flex w-max gap-3 mx-auto">
            {categories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={(event) => selectCategory(category.key, event.currentTarget)}
                className={`snap-start px-5 md:px-6 py-2.5 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 ${
                  activeKey === category.key
                    ? "bg-gradient-to-r from-[#2E3192] to-[#4F52C9] text-white shadow-lg scale-[1.03]"
                    : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.name}
              </button>
            ))}
            </div>
            </div>
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
                <div className="relative">
                <button
                  type="button"
                  aria-label="Previous subcategories"
                  onClick={() => subSwiperRef.current?.slidePrev()}
                  className={`absolute -left-2 top-[90px] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-[#2E3192] shadow-md transition-opacity hover:bg-gray-50 md:flex ${subEdges.start ? "pointer-events-none opacity-0" : "opacity-100"}`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="More subcategories"
                  onClick={() => subSwiperRef.current?.slideNext()}
                  className={`absolute -right-2 top-[90px] z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-[#2E3192] shadow-md transition-opacity hover:bg-gray-50 md:flex ${subEdges.end ? "pointer-events-none opacity-0" : "opacity-100"}`}
                >
                  <ChevronRight size={20} />
                </button>
                <Swiper
                  modules={[FreeMode, Mousewheel, Keyboard, A11y]}
                  freeMode={{ enabled: true, sticky: true, momentumRatio: 0.6, momentumVelocityRatio: 0.7 }}
                  mousewheel={{ forceToAxis: true, sensitivity: 0.8, thresholdDelta: 6 }}
                  keyboard={{ enabled: true, onlyInViewport: true }}
                  grabCursor
                  watchOverflow
                  resistanceRatio={0.6}
                  onSwiper={(swiper) => {
                    subSwiperRef.current = swiper;
                    setSubEdges({ start: swiper.isBeginning, end: swiper.isEnd });
                  }}
                  onSlideChange={(swiper) => setSubEdges({ start: swiper.isBeginning, end: swiper.isEnd })}
                  onProgress={(swiper) => setSubEdges({ start: swiper.isBeginning, end: swiper.isEnd })}
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
                </div>
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
