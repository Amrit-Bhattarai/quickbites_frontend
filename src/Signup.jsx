import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Username must start with a letter, only letters and numbers, min 3 char
const USERNAME_REGEX = /^[A-Za-z][A-Za-z0-9]{2,}$/;

const passwordStrength = (password) => {
  if (!password) return "";
  const strongRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])(.{8,})$/;
  const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z]|.*\d)(.{8,})$/;
  if (strongRegex.test(password)) return "Strong";
  if (mediumRegex.test(password)) return "Medium";
  return "Weak";
};

const baseSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required.")
    .regex(/^[A-Za-z]+$/, "First name must contain only letters."),
  lastName: z
    .string()
    .min(1, "Last name is required.")
    .regex(/^[A-Za-z]+$/, "Last name must contain only letters."),
  email: z
    .string()
    .min(1, "Email is required.")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email address."),
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .regex(
      USERNAME_REGEX,
      "Username must start with a letter and contain only letters and numbers."
    ),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

const deliverySchema = baseSchema.extend({
  citizenshipPhoto: z
    .any()
    .refine((file) => file?.length === 1, "Front side is required."),
  citizenshipPhotoBack: z
    .any()
    .refine((file) => file?.length === 1, "Back side is required."),
  drivingLicense: z
    .any()
    .refine((file) => file?.length === 1, "Driving license is required."),
});

const Signup = () => {
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const schema = role === "customer" ? baseSchema : deliverySchema;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  useEffect(() => {
    reset();
  }, [role, reset]);

  useEffect(() => {
    const subscription = watch((value) => {
      setStrength(passwordStrength(value.password));
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  // Username live validation
  const usernameValue = watch("userName") || "";
  const isUsernameValid = USERNAME_REGEX.test(usernameValue);
  const showUsernameError =
    usernameValue.length > 0 && !isUsernameValid && usernameValue.length >= 3;

  const onSubmit = async (data) => {
    if (strength === "Weak") {
      toast.error("Password strength is too weak!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (role === "customer") {
        const response = await axios.post(
          "http://localhost:8080/api/v1/auth/signup/customer",
          data,
          { headers: { "Content-Type": "application/json" } }
        );

        if (response.status !== 200 && response.status !== 201) {
          const errorMessage =
            response.data?.errorMessage ||
            response.data?.message ||
            "Signup failed.";
          toast.error(errorMessage);
          setIsSubmitting(false);
          return;
        }

        toast.success("Signup successful! Now verify OTP.");
        navigate("/otp", { state: { role, email: data.email } });
      } else {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (
            key === "citizenshipPhoto" ||
            key === "citizenshipPhotoBack" ||
            key === "drivingLicense"
          ) {
            if (value?.[0]) {
              formData.append(key, value[0]);
            }
          } else {
            formData.append(key, value);
          }
        });

        const response = await axios.post(
          "http://localhost:8080/api/v1/auth/signup/agent",
          formData
        );

        if (response.status !== 200 && response.status !== 201) {
          const errorMessage =
            response.data?.errorMessage ||
            response.data?.message ||
            "Signup failed.";
          toast.error(errorMessage);
          setIsSubmitting(false);
          return;
        }

        toast.success("Signup successful! Now verify OTP.");
        navigate("/otp", { state: { role, email: data.email } });
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.response) {
        const data = error.response.data;
        const errorMessage =
          data?.errorMessage ||
          data?.message ||
          data?.detail ||
          (Array.isArray(data?.errors) && data.errors.length > 0
            ? data.errors[0].message
            : null) ||
          `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("No response from server. Please try again.");
      } else {
        toast.error("An error occurred during signup.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTab = "bg-[#d46a27] text-white";
  const inactiveTab = "bg-white text-black";

  const Label = ({ label, required }) => (
    <label className="block font-medium text-black text-sm">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center p-4"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=1470&q=80')",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="w-full max-w-md bg-[#f0e6d2] p-4 rounded-xl shadow-2xl backdrop-blur-md border border-gray-200">
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setRole("customer")}
            className={`px-4 py-2 rounded-l-full border border-[#d46a27] font-semibold ${
              role === "customer" ? activeTab : inactiveTab
            }`}
          >
            Customer
          </button>
          <button
            onClick={() => setRole("delivery")}
            className={`px-4 py-2 rounded-r-full border border-[#d46a27] font-semibold ${
              role === "delivery" ? activeTab : inactiveTab
            }`}
          >
            Delivery Agent
          </button>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-3"
          encType="multipart/form-data"
        >
          <div className="flex gap-3">
            <div className="flex-1">
              <Label label="First Name" required />
              <input
                type="text"
                {...register("firstName")}
                placeholder="John"
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#d46a27] focus:outline-none placeholder-gray-500 text-sm"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div className="flex-1">
              <Label label="Last Name" required />
              <input
                type="text"
                {...register("lastName")}
                placeholder="Doe"
                className="w-full p-2 border border-gray-300 rounded-md focus:border-[#d46a27] focus:outline-none placeholder-gray-500 text-sm"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label label="Email" required />
            <input
              type="email"
              {...register("email")}
              placeholder="john.doe@example.com"
              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#d46a27] focus:outline-none placeholder-gray-500 text-sm"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label label="Username" required />
            <input
              type="text"
              {...register("userName")}
              placeholder="johnDoe123"
              className="w-full p-2 border border-gray-300 rounded-md focus:border-[#d46a27] focus:outline-none placeholder-gray-500 text-sm"
            />
            {errors.userName && (
              <p className="text-xs text-red-500">{errors.userName.message}</p>
            )}
            {showUsernameError && (
              <p className="text-xs text-red-500">
                Username must start with a letter and contain only letters and
                numbers.
              </p>
            )}
          </div>

          <div>
            <Label label="Password" required />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Create a strong password"
                className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:border-[#d46a27] focus:outline-none placeholder-gray-500 text-sm"
              />
              <div
                className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEye /> : <FiEyeOff />}
              </div>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500">{errors.password.message}</p>
            )}
            {strength && (
              <p
                className={`text-xs mt-1 ${
                  strength === "Strong"
                    ? "text-green-600"
                    : strength === "Medium"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                Password strength: {strength}
              </p>
            )}
          </div>

          {role === "delivery" && (
            <>
              <div>
                <Label label="Citizenship Photo (Front)" required />
                <input
                  type="file"
                  {...register("citizenshipPhoto")}
                  accept="image/*"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                />
                {errors.citizenshipPhoto && (
                  <p className="text-xs text-red-500">
                    {errors.citizenshipPhoto.message}
                  </p>
                )}
              </div>
              <div>
                <Label label="Citizenship Photo (Back)" required />
                <input
                  type="file"
                  {...register("citizenshipPhotoBack")}
                  accept="image/*"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                />
                {errors.citizenshipPhotoBack && (
                  <p className="text-xs text-red-500">
                    {errors.citizenshipPhotoBack.message}
                  </p>
                )}
              </div>
              <div>
                <Label label="Driving License Photo" required />
                <input
                  type="file"
                  {...register("drivingLicense")}
                  accept="image/*"
                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                />
                {errors.drivingLicense && (
                  <p className="text-xs text-red-500">
                    {errors.drivingLicense.message}
                  </p>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-4 bg-gradient-to-r from-[#d46a27] to-[#c25e1f] text-white font-semibold py-2 rounded-md transition duration-200 text-sm ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gradient-to-l"
            }`}
          >
            {isSubmitting
              ? "Registering..."
              : `Register as ${
                  role === "customer" ? "Customer" : "Delivery Agent"
                }`}
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Signup;
