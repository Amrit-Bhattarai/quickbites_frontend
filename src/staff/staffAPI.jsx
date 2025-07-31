import axios from "axios";

const BASE_URL = "http://localhost:8080/api/v1/staff";
const AUTH_URL = "http://localhost:8080/api/v1/auth";

const getAuthToken = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const token = user ? user.accessToken : null;
    console.log("getAuthToken() - Token from localStorage:", token);
    return token;
  } catch (error) {
    console.error("Error parsing user data from localStorage:", error);
    return null;
  }
};

axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Interceptor - Adding Authorization header:", config.headers.Authorization);
    } else {
      console.warn("Interceptor - No token found, Authorization header not added.");
    }
    return config;
  },
  (error) => {
    console.error("Request Interceptor Error:", error); // Log request errors
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("Response Interceptor Error:", error); // Log all response errors
    if (error.response && error.response.status === 401) {
      console.error("401 Error - Token invalid or expired. Redirecting to login.");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const getOrders = async () => {
  console.log("getOrders() - Making API call");
  try {
    const res = await axios.get(`${BASE_URL}/orders`);
    console.log("getOrders() - Response:", res); // Log the full response
    return res.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

export const updateKitchenStatus = async (orderId, newStatus) => {
  console.log(`updateKitchenStatus() - orderId: ${orderId}, newStatus: ${newStatus}`);
  try {
    const response = await axios.patch(
      `${BASE_URL}/orders/${orderId}/status`,
      {
        kitchenStatus: newStatus,
      },
      {
        headers: {
          "Content-Type": "application/json", // Explicitly set content type
        },
      }
    );
    console.log("updateKitchenStatus() - Response:", response); // Log the full response
    return response.data; // Or just return the response if needed
  } catch (error) {
    console.error("Error updating kitchen status:", error);
    if (error.response) {
      console.error("updateKitchenStatus() - Response Data:", error.response.data);
      console.error("updateKitchenStatus() - Response Status:", error.response.status);
      console.error("updateKitchenStatus() - Response Headers:", error.response.headers);
    } else if (error.request) {
      console.error("updateKitchenStatus() - No response received:", error.request);
    } else {
      console.error("updateKitchenStatus() - Error setting up the request:", error.message);
    }
    throw error;
  }
};

export const getKitchenStatuses = async () => {
  console.log("getKitchenStatuses() - Making API call");
  try {
    const res = await axios.get(`${BASE_URL}/kitchen-statuses`);
    console.log("getKitchenStatuses() - Response:", res); // Log the full response
    return res.data;
  } catch (error) {
    console.error("Error fetching kitchen statuses:", error);
    throw error;
  }
};

export const staffLogout = async () => {
  try {
    await axios.post(`${AUTH_URL}/logout`);
    localStorage.removeItem("user");
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
};