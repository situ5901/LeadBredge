'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Cookies from 'js-cookie';

// Define the types for better code clarity
type ExcelRow = (string | number | null | undefined)[];
type ApiResponseItem = {
  phone: string | number;
  status: 'Duplicate' | 'Not Duplicate' | string;
};
type ApiResponse = {
  totalPhoneRequested: number;
  totalPhoneDuplicate: number;
  phoneData: ApiResponseItem[];
};

export default function PartnerDashboard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [headers, setHeaders] = useState<string[]>([]);
  const [phoneColumnIndex, setPhoneColumnIndex] = useState<number | null>(null);
  const [duplicates, setDuplicates] = useState<ExcelRow[]>([]);
  const [notDuplicates, setNotDuplicates] = useState<ExcelRow[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);
  const [processedRows, setProcessedRows] = useState<number>(0);
  const [showUploadButton, setShowUploadButton] = useState<boolean>(false);
  const [uploadingToInfi, setUploadingToInfi] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setUploadMessage('');
    setProgress(0);
    setDuplicates([]);
    setNotDuplicates([]);
    setHeaders([]);
    setPhoneColumnIndex(null);
    setTotalRows(0);
    setProcessedRows(0);
    setShowUploadButton(false);
  };

  const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000;
  const BETWEEN_BATCH_DELAY = 10;
  const ROW_LIMIT = 10000; // Define the row limit as a constant

  const processBatch = useCallback(
    async (
      rows: ExcelRow[],
      index: number,
      tempDup: ExcelRow[],
      tempNonDup: ExcelRow[],
      headers: string[]
    ) => {
      const phones = rows
        .map((r) => r[index])
        .filter((num) =>
          /^\d{10}$/.test(String(num).replace(/\D/g, '').slice(-10))
        )
        .map((num) =>
          Number(String(num).replace(/\D/g, '').slice(-10))
        );

      if (!phones.length) return;

      let attempt = 0;
      let success = false;
      let resultData: ApiResponseItem[] = [];

      while (attempt < MAX_RETRIES && !success) {
        try {
          const res = await fetch(
            'https://keshvacredit.com/api/v1/getAll/check-data',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: phones }),
            }
          );

          if (!res.ok) throw new Error(`Status ${res.status}`);
          const json: ApiResponse = await res.json();
          resultData = json.phoneData;
          success = true;
        } catch (err) {
          console.warn(`Attempt ${attempt + 1} failed`, err);
          attempt++;
          if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY * attempt);
        }
      }

      if (success) {
        const statusMap = new Map(resultData.map((d) => [String(d.phone), d.status]));
        rows.forEach((row) => {
          const phone = String(row[index]).replace(/\D/g, '').slice(-10);
          const status = statusMap.get(phone);
          if (status === 'Duplicate') {
            tempDup.push(row);
          } else if (status === 'Not Duplicate') {
            tempNonDup.push(row);
          }
        });
      }

      await sleep(BETWEEN_BATCH_DELAY);
    },
    [MAX_RETRIES, RETRY_DELAY, BETWEEN_BATCH_DELAY]
  );

  const processData = async (allRows: ExcelRow[], discoveredPhoneColIndex: number, headers: string[]) => {
    setProcessing(true);
    setUploadMessage('Processing data...');
    setProgress(0);
    setTotalRows(allRows.length);
    setProcessedRows(0);

    const BATCH_SIZE = 5000;
    const tempDuplicates: ExcelRow[] = [];
    const tempNonDuplicates: ExcelRow[] = [];
    let processedCount = 0;

    if (allRows.length <= 0) {
      setUploadMessage('✅ No data rows found to process.');
      setProcessing(false);
      return;
    }

    for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
      const batch = allRows.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await processBatch(batch, discoveredPhoneColIndex, tempDuplicates, tempNonDuplicates, headers);
        processedCount += batch.length;
        setProcessedRows(processedCount);
        setProgress(Math.floor((processedCount / allRows.length) * 100));
        setDuplicates([...tempDuplicates]);
        setNotDuplicates([...tempNonDuplicates]);
      }
    }

    setUploadMessage('✅ Deduplication complete!');
    setProgress(100);
    setProcessing(false);
    setShowUploadButton(true);
  };

  const handleUpload = () => {
    if (!file) {
      setUploadMessage('Please select a file to upload.');
      return;
    }

    setProcessing(true);
    setUploadMessage('Reading file...');
    setProgress(0);
    setDuplicates([]);
    setNotDuplicates([]);
    setHeaders([]);
    setPhoneColumnIndex(null);
    setTotalRows(0);
    setProcessedRows(0);
    setShowUploadButton(false);

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        skipEmptyLines: true,
        header: false,
        complete: (fullResults) => {
          const allCsvRows = fullResults.data as ExcelRow[];
          if (allCsvRows.length === 0) {
            setUploadMessage('❌ CSV file is empty.');
            setProcessing(false);
            return;
          }
          // Check for row limit, accounting for the header row
          if (allCsvRows.length - 1 > ROW_LIMIT) {
            setUploadMessage(`❌ File exceeds the maximum limit of ${ROW_LIMIT} rows.`);
            setProcessing(false);
            return;
          }

          const headerRow = allCsvRows[0];
          const dataRows = allCsvRows.slice(1);
          const keywords = ['phone', 'mobile', 'number', 'contact', 'phonenumber', 'phone_number', 'mobile_number', 'contact_number', 'contactnumber', 'mobilenumber'];
          const foundIndex = headerRow.findIndex((h) =>
            keywords.some((k) => String(h).toLowerCase().replace(/[^a-z]/g, '').includes(k))
          );
          if (foundIndex === -1) {
            setUploadMessage('❌ No phone-related column found in CSV.');
            setProcessing(false);
            return;
          }
          setHeaders(headerRow as string[]);
          setPhoneColumnIndex(foundIndex);
          processData(dataRows, foundIndex, headerRow as string[]);
        },
        error: (err) => {
          console.error('CSV parsing error:', err);
          setUploadMessage('❌ Failed to parse CSV file.');
          setProcessing(false);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const readerResult = e.target?.result;

        if (!readerResult) {
          setUploadMessage('❌ Could not read file content.');
          setProcessing(false);
          return;
        }

        try {
          const data = new Uint8Array(readerResult as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const allExcelRows: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: null });

          if (allExcelRows.length === 0) {
            setUploadMessage('❌ Excel file is empty or contains no data.');
            setProcessing(false);
            return;
          }
          // Check for row limit, accounting for the header row
          if (allExcelRows.length - 1 > ROW_LIMIT) {
            setUploadMessage(`❌ File exceeds the maximum limit of ${ROW_LIMIT} rows.`);
            setProcessing(false);
            return;
          }

          const headerRow = allExcelRows[0];
          const dataRows = allExcelRows.slice(1);
          const keywords = ['phone', 'mobile', 'number', 'contact', 'phonenumber', 'phone_number', 'mobile_number', 'contact_number', 'contactnumber', 'mobilenumber'];
          const foundIndex = headerRow.findIndex((h) =>
            keywords.some((k) => String(h).toLowerCase().replace(/[^a-z]/g, '').includes(k))
          );

          if (foundIndex === -1) {
            setUploadMessage('❌ No phone-related column found in Excel.');
            setProcessing(false);
            return;
          }

          setHeaders(headerRow as string[]);
          setPhoneColumnIndex(foundIndex);
          await processData(dataRows, foundIndex, headerRow as string[]);

        } catch (error) {
          console.error('Excel file processing error:', error);
          setUploadMessage('❌ Failed to process Excel file.');
          setProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setUploadMessage('❌ Unsupported file type.');
      setProcessing(false);
    }
  };



  const handleUploadToInfiSchema = async () => {
    setUploadingToInfi(true);
  
    const BATCH_SIZE = 200; // adjust batch size if needed
    let successCount = 0;
    let failCount = 0;
  
    // ✅ Get userName from localStorage and use it as partner_id
    const partner_id = localStorage.getItem('userName') || '';
  
    // ✅ created_at in "YY-MM-DD" format
    const created_at = new Date().toISOString().slice(2, 10); // e.g. "25-08-14"
  
    for (let i = 0; i < notDuplicates.length; i += BATCH_SIZE) {
      const batch = notDuplicates.slice(i, i + BATCH_SIZE);
  
      const payloadArray = batch.map(row => {
        const obj: { [key: string]: any } = {}; // dynamic keys allowed
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        obj.partner_id = partner_id;
        obj.created_at = created_at; // ✅ only date part
        return obj;
      });
  
      try {
        const res = await fetch('https://keshvacredit.com/api/v1/getAll/infiSchema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadArray),
        });
  
        if (!res.ok) throw new Error(`Status ${res.status}`);
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed`, err);
      }
    }
  
    if (failCount === 0) {
      setUploadMessage(`✅ All batches uploaded successfully! (${successCount} batches)`);
    } else {
      setUploadMessage(`⚠️ ${successCount} batches succeeded, ${failCount} batches failed.`);
    }
  
    setUploadingToInfi(false);
    setShowUploadButton(false);
  };
  
  

  const downloadCSV = (rows: ExcelRow[], filename: string) => {
    const dataToUnparse = headers.length > 0 ? [headers, ...rows] : rows;
    const csv = Papa.unparse(dataToUnparse);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden">
        {/* Header */}
        <div className="p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-center">
          <h2 className="text-3xl font-bold text-white">Dedupe Find And Upload Tool</h2>
          <p className="mt-2 text-blue-100">Easily detect and manage duplicate records and upload uniqe records to database</p>
        </div>

        <div className="p-8 space-y-8">
          {/* File Upload */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors">
            <div className="flex flex-col items-center space-y-4">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
              >
                📂 Choose File
              </label>
              {file && <p className="text-gray-700 text-sm">Selected: <span className="font-semibold">{file.name}</span></p>}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleUpload}
                disabled={processing || !file}
                className={`px-6 py-3 rounded-lg font-semibold transition ${processing || !file
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {processing ? '⏳ Processing...' : '🚀 Start Process'}
              </button>
            </div>

            {uploadMessage && (
              <div className="mt-4 text-center text-sm text-gray-600">{uploadMessage}</div>
            )}
          </div>

          {/* Summary */}
          {!processing && totalRows > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">📊 Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-gray-500 text-sm">Total Records</p>
                  <p className="text-xl font-bold text-blue-600">{totalRows}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Duplicates</p>
                  <p className="text-xl font-bold text-red-600">{duplicates.length}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Unique</p>
                  <p className="text-xl font-bold text-green-600">{notDuplicates.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Upload Unique Records */}
          {showUploadButton && notDuplicates.length > 0 && (
            <div className="text-center">
              <button
                onClick={handleUploadToInfiSchema}
                disabled={uploadingToInfi}
                className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                {uploadingToInfi ? '📤 Uploading...' : '✅ Upload Unique Records'}
              </button>
            </div>
          )}

          {/* Download Buttons */}
          {!processing && phoneColumnIndex !== null && (duplicates.length > 0 || notDuplicates.length > 0) && (
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => downloadCSV(duplicates, 'Duplicates')}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition"
              >
                ⬇ Download Duplicates
              </button>
              <button
                onClick={() => downloadCSV(notDuplicates, 'Not_Duplicates')}
                className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700 transition"
              >
                ⬇ Download Unique
              </button>
            </div>
          )}
        </div>
      </div>
    </div>

  );
}

