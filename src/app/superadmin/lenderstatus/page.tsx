"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { saveAs } from "file-saver";

const CHUNK_SIZE = 1000;

const FilterUploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [finalResults, setFinalResults] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "search">("search");
  const [leadId, setLeadId] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFinalResults(null); 
      console.log("📁 File selected:", file.name);
    }
  };

  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress("📖 Reading file...");
    setProgressPercent(5);
    setFinalResults(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet) as any[];

      const leadIdKey = Object.keys(data[0] || {}).find(
        key => key.toLowerCase() === 'lead_id'
      );

      if (!leadIdKey) {
        alert("CSV must contain a 'lead_id' column.");
        setLoading(false);
        return;
      }

      const leadIdToRowMap: Record<string, any> = {};
      const leadIds: string[] = [];

      data.forEach((row) => {
        const leadId = row[leadIdKey]?.toString().trim();
        if (leadId) {
          leadIds.push(leadId);
          leadIdToRowMap[leadId] = row;
        }
      });

      if (leadIds.length === 0) {
        alert("No valid lead_id values found in the file.");
        setLoading(false);
        return;
      }

      const chunks = chunkArray(leadIds, CHUNK_SIZE);
      const allResults: any[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setProgress(`🔁 Processing chunk ${i + 1} of ${chunks.length}...`);
        setProgressPercent(Math.round(((i + 1) / chunks.length) * 100));

        try {
          const response = await axios.post(
            "https://keshvacredit.com/api/v1/api/check-leads",
            { leadIds: chunk },
            { headers: { "Content-Type": "application/json" } }
          );

          const results = response.data?.results || [];

          results.forEach((item: any) => {
            const originalRow = leadIdToRowMap[item.leadId] || {};
            allResults.push({
              ...originalRow,
              api_status: item.status || "",
              api_code: item.fullResponse?.code || "",
              api_message: item.fullResponse?.message || "",
              leadStatus: item.fullResponse?.leadStatus || "",
              full_api_response: item.fullResponse || {},
            });
          });

        } catch (err) {
          console.error("❌ API call failed for chunk", i + 1, err);
          chunk.forEach((leadId) => {
            const originalRow = leadIdToRowMap[leadId] || {};
            allResults.push({
              ...originalRow,
              api_status: "error",
              api_message: "API call failed",
              full_api_response: {},
            });
          });
        }
      }

      setFinalResults(allResults);
      setProgress("✅ Done! Ready to download.");
      setProgressPercent(100);
      setLoading(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleSearch = async () => {
    if (!leadId.trim()) {
      alert("Please enter a lead ID");
      return;
    }

    setLoading(true);
    setProgress("🔍 Searching for lead...");
    setProgressPercent(50);
    setSingleResult(null); 

    try {
      const response = await axios.post(
        "https://keshvacredit.com/api/v1/api/check-leads",
        { leadIds: [leadId.trim()] },
        { headers: { "Content-Type": "application/json" } }
      );

      const result = response.data?.results?.[0] || {};
      setSingleResult({
        leadId: leadId,
        api_status: result.status || "",
        api_code: result.fullResponse?.code || "",
        api_message: result.fullResponse?.message || "",
        leadStatus: result.fullResponse?.leadStatus || "",
        full_api_response: result.fullResponse || {},
      });

      setProgress("✅ Lead status found");
      setProgressPercent(100);
    } catch (err) {
      console.error("❌ API call failed", err);
      setSingleResult({
        leadId: leadId,
        api_status: "error",
        api_message: "API call failed",
        full_api_response: {},
      });
      setProgress("❌ Error searching for lead");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!finalResults) return;

    const exportData = finalResults.map((row) => ({
      ...row,
      full_api_response: JSON.stringify(row.full_api_response || {}),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "lead_status_results.csv");
    console.log("📥 CSV downloaded with", finalResults.length, "rows");
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 mb-5 shadow-lg rounded-xl bg-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
        Lead Status Checker Moneyview
      </h1>

      <div className="flex border-b mb-6">
        <button
          className={`py-3 px-6 font-medium text-lg ${
            activeTab === "upload"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => {
            setActiveTab("upload");
            setSingleResult(null);
          }}
        >
          Bulk Upload
        </button>
        <button
          className={`py-3 px-6 font-medium text-lg ${
            activeTab === "search"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => {
            setActiveTab("search");
            setFinalResults(null); 
          }}
        >
          Single Search
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === "upload" ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload your leads file (CSV/Excel)
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex-1 cursor-pointer">
                    <div className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-sm text-gray-600">
                        {selectedFile
                          ? selectedFile.name
                          : "Click to select file"}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition ${
                    loading
                      ? "bg-blue-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  } text-white`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    "Upload & Check Status"
                  )}
                </button>
              )}
            </div>

            {loading && (
              <div className="mt-4 space-y-2">
                <p className="text-gray-700 font-medium">{progress}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <p className="text-right text-sm text-gray-500">
                  {progressPercent}%
                </p>
              </div>
            )}

            {finalResults && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg
                      className="w-5 h-5 text-green-500 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <p className="text-green-700 font-medium">
                      Processed {finalResults.length} leads successfully!
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDownloadCSV}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Results (CSV)
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Lead ID
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <input
                    type="text"
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    placeholder="Enter lead ID"
                    className="flex-1 text-black  min-w-0 block w-full px-4 py-3 rounded-l-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className={`inline-flex items-center px-4 py-3 border border-transparent text-sm font-medium rounded-r-lg text-white ${
                      loading
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>
            </div>

            {loading && (
              <div className="mt-4 space-y-2">
                <p className="text-gray-700 font-medium">{progress}</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            )}

            {singleResult && (
              <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Lead Status Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Lead ID
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {singleResult.leadId}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Status</p>
                      <p
                        className={`mt-1 text-sm ${
                          singleResult.api_status === "success"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {singleResult.api_status}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Code</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {singleResult.api_code || "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Message
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {singleResult.api_message || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">
                        Lead Status
                      </p>
                      <p className="mt-1 text-sm text-gray-900">
                        {singleResult.leadStatus || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && progress && (
              <div
                className={`p-4 rounded-lg ${
                  progress.startsWith("✅")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                <div className="flex items-center">
                  {progress.startsWith("✅") ? (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <p className="font-medium">{progress}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FilterUploadPage;