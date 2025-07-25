'use client';

import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
// Add this interface above your LoanDashboard component or in a types.ts file
type RowData = {
  srNo: number;
  lenderName: string;
  [key: string]: string | number;
};

const LoanDashboard = () => {
  const [userData, setUserData] = useState({ userCount: 0, users2Count: 0, totalUsers: 0 });
  const [analysisData, setAnalysisData] = useState({ validUsers: 0, invalidUsers: 0 });
  const [portfolioStats, setPortfolioStats] = useState({ totalDocuments: 0, duplicatePhoneCount: 0 });
  const [lenderStats, setLenderStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState({
    userData: true,
    analysisData: true,
    portfolioStats: true,
    lenderStats: true
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Fetch user-related data
  const fetchUserData = async () => {
    if (!token) return toast.error('No token found in localStorage.');
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
      } else toast.error(data.message || 'Failed to fetch user data.');
    } catch (error) {
      toast.error('Error fetching user data: ');
    } finally {
      setIsLoading(prev => ({ ...prev, userData: false }));
    }
  };

  const fetchLenderData = async () => {
    if (!token) return toast.error('No token found in localStorage.');
    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/get/LenderData', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLenderStats(data.lender || {});
      } else toast.error(data.message || 'Failed to fetch lender data.');
    } catch (error) {
      toast.error('Error fetching lender data: ');
    } finally {
      setIsLoading(prev => ({ ...prev, lenderStats: false }));
    }
  };

  const fetchAnalysisData = async () => {
    if (!token) return toast.error('No token found in localStorage.');
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
      } else toast.error(data.message || 'Failed to fetch analysis data.');
    } catch (error) {
      toast.error('Error fetching analysis data: ');
    } finally {
      setIsLoading(prev => ({ ...prev, analysisData: false }));
    }
  };

  const fetchPortfolioStats = async () => {
    if (!token) return toast.error('No token found in localStorage.');
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
      } else toast.error(data.message || 'Failed to fetch portfolio stats.');
    } catch (error) {
      toast.error('Error fetching portfolio stats: ');
    } finally {
      setIsLoading(prev => ({ ...prev, portfolioStats: false }));
    }
  };

  const handleDeleteData = async () => {
    if (!token) return toast.error('No token found in localStorage.');
    setLoading(true);
    try {
      const res = await fetch('https://keshvacredit.com/api/v1/admin/v1/filterdata/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Data deleted successfully');
        fetchPortfolioStats();
      } else toast.error(data.message || 'Failed to delete data.');
    } catch (error) {
      toast.error('Error deleting data: ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchAnalysisData();
    fetchPortfolioStats();
    fetchLenderData();
  }, [token]);

  const loanDistributionData = [
    { name: 'Web Users', value: userData.userCount },
    { name: 'Old Users', value: userData.users2Count },
  ];

  const documentsData = [
    { name: 'Total', value: portfolioStats.totalDocuments },
    { name: 'Duplicate', value: portfolioStats.duplicatePhoneCount },
  ];

  // Refactor lenderTableData to display all values for a lender in one row
  const lenderTableData = Object.entries(lenderStats).map(([lenderName, lenderData], index) => {
    // Ensure lenderData is an object before spreading
    const dataToSpread = typeof lenderData === 'object' && lenderData !== null ? lenderData : {};
    return {
      srNo: index + 1,
      lenderName: lenderName,
      ...dataToSpread,
    };
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 md:mb-8">Dashboard</h1>

        {/* Stats Grid with Loading States */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 md:mb-8">
          {/* Total Users */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Total Users</h3>
            {isLoading.userData ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-blue-400">{userData.totalUsers.toLocaleString()}</p>
            )}
          </div>

          {/* Old Users */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Old Users</h3>
            {isLoading.userData ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-pink-600">{userData.users2Count.toLocaleString()}</p>
            )}
          </div>

          {/* Website Users */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Website Users</h3>
            {isLoading.userData ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600">{userData.userCount.toLocaleString()}</p>
            )}
          </div>

          {/* Valid Users */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Valid Users</h3>
            {isLoading.analysisData ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-amber-500">
                {analysisData.validUsers.toLocaleString()}
              </p>
            )}
          </div>

          {/* Invalid Users */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="text-gray-500 text-sm font-bold">Invalid Users</h3>
            {isLoading.analysisData ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-amber-500">
                {analysisData.invalidUsers.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Lender Data Section */}
        <div className="h-full mt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Lender Lead Summary</h2>

          {/* Full-width Table */}
          <div className="overflow-auto border border-gray-200 rounded-lg shadow-sm bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Sr. No</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Lender Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leads sent</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leads total</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Leads rejected</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading.lenderStats ? (
                  <tr>
                    <td colSpan={100} className="px-6 py-4 text-center"> {/* Use a large colspan to cover all columns */}
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                      </div>
                    </td>
                  </tr>
                ) : lenderTableData.length > 0 ? (
                  lenderTableData.map((row) => (
                    <tr key={row.lenderName} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.srNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{row.lenderName}</td>
                      {Object.keys(row)
                        .filter(key => key !== 'srNo' && key !== 'lenderName')
                        .map(key => (
                          <td
                            key={`${row.lenderName}-${key}`}
                            className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium"
                          >
                            {Number((row as Record<string, any>)[key]).toLocaleString()}
                          </td>
                        ))}

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={100} className="px-6 py-4 text-center text-sm text-gray-500">
                      No lender data available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
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

          {/* Chart 2: User Validation Bar Chart */}
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

          {/* Data Management Section */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Data management</h2>
            <div className="h-[300px] flex gap-4">
              <div className="flex-1 bg-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 flex flex-col">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">📊 Duplicate Stats</h3>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 bg-gradient-to-br from-blue-100 to-blue-200 text-center rounded-xl p-4 h-24 flex flex-col justify-center shadow-sm border border-blue-200">
                    <p className="text-sm font-bold text-blue-900">Total Documents</p>
                    {isLoading.portfolioStats ? (
                      <div className="flex justify-center mt-1">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-blue-800 mt-1">
                        {portfolioStats.totalDocuments.toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 bg-gradient-to-br from-yellow-100 to-yellow-200 text-center rounded-xl p-4 h-24 flex flex-col justify-center shadow-sm border border-yellow-200">
                    <p className="text-sm font-bold text-yellow-900">Duplicate Documents</p>
                    {isLoading.portfolioStats ? (
                      <div className="flex justify-center mt-1">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-500"></div>
                      </div>
                    ) : (
                      <p className="text-base font-medium text-yellow-800 mt-1">
                        {portfolioStats.duplicatePhoneCount.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={handleDeleteData}
                    disabled={loading || isLoading.portfolioStats}
                    className={`w-48 h-12 text-sm font-semibold rounded-xl transition-all duration-200 ${loading || isLoading.portfolioStats
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                      }`}
                  >
                    {loading ? 'Processing...' : '🗑️ Delete Duplicate Data'}
                  </button>
                </div>
              </div>
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