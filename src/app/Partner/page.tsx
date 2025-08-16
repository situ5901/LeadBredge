"use client";
import React, { useEffect, useState } from "react";
import Dedupe from "./dedupe-check/page";
import { Send, CheckCircle, XCircle, Users, Download } from "lucide-react";

export default function MemberDashboard() {
  const [dataSent, setDataSent] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const partner_Id =
    typeof window !== "undefined" ? localStorage.getItem("userName") : null;

  // Fetch only Data Sent count
  useEffect(() => {
    const fetchData = async () => {
      if (!partner_Id) return;
      setLoading(true);
      try {
        const res = await fetch(
          "https://keshvacredit.com/api/v1/admin/get/membersData",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ partner_Id }),
          }
        );
        const data = await res.json();
        setDataSent(data.count || 0);
      } catch (err) {
        console.error("API Error:", err);
      }
      setLoading(false);
    };

    fetchData();
  }, [partner_Id]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-black">Partner Dashboard</h1>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {/* Data Sent (from API) */}
        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Data Sent</p>
              <h3 className="text-2xl font-bold text-gray-800">
                {loading ? "Loading..." : dataSent !== null ? dataSent : 0}
              </h3>
            </div>
          </div>
        </div>

        {/* Other stats - static for now */}
        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Disbursed</p>
              <h3 className="text-2xl font-bold text-gray-800">N/A</h3>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="bg-gray-100 p-3 rounded-full">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rejected</p>
              <h3 className="text-2xl font-bold text-gray-800">N/A</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Action Section */}
      <div className="text-center space-y-6">
        <a
          href="/our_requirments.pdf"
          download
          className="inline-flex items-center gap-2 px-5 py-3 bg-green-500 text-white rounded-2xl shadow hover:bg-blue-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Download Our Data Requirement PDF
        </a>

        <div>
          <Dedupe />
        </div>
      </div>
    </div>
  );
}
