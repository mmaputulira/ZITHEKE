import React, { useEffect, useState } from "react";
import axios from "axios";
import { ChevronLeft, ChevronRight, Loader2, MapPin, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { formatPrice } from "../../utils/formatPrice";
import {
  getCardImageOrFallback,
  getPrimaryImage,
  handleImageFallback,
} from "../../utils/imageVariants";

const BASE_URL = "/api";
const PAGE_SIZE = 24;

const Listings = () => {
  const [ads, setAds] = useState([]);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const fetchAds = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (submittedSearch) params.set("q", submittedSearch);

        const res = await axios.get(`${BASE_URL}/ads?${params.toString()}`);
        if (!alive) return;
        setAds(Array.isArray(res.data?.ads) ? res.data.ads : []);
        setPages(Number(res.data?.totalPages || res.data?.pages || 1));
        setTotal(Number(res.data?.total || 0));
      } catch (err) {
        if (alive) {
          console.error("Error fetching listings:", err);
          setAds([]);
          setPages(1);
          setTotal(0);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchAds();
    return () => {
      alive = false;
    };
  }, [sort, page, submittedSearch]);

  const runSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  };

  return (
    <section className="min-h-screen bg-[#F8FAFC] pt-28 pb-16 font-[Poppins]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#2E3192]/55">
              Zitheke Marketplace
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1D64] mt-2">
              All Listings
            </h1>
            <p className="text-gray-500 mt-2">
              {total.toLocaleString()} listing{total === 1 ? "" : "s"} available.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <form
              onSubmit={runSearch}
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 bg-white min-w-0 sm:min-w-[300px]"
            >
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="search"
                placeholder="Search listings..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="outline-none text-sm w-full bg-transparent"
              />
            </form>

            <select
              aria-label="Sort listings"
              className="border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-sm cursor-pointer focus:ring-2 focus:ring-[#2E3192]/20"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest</option>
              <option value="popular">Most popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-[#2E3192]">
            <Loader2 className="animate-spin mb-3" size={30} />
            <p className="font-semibold">Loading listings...</p>
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white border rounded-3xl p-12 text-center">
            <Search size={42} className="mx-auto text-gray-300 mb-3" />
            <h2 className="font-semibold text-lg text-gray-800">No listings found</h2>
            <p className="text-gray-500 text-sm mt-2">
              Try a different search or browse all categories.
            </p>
          </div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {ads.map((ad) => (
                <motion.article
                  key={ad._id}
                  onClick={() => navigate(`/ad/${ad._id}`)}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl overflow-hidden cursor-pointer flex flex-col"
                >
                  <div className="relative h-48 w-full bg-gray-100">
                    <img
                      src={getCardImageOrFallback(ad)}
                      alt={ad.title}
                      loading="lazy"
                      decoding="async"
                      onError={(event) =>
                        handleImageFallback(event, getPrimaryImage(ad), "medium")
                      }
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    {ad.featured && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[11px] rounded-full font-bold bg-[#F9B233] text-[#1A1D64]">
                        Boosted
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col justify-between flex-1 p-4">
                    <div>
                      <p className="text-[#2E3192] font-extrabold text-lg">
                        {ad.price == null ? "Price on request" : formatPrice(ad.price, "MWK ")}
                      </p>
                      <h2 className="font-semibold text-gray-900 text-base truncate mt-1">
                        {ad.title}
                      </h2>
                      <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                        {ad.description || "Open the listing to see more details."}
                      </p>
                    </div>

                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-4">
                      <MapPin size={13} />
                      {ad.city || ad.location || "Malawi"}
                    </p>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="h-10 w-10 rounded-full border bg-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm text-gray-600">
                  Page <strong>{page}</strong> of <strong>{pages}</strong>
                </span>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((current) => Math.min(pages, current + 1))}
                  className="h-10 w-10 rounded-full border bg-white flex items-center justify-center disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Listings;
