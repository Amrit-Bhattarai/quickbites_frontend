import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useCartStore } from "./cartStore";
import { useMenuStore } from "./menuStore";
import { toast } from "react-toastify";
import SearchBar from "./SearchBar";
import CategorySection from "./CategorySection";

const BASE_URL = "http://localhost:8080";
const MAX_VISIBLE_CATEGORIES = 8;

const Menu = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [moreOpen, setMoreOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const { setCartFromBackend } = useCartStore();
  const { cachedCategories, cachedFoods, setCachedData } = useMenuStore();

  const [categories, setCategories] = useState(cachedCategories || []);
  const [foods, setFoods] = useState(cachedFoods || []);

  // ✅ This checks if user is not logged in
  useEffect(() => {
    let toastShown = false;

    const hasShownToast = sessionStorage.getItem("hasShownMenuToast");
    if (!localStorage.getItem("user") && !hasShownToast && !toastShown) {
      toast.info("Note: You can only view menu, you can't order");
      sessionStorage.setItem("hasShownMenuToast", "true");
      toastShown = true;
    }
  }, []);

  // ✅ This fetches the food data
  useEffect(() => {
    const fetchData = async () => {
      if (cachedCategories.length > 0 && cachedFoods.length > 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setIsError(false);

      try {
        const [categoryRes, foodRes] = await Promise.all([
          axios.get(`${BASE_URL}/public/foodCategories`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }),
          axios.get(`${BASE_URL}/public/foodItems`, {
            headers: { "ngrok-skip-browser-warning": "true" },
          }),
        ]);

        const categoriesData = Array.isArray(categoryRes.data)
          ? categoryRes.data
          : [];
        const foodsData = Array.isArray(foodRes.data) ? foodRes.data : [];

        setCategories(categoriesData);
        setFoods(foodsData);
        setCachedData(categoriesData, foodsData);
      } catch (error) {
        console.error("Fetch error:", error.message);
        setIsError(true);
        toast.error("Failed to fetch menu data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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
        toast.error("Please select a variant.");
        return;
      }

      // POST request to add item to backend cart
      const response = await axios.post(
        `${BASE_URL}/api/v1/cart/add`,
        {
          foodItemId: food.id,
          foodVariantId: food.selectedVariantId,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success(`${food.name} has been added to the cart.`);

        // Fetch updated cart from backend
        const cartRes = await axios.get(`${BASE_URL}/api/v1/cart`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        });

        if (Array.isArray(cartRes.data.items)) {
          setCartFromBackend(cartRes.data.items); // update Zustand store immediately
        }
      } else {
        toast.error("Failed to add item to cart");
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Error adding to cart");
    }
  };
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      
      const foodCatId = food.category?.id?.toString?.();
      return (
        (activeCategoryId === "all" || foodCatId === activeCategoryId) &&
        food.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [foods, activeCategoryId, searchTerm]);

  const visibleCategories = categories.slice(0, MAX_VISIBLE_CATEGORIES);
  const moreCategories = categories.slice(MAX_VISIBLE_CATEGORIES);

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
       
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-800 mb-2">Our Menu</h1>
          <p className="text-orange-600 text-lg">
            Discover delicious dishes crafted with care
          </p>
        </div>

        {/* Categories */}
        {!isLoading && !isError && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pb-6 mb-8">
            {/* All button - bigger than others */}
            <button
              onClick={() => setActiveCategoryId("all")}
              className={`px-6 py-3 text-base sm:text-lg font-bold rounded-full transition-all duration-300 whitespace-nowrap shadow-lg ${
                activeCategoryId === "all"
                  ? "bg-orange-500 text-white shadow-xl transform scale-105"
                  : "bg-white text-orange-600 hover:bg-orange-100 hover:shadow-md"
              }`}
            >
              All
            </button>

            {/* Category buttons */}
            {visibleCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryId(cat.id.toString())}
                className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-full transition-all duration-300 whitespace-nowrap shadow-md ${
                  activeCategoryId === cat.id.toString()
                    ? "bg-orange-500 text-white shadow-xl"
                    : "bg-white text-orange-600 hover:bg-orange-100 hover:shadow-lg"
                }`}
              >
                {cat.name}
              </button>
            ))}

            {/* More dropdown */}
            {moreCategories.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="px-4 py-2 text-sm sm:text-base font-semibold rounded-full bg-white text-orange-600 hover:bg-orange-100 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  More...
                </button>
                {moreOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-2xl z-50 border border-orange-200 overflow-hidden">
                    {moreCategories.map((cat, index) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategoryId(cat.id.toString());
                          setMoreOpen(false);
                        }}
                        className={`block w-full text-left px-6 py-4 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors duration-200 ${
                          index !== moreCategories.length - 1
                            ? "border-b border-orange-100"
                            : ""
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Search bar */}
        {!isLoading && !isError && (
          <div className="mb-8">
            <SearchBar
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="animate-pulse rounded-2xl border border-orange-200 p-6 bg-white shadow-lg"
              >
                <div className="h-48 bg-orange-100 rounded-xl mb-4" />
                <div className="h-5 bg-orange-100 rounded w-3/4 mb-3" />
                <div className="h-4 bg-orange-100 rounded w-1/2 mb-4" />
                <div className="h-8 bg-orange-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center text-red-600 mt-20 text-xl font-semibold bg-white rounded-2xl p-8 shadow-lg">
            ⚠️ No preview available.
            <br />
            Please try again later.
          </div>
        ) : filteredFoods.length === 0 && searchTerm !== "" ? (
          <div className="flex flex-col items-center mt-20 text-orange-700 font-semibold text-lg bg-white rounded-2xl p-8 shadow-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mb-4 text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.75 17.25l-4.5-4.5m0 0l4.5-4.5m-4.5 4.5h13.5"
              />
            </svg>
            <p>
              No items found matching "<strong>{searchTerm}</strong>".
            </p>
            <p>Try different keywords or clear your search.</p>
            <button
              className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors duration-200"
              onClick={() => setSearchTerm("")}
            >
              Clear Search
            </button>
          </div>
        ) : (
          <CategorySection
            category={
              activeCategoryId === "all"
                ? { name: "All Categories", id: "all", imageUrl: "" }
                : categories.find(
                    (cat) => cat.id.toString() === activeCategoryId
                  )
            }
            items={filteredFoods}
            onAddToCart={handleAddToCart}
          />
        )}
      </div>
    </div>
  );
};

export default Menu;
