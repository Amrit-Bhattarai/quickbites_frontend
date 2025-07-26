import React, { useEffect, useState } from "react";
import { axiosWithRefresh } from "../../axiosWithRefresh";

const BASE_IMAGE_URL =
  "http://localhost:8080/uploads/images/deliveryAgentImages/";

const ApprovedDeliveryAgents = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState(null);

  useEffect(() => {
    fetchApprovedAgents();
  }, []);

  const fetchApprovedAgents = async () => {
    try {
      const res = await axiosWithRefresh({
        method: "get",
        url: "/api/v1/admin/agents",
      });
      setAgents(res.data || []);
    } catch (err) {
      console.error("Error fetching agents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => setSelectedAgent(null);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Approved Delivery Agents
      </h2>

      {loading ? (
        <p>Loading approved agents...</p>
      ) : agents.length === 0 ? (
        <p className="text-gray-500">No approved agents found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white shadow-md rounded-lg p-4 border border-gray-200"
            >
              <p className="font-semibold text-gray-700">
                Username:{" "}
                <span className="text-gray-900">{agent.userName}</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">Email: {agent.email}</p>
              <button
                onClick={() => setSelectedAgent(agent)}
                className="text-indigo-600 hover:underline font-medium text-sm"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-2 right-2 text-gray-500 text-xl"
              onClick={handleCloseModal}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">
              Agent Details
            </h3>

            <p className="mb-2">
              <b>Name:</b> {selectedAgent.firstName} {selectedAgent.lastName}
            </p>
            <p className="mb-2">
              <b>Username:</b> {selectedAgent.userName}
            </p>
            <p className="mb-2">
              <b>Email:</b> {selectedAgent.email}
            </p>
            <p className="mb-4">
              <b>Earning:</b> Rs. {selectedAgent.earning}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {selectedAgent.citizenshipPhotoFront && (
                <div>
                  <p className="font-medium mb-1">Citizenship Front</p>
                  <img
                    src={`${BASE_IMAGE_URL}${selectedAgent.citizenshipPhotoFront}`}
                    alt="Citizenship Front"
                    className="rounded border shadow w-full"
                  />
                </div>
              )}
              {selectedAgent.citizenshipPhotoBack && (
                <div>
                  <p className="font-medium mb-1">Citizenship Back</p>
                  <img
                    src={`${BASE_IMAGE_URL}${selectedAgent.citizenshipPhotoBack}`}
                    alt="Citizenship Back"
                    className="rounded border shadow w-full"
                  />
                </div>
              )}
              {selectedAgent.drivingLicense && (
                <div>
                  <p className="font-medium mb-1">Driving License</p>
                  <img
                    src={`${BASE_IMAGE_URL}${selectedAgent.drivingLicense}`}
                    alt="Driving License"
                    className="rounded border shadow w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovedDeliveryAgents;
