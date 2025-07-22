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
  const [activeTab, setActiveTab] = useState<"upload" | "search">("upload");
  const [leadId, setLeadId] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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

      if (!data[0]?.lead_id) {
        alert("CSV must contain a 'lead_id' column.");
        setLoading(false);
        return;
      }

      const leadIdToRowMap: Record<string, any> = {};
      const leadIds: string[] = [];

      data.forEach((row) => {
        const leadId = row.lead_id?.toString().trim();
        if (leadId) {
          leadIds.push(leadId);
          leadIdToRowMap[leadId] = row;
        }
      });

      if (leadIds.length === 0) {
        alert("No valid lead_id found.");
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

      setProgress("✅ Lead found!");
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
    <div className="max-w-xl mx-auto mt-10 p-6 mb-5 shadow-md rounded-lg border border-gray-200">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">📤 Lead Status Checker MoneyView</h1>

      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === "upload" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("upload")}
        >
          Upload CSV/Excel
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === "search" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
          onClick={() => setActiveTab("search")}
        >
          Search by Lead ID
        </button>
      </div>

      {activeTab === "upload" ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload your leads file (CSV/Excel)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>

          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Upload & Check Status"}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter Lead ID
            </label>
            <div className="flex">
              <input
                type="text"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                placeholder="Enter lead ID"
                className="text-black flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-r-md hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {singleResult && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md">
              <h3 className="font-medium text-black text-lg mb-2">Lead Status Result</h3>
              <div className="space-y-2 text-black">
                <p><span className="font-medium">Lead ID:</span> {singleResult.leadId}</p>
                <p><span className="font-medium">Status:</span> {singleResult.api_status}</p>
                <p><span className="font-medium">Code:</span> {singleResult.api_code}</p>
                <p><span className="font-medium">Message:</span> {singleResult.api_message}</p>
                <p><span className="font-medium">Lead Status:</span> {singleResult.leadStatus}</p>
              </div>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="mt-4">
          <p className="text-gray-700 font-medium mb-1">{progress}</p>
          <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      )}

      {!loading && activeTab === "upload" && finalResults && finalResults.length > 0 && (
        <button
          onClick={handleDownloadCSV}
          className="w-full mt-4 bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
        >
          ⬇️ Download Results (CSV)
        </button>
      )}

      {!loading && progress && (
        <p className={`mt-4 font-semibold ${progress.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {progress}
        </p>
      )}
    </div>
  );
};

export default FilterUploadPage;