"use client";
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";
import { saveAs } from "file-saver";

const CHUNK_SIZE = 5000;

const FilterUploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [finalResults, setFinalResults] = useState<any[] | null>(null);
  const [searchMode, setSearchMode] = useState<"phone" | "excel">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [singleResult, setSingleResult] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // This ensures we don't render anything until after hydration
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("File selected:", file.name);
      setSelectedFile(file);
    }
  };

  const handleSingleSearch = async () => {
    if (!phoneNumber) return;

    setLoading(true);
    setProgress("Searching for phone number...");
    
    try {
      const res = await axios.post(
        "https://keshvacredit.com/api/v1/Test/filterdata",
        { phones: [phoneNumber] },
        { headers: { "Content-Type": "application/json" } }
      );

      if (res.data.success && res.data.data) {
        const result = Array.isArray(res.data.data) ? res.data.data[0] : res.data.data;
        setSingleResult(result);
        setFinalResults([result]);
        setProgress("Found result for phone number");
      } else {
        setProgress("No results found");
        setSingleResult(null);
        setFinalResults(null);
      }
    } catch (err) {
      console.error("Error searching phone number:", err);
      setProgress("Error searching phone number");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setProgress("");
    setProgressPercent(0);
    setFinalResults(null);
    setSingleResult(null);

    const reader = new FileReader();

    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      const phoneNumbers = data.flat().filter((v) => typeof v === "number");
      console.log("Total phone numbers found:", phoneNumbers.length);

      const results: any[] = [];
     
      for (let i = 0; i < phoneNumbers.length; i += CHUNK_SIZE) {
        const chunk = phoneNumbers.slice(i, i + CHUNK_SIZE);
        console.log(`Sending chunk ${i}–${i + chunk.length}`);

        try {
          const res = await axios.post(
            "https://keshvacredit.com/api/v1/Test/filterdata",
            { phones: chunk },
            { headers: { "Content-Type": "application/json" } }
          );

          console.log("API response:", res.data);

          if (res.data.success && res.data.data) {
            const raw = res.data.data;

            // If primitive array, convert to objects
            const formatted =
              Array.isArray(raw) && typeof raw[0] !== "object"
                ? raw.map((val) => ({ phone: val }))
                : raw;

            results.push(...formatted);
          }
        } catch (err) {
          console.error("Error in chunk:", chunk, err);
        }

        setProgress(`Processed: ${i + chunk.length} / ${phoneNumbers.length}`);
        setProgressPercent(Math.round(((i + chunk.length) / phoneNumbers.length) * 100));
      }

      console.log("Final filtered results:", results);
      setFinalResults(results);
      setLoading(false);
      setProgress("Done! Ready to download.");
      setProgressPercent(100);
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleDownloadCSV = () => {
    if (!finalResults) return;

    const ws = XLSX.utils.json_to_sheet(finalResults);
    const csv = XLSX.utils.sheet_to_csv(ws);

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "filtered_users.csv");
    console.log("CSV downloaded with", finalResults.length, "rows");
  };

  if (!hasMounted) {
    return null; // Don't render anything during SSR
  }

  return (
   <div className="max-w-2xl mx-auto p-6 mb-5">
  <div className="text-center mb-8">
    <h1 className="text-3xl font-bold text-gray-800 mb-2">
      <span className="relative">
        <span className="absolute left-0 top-0 -ml-6 -mt-1 text-2xl"></span>
        Phone Number Lookup
      </span>
    </h1>
    <p className="text-gray-600">Search by single phone number or upload an Excel file</p>
  </div>
  
  <div className="flex justify-center mb-8">
    <div className="inline-flex rounded-md shadow-sm" role="group">
      <button
        onClick={() => setSearchMode("phone")}
        className={`px-6 py-3 text-sm font-medium rounded-l-lg border ${
          searchMode === "phone" 
            ? "bg-blue-600 text-white border-blue-600" 
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Single Search
        </span>
      </button>
      <button
        onClick={() => setSearchMode("excel")}
        className={`px-6 py-3 text-sm font-medium rounded-r-lg border ${
          searchMode === "excel" 
            ? "bg-blue-600 text-white border-blue-600" 
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`}
      >
        <span className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Bulk Upload
        </span>
      </button>
    </div>
  </div>

  {searchMode === "phone" ? (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter 10-digit phone number"
              className="block w-full px-4 py-3 rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 border text-gray-700"
            />
          </div>
        </div>
        
        <button
          onClick={handleSingleSearch}
          disabled={loading || !phoneNumber}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </>
          ) : "Search"}
        </button>

        {singleResult && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Search Result</h3>
            <div className="bg-white p-4 rounded border border-gray-200 overflow-x-auto">
              <pre className="text-sm text-gray-800">{JSON.stringify(singleResult, null, 2)}</pre>
            </div>
          </div>
        )}

        {progress && !loading && !singleResult && (
          <div className="mt-4 p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            {progress}
          </div>
        )}
      </div>
    </div>
  ) : (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Excel File Upload</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                  <span>Upload a file</span>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleFileChange} 
                    className="sr-only" 
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {selectedFile ? selectedFile.name : "XLSX, XLS, or CSV up to 10MB"}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleBulkUpload}
          disabled={loading || !selectedFile}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-300 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : "Process File"}
        </button>

        {loading && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{progress}</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-purple-600 h-2.5 rounded-full" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        )}

        {!loading && finalResults && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-green-800">Results Ready</h3>
                <p className="text-sm text-green-600">Found {finalResults.length} matching records</p>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download CSV
              </button>
            </div>
          </div>
        )}

        {!loading && progress && !finalResults && (
          <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
            {progress}
          </div>
        )}
      </div>
    </div>
  )}
</div>
  );
};

export default FilterUploadPage;