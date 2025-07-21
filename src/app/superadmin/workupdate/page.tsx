"use client";
import React, { useEffect, useState } from "react";

interface UserData {
  name: string;
  department: string;
  message: string;
  createdAt: string;
  time: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [searchName, setSearchName] = useState<string>("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://keshvacredit.com/api/v1/employee/getDailyReport");
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();
      setUserData(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchName.trim()) {
      fetchUserData();
      return;
    }
    try {
      setLoading(true);
      const res = await fetch("https://keshvacredit.com/api/v1/employee/getUserReport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: searchName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to fetch search results");
      const data = await res.json();
      setUserData(data || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching user data:", error);
      setUserData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const totalPages = Math.ceil(userData.length / rowsPerPage);
  const currentData = userData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 rounded-xl p-6 mb-8 shadow-lg">
        <h1 className="text-3xl font-bold text-center text-white">Daily Work Report</h1>
        <p className="text-center text-white/90 mt-2">Track and manage daily employee updates</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="block w-full text-black pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Search
            </button>
            <button
              onClick={() => {
                setSearchName("");
                fetchUserData();
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="rowsPerPage" className="text-sm font-medium text-black">
              Rows:
            </label>
            <select
              id="rowsPerPage"
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              className="block w-full pl-3 pr-10 text-black py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              {[5, 10, 25, 50].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Reports</p>
              <p className="text-2xl font-semibold text-gray-800">{loading ? "..." : userData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Department", "Message", "Date", "Time"].map((col) => (
                  <th
                    key={col}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    Loading data...
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((user, idx) => (
                  <tr key={idx}>
                    <td className="px-6 py-4 text-sm text-black">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-black">{user.department}</td>
                    <td className="px-6 py-4 text-sm text-black">{user.message}</td>
                    <td className="px-6 py-4 text-sm text-black">{user.createdAt}</td>
                    <td className="px-6 py-4 text-sm text-black">{user.time}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center bg-white px-4 py-3 rounded-lg shadow-md">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
          {Math.min(currentPage * rowsPerPage, userData.length)} of {userData.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-black text-sm border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-black text-sm border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
