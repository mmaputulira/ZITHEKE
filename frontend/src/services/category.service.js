import api from "../api/axios";

let publicCategoryCache = null;
let publicCategoryRequest = null;

export const getPublicCategories = async ({ force = false } = {}) => {
  if (!force && Array.isArray(publicCategoryCache)) {
    return publicCategoryCache;
  }

  if (!force && publicCategoryRequest) {
    return publicCategoryRequest;
  }

  publicCategoryRequest = api
    .get("/categories")
    .then(({ data }) => {
      publicCategoryCache = Array.isArray(data?.categories)
        ? data.categories
        : [];
      return publicCategoryCache;
    })
    .finally(() => {
      publicCategoryRequest = null;
    });

  return publicCategoryRequest;
};

export const clearPublicCategoryCache = () => {
  publicCategoryCache = null;
};
