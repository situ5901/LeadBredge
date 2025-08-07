'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

type RowData = {
    srNo: number;
    lenderName: string;
    leads_sent: number;
    leads_offer: number;
    leads_rejected: number;
    leads_processed: number;
    leads_total: number;
};

const LoanDashboard = () => {
    const [lenderStats, setLenderStats] = useState({});
    const [isLoading, setIsLoading] = useState({
        lenderStats: true,
    });

    // Fetch Lender Stats
    useEffect(() => {
        const fetchLenderData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return toast.error('No token found in localStorage.');

            try {
                const res = await fetch(
                    'https://keshvacredit.com/api/v1/admin/get/LenderData',
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const data = await res.json();

                if (res.ok) {
                    setLenderStats(data.lender || {});
                } else {
                    toast.error(data.message || 'Failed to fetch lender data.');
                }
            } catch (error) {
                toast.error('Error fetching lender data');
            } finally {
                setIsLoading((prev) => ({ ...prev, lenderStats: false }));
            }
        };

        fetchLenderData();
    }, []);

    // Normalize the API data
    const lenderTableData: RowData[] = Object.entries(lenderStats).map(
        ([lenderName, lenderData], index) => {
            const raw =
                typeof lenderData === 'object' && lenderData !== null
                    ? lenderData
                    : {};

            // Normalize fields based on key matching
            const mapped = {
                leads_sent:
                    Object.entries(raw).find(
                        ([key]) => key.toLowerCase() === lenderName.toLowerCase()
                    )?.[1] || 0,

                leads_rejected:
                    Object.entries(raw).find(([key]) =>
                        key.toLowerCase().includes('rejected')
                    )?.[1] || 0,

                leads_offer:
                    Object.entries(raw).find(([key]) =>
                        key.toLowerCase().includes('offers')
                    )?.[1] || 0,

                leads_processed:
                    Object.entries(raw).find(([key]) =>
                        key.toLowerCase().includes('processed')
                    )?.[1] || 0,

                leads_total:
                    Object.entries(raw).find(([key]) =>
                        key.toLowerCase().includes('total')
                    )?.[1] || 0,
            };

            return {
                srNo: index + 1,
                lenderName,
                ...mapped,
            };
        }
    );

    return (
        <div className="bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="mt-6">
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">
                        Lender Lead Summary
                    </h2>

                    <div className="overflow-auto border border-gray-200 rounded-lg shadow-sm bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Sr. No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Lender Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Leads Sent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Leads Offer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Leads Rejected
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Leads Processed
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Leads Total
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading.lenderStats ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8">
                                            <div className="flex justify-center">
                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : lenderTableData.length > 0 ? (
                                    lenderTableData.map((row) => (
                                        <tr key={row.lenderName} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {row.srNo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {row.lenderName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {Number(row.leads_sent).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {Number(row.leads_offer).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {Number(row.leads_rejected).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {Number(row.leads_processed).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                                                {Number(row.leads_total).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-4 text-center text-sm text-gray-500"
                                        >
                                            No lender data available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!isLoading.lenderStats && lenderTableData.length > 0 && (
                    <div className="mt-10 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Lender Lead Status Breakdown
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={lenderTableData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="lenderName" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="leads_sent" stackId="a" fill="#3b82f6" name="Leads Sent" />
                                <Bar dataKey="leads_offer" stackId="a" fill="#22c55e" name="Leads Offer" />
                                <Bar dataKey="leads_rejected" stackId="a" fill="#ef4444" name="Leads Rejected" />
                                <Bar dataKey="leads_processed" stackId="a" fill="#eab308" name="Leads Processed" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LoanDashboard;