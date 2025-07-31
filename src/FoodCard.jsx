import { useState, useEffect } from "react";
import { useCartStore } from "./cartStore";
import { toast } from "react-toastify";

const BASE_URL = "http://localhost:8080";

const FoodCard = ({ food, onAddToCart }) => {
  const [selectedVariantId, setSelectedVariantId] = useState(
    food.foodVariants?.[0]?.id || null
  );
  const { cart } = useCartStore();

  useEffect(() => {
    setSelectedVariantId(food.foodVariants?.[0]?.id || null);
  }, [food]);

  const alreadyInCart = cart.some(
    (item) =>
      (item.foodItemId === food.id || item.id === food.id) &&
      (item.foodVariantId === selectedVariantId ||
        item.variantId === selectedVariantId)
  );

  const handleClick = () => {
    if (alreadyInCart) {
      toast.warn("Item already in cart");
      return;
    }
    onAddToCart({ ...food, selectedVariantId, name: food.name });
  };

  const selectedVariant = food.foodVariants?.find(
    (v) => v.id === selectedVariantId
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full border border-orange-100 group">
      {/* Image Container with proper aspect ratio */}
      <div className="relative overflow-hidden bg-orange-50">
        <img
          src={`${food.imageUrl}`}
          alt={food.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/400x300?text=No+Image";
          }}
          className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Optional: Add a subtle overlay on hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 line-clamp-1">
            {food.name}
          </h3>
          <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
            {food.description}
          </p>

          {food.foodVariants?.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Variant:
              </label>
              <select
                value={selectedVariantId}
                onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                className="w-full p-3 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm"
              >
                {food.foodVariants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} – Rs. {variant.price}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-4 border-t border-orange-100">
          <div>
            <span className="text-orange-600 font-bold text-lg sm:text-xl">
              Rs.{" "}
              {selectedVariant?.price ?? food.foodVariants?.[0]?.price ?? "N/A"}
            </span>
            {food.foodVariants?.length > 1 && (
              <p className="text-xs text-gray-500 mt-1">
                {selectedVariant?.name}
              </p>
            )}
          </div>
          <button
            onClick={handleClick}
            disabled={alreadyInCart}
            className={`${
              alreadyInCart
                ? "bg-green-500 hover:bg-green-600"
                : "bg-orange-500 hover:bg-orange-600"
            } text-white text-sm font-semibold px-6 py-3 rounded-full transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
              alreadyInCart ? "opacity-90 cursor-not-allowed" : ""
            }`}
          >
            {alreadyInCart ? (
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Added
              </span>
            ) : (
              "Add to Cart"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;