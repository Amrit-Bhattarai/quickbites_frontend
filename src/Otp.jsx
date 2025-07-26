import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Otp = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, email } = location.state || {};

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [message, setMessage] = useState("");
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setInterval(() => setTimer((prev) => prev - 1), 1000);
      return () => clearInterval(countdown);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleSubmit = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length === 6) {
      try {
        const response = await fetch(
          "http://localhost:8080/api/v1/auth/verify-otp",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, otp: fullOtp }),
          }
        );

        if (response.status === 202) {
          const messageText = await response.text();

          if (messageText === "OTP_VERIFIED") {
            setMessage("✅ OTP Verified. La badhai xa!");

            navigate("/login", {
              state: { showMessage: true },
            });
          } else {
            setMessage("❌ Invalid. Try again.");
          }
        } else {
          setMessage("❌ Invalid. Try again.");
        }
      } catch (error) {
        console.error("OTP verification error:", error);
        setMessage("⚠️ OTP Error. Try again later.");
      }
    } else {
      setMessage("⚠️ Please enter full 6-digit OTP.");
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/auth/resend-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );

      if (response.status === 200) {
        setOtp(["", "", "", "", "", ""]);
        setMessage("✅ OTP Resent to your email!");
        setTimer(30);
        setCanResend(false);
      } else {
        setMessage("❌ Failed to resend OTP. Try again.");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setMessage("⚠️ Server error. Try again later.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <h2 className="text-2xl font-semibold mb-2">Enter 6-digit OTP</h2>

      {email && (
        <p className="text-sm text-gray-600 mb-4">
          OTP has been sent to: <strong>{email}</strong>
        </p>
      )}

      <div className="flex gap-3 mb-4">
        {otp.map((digit, index) => (
          <input
            key={index}
            id={`otp-${index}`}
            type="text"
            value={digit}
            onChange={(e) => handleChange(e, index)}
            maxLength={1}
            className="w-12 h-12 text-xl text-center border-2 border-gray-300 rounded-md focus:outline-none focus:border-orange-500 transition-all"
          />
        ))}
      </div>

      <button
        onClick={handleSubmit}
        className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-6 rounded-md transition-all"
      >
        Verify
      </button>

      <div className="mt-4 text-gray-700 text-sm">
        {canResend ? (
          <button
            onClick={handleResend}
            className="text-orange-500 underline hover:text-orange-600 transition"
          >
            Resend OTP
          </button>
        ) : (
          <span>Resend OTP in {timer}s</span>
        )}
      </div>

      {message && (
        <p className="mt-4 text-lg font-medium text-gray-700">{message}</p>
      )}
    </div>
  );
};

export default Otp;
