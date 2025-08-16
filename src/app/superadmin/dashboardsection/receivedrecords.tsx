"use client";
import React, { useState } from "react";

export default function PartnerDashboard() {
    const [partnerId1, setPartnerId1] = useState("Creditsea-keshva");
    const [partnerId2, setPartnerId2] = useState("bharti");
    const [apiData, setApiData] = useState<any>(null);
    const [crmData, setCrmData] = useState<any>(null);
    const [loading1, setLoading1] = useState(false);
    const [loading2, setLoading2] = useState(false);

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // Fetch API Data (partnerData)
    const fetchApiData = async () => {
        setLoading1(true);
        try {
            const res = await fetch(
                "https://keshvacredit.com/api/v1/admin/get/partnerData",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ partner_Id: partnerId1 }),
                }
            );
            const data = await res.json();
            setApiData(data);
        } catch (err) {
            console.error("API Data error:", err);
        }
        setLoading1(false);
    };

    // Fetch CRM Data (membersData)
    const fetchCrmData = async () => {
        setLoading2(true);
        try {
            const res = await fetch(
                "https://keshvacredit.com/api/v1/admin/get/membersData",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ partner_Id: partnerId2 }),
                }
            );
            const data = await res.json();
            setCrmData(data);
        } catch (err) {
            console.error("CRM Data error:", err);
        }
        setLoading2(false);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Box 1: API Data */}
            <div className="p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-bold text-blue-700 mb-4">📊 Received from API</h2>
                <div className="flex items-center gap-3 mb-4">
                    <select
                        value={partnerId1}
                        onChange={(e) => setPartnerId1(e.target.value)}
                        className="border text-black rounded-lg px-3 py-2"
                    >
                        <option value="">choose api partner</option>
                        <option value="Creditsea-keshva">Creditsea-keshva</option>
                    </select>
                    <button
                        onClick={fetchApiData}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Fetch
                    </button>
                </div>
                {loading1 ? (
                    <p className="text-gray-500">Loading...</p>
                ) : apiData ? (
                    <p className="text-2xl font-bold text-gray-800">
                        Count: {apiData.count}
                    </p>
                ) : (
                    <p className="text-gray-400">No data yet</p>
                )}
            </div>

            {/* Box 2: CRM Data */}
            <div className="p-6 bg-white rounded-2xl shadow">
                <h2 className="text-lg font-bold mb-4 text-green-600">🔗 Received from CRM</h2>
                <div className="flex items-center gap-3 mb-4">
                    <select
                        value={partnerId2}
                        onChange={(e) => setPartnerId2(e.target.value)}
                        className="border text-black rounded-lg px-3 py-2"
                    >
                        <option value="">choose partner</option>
                        <option value="tester007">tester007</option>
                        <option value="bharti">bharti</option>
                    </select>   
                    <button
                        onClick={fetchCrmData}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                        Fetch
                    </button>
                </div>
                {loading2 ? (
                    <p className="text-gray-500">Loading...</p>
                ) : crmData ? (
                    <p className="text-2xl font-bold text-gray-800">
                        Count: {crmData.count}
                    </p>
                ) : (
                    <p className="text-gray-400">No data yet</p>
                )}
            </div>
        </div>
    );
}
