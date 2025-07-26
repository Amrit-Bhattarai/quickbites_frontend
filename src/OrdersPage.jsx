import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaMoneyBillWave,
  FaUtensils,
  FaShippingFast,
  FaListUl,
} from "react-icons/fa";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 3;

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.accessToken;

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8080/api/v1/orders",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const formatStatus = (status) => {
    return status
      ?.toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusBadge = (status) => {
    const base =
      "inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold rounded-full";
    const lower = status?.toLowerCase();

    if (lower.includes("pending") || lower.includes("to_be")) {
      return (
        <span className={`${base} bg-yellow-100 text-yellow-700`}>
          <FaClock className="text-xs" /> {formatStatus(status)}
        </span>
      );
    } else if (
      lower.includes("completed") ||
      lower.includes("delivered") ||
      lower.includes("prepared")
    ) {
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          <FaCheckCircle className="text-xs" /> {formatStatus(status)}
        </span>
      );
    } else if (lower.includes("cancelled") || lower.includes("failed")) {
      return (
        <span className={`${base} bg-red-100 text-red-700`}>
          <FaTimesCircle className="text-xs" /> {formatStatus(status)}
        </span>
      );
    } else {
      return (
        <span className={`${base} bg-gray-200 text-gray-700`}>
          {formatStatus(status)}
        </span>
      );
    }
  };
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl font-medium text-gray-600">
        Loading your orders...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-10 text-orange-600 tracking-tight">
        Your Orders
      </h1>

      {orders.length === 0 ? (
        <p className="text-center text-lg text-gray-500">
          You haven’t placed any orders yet.
        </p>
      ) : (
        <>
          {currentOrders.map((order, idx) => (
            <div
              key={idx}
              className="bg-white/90 backdrop-blur rounded-2xl p-6 mb-8 shadow-md hover:shadow-xl transition-all border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Order #{order.orderId}
                </h2>
                {getStatusBadge(order.orderStatus)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 text-sm text-gray-700 mb-5">
                <p>
                  <FaMoneyBillWave className="inline mr-2 text-gray-500" />
                  <strong>Total:</strong> Rs. {order.totalAmount.toFixed(2)}
                </p>
                <p>
                  <FaClock className="inline mr-2 text-gray-500" />
                  <strong>Placed:</strong>{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p>
                  <strong>Payment:</strong> {formatStatus(order.paymentMethod)}
                </p>
                <p>
                  <FaUtensils className="inline mr-2 text-gray-500" />
                  <strong>Kitchen:</strong>{" "}
                  {getStatusBadge(order.kitchenStatus)}
                </p>
                <p>
                  <FaShippingFast className="inline mr-2 text-gray-500" />
                  <strong>Delivery:</strong>{" "}
                  {getStatusBadge(order.deliveryStatus)}
                </p>

                {typeof order.deliveryTime === "number" &&
                  order.deliveryTime > 0 && (
                    <p>
                      <strong>Delivery Time:</strong> {order.deliveryTime} min
                    </p>
                  )}
                {order.verificationOtp && (
                  <p>
                    <strong>OTP:</strong> {order.verificationOtp}
                  </p>
                )}
              </div>

              <div>
                <p className="text-md font-semibold text-gray-800 mb-2">
                  <FaListUl className="inline mr-2 text-gray-600" />
                  Ordered Items:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                  {Array.isArray(order.items) && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <li key={i}>
                        <strong>
                          {item.quantity} × {item.foodName}
                        </strong>
                        {item.variantName ? ` (${item.variantName})` : ""} — Rs.
                        {item.priceAtPurchase.toFixed(2)} each =
                        <span className="text-green-700 font-semibold ml-1">
                          Rs.
                          {(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li>No items found.</li>
                  )}
                </ul>
              </div>
            </div>
          ))}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-full text-sm font-medium border ${
                  currentPage === i + 1
                    ? "bg-orange-500 text-white border-orange-500"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default OrdersPage;
