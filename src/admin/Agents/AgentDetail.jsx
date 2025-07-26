import React, { useState } from "react";
import { axiosWithRefresh } from "../../axiosWithRefresh";

const BASE_IMAGE_URL =
  "http://localhost:8080/uploads/images/deliveryAgentRequestImages/";

const AgentDetail = ({ agent, onClose, onStatusChange }) => {
  const [rejectionReason, setRejectionReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reapplicationEnabled, setReapplicationEnabled] = useState(true);

  if (!agent) return null;

  const handleApprove = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axiosWithRefresh({
        method: "post",
        url: `/api/v1/admin/approve-agent/${agent.id}`,
      });
      setSuccess("Agent approved successfully.");
      onStatusChange && onStatusChange();
    } catch (err) {
      setError("Failed to approve agent.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Rejection reason is required.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await axiosWithRefresh({
        method: "post",
        url: `/api/v1/admin/reject-agent/${agent.id}`,
        data: {
          reason: rejectionReason,
          allowReapplication: reapplicationEnabled,
        },
      });
      setSuccess("Agent rejected.");
      onStatusChange && onStatusChange();
    } catch (err) {
      setError("Failed to reject agent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full relative overflow-y-auto max-h-[90vh]">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800">Agent Details</h2>

        <div className="mb-4">
          <p>
            <strong>Name:</strong> {agent.userName}
          </p>
          <p>
            <strong>Email:</strong> {agent.email}
          </p>
          <p>
            <strong>Status:</strong> {agent.status || "pending"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {agent.citizenshipPhotoFront && (
            <div>
              <p className="font-medium text-gray-700 mb-1">
                Citizenship Photo Front
              </p>
              <a
                href={`${BASE_IMAGE_URL}${agent.citizenshipPhotoFront}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
            </div>
          )}

          {agent.citizenshipPhotoBack && (
            <div>
              <p className="font-medium text-gray-700 mb-1">
                Citizenship Photo Back
              </p>
              <a
                href={`${BASE_IMAGE_URL}${agent.citizenshipPhotoBack}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
            </div>
          )}

          {agent.driverLicense && (
            <div>
              <p className="font-medium text-gray-700 mb-1">Driving License</p>
              <a
                href={`${BASE_IMAGE_URL}${agent.driverLicense}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">
            Reapplication Control:
          </label>
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={reapplicationEnabled}
              onChange={() => setReapplicationEnabled((v) => !v)}
              className="form-checkbox"
            />
            <span className="ml-2">Allow agent to reapply if rejected</span>
          </label>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Rejection Reason:</label>
          <input
            type="text"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter reason for rejection"
            disabled={loading}
          />
        </div>

        {error && <div className="text-red-600 mb-2">{error}</div>}
        {success && <div className="text-green-600 mb-2">{success}</div>}

        <div className="flex gap-4 justify-end">
          <button
            onClick={handleApprove}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            disabled={loading}
          >
            Approve
          </button>
          <button
            onClick={handleReject}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            disabled={loading}
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDetail;
