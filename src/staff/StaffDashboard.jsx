import React, { useEffect, useState } from "react";
import { getOrders, updateKitchenStatus, getKitchenStatuses } from "./staffAPI";
import {
  connectToKitchenSocket,
  disconnectKitchenSocket,
} from "./kitchenSocket";
import OrderCard from "./OrderCard";

const StaffDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);

  const fetchOrders = async () => {
    try {
      const data = await getOrders();
      if (Array.isArray(data)) {
        setOrders(data);
      } else {
        console.error("Orders response is not an array:", data);
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    fetchOrders();
    getKitchenStatuses()
      .then(setStatuses)
      .catch((err) => {
        console.error("Failed to fetch kitchen statuses:", err);
        setStatuses([]);
      });

    connectToKitchenSocket((event) => {
      console.log("Received Kitchen Event:", event);

      if (event.type === "ORDER_CANCELLED") {
        alert(`\u274c Order ${event.orderId} has been cancelled by the user.`);
        setOrders((prev) =>
          prev.filter((order) => order.orderId !== event.orderId)
        );
      }
    });

    // POLLING: fetch orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);

    return () => {
      disconnectKitchenSocket();
      clearInterval(interval);
    };
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await updateKitchenStatus(orderId, newStatus);
      fetchOrders();
      // If status is READY and backend returns agent info, show notification
      if (newStatus === "READY" && res && res.assignedAgent) {
        alert(`Order assigned to agent: ${res.assignedAgent.name || res.assignedAgent.id}`);
      }
    } catch (err) {
      alert("❌ Failed to update status.");
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>
      {Array.isArray(orders) && orders.length > 0 ? (
        orders.map((order) => (
          <OrderCard
            key={order.orderId}
            order={order}
            kitchenStatuses={statuses}
            onStatusChange={handleStatusChange}
          />
        ))
      ) : (
        <p>No active orders.</p>
      )}
    </div>
  );
};

export default StaffDashboard;
