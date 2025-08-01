
import React, { useState, useEffect } from "react";
import webSocketService from "./websocketService";
import RouteMap from "./RouteMap";

const AssignedOrders = () => {
  const [orders, setOrders] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [routeStart, setRouteStart] = useState(null);
  const [routeEnd, setRouteEnd] = useState(null);
  const [agentLocation, setAgentLocation] = useState(null);

  // Fetch assigned orders on mount
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

  // WebSocket subscription for live order assignment
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) return;
    const agentTopic = `/topic/agent-${user.id}`;
    const handleNewOrder = (message) => {
      const notification = JSON.parse(message.body);
      setOrders((prev) => [notification, ...prev]);
      window.alert('New delivery assigned: Order #' + notification.orderId);
    };
    webSocketService.subscribe(agentTopic, handleNewOrder);
    return () => {
      webSocketService.unsubscribe(agentTopic);
    };
  }, []);


  // Get agent's current location (for map), returns a Promise
  const fetchAgentLocation = () => {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setAgentLocation(loc);
            resolve(loc);
          },
          (err) => {
            console.error("Could not get agent location", err);
            reject(err);
          }
        );
      } else {
        reject(new Error("Geolocation not supported"));
      }
    });
  };

  // Accept order handler
  const handleAccept = async (order) => {
    try {
      const res = await fetch(`/agent/accept-order/${order.orderId}`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        // Get agent location, then show map
        const agentLoc = await fetchAgentLocation();
        setRouteStart(agentLoc);
        setRouteEnd({ lat: order.customerLat, lon: order.customerLon });
        setShowMap(true);
        setOrders((prev) => prev.map(o => o.orderId === order.orderId ? { ...o, status: "Accepted" } : o));
      } else {
        window.alert("Failed to accept order");
      }
    } catch (e) {
      window.alert("Failed to accept order");
    }
  };

  // Reject order handler
  const handleReject = (order) => {
    fetch(`/agent/reject-order/${order.orderId}`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "success") {
          setOrders((prev) => prev.filter(o => o.orderId !== order.orderId));
        } else {
          window.alert("Failed to reject order");
        }
      })
      .catch(() => window.alert("Failed to reject order"));
  };

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
              <div className="text-xs text-gray-500">Status: {order.status || "Assigned"}</div>
            </div>
            <div className="flex gap-2">
              <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => handleAccept(order)} disabled={order.status === "Accepted"}>Accept</button>
              <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => handleReject(order)} disabled={order.status === "Accepted"}>Reject</button>
            </div>
          </div>
        ))}
      </div>
      {showMap && routeStart && routeEnd && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Route to Customer</h3>
          <div className="h-96 w-full rounded overflow-hidden">
            <RouteMap start={routeStart} end={routeEnd} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignedOrders;
