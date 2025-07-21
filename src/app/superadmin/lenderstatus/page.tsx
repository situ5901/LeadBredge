"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";

export default function MoneyViewStatus() {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedPhone = Cookies.get("phone");
    if (storedPhone) setPhone(storedPhone);
  }, []);

  const checkStatus = async () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://example.com/api/moneyview/status", {
        phone,
      });
      setStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching status:", error);
      alert("Failed to check status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-800";
      case "Rejected": return "bg-red-100 text-red-800";
      case "Pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className=" bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-md p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-600">
          Application Status
        </h1>

        <div className="space-y-4">
          <input
            type="tel"
            className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Enter Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <button
            onClick={checkStatus}
            disabled={loading}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              loading 
                ? "bg-indigo-400 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            }`}
          >
            {loading ? "Checking..." : "Check Status"}
          </button>

          {status && (
            <div className={`mt-4 p-4 rounded-lg ${getStatusColor(status)}`}>
              <p className="text-center font-semibold">
                Current Status: <span className="font-bold">{status}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}