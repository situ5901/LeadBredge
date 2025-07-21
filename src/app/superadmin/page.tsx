'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line
} from 'recharts';

const LoanDashboard = () => {
  const [userData, setUserData] = useState({
    userCount: 0,
    users2Count: 0,
    totalUsers: 0,
  });
  const [analysisData, setAnalysisData] = useState({
    validUsers: 0,
    invalidUsers: 0,
  });
  const [portfolioStats, setPortfolioStats] = useState({
    totalDocuments: 0,
    duplicatePhoneCount: 0,
  });
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch user data from API
  const fetchUserData = async () => {
    if (!token) {
      toast.error('No token found in localStorage.');
      return;
    }

    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/get/all/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUserData({
          userCount: data.userCount || 0,
          users2Count: data.users2Count || 0,
          totalUsers: data.totalUsers || 0,
        });
      } else {
        toast.error(data.message || 'Failed to fetch user data.');
      }
    } catch {
      toast.error('Error fetching user data');
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchAnalysisData();
    fetchPortfolioStats();
  }, []);

  const fetchAnalysisData = async () => {
    if (!token) {
      toast.error('No token found in localStorage.');
      return;
    }

    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/analysis', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setAnalysisData({
          validUsers: data.validUsers || 0,
          invalidUsers: data.invalidUsers || 0,
        });
      } else {
        toast.error(data.message || 'Failed to fetch analysis data.');
      }
    } catch {
      toast.error('Error fetching analysis data');
    }
  };

  const fetchPortfolioStats = async () => {
    if (!token) {
      toast.error('No token found in localStorage.');
      return;
    }

    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/v1/filterdata', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPortfolioStats({
          totalDocuments: data.totalDocuments || 0,
          duplicatePhoneCount: data.duplicatePhoneCount || 0,
        });
      } else {
        toast.error(data.message || 'Failed to fetch portfolio stats.');
      }
    } catch {
      toast.error('Error fetching portfolio stats');
    }
  };

  const handleDeleteData = async () => {
    if (!token) {
      toast.error('No token found in localStorage.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/v1/filterdata/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Data deleted successfully');
        fetchPortfolioStats(); // Refresh the stats after deletion
      } else {
        toast.error(data.message || 'Failed to delete data.');
      }
    } catch {
      toast.error('Error deleting data');
    } finally {
      setLoading(false);
    }
  };

  const loanDistributionData = [
    { name: 'Web Users', value: userData.userCount },
    { name: 'Old Users', value: userData.users2Count },
  ];

  const documentsData = [
    { name: 'Total', value: portfolioStats.totalDocuments },
    { name: 'Duplicate', value: portfolioStats.duplicatePhoneCount },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Total Users</h3>
            <p className="text-2xl font-bold text-blue-400">{userData.totalUsers.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Old Users</h3>
            <p className="text-2xl font-bold text-pink-600">{(userData.users2Count).toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Website Users</h3>
            <p className="text-2xl font-bold text-green-600">{userData.userCount.toLocaleString()}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Valid Users</h3>
            <p className="text-2xl font-bold text-amber-500">
              {analysisData.validUsers.toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Invalid Users</h3>
            <p className="text-2xl font-bold text-amber-500">
              {analysisData.invalidUsers.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Lender Lead Summary</h2>
          <table className="min-w-full table-auto border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <thead className="bg-gray-100 text-gray-700 text-sm font-semibold">
              <tr>
                <th className="px-6 py-3 text-left">Sr. No</th>
                <th className="px-6 py-3 text-left">Lender Name</th>
                <th className="px-6 py-3 text-left">Total Leads Sent</th>
                <th className="px-6 py-3 text-left">Successful Leads</th>
                <th className="px-6 py-3 text-left">Dedupe Leads</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-800 divide-y divide-gray-200">
              {[
                {
                  lender: 'money view',
                  total: 1200,
                  success: 950,
                  dedupe: 50,
                },
                {
                  lender: 'Ramfin',
                  total: 1100,
                  success: 870,
                  dedupe: 40,
                },
                {
                  lender: 'olyv',
                  total: 900,
                  success: 780,
                  dedupe: 30,
                },
              ].map((row, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.lender}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{row.total.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-green-600 font-medium">
                    {row.success.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-red-500 font-medium">
                    {row.dedupe.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-5">
          {/* Chart 1: User Distribution Pie Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">User Distribution</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      percent !== undefined ? `${name} ${(percent * 100).toFixed(0)}%` : `${name} 0%`
                    }
                  >
                    {loanDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">User Validation Summary</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Valid Users', count: analysisData.validUsers },
                    { name: 'Invalid Users', count: analysisData.invalidUsers },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="count"
                    name="User Count"
                    fill="#8884d8"
                    radius={[8, 8, 0, 0]}
                    barSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>


          {/* Chart 5: Portfolio Growth Area Chart */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Data management</h2>
            <div className="h-[300px] flex gap-4">
              {/* Card 1 */}
              <div className="flex-1 bg-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 flex flex-col">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📊 Duplicate Stats</h3>

                {/* Small Boxes Row */}
                <div className="flex gap-4 mb-6">
                  {/* Total Data Box */}
                  <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 text-center rounded-xl p-4 h-24 flex flex-col justify-center shadow-sm border border-blue-200">
                    <p className="text-sm font-bold text-blue-900">Total Documents</p>
                    <p className="text-base font-medium text-blue-800 mt-1">{portfolioStats.totalDocuments.toLocaleString()}</p>
                  </div>

                  {/* Duplicate Data Box */}
                  <div className="flex-1 bg-gradient-to-br from-yellow-100 to-yellow-200 text-center rounded-xl p-4 h-24 flex flex-col justify-center shadow-sm border border-yellow-200">
                    <p className="text-sm font-bold text-yellow-900">Duplicate Documents</p>
                    <p className="text-base font-medium text-yellow-800 mt-1">{portfolioStats.duplicatePhoneCount.toLocaleString()}</p>
                  </div>
                </div>

                {/* Centered Delete Button below the boxes */}
                <div className="flex justify-center">
                  <button
                    onClick={handleDeleteData}
                    disabled={loading}
                    className={`w-48 h-12 text-sm font-semibold rounded-xl transition-all duration-200 ${loading
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                      }`}
                  >
                    {loading ? 'Processing...' : '🗑️ Delete Duplicate Data'}
                  </button>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex-1 bg-green-50 p-4 rounded-lg shadow-md border border-green-100">
                <h3 className="text-md font-medium text-green-700 mb-2">Documents Overview</h3>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={documentsData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="value"
                        name="Documents"
                        fill="#4CAF50"
                        radius={[8, 8, 0, 0]}
                        barSize={60}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDashboard;