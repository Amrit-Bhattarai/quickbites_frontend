import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useCartStore } from "./cartStore";
import { useMenuStore } from "./menuStore";
import {
  FiPlus,
  FiMinus,
  FiTrash2,
  FiMapPin,
  FiCheckCircle,
  FiArrowRight,
  FiNavigation,
  FiMessageSquare,
  FiLoader,
  FiCreditCard,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const BASE_URL = "http://localhost:8080";
const DELIVERY_FEE = 100;

const RESTAURANT_COORDS = { lat: 27.6857, lng: 83.46525 };
const DELIVERY_RADIUS_METERS = 10000; // 18km

function haversineDistance(lat1, lon1, lat2, lon2) {
  // Returns distance in meters
  function toRad(x) {
    return (x * Math.PI) / 180;
  }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const MapSelectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [position, setPosition] = useState(null);
  const [distance, setDistance] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Update distance when position changes
  useEffect(() => {
    if (position) {
      const d = haversineDistance(
        RESTAURANT_COORDS.lat,
        RESTAURANT_COORDS.lng,
        position.lat,
        position.lng
      );
      setDistance(d);
    } else {
      setDistance(null);
    }
  }, [position]);

  const LocationMarker = () => {
    useMapEvents({
      click: (e) => {
        setPosition(e.latlng);
        setShowTooltip(false);
      },
    });
    return position ? <Marker position={position}></Marker> : null;
  };

  if (!isOpen) return null;
  const insideRadius = distance !== null && distance <= DELIVERY_RADIUS_METERS;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <h3 className="mb-4 text-xl font-semibold">Select Location on Map</h3>
        <div className="h-96 overflow-hidden rounded-md">
          <MapContainer
            center={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]}
            zoom={12}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]} />
            <Circle
              center={[RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng]}
              radius={DELIVERY_RADIUS_METERS}
              pathOptions={{
                color: "green",
                fillColor: "#414341ff",
                fillOpacity: 0.15,
              }}
            />
            <LocationMarker />
          </MapContainer>
        </div>
        <div className="mt-4 flex flex-col items-end gap-2">
          {distance !== null && (
            <span
              className={`text-sm ${
                insideRadius ? "text-green-600" : "text-red-600"
              }`}
            >
              Distance from restaurant: {(distance / 1000).toFixed(2)} km
            </span>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-200 px-4 py-2"
            >
              Cancel
            </button>
            <div className="relative">
              <button
                onClick={() => onConfirm(position)}
                disabled={!position || !insideRadius}
                onMouseEnter={() => {
                  if (!insideRadius && position) setShowTooltip(true);
                }}
                onMouseLeave={() => setShowTooltip(false)}
                className="rounded-md bg-orange-500 px-4 py-2 text-white disabled:bg-orange-300"
              >
                Confirm Location
              </button>
              {showTooltip && !insideRadius && position && (
                <div className="absolute right-0 top-[-40px] z-10 w-56 rounded bg-red-500 px-3 py-2 text-xs text-white shadow-lg">
                  Sorry, we only deliver within 18km of the restaurant.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AddAddressModal = ({ isOpen, onClose, onAddressSaved }) => {
  const [title, setTitle] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [latLng, setLatLng] = useState(null);
  const [isMapOpen, setMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setFullAddress("");
      setLatLng(null);
      setErrors({});
      setIsSaving(false);
    }
  }, [isOpen]);

  const validateField = (name, value) => {
    let error = null;
    switch (name) {
      case "title":
        if (!value.trim()) error = "Title is required.";
        break;
      case "address":
        if (!value.trim()) error = "Address cannot be empty.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "title") setTitle(value);
    if (name === "address") setFullAddress(value);
    validateField(name, value);
  };

  const fetchAddressFromLatLng = async ({ lat, lng }) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await res.json();
      const fetchedAddress = data.display_name || "Address not found";
      setFullAddress(fetchedAddress);
      validateField("address", fetchedAddress);
    } catch (error) {
      toast.error("Failed to get address from location.");
    }
  };

  const handleUseCurrentLocation = () =>
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setLatLng(newLatLng);
        fetchAddressFromLatLng(newLatLng);
      },
      () => {
        toast.error("Could not get your location. Please choose on map.");
      }
    );

  const handleMapConfirm = (position) => {
    if (position) {
      setLatLng(position);
      fetchAddressFromLatLng(position);
    }
    setMapOpen(false);
  };

  const handleSave = async () => {
    const isTitleValid = validateField("title", title);
    const isAddressValid = validateField("address", fullAddress);

    if (!latLng) {
      setErrors((prev) => ({ ...prev, location: "Please select a location." }));
      toast.error("Please select a location on the map.");
      return;
    } else {
      setErrors((prev) => ({ ...prev, location: null }));
    }

    if (!isTitleValid || !isAddressValid) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.accessToken) {
        toast.error("You must be logged in to save an address.");
        setIsSaving(false);
        return;
      }

      const res = await fetch(`${BASE_URL}/api/v1/user/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          title,
          latitude: latLng.lat,
          longitude: latLng.lng,
          fullAddress: fullAddress,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save address.");
      }

      const savedAddress = await res.json();
      onAddressSaved(savedAddress);
      toast.success("Address saved successfully!");
      onClose();
    } catch (error) {
      console.error("Error saving address:", error);
      toast.error(error.message || "Could not save address.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
        <div
          className="w-full max-w-lg rounded-lg bg-white p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="mb-4 text-2xl font-bold">Add New Address</h2>
          <div className="mb-6 grid grid-cols-2 gap-4">
            <button
              onClick={handleUseCurrentLocation}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-500 p-3 text-white hover:bg-blue-600"
            >
              <FiNavigation /> Use My Location
            </button>
            <button
              onClick={() => setMapOpen(true)}
              className="flex items-center justify-center gap-2 rounded-md bg-green-500 p-3 text-white hover:bg-green-600"
            >
              <FiMapPin /> Choose on Map
            </button>
          </div>
          {errors.location && (
            <small className="mb-4 block text-center text-red-500">
              {errors.location}
            </small>
          )}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Latitude
              </label>
              <input
                type="text"
                readOnly
                value={latLng?.lat.toFixed(5) || ""}
                placeholder="Set via map"
                className="mt-1 w-full rounded-md border bg-gray-100 p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Longitude
              </label>
              <input
                type="text"
                readOnly
                value={latLng?.lng.toFixed(5) || ""}
                placeholder="Set via map"
                className="mt-1 w-full rounded-md border bg-gray-100 p-2"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                name="title"
                value={title}
                onChange={handleInputChange}
                placeholder="e.g., Home, Work"
                className={`mt-1 w-full rounded-md border p-2 ${
                  errors.title ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.title && (
                <small className="text-red-500">{errors.title}</small>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">
                Full Address / Details
              </label>
              <textarea
                name="address"
                value={fullAddress}
                onChange={handleInputChange}
                rows="3"
                placeholder="e.g., Street Name, House No."
                className={`mt-1 w-full rounded-md border p-2 ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <small className="text-red-500">{errors.address}</small>
              )}
            </div>
          </div>
          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-md bg-gray-200 px-6 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center justify-center rounded-md bg-orange-500 px-6 py-2 text-white disabled:bg-orange-300"
            >
              {isSaving ? (
                <>
                  <FiLoader className="mr-2 animate-spin" /> Saving...
                </>
              ) : (
                "Save Address"
              )}
            </button>
          </div>
        </div>
      </div>
      <MapSelectionModal
        isOpen={isMapOpen}
        onClose={() => setMapOpen(false)}
        onConfirm={handleMapConfirm}
      />
    </>
  );
};

const CartSkeleton = () => (
  <div className="flex animate-pulse items-center justify-between rounded-xl bg-white p-5 shadow-md">
    <div className="flex items-center gap-5">
      <div className="h-20 w-20 rounded-md bg-gray-200" />
      <div className="space-y-2">
        <div className="h-4 w-36 rounded-md bg-gray-300" />
        <div className="h-3 w-28 rounded-md bg-gray-300" />
        <div className="h-3 w-20 rounded-md bg-gray-300" />
      </div>
    </div>
    <div className="flex items-center gap-4">
      <div className="h-9 w-9 rounded-full bg-gray-200" />
      <div className="h-4 w-6 rounded-md bg-gray-300" />
      <div className="h-9 w-9 rounded-full bg-gray-200" />
    </div>
  </div>
);

const mapCartItems = (backendItems, foods) =>
  backendItems.map((item) => {
    let matchedFoodItem = null,
      matchedVariant = null;
    for (const food of foods) {
      const variant = food.foodVariants.find(
        (v) => v.name === item.variantName
      );
      if (variant && food.name === item.foodName) {
        matchedFoodItem = food;
        matchedVariant = variant;
        break;
      }
    }
    return {
      ...item,
      foodVariantId: matchedVariant?.id || 0,
      imageUrl: matchedFoodItem?.imageUrl || "",
    };
  });

const Cart = () => {
  const { cart, setCartFromBackend, clearCart } = useCartStore();
  const { cachedFoods } = useMenuStore();
  const navigate = useNavigate();

  const [isCartLoading, setIsCartLoading] = useState(true);
  const [modifyingItemId, setModifyingItemId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [view, setView] = useState("cart");

  const [addresses, setAddresses] = useState([]);
  const [isFetchingAddresses, setIsFetchingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [isAddAddressModalOpen, setAddAddressModalOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState(null);
  const [suggestions, setSuggestions] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [deliveryChargeLoading, setDeliveryChargeLoading] = useState(false);
  const [deliveryChargeError, setDeliveryChargeError] = useState(null);

  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutPhoneError, setCheckoutPhoneError] = useState("");

  useEffect(() => {
    const fetchCart = async () => {
      setIsCartLoading(true);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.accessToken) return;

        const res = await fetch(`${BASE_URL}/api/v1/cart`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!res.ok) throw new Error("Failed to fetch cart");
        const data = await res.json();
        if (data?.items && cachedFoods.length > 0) {
          const mappedItems = mapCartItems(data.items, cachedFoods);
          setCartFromBackend(mappedItems);
        } else {
          setCartFromBackend([]);
        }
      } catch (err) {
        console.error("Error fetching cart:", err);
      } finally {
        setIsCartLoading(false);
      }
    };
    fetchCart();
  }, [cachedFoods, setCartFromBackend]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (view === "checkout") {
        setIsFetchingAddresses(true);
        try {
          const user = JSON.parse(localStorage.getItem("user"));
          if (!user?.accessToken) {
            toast.error("Please login to see addresses.");
            return;
          }
          const res = await fetch(`${BASE_URL}/api/v1/user/addresses`, {
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          });
          if (!res.ok) throw new Error("Could not fetch addresses.");
          const data = await res.json();
          setAddresses(data || []);
          if (data.length > 0) {
            setSelectedAddressId(data[0].id);
          }
        } catch (error) {
          console.error("Error fetching addresses:", error);
          toast.error(error.message);
        } finally {
          setIsFetchingAddresses(false);
        }
      }
    };
    fetchAddresses();
  }, [view]);

  useEffect(() => {
    const fetchDeliveryCharge = async () => {
      if (!selectedAddressId) {
        setDeliveryCharge(null);
        return;
      }
      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        setDeliveryCharge(null);
        return;
      }
      if (
        typeof selectedAddress.latitude !== "number" ||
        typeof selectedAddress.longitude !== "number" ||
        isNaN(selectedAddress.latitude) ||
        isNaN(selectedAddress.longitude)
      ) {
        const errMsg = "Invalid latitude or longitude for selected address";
        setDeliveryChargeError(errMsg);
        toast.error(errMsg);
        setDeliveryCharge(DELIVERY_FEE);
        return;
      }
      setDeliveryChargeLoading(true);
      setDeliveryChargeError(null);
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const res = await fetch(BASE_URL + "/api/v1/orders/deliveryCharge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
            ...(user?.accessToken
              ? { Authorization: `Bearer ${user.accessToken}` }
              : {}),
          },
          body: JSON.stringify({
            lat: selectedAddress.latitude,
            lon: selectedAddress.longitude,
          }),
        });
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Delivery charge fetch failed:", {
            status: res.status,
            statusText: res.statusText,
            errorText,
          });
          throw new Error("Failed to fetch delivery charge: " + errorText);
        }
        const data = await res.json();
        console.log("Delivery charge response:", data);
        if (
          typeof data.deliveryCharge === "number" ||
          (typeof data.deliveryCharge === "string" &&
            !isNaN(Number(data.deliveryCharge)) &&
            data.deliveryCharge.trim() !== "")
        ) {
          setDeliveryCharge(Number(data.deliveryCharge));
        } else {
          console.warn("Invalid or empty delivery charge response:", data);
          const errMsg = "Unable to fetch delivery charge; using default fee";
          setDeliveryChargeError(errMsg);
          toast.error(
            `Using default delivery fee (Rs. ${DELIVERY_FEE}) due to server issue`
          );
          setDeliveryCharge(DELIVERY_FEE);
        }
      } catch (error) {
        console.error("Error fetching delivery charge:", error);
        const errorMessage = error.message || "Error fetching delivery charge";
        setDeliveryChargeError(errorMessage);
        toast.error(
          `Using default delivery fee (Rs. ${DELIVERY_FEE}) due to server issue`
        );
        setDeliveryCharge(DELIVERY_FEE);
      } finally {
        setDeliveryChargeLoading(false);
      }
    };
    fetchDeliveryCharge();
  }, [selectedAddressId, addresses]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );

  const modifyCartItem = async (
    item,
    increment = true,
    directRemove = false
  ) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.accessToken) {
        toast.error("Please login to modify cart");
        return;
      }
      setModifyingItemId(item.id);
      if (directRemove) {
        const res = await fetch(`${BASE_URL}/api/v1/cart/remove/${item.id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        });
        if (!res.ok) throw new Error("Failed to delete cart item");
      } else {
        if (increment && item.quantity >= 10) {
          toast.error("Cannot add more than 10 units.", { icon: null });
          return;
        }
        const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
        if (newQuantity < 1) return;
        const res = await fetch(`${BASE_URL}/api/v1/cart/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({
            cartItemId: item.id,
            quantity: newQuantity,
          }),
        });
        if (!res.ok) throw new Error("Failed to update cart item");
      }
      const cartRes = await fetch(`${BASE_URL}/api/v1/cart`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!cartRes.ok) throw new Error("Failed to refresh cart");
      const cartData = await cartRes.json();
      if (cartData?.items && cachedFoods.length > 0) {
        setCartFromBackend(mapCartItems(cartData.items, cachedFoods));
      } else {
        setCartFromBackend([]);
      }
    } catch (error) {
      console.error("Error modifying cart item:", error);
      toast.error("Failed to update cart");
    } finally {
      setModifyingItemId(null);
    }
  };

  const clearCartHandler = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.accessToken) {
        toast.error("Please login to clear cart");
        return;
      }
      setClearingCart(true);
      const res = await fetch(`${BASE_URL}/api/v1/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
      });
      if (!res.ok) throw new Error("Failed to clear cart from backend");
      setCartFromBackend([]);
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Error while clearing cart");
    } finally {
      setClearingCart(false);
    }
  };

  const handleAddressSaved = (newAddress) => {
    setAddresses((prev) => [...prev, newAddress]);
    setSelectedAddressId(newAddress.id);
    setAddAddressModalOpen(false);
  };

  const handleDeleteAddress = async (idToDelete) => {
    setDeletingAddressId(idToDelete);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.accessToken) {
        toast.error("Please login to delete addresses.");
        return;
      }
      const res = await fetch(
        `${BASE_URL}/api/v1/user/addresses/${idToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete address.");
      }

      setAddresses((prev) => prev.filter((addr) => addr.id !== idToDelete));
      if (selectedAddressId === idToDelete) {
        setSelectedAddressId(null);
      }
      toast.success("Address removed");
    } catch (error) {
      console.error("Error deleting address:", error);
      toast.error(error.message || "Could not remove address.");
    } finally {
      setDeletingAddressId(null);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }
    const suggestionsRegex = /^[a-zA-Z0-9\s.,-]*$/;
    if (suggestions.trim() && !suggestionsRegex.test(suggestions)) {
      toast.error("Instructions contain invalid characters.");
      return;
    }

    setPlacingOrder(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.accessToken) {
        toast.error("Please login to place an order.");
        setPlacingOrder(false);
        return;
      }

      const selectedAddress = addresses.find((a) => a.id === selectedAddressId);
      if (!selectedAddress) {
        toast.error("Selected address not found.");
        setPlacingOrder(false);
        return;
      }

      const payload = {
        items: cart.map((item) => ({ cartItemId: item.id })),
        specialInstructions: suggestions,
        phoneNumber: checkoutPhone,
        locationInfo: {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude,
          deliveryAddress: selectedAddress.address,
        },
        addressId: selectedAddressId,
        paymentMethod: paymentMethod === "cod" ? "COD" : "STRIPE",
      };

      const res = await fetch(`${BASE_URL}/api/v1/orders/place`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to place order.");
      }
      if (paymentMethod === "cod") {
        try {
          await fetch(`${BASE_URL}/api/v1/cart/clear`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          });
        } catch (clearError) {
          console.error("Failed to clear backend cart after COD:", clearError);
        }
      } else if (paymentMethod === "stripe" && data.clientSecret) {
        try {
          await fetch(`${BASE_URL}/api/v1/cart/clear`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${user.accessToken}`,
              "ngrok-skip-browser-warning": "true",
            },
          });
        } catch (clearError) {
          console.error(
            "Failed to clear backend cart after Stripe:",
            clearError
          );
        }

        clearCart();
        window.location.href = data.clientSecret;
      } else {
        throw new Error("Missing Stripe payment session URL.");
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error.message || "Could not place order.");
      navigate("/failure");
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isCartLoading) {
    return (
      <div className="mx-auto mt-10 max-w-4xl space-y-6 p-6">
        {[...Array(3)].map((_, i) => (
          <CartSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold text-orange-800">
          Your cart is empty!
        </h2>
        <Toaster />
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-center" />
      <AddAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setAddAddressModalOpen(false)}
        onAddressSaved={handleAddressSaved}
      />

      {view === "cart" && (
        <div className="mx-auto mt-10 max-w-4xl p-6">
          <h2 className="mb-6 text-3xl font-bold text-orange-600">Your Cart</h2>
          <div className="space-y-6">
            {cart.map((item) => (
              <div
                key={`${item.id}-${item.foodVariantId}`}
                className="flex items-center justify-between rounded-lg bg-white p-4 shadow-md"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={`${BASE_URL}/uploads/images/foodItemImages/${item.imageUrl}`}
                    alt={item.foodName}
                    className="h-20 w-20 rounded-md object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold">{item.foodName}</h3>
                    <p className="text-sm text-gray-500">
                      {item.variantName ? `Variant: ${item.variantName}` : ""}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      Rs. {item.unitPrice}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    disabled={modifyingItemId === item.id}
                    onClick={() => modifyCartItem(item, false)}
                    className="rounded-full bg-orange-100 p-2 text-orange-600 transition hover:bg-orange-200"
                  >
                    <FiMinus />
                  </button>
                  <span className="text-lg">{item.quantity}</span>
                  <button
                    disabled={modifyingItemId === item.id}
                    onClick={() => modifyCartItem(item, true)}
                    className="rounded-full bg-orange-100 p-2 text-orange-600 transition hover:bg-orange-200"
                  >
                    <FiPlus />
                  </button>
                  <button
                    disabled={modifyingItemId === item.id}
                    onClick={() => modifyCartItem(item, true, true)}
                    className="rounded-full p-2 text-red-500 transition hover:bg-red-100"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-between">
            <div className="text-xl font-semibold">Total: Rs. {total}</div>
            <div>
              <button
                onClick={() => setView("checkout")}
                className="rounded-md bg-orange-500 px-6 py-2 font-semibold text-white transition hover:bg-orange-600"
              >
                Proceed to Checkout
              </button>
              <button
                disabled={clearingCart}
                onClick={clearCartHandler}
                className="ml-4 rounded-md bg-red-500 px-4 py-2 font-semibold text-white transition hover:bg-red-600"
              >
                {clearingCart ? "Clearing..." : "Clear Cart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "checkout" && (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-sm lg:col-span-2">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  Choose a Delivery Address
                </h2>
                <p className="mb-6 text-gray-500">
                  Select an existing address or add a new one.
                </p>
                {isFetchingAddresses ? (
                  <div className="flex items-center justify-center p-8">
                    <FiLoader
                      className="animate-spin text-orange-500"
                      size={32}
                    />
                    <p className="ml-4 text-gray-600">Loading addresses...</p>
                  </div>
                ) : (
                  addresses.length === 0 && (
                    <div className="rounded-md border-l-4 border-yellow-400 bg-yellow-100 p-4 text-yellow-700">
                      <p>You have no saved addresses. Add one to proceed.</p>
                    </div>
                  )
                )}
                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                        selectedAddressId === addr.id
                          ? "border-orange-500 ring-2 ring-orange-200"
                          : "border-gray-200"
                      }`}
                    >
                      <h3 className="pr-16 text-lg font-bold">{addr.title}</h3>
                      <p className="mt-2 text-gray-600">{addr.address}</p>
                      <p className="mt-1 text-sm text-gray-500">{addr.phone}</p>
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {selectedAddressId === addr.id && (
                          <FiCheckCircle
                            className="text-orange-500"
                            size={20}
                          />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(addr.id);
                          }}
                          disabled={deletingAddressId === addr.id}
                          className="p-1 text-gray-400 hover:text-red-600 disabled:cursor-wait disabled:text-gray-300"
                        >
                          {deletingAddressId === addr.id ? (
                            <FiLoader className="animate-spin" />
                          ) : (
                            <FiTrash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                  {addresses.length < 2 && (
                    <div
                      onClick={() => setAddAddressModalOpen(true)}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-all hover:border-orange-400 hover:bg-orange-50"
                    >
                      <div className="mb-3 rounded-full bg-orange-100 p-3">
                        <FiPlus className="text-orange-500" size={24} />
                      </div>
                      <h3 className="text-lg font-semibold text-orange-600">
                        Add New Address
                      </h3>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-10">
                <h2 className="mb-2 text-2xl font-bold text-gray-800">
                  Choose Payment Method
                </h2>
                <p className="mb-6 text-gray-500">
                  Select how you'd like to pay for your order.
                </p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all ${
                      paymentMethod === "cod"
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-gray-200"
                    }`}
                  >
                    <span className="h-6 w-6 flex items-center justify-center text-green-500 font-bold text-lg">
                      Rs.
                    </span>
                    <div>
                      <h3 className="font-bold">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">
                        Pay directly upon arrival.
                      </p>
                    </div>
                    {paymentMethod === "cod" && (
                      <FiCheckCircle
                        className="absolute top-3 right-3 text-orange-500"
                        size={20}
                      />
                    )}
                  </div>
                  <div
                    onClick={() => setPaymentMethod("stripe")}
                    className={`relative flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-all ${
                      paymentMethod === "stripe"
                        ? "border-orange-500 ring-2 ring-orange-200"
                        : "border-gray-200"
                    }`}
                  >
                    <FiCreditCard className="h-6 w-6 text-indigo-500" />
                    <div>
                      <h3 className="font-bold">Pay with Stripe</h3>
                      <p className="text-sm text-gray-600">
                        Securely pay with your card.
                      </p>
                    </div>
                    {paymentMethod === "stripe" && (
                      <FiCheckCircle
                        className="absolute top-3 right-3 text-orange-500"
                        size={20}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                    <span className="text-xl font-bold text-gray-600">QB</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">QuickBites</h3>
                    <p className="text-sm text-gray-500">MilankChowk, Butwal</p>
                  </div>
                </div>
                {cart.map((item) => (
                  <div
                    key={`${item.id}-${item.foodVariantId}`}
                    className="flex items-center justify-between border-b py-3"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={`${BASE_URL}/uploads/images/foodItemImages/${item.imageUrl}`}
                        alt={item.foodName}
                        className="h-8 w-8 rounded object-cover"
                      />
                      <div>
                        <p className="text-sm font-semibold">{item.foodName}</p>
                        <p className="text-xs text-gray-500">
                          x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">
                      Rs. {item.unitPrice * item.quantity}
                    </p>
                  </div>
                ))}
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-gray-600">
                    <p>Gross Amount</p>
                    <p>Rs. {total}</p>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <p>Delivery Fee</p>
                    <p>
                      Rs.{" "}
                      {deliveryChargeLoading ? (
                        "Loading..."
                      ) : deliveryChargeError ? (
                        <span className="text-yellow-600">
                          {DELIVERY_FEE} <small>(Default)</small>
                        </span>
                      ) : deliveryCharge !== null ? (
                        deliveryCharge
                      ) : (
                        DELIVERY_FEE
                      )}
                    </p>
                  </div>
                  <hr />
                  <div className="flex justify-between text-lg font-bold">
                    <p>To Pay</p>
                    <p>
                      Rs.{" "}
                      {deliveryChargeLoading
                        ? "Loading..."
                        : deliveryChargeError
                        ? total + DELIVERY_FEE
                        : deliveryCharge !== null
                        ? total + deliveryCharge
                        : total + DELIVERY_FEE}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={checkoutPhone}
                      onChange={(e) => {
                        setCheckoutPhone(e.target.value);
                        const v = e.target.value;
                        if (!/^(98|97)\d{8}$/.test(v))
                          setCheckoutPhoneError(
                            "Must be 10 digits starting with 98/97."
                          );
                        else setCheckoutPhoneError("");
                      }}
                      placeholder="e.g., 98XXXXXXXX"
                      className={`w-full rounded-lg border p-3 focus:ring-2 focus:ring-orange-300 transition ${
                        checkoutPhoneError
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    <small className="text-red-500">{checkoutPhoneError}</small>
                  </div>
                  <div className="relative flex items-center">
                    <FiMessageSquare
                      className="absolute left-3 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      value={suggestions}
                      onChange={(e) => setSuggestions(e.target.value)}
                      placeholder="Special Instructions?..."
                      className="w-full rounded-lg border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    !selectedAddressId ||
                    placingOrder ||
                    !checkoutPhone ||
                    !!checkoutPhoneError
                  }
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-500 py-3 font-bold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
                >
                  {placingOrder ? (
                    <>
                      <FiLoader className="animate-spin" /> Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order <FiArrowRight />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
