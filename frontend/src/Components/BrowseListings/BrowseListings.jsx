import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers3, Search } from "lucide-react";
import useMarketplaceCategories from "../../hooks/useMarketplaceCategories.js";

const BrowseListings = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { categories, loading } = useMarketplaceCategories();

  const filteredCategories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((category) => {
      if (category.name.toLowerCase().includes(needle)) return true;
      return (category.subcategories || []).some((sub) =>
        sub.name.toLowerCase().includes(needle)
      );
    });
  }, [categories, query]);

  const totalSubcategories = useMemo(
    () =>
      categories.reduce(
        (count, category) => count + (category.subcategories?.length || 0),
        0
      ),
    [categories]
  );

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#F7F9FF] to-white pt-28 pb-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 font-[Poppins]">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#2E3192] tracking-tight">
            Browse Listings
          </h1>
          <p className="text-gray-600 mt-2 text-sm md:text-base">
            Browse the categories currently available on Zitheke.
          </p>
        </div>

        <div className="bg-white border border-[#2E3192]/10 rounded-2xl p-4 md:p-5 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <label className="relative w-full md:max-w-sm">
              <span className="sr-only">Search categories</span>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search categories or subcategories..."
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3192]/20"
              />
            </label>

            <div className="text-sm text-gray-600">
              <span className="font-semibold text-[#2E3192]">
                {categories.length}
              </span>{" "}
              categories ·{" "}
              <span className="font-semibold text-[#2E3192]">
                {totalSubcategories}
              </span>{" "}
              subcategories
            </div>
          </div>
        </div>

        {loading && !categories.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {filteredCategories.map((category) => (
              <button
                key={category.key}
                type="button"
                onClick={() =>
                  navigate(`/category/${encodeURIComponent(category.name)}`)
                }
                className="group text-left bg-white border border-[#2E3192]/10 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-[#2E3192]/30 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#2E3192] mb-2 group-hover:text-[#1F2370]">
                      {category.name}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {category.subcategories?.length || 0} subcategories
                    </p>
                  </div>
                  <span className="h-10 w-10 shrink-0 rounded-xl bg-[#EEF0FF] text-[#2E3192] flex items-center justify-center">
                    <Layers3 size={19} />
                  </span>
                </div>
                {!!category.subcategories?.length && (
                  <p className="mt-4 text-xs text-gray-500 line-clamp-2">
                    {category.subcategories
                      .slice(0, 4)
                      .map((sub) => sub.name)
                      .join(" · ")}
                  </p>
                )}
                <p className="mt-3 text-xs text-[#2E3192] font-semibold">
                  Explore category →
                </p>
              </button>
            ))}
          </div>
        )}

        {!loading && filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No category found for “<span className="font-medium">{query}</span>”.
          </div>
        )}
      </div>
    </section>
  );
};

export default BrowseListings;
