import axios from "axios";

// Backend base URL
const BASE_URL = "http://localhost:8080";

// Main function for protected requests
export const axiosWithRefresh = async (config) => {
  const user = JSON.parse(localStorage.getItem("user"));

  try {
    // Try the original request with access token
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

        // Clear user and redirect to login
        localStorage.removeItem("user");
        window.location.href = "/login";
        throw refreshErr;
      }
    }

    // Some other error
    throw error;
  }
};
