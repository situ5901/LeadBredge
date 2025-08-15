"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { saveAs } from "file-saver";

const CHUNK_SIZE = 2000;
const MAX_ROWS = 200000;

const FilterUploadPage = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [finalResults, setFinalResults] = useState<any[] | null>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "search">("search");
  const [leadId, setLeadId] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Modal display utility
  const showAlert = (message: string) => {
    setModalMessage(message);
    setShowModal(true);
  };

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFinalResults(null);
      console.log("📁 File selected:", file.name);
    }
  };

  // Array chunking utility
  const chunkArray = (arr: any[], size: number) => {
    const result = [];
    for (let i = 0; i < arr.length; i += size) {
      result.push(arr.slice(i, i + size));
    }
    return result;
  };

  // Bulk upload handler
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

      if (data.length > MAX_ROWS) {
        showAlert("File contains more than 2 lakh rows. Please upload file with less than 2 lakh rows.");
        setLoading(false);
        return;
      }

      // Find the 'lead_id' column, case-insensitive
      const leadIdKey = Object.keys(data[0] || {}).find(
        (key) => key.toLowerCase() === "lead_id"
      );

      if (!leadIdKey) {
        showAlert("CSV must contain a 'lead_id' column.");
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
        showAlert("No valid lead_id values found in the file.");
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
          const [checkLeadsResponse, finalLoanDetailsResponse] =
            await Promise.allSettled([
              axios.post(
                "https://keshvacredit.com/api/v1/api/check-leads",
                { leadIds: chunk },
                { headers: { "Content-Type": "application/json" } }
              ),
              axios.post(
                "https://keshvacredit.com/api/v1/api/final-loan-details",
                { leadIds: chunk },
                { headers: { "Content-Type": "application/json" } }
              ),
            ]);

          const checkLeadsResults =
            checkLeadsResponse.status === "fulfilled"
              ? checkLeadsResponse.value.data?.results || []
              : [];
          const finalLoanDetailsResults =
            finalLoanDetailsResponse.status === "fulfilled"
              ? finalLoanDetailsResponse.value.data?.results || []
              : [];

          const checkLeadsMap: Record<string, any> = {};
          checkLeadsResults.forEach((item: any) => {
            checkLeadsMap[item.leadId] = item.fullResponse || {};
          });

          const finalLoanDetailsMap: Record<string, any> = {};
          finalLoanDetailsResults.forEach((item: any) => {
            finalLoanDetailsMap[item.leadId] = item.fullResponse || {};
          });

          chunk.forEach((leadId) => {
            const originalRow = leadIdToRowMap[leadId] || {};
            const checkLeadsData = checkLeadsMap[leadId] || {
              status: "N/A",
              code: "N/A",
              message: "No data from API",
              leadStatus: "N/A",
            };
            const finalLoanDetailsData = finalLoanDetailsMap[leadId] || {
              status: "N/A",
              loanAmount: "N/A",
              emi: "N/A",
              processingFee: "N/A",
              processingFeeWithoutGST: "N/A",
              tenure: "N/A",
              rateOfInterest: "N/A",
              amountTransferable: "N/A",
              preEmi: "N/A",
              lendingPartner: "N/A",
            };

            allResults.push({
              ...originalRow,
              checkLeads_status: checkLeadsData.status,
              checkLeads_code: checkLeadsData.code,
              checkLeads_message: checkLeadsData.message,
              checkLeads_leadStatus: checkLeadsData.leadStatus,
              finalLoanDetails_status: finalLoanDetailsData.status,
              finalLoanDetails_loanAmount: finalLoanDetailsData.loanAmount,
              finalLoanDetails_emi: finalLoanDetailsData.emi,
              finalLoanDetails_processingFee: finalLoanDetailsData.processingFee,
              finalLoanDetails_processingFeeWithoutGST: finalLoanDetailsData.processingFeeWithoutGST,
              finalLoanDetails_tenure: finalLoanDetailsData.tenure,
              finalLoanDetails_rateOfInterest: finalLoanDetailsData.rateOfInterest,
              finalLoanDetails_amountTransferable: finalLoanDetailsData.amountTransferable,
              finalLoanDetails_preEmi: finalLoanDetailsData.preEmi,
              finalLoanDetails_lendingPartner: finalLoanDetailsData.lendingPartner,
            });
          });
        } catch (err) {
          console.error("❌ An unexpected error occurred during chunk processing", i + 1, err);
          chunk.forEach((leadId) => {
            const originalRow = leadIdToRowMap[leadId] || {};
            allResults.push({
              ...originalRow,
              checkLeads_status: "error",
              checkLeads_code: "N/A",
              checkLeads_message: "API call failed for chunk",
              checkLeads_leadStatus: "N/A",
              finalLoanDetails_status: "error",
              finalLoanDetails_loanAmount: "N/A",
              finalLoanDetails_emi: "N/A",
              finalLoanDetails_processingFee: "N/A",
              finalLoanDetails_processingFeeWithoutGST: "N/A",
              finalLoanDetails_tenure: "N/A",
              finalLoanDetails_rateOfInterest: "N/A",
              finalLoanDetails_amountTransferable: "N/A",
              finalLoanDetails_preEmi: "N/A",
              finalLoanDetails_lendingPartner: "N/A",
            });
          });
        }
        // Optional: Let browser breathe on every big chunk
        if (chunks.length > 50) await new Promise((res) => setTimeout(res, 10));
      }

      setFinalResults(allResults);
      setProgress("✅ Done! Ready to download.");
      setProgressPercent(100);
      setLoading(false);
    };

    reader.readAsBinaryString(selectedFile);
  };

  // Single search handler
  const handleSearch = async () => {
    if (!leadId.trim()) {
      showAlert("Please enter a lead ID");
      return;
    }

    setLoading(true);
    setProgress("🔍 Searching for lead status and loan details...");
    setProgressPercent(25);
    setSingleResult(null);

    try {
      const payload = { leadIds: [leadId.trim()] };
      const headers = { "Content-Type": "application/json" };

      const [checkLeadsResponse, finalLoanDetailsResponse] = await Promise.all([
        axios.post("https://keshvacredit.com/api/v1/api/check-leads", payload, { headers }),
        axios.post("https://keshvacredit.com/api/v1/api/final-loan-details", payload, { headers }),
      ]);

      setProgressPercent(75);

      const checkLeadsResult = checkLeadsResponse.data?.results?.[0] || {};
      const finalLoanDetailsResult =
        finalLoanDetailsResponse.data?.results?.[0]?.fullResponse || {};

      setSingleResult({
        leadId: leadId,
        checkLeads: {
          status: checkLeadsResult.status || "N/A",
          code: checkLeadsResult.fullResponse?.code || "N/A",
          message: checkLeadsResult.fullResponse?.message || "N/A",
          leadStatus: checkLeadsResult.fullResponse?.leadStatus || "N/A",
        },
        finalLoanDetails: {
          status: finalLoanDetailsResult.status || "N/A",
          loanAmount: finalLoanDetailsResult.loanAmount || "N/A",
          emi: finalLoanDetailsResult.emi || "N/A",
          processingFee: finalLoanDetailsResult.processingFee || "N/A",
          processingFeeWithoutGST: finalLoanDetailsResult.processingFeeWithoutGST || "N/A",
          tenure: finalLoanDetailsResult.tenure || "N/A",
          rateOfInterest: finalLoanDetailsResult.rateOfInterest || "N/A",
          amountTransferable: finalLoanDetailsResult.amountTransferable || "N/A",
          preEmi: finalLoanDetailsResult.preEmi || "N/A",
          lendingPartner: finalLoanDetailsResult.lendingPartner || "N/A",
        },
      });

      setProgress("✅ Lead status and loan details found.");
      setProgressPercent(100);
    } catch (err) {
      console.error("❌ API call failed", err);
      setSingleResult({
        leadId: leadId,
        checkLeads: {
          status: "error",
          message: "API call failed",
        },
        finalLoanDetails: {
          status: "error",
          message: "API call failed",
        },
      });
      setProgress("❌ Error searching for lead.");
    } finally {
      setLoading(false);
    }
  };

  // Download CSV handler – async with spinner
  const handleDownloadCSV = () => {
    if (!finalResults) return;

    setIsDownloading(true);
    setTimeout(() => {
      try {
        const exportData = finalResults.map((row) => ({ ...row }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "lead_status_results.csv");
        console.log("📥 CSV downloaded with", finalResults.length, "rows");
      } catch (error) {
        console.error("Error during CSV download:", error);
        showAlert("Error during CSV download. Please try again.");
      } finally {
        setIsDownloading(false);
      }
    }, 100);
  };

  // Render API response card
  const renderDetailCard = (title: string, data: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-1">
              <label className="block text-sm font-medium text-gray-500 capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </label>
              <p className="text-gray-800 font-medium">
                {value?.toString() || "N/A"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Main component render
  return (
    <div className="mx-auto p-4 mb-5 font-sans">
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notification
            </h3>
            <p className="text-gray-700 mb-6">{modalMessage}</p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
      <div className="overflow-hidden mb-8">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Lead Status & Loan Details Checker Moneyview
          </h1>
          <p className="text-gray-600 text-center mb-6">
            Check lead status and loan details in bulk or individually
          </p>

          {/* Tab navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`flex-1 py-3 px-6 font-medium text-lg transition-all ${
                activeTab === "upload"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("upload");
                setSingleResult(null);
                setProgress("");
                setProgressPercent(0);
              }}
            >
              Bulk Upload
            </button>
            <button
              className={`flex-1 py-3 px-6 font-medium text-lg transition-all ${
                activeTab === "search"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => {
                setActiveTab("search");
                setFinalResults(null);
                setSelectedFile(null);
                setProgress("");
                setProgressPercent(0);
              }}
            >
              Single Search
            </button>
          </div>

          <div className="space-y-6">
            {/* Bulk Upload Tab */}
            {activeTab === "upload" ? (
              <>
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload your leads file (CSV/Excel)
                    </label>
                    <div className="flex items-center space-x-4">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-all bg-white">
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
                              : "Click to select file (CSV, XLSX)"}
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
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                        loading
                          ? "bg-blue-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700"
                      } text-white shadow-md`}
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
                {/* Progress bar */}
                {loading && (
                  <div className="mt-4 space-y-2 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700 font-medium">{progress}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-gray-500">
                      {progressPercent}%
                    </p>
                  </div>
                )}

                {/* Download button */}
                {finalResults && (
                  <div className="mt-6 space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
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
                      disabled={isDownloading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-all shadow-md flex items-center justify-center ${
                        isDownloading
                          ? "bg-green-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700"
                      } text-white`}
                    >
                      {isDownloading ? (
                        <>
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
                          Downloading...
                        </>
                      ) : (
                        <>
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
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              // Single Search Tab
              <>
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Enter Lead ID
                    </label>
                    <div className="flex rounded-lg shadow-sm">
                      <input
                        type="text"
                        value={leadId}
                        onChange={(e) => setLeadId(e.target.value)}
                        placeholder="Enter lead ID"
                        className="flex-1 min-w-0 block w-full text-black px-4 py-3 rounded-l-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 focus:outline-none"
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
                {/* Progress Bar */}
                {loading && (
                  <div className="mt-4 space-y-2 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700 font-medium">{progress}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-sm text-gray-500">
                      {progressPercent}%
                    </p>
                  </div>
                )}

                {/* Display results */}
                {singleResult && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800">
                          Lead Information
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-500">
                              Lead ID
                            </label>
                            <p className="text-gray-800 font-medium">
                              {singleResult.leadId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {renderDetailCard("Lead Status Details", singleResult.checkLeads)}
                    {renderDetailCard("Loan Details", singleResult.finalLoanDetails)}
                  </div>
                )}
                {/* Status messages */}
                {!loading && progress && (
                  <div
                    className={`p-4 rounded-lg ${
                      progress.startsWith("✅")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
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
      </div>
    </div>
  );
};

export default FilterUploadPage;
