import React, { useState } from "react";

const Header = ({ className = "" }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header
      className={`flex items-center justify-between ml-64 bg-white shadow px-8 py-5 ${className}`}
    >
      <div className="flex items-center">
        <img
          src={require("../images/QuickBites_Logo_Transparent1.png")}
          alt="Logo"
          className="h-14 w-14 mr-4" // increased size
        />
        <span className="text-2xl font-bold text-orange-600">
          {" "}
          {/* larger text */}
          Delivery Agent Dashboard
        </span>
      </div>
      <div className="relative">
        <button
          className="focus:outline-none"
          onClick={() => setDropdownOpen((open) => !open)}
        >
          <img
            src={require("../images/icon.jpeg")}
            alt="Profile"
            className="h-12 w-12 rounded-full border-2 border-gray-300" // increased profile icon size
          />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-10">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={async () => {
                try {
                  await fetch(
                    "http://localhost:8080/api/v1/auth/logout",
                    {
                      method: "POST",
                      credentials: "include",
                    }
                  );
                } catch (error) {
                  console.error("Logout failed:", error);
                } finally {
                  localStorage.removeItem("user");
                  window.location.href = "/login";
                }
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
