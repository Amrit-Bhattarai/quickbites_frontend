import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { axiosWithRefresh } from "../axiosWithRefresh";
=======
import { axiosDelivery } from "../api/axiosDelivery";
>>>>>>> feat/delivery-api-helper

const OrderHistory = () => {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    const fetchHistory = async () => {
      try {
<<<<<<< HEAD
        const res = await axiosWithRefresh({ method: "get", url: "/agent/history" });
        if (res.data.status === "success" && res.data.data) {
=======
        const res = await axiosDelivery({ method: "get", url: "/agent/history" });
        if (res.data && res.data.status === "success" && res.data.data) {
>>>>>>> feat/delivery-api-helper
          setHistory(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching delivery history:", error);
      }
    };
<<<<<<< HEAD

=======
>>>>>>> feat/delivery-api-helper
    fetchHistory();
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Delivery Order History</h2>
      <div className="bg-white rounded shadow p-4">
        {history.length === 0 && <div>No delivery history available.</div>}
        {history.map((order) => (
          <div key={order.orderId} className="mb-4 border-b pb-2">
            <div className="font-semibold">Order #{order.orderId}</div>
            <div className="text-gray-600 text-sm">
              {order.customerName} - {order.deliveryAddress}
            </div>
            <div className="text-gray-500 text-xs">
              Delivered: {new Date(order.deliveryDateTime).toLocaleString()}
            </div>
            <div className="text-green-600 text-xs">Status: {order.finalDeliveryStatus}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
