import { useEffect, useMemo, useState } from "react";
import staticCategories from "../Components/CategoryBar/categories.js";
import { getPublicCategories } from "../services/category.service.js";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");

const staticEntries = Object.entries(staticCategories).map(([key, value]) => ({
  key,
  name: value.label || key,
  slug: normalize(value.label || key),
  subcategories: (value.subs || []).map((sub) => ({
    key: sub.key,
    name: sub.label || sub.key,
    slug: normalize(sub.label || sub.key),
    image: sub.image || "",
  })),
}));

const findStaticCategory = (name = "") =>
  staticEntries.find((entry) => normalize(entry.name) === normalize(name));

const decorateCategories = (rows = []) =>
  rows.map((row) => {
    const visual = findStaticCategory(row.name);
    const staticSubs = visual?.subcategories || [];

    return {
      key: String(row._id || row.slug || row.name),
      name: row.name,
      slug: row.slug || normalize(row.name),
      subcategories: (row.subcategories || []).map((sub) => {
        const visualSub = staticSubs.find(
          (candidate) => normalize(candidate.name) === normalize(sub.name)
        );
        return {
          key: String(sub._id || sub.slug || sub.name),
          name: sub.name,
          slug: sub.slug || normalize(sub.name),
          // An admin-uploaded picture wins; a removed picture shows none;
          // otherwise fall back to the built-in picture.
          image: sub.imageHidden ? "" : sub.image || visualSub?.image || "",
        };
      }),
      image: staticSubs.find((sub) => sub.image)?.image || "",
    };
  });

export default function useMarketplaceCategories() {
  const [remoteCategories, setRemoteCategories] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getPublicCategories()
      .then((rows) => {
        if (alive) setRemoteCategories(rows);
      })
      .catch(() => {
        if (alive) setRemoteCategories([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const categories = useMemo(() => {
    if (Array.isArray(remoteCategories) && remoteCategories.length) {
      return decorateCategories(remoteCategories);
    }
    return staticEntries;
  }, [remoteCategories]);

  return { categories, loading };
}
