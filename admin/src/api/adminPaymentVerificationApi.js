import adminApi from "./adminApi";

export const getPopVerificationQueue = async (params = {}) => {
  const { data } = await adminApi.get("/payments/pop-verification", { params });
  return { items: Array.isArray(data?.data) ? data.data : [], pagination: data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 } };
};

export const approvePopPayment = async (paymentId) => {
  const { data } = await adminApi.patch(`/payments/${paymentId}/pop/approve`);
  return data;
};

export const rejectPopPayment = async (paymentId, reason) => {
  const { data } = await adminApi.patch(`/payments/${paymentId}/pop/reject`, { reason });
  return data;
};

export const getAdminPopBlob = async (paymentId) => {
  const response = await adminApi.get(`/payments/${paymentId}/pop`, { responseType: "blob" });
  return response.data;
};
