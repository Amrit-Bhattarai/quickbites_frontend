import React, { useState, useEffect } from "react";

const AssignedOrders = () => {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    fetch("/agent/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success" && data.data) {
          setOrders(data.data);
        }
      })
      .catch((error) => {
        console.error("Error fetching assigned orders:", error);
      });
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Assigned Orders</h2>
      <div className="bg-white rounded shadow p-4">
        {orders.length === 0 && <div>No assigned orders available.</div>}
        {orders.map((order) => (
          <div key={order.orderId} className="flex justify-between items-center border-b py-2">
            <div>
              <div className="font-semibold">Order #{order.orderId}</div>
              <div className="text-gray-600 text-sm">
                {order.customerName} - {order.deliveryAddress}
              </div>
              <div className="text-gray-600 text-sm">Total: Rs.{order.totalAmount}</div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-1 rounded">Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssignedOrders;
