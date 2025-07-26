import React, { useState, useEffect } from "react";
import { axiosDelivery } from "../api/axiosDelivery";

const Dashboard = () => {
  const [summary, setSummary] = useState({
    activeDeliveriesCount: 0,
    totalEarningsToday: 0,
    completedDeliveriesToday: 0,
    assignedDeliveriesToday: 0,
  });
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosDelivery({ method: "get", url: "/agent/summary" });
        if (res.data && res.data.status === "success" && res.data.data) {
          setSummary(res.data.data);
        }
      } catch (error) {
        console.error("Error fetching dashboard summary:", error);
      }
    };
    fetchSummary();
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Active Deliveries</h3>
        <ul className="bg-white rounded shadow p-4">
          <li className="py-2 border-b">
            Active Deliveries Count: {summary.activeDeliveriesCount}
          </li>
        </ul>
      </div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Today's Summary</h3>
        <div className="bg-white rounded shadow p-4 flex gap-8">
          <div>
            <div className="text-2xl font-bold">{summary.totalEarningsToday}</div>
            <div className="text-gray-600">Total Cash Collected</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{summary.completedDeliveriesToday}</div>
            <div className="text-gray-600">Completed Deliveries</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{summary.assignedDeliveriesToday}</div>
            <div className="text-gray-600">Assigned Deliveries</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
