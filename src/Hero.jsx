import React, { useState, useEffect } from "react";
import Agent from "./images/Agent.png";
import { motion } from "framer-motion";
import { useCartStore } from "./cartStore";
import { toast } from "react-toastify";

const BASE_URL = "http://localhost:8080";
const baseImageURL = `${BASE_URL}/uploads/images/foodItemImages/`;

const SearchResultItem = ({ item, onAddToCart }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(
    item.foodVariants?.[0]?.id || null
  );
  const { cart } = useCartStore();

  const alreadyInCart = cart.some(
    (cartItem) =>
      (cartItem.foodItemId === item.id || cartItem.id === item.id) &&
      (cartItem.foodVariantId === selectedVariantId ||
        cartItem.variantId === selectedVariantId)
  );

  const handleClick = () => {
    if (alreadyInCart) {
      toast.warn("Item already in cart");
      return;
    }
    onAddToCart({ ...item, selectedVariantId });
  };

  return (
    <li className="flex flex-col space-y-2 bg-gray-50 p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <img
          src={`${baseImageURL}${item.imageUrl}`}
          alt={item.name}
          className="w-16 h-16 rounded object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/64";
          }}
        />
        <div className="flex-1">
          <p className="font-medium text-gray-700">{item.name}</p>
          <p className="text-sm text-orange-500">
            Rs{" "}
            {item.foodVariants?.find((v) => v.id === selectedVariantId)
              ?.price ?? "N/A"}
          </p>
        </div>
      </div>

      {item.foodVariants?.length > 1 && (
        <select
          value={selectedVariantId}
          onChange={(e) => setSelectedVariantId(Number(e.target.value))}
          className="w-full p-2 border border-orange-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
        >
          {item.foodVariants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} – Rs. {variant.price}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={handleClick}
        disabled={alreadyInCart}
        className={`mt-1 text-sm text-white ${
          alreadyInCart ? "bg-green-500" : "bg-orange-500 hover:bg-orange-600"
        } px-3 py-1 rounded-full ${
          alreadyInCart ? "opacity-70 cursor-not-allowed" : ""
        }`}
      >
        {alreadyInCart ? "✔ Added" : "Add to Cart"}
      </button>
    </li>
  );
};

const Hero = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const setCartFromBackend = useCartStore((state) => state.setCartFromBackend);

  useEffect(() => {
    fetch(`${BASE_URL}/public/foodItems`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    })
      .then((res) => res.json())
      .then((data) => {
        setMenuItems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch food items", err);
        setLoading(false);
      });
  }, []);

  // Debounce searchTerm
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim() === "") {
        setResults([]);
      } else {
        const filtered = menuItems.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setResults(filtered);
      }
      setSearching(false);
    }, 400);

    setSearching(true);
    return () => clearTimeout(handler);
  }, [searchTerm, menuItems]);

  const handleAddToCart = async (food) => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      toast.error("You must be logged in to order.");
      return;
    }

    try {
      const user = JSON.parse(userData);
      const token = user.accessToken;
      if (!token) {
        toast.error("Please login again.");
        return;
      }

      if (!food.selectedVariantId) {
        toast.error("Please select a variant");
        return;
      }

      // POST to backend to add cart item
      const response = await fetch(`${BASE_URL}/api/v1/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          foodItemId: food.id,
          foodVariantId: food.selectedVariantId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`Failed to add to cart: ${errorText}`);
        return;
      }

      toast.success(`${food.name} has been added to the cart.`);

      // Fetch updated cart from backend
      const cartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (cartRes.ok) {
        const cartData = await cartRes.json();
        if (Array.isArray(cartData.items)) {
          setCartFromBackend(cartData.items);
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="relative bg-orange-400 pb-32 pt-28 px-6 md:px-20 overflow-hidden">
      <div className="absolute top-0 left-5/3 w-[700px] h-[500px] bg-orange-300 blur-[140px] rounded-full -translate-x-1/2 z-0" />

      <div className="relative z-10 max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between">
        <div className="md:w-1/2 text-left">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-5xl font-poppins font-bold leading-tight mb-6 tracking-tight"
          >
            Knock Knock. <br />
            <span className="text-orange-900 italic tracking-wide ">
              QuickBites
            </span>{" "}
            at Your Door!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="text-gray-700 text-lg font-medium  tracking-wide mb-8 max-w-lg"
          >
            Delivered hot and fresh. <br />
            No delays, No compromises.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
            className="flex items-center bg-white rounded-full overflow-hidden max-w-lg shadow-lg mb-6 relative"
          >
            <input
              type="text"
              placeholder="Search for your cravings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow px-6 py-3 text-gray-800 text-base focus:outline-none bg-transparent"
            />
            <button
              onClick={() => {
                const filtered = menuItems.filter((item) =>
                  item.name.toLowerCase().includes(searchTerm.toLowerCase())
                );
                setResults(filtered);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 md:px-8 py-3 font-semibold transition-all"
            >
              Search
            </button>
          </motion.div>

          {searchTerm.trim() !== "" && (
            <div className="bg-white rounded-lg p-4 shadow-md max-w-xl w-full mt-4">
              {searching ? (
                <p className="text-sm text-gray-600">Searching...</p>
              ) : results.length > 0 ? (
                <>
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    Search Results:
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.map((item) => (
                      <SearchResultItem
                        key={item.id}
                        item={item}
                        onAddToCart={handleAddToCart}
                      />
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-gray-900 text-sm">
                  No items found for “{searchTerm}”
                </p>
              )}
            </div>
          )}
        </div>

        <div className="md:w-1/2 mb-10 md:mb-0 flex justify-end">
          {loading ? (
            <div className="text-white text-xl animate-pulse">Loading...</div>
          ) : (
            <motion.img
              src={Agent}
              alt="Delivery Agent"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
              className="w-72 md:w-[22rem] drop-shadow-[0_8px_20px_rgba(255,102,0,0.3)]"
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default Hero;
