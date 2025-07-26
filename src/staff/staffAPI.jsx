import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1/staff";
const AUTH_URL = "http://localhost:8080/api/v1/auth";

export const getOrders = async () => {
  const res = await axios.get(`${BASE_URL}/orders`);
  return res.data;
};

export const updateKitchenStatus = async (orderId, newStatus) => {
  await axios.patch(`${BASE_URL}/orders/${orderId}/status`, {
    kitchenStatus: newStatus,
  });
};

export const getKitchenStatuses = async () => {
  const res = await axios.get(`${BASE_URL}/kitchen-statuses`);
  return res.data; // e.g. ["TO_BE_PREPARED", "PREPARING", "READY"]
};

export const staffLogout = async () => {
  await axios.post(`${AUTH_URL}/logout`);
};
