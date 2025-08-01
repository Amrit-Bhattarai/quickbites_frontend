import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1/staff";
const AUTH_URL = "http://localhost:8080/api/v1/auth";

const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? user.accessToken : null;
  } catch {
    return null;
  }
};

axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getOrders = async () => {
  const res = await axios.get(`${BASE_URL}/orders`);
  return res.data;
};

export const updateKitchenStatus = async (orderId, newStatus) => {
  const response = await axios.patch(
    `${BASE_URL}/orders/${orderId}/status`,
    { kitchenStatus: newStatus },
    { headers: { "Content-Type": "application/json" } }
  );
  return response.data;
};

export const getKitchenStatuses = async () => {
  const res = await axios.get(`${BASE_URL}/kitchen-statuses`);
  return res.data;
};

export const staffLogout = async () => {
  await axios.post(`${AUTH_URL}/logout`);
  localStorage.removeItem("user");
};
