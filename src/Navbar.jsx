import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FiShoppingCart } from "react-icons/fi";
import { useCartStore } from "./cartStore";
import axios from "axios";
import logo from "./images/QuickBites_Logo_Transparent.png";
import icon from "./images/icon.jpeg";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { cart, setCartFromBackend } = useCartStore();

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setUser(storedUser);
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
      setUser(null);
    }
  }, [location]);

  useEffect(() => {
    const fetchCartIfLoggedIn = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.accessToken) return;

        const res = await axios.get(
          "http://localhost:8080/api/v1/cart",
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          }
        );

        if (Array.isArray(res.data.items)) {
          setCartFromBackend(res.data.items);
        }
      } catch (error) {
        console.error("Error restoring cart:", error);
      }
    };

    fetchCartIfLoggedIn();
  }, [location, setCartFromBackend]);

  useEffect(() => {
    const localCart = localStorage.getItem("localCart");
    if (localCart) {
      try {
        setCartFromBackend(JSON.parse(localCart));
      } catch {}
    }
    // Only run on mount
    // eslint-disable-next-line
  }, []);

  const roles = user?.roles || [];

  const isAdmin = roles.includes("ROLE_ADMIN");
  const isCustomer = roles.length === 1 && roles.includes("ROLE_CUSTOMER");
  const isAgent = roles.length === 1 && roles.includes("ROLE_AGENT");

  let primaryRole = "GUEST";
  if (isAdmin) primaryRole = "ADMIN";
  else if (isCustomer) primaryRole = "CUSTOMER";
  else if (isAgent) primaryRole = "AGENT";

  const isLoggedIn = !!user;

  const getHomeRoute = () => {
    if (primaryRole === "ADMIN") return "/admin";
    if (primaryRole === "CUSTOMER") return "/customer-home";
    if (primaryRole === "AGENT") return "/delivery-home";
    return "/";
  };

  const getProfileLink = () => {
    if (primaryRole === "ADMIN") return "/aprofile";
    if (primaryRole === "CUSTOMER") return "/cprofile";
    if (primaryRole === "AGENT") return "/dprofile";
    return "/login";
  };

  const getOrdersLink = () => {
    if (primaryRole === "CUSTOMER") return "/ordersPage";
    if (primaryRole === "AGENT") return "/dorder";
    return "/";
  };

  const navItems = [
    { to: getHomeRoute(), label: "Home" },
    { to: "/menu", label: "Menu" },
    { to: "/features", label: "About" },
    { to: "/contact", label: "Contact Us" },
  ];

  const handleLogout = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (user?.accessToken) {
        await axios.post(
          "http://localhost:8080/api/v1/auth/logout",
          {},
          {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
            },
            withCredentials: true,
          }
        );
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("user");
      setCartFromBackend([]); // clear cart on logout
      navigate("/login");
    }
  };

  const handleHomeClick = (e, path) => {
    if (path === "/" && location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Never render Navbar for admins
  if (isAdmin) return null;

  return (
    <AnimatePresence>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -80, opacity: 0 }}
        transition={{ duration: 0.7, type: "spring", stiffness: 80, damping: 15 }}
        className="bg-orange-400 text-black shadow-md px-4 py-0 sticky top-0 z-50"
      >
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center space-x-4"
          >
            <NavLink
              to={getHomeRoute()}
              onClick={(e) => handleHomeClick(e, getHomeRoute())}
            >
              <img
                src={logo}
                alt="QuickBites Logo"
                className="h-16 drop-shadow-md cursor-pointer"
              />
            </NavLink>
          </motion.div>

          <motion.ul
            className="hidden md:flex space-x-12 font-semibold text-lg"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.4,
                },
              },
            }}
          >
            {navItems.map(({ to, label }, idx) => (
              <motion.li
                key={to}
                className="relative"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 + idx * 0.12 }}
              >
                <NavLink
                  to={to}
                  onClick={(e) => handleHomeClick(e, to)}
                  className={({ isActive }) =>
                    `transition-colors duration-300 ${
                      isActive ? "text-orange-800" : "hover:text-orange-800"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <span className="relative">
                      {label}
                      {isActive && (
                        <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-orange-800 animate-scale-in origin-left" />
                      )}
                    </span>
                  )}
                </NavLink>
              </motion.li>
            ))}
          </motion.ul>

          <motion.div
            className="ml-2 relative flex items-center space-x-4"
            initial={{ x: 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6, type: "spring" }}
          >
            {isLoggedIn && user?.username && (
              <span className="text-white font-semibold mr-2 hidden md:inline-block">
                Welcome, {user.username}!
              </span>
            )}

            {isLoggedIn &&
              (primaryRole === "CUSTOMER" || primaryRole === "ADMIN") && (
                <div
                  className="relative cursor-pointer text-white"
                  onClick={() => navigate("/cart")}
                >
                  <FiShoppingCart size={24} />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {totalItems}
                    </span>
                  )}
                </div>
              )}

            {isLoggedIn ? (
              <div className="group relative">
                <img
                  src={icon}
                  alt="Profile"
                  className="h-10 w-10 rounded-full cursor-pointer border-2 border-white"
                />
                <div className="absolute right-0 mt-2 bg-white text-black rounded-md shadow-md p-3 w-48 hidden group-hover:block z-50">
                  {primaryRole === "ADMIN" && (
                    <NavLink
                      to="/admin/add-food"
                      className="block py-2 px-3 hover:bg-orange-100 rounded-md"
                    >
                      Dashboard
                    </NavLink>
                  )}

                  {(primaryRole === "CUSTOMER" || primaryRole === "AGENT") && (
                    <NavLink
                      to={getOrdersLink()}
                      className="block py-2 px-3 hover:bg-orange-100 rounded-md"
                    >
                      Orders
                    </NavLink>
                  )}

                  <NavLink
                    to={getProfileLink()}
                    className="block py-2 px-3 hover:bg-orange-100 rounded-md"
                  >
                    My Profile
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 px-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <NavLink
                to="/login"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full text-base font-semibold transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Login
              </NavLink>
            )}
          </motion.div>
        </div>
      </motion.nav>
    </AnimatePresence>
  );
};

export default Navbar;
