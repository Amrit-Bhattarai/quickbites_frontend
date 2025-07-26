import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

const BASE_URL = "http://localhost:8080"; // Update if needed

const Cprofile = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: [],
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const userData = JSON.parse(localStorage.getItem("user"));
  const token = userData?.accessToken;
  const fullUser = userData?.user;

  const fetchData = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/v1/user/get-profile-detail`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { firstName, lastName, phone, address } = res.data.data;

      const updatedAddress = address.map((addr) => ({
        ...addr,
        user: fullUser,
      }));

      setFormData({ firstName, lastName, phone, address: updatedAddress });
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch profile data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e, index) => {
    const { name, value } = e.target;
    const updated = [...formData.address];
    updated[index][name] =
      name === "latitude" || name === "longitude" ? parseFloat(value) : value;
    setFormData((prev) => ({ ...prev, address: updated }));
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        address: formData.address.map((addr) => ({
          ...addr,
          user: fullUser,
        })),
      };

      await axios.put(`${BASE_URL}/api/v1/user/update-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Profile update failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const currentPassword = e.target.currentPassword.value;
    const newPassword = e.target.newPassword.value;
    const confirmPassword = e.target.confirmPassword.value;

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/api/v1/user/profile/initiate-password-change`,
        { currentPassword, newPassword, confirmPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Password changed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Password change failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/api/v1/user/profile/initiate-email-change`,
        { newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("OTP sent to your email");
    } catch (error) {
      console.error(error);
      toast.error("Email change initiation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpConfirm = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/api/v1/user/profile/confirm-email-change`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Email changed successfully");
      setOtp("");
      setNewEmail("");
      setMessage("");
    } catch (error) {
      console.error(error);
      toast.error("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>First Name</label>
          <input
            className="w-full border p-2 rounded"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Last Name</label>
          <input
            className="w-full border p-2 rounded"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label>Phone</label>
          <input
            className="w-full border p-2 rounded"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Addresses</h3>
        {formData.address.map((addr, i) => (
          <div
            key={i}
            className="grid grid-cols-2 gap-4 border p-4 mb-4 rounded"
          >
            <div>
              <label>Title</label>
              <input
                className="w-full border p-2 rounded"
                name="title"
                value={addr.title}
                onChange={(e) => handleAddressChange(e, i)}
              />
            </div>
            <div>
              <label>Full Address</label>
              <input
                className="w-full border p-2 rounded"
                name="fullAddress"
                value={addr.fullAddress}
                onChange={(e) => handleAddressChange(e, i)}
              />
            </div>
            <div>
              <label>Latitude</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                name="latitude"
                value={addr.latitude}
                onChange={(e) => handleAddressChange(e, i)}
              />
            </div>
            <div>
              <label>Longitude</label>
              <input
                type="number"
                className="w-full border p-2 rounded"
                name="longitude"
                value={addr.longitude}
                onChange={(e) => handleAddressChange(e, i)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleProfileUpdate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Updating..." : "Update Profile"}
      </button>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Change Password</h3>
        <div>
          <label>Current Password</label>
          <input
            name="currentPassword"
            type="password"
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>New Password</label>
          <input
            name="newPassword"
            type="password"
            className="w-full border p-2 rounded"
          />
        </div>
        <div>
          <label>Confirm New Password</label>
          <input
            name="confirmPassword"
            type="password"
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>

      {/* Email Change */}
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold">Change Email</h3>
        <div>
          <label>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border p-2 rounded"
          />
        </div>
        <button
          onClick={handleEmailChange}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>

        {message && <p className="text-green-600">{message}</p>}

        {message && (
          <>
            <div>
              <label>Enter OTP</label>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full border p-2 rounded"
              />
            </div>
            <button
              onClick={handleOtpConfirm}
              disabled={loading}
              className="bg-yellow-600 text-white px-4 py-2 rounded"
            >
              {loading ? "Verifying..." : "Confirm OTP"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Cprofile;
