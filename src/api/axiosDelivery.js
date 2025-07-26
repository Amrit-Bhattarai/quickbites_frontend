import axios from "axios";

// Delivery-specific axios helper for protected API calls
// Usage:
//   import { axiosDelivery } from "../api/axiosDelivery";
//   const res = await axiosDelivery({ method: "get", url: "/agent/summary" });

const BASE_URL = "http://localhost:8080";

export const axiosDelivery = async (config) => {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    const response = await axios({
      ...config,
      baseURL: BASE_URL,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${user?.accessToken}`,
      },
      withCredentials: true,
    });
    return response;
  } catch (error) {
    // If access token is expired and not already retried
    if (error.response?.status === 401 && !config._retry) {
      config._retry = true;
      try {
        // Call refresh-token API
        const refreshRes = await axios.post(
          `${BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        );
        const { accessToken, accessTokenExpiry } = refreshRes.data.data;
        // Update localStorage with new access token
        const updatedUser = { ...user, accessToken, accessTokenExpiry };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        // Retry original request with new token
        return axios({
          ...config,
          baseURL: BASE_URL,
          headers: {
            ...config.headers,
            Authorization: `Bearer ${accessToken}`,
          },
          withCredentials: true,
        });
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw refreshErr;
      }
    }
    throw error;
  }
};
