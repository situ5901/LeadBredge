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
    <div className="max-w-xl mx-auto  p-6 mb-5 ">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600 relative">
        <span className="before:content-['🔍'] before:mr-2">Phone Number Lookup search</span>
      </h1>
      
      <div className="flex justify-center mb-6 space-x-4">
        <button
          onClick={() => setSearchMode("phone")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            searchMode === "phone" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Single Phone Search
        </button>
        <button
          onClick={() => setSearchMode("excel")}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            searchMode === "excel" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Bulk Excel Upload
        </button>
      </div>

      {searchMode === "phone" ? (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Enter Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 9876543210"
              className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleSingleSearch}
              disabled={loading || !phoneNumber}
              className="mt-3 w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-300"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {singleResult && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
              <h3 className="font-bold text-green-800 mb-2">Result Found</h3>
              <pre className="bg-white p-3 rounded text-sm overflow-x-auto">
                {JSON.stringify(singleResult, null, 2)}
              </pre>
            </div>
          )}

          {progress && !loading && !singleResult && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800">
              {progress}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
            <div className="flex items-center space-x-4">
              <label className="flex-1 cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition">
                  <span className="block text-purple-600 font-medium">
                    {selectedFile ? selectedFile.name : "Choose file..."}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </label>
              <button
                onClick={handleBulkUpload}
                disabled={loading || !selectedFile}
                className="bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition disabled:bg-purple-300"
              >
                {loading ? "Processing..." : "Upload"}
              </button>
            </div>
          </div>

          {loading && (
            <div className="mt-4 space-y-2">
              <p className="text-gray-700 font-medium">{progress}</p>
              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-400 to-purple-600 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{progressPercent}% complete</p>
            </div>
          )}

          {!loading && finalResults && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">
                  Found {finalResults.length} results
                </span>
                <button
                  onClick={handleDownloadCSV}
                  className="bg-green-600 text-white font-semibold py-1 px-3 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <span className="before:content-['⬇️'] before:mr-1">Download CSV</span>
                </button>
              </div>
            </div>
          )}

          {!loading && progress && !finalResults && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-yellow-800">
              {progress}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterUploadPage;