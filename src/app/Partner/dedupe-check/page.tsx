'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

type ExcelRow = (string | number | null | undefined)[];
type ApiResponseItem = {
    phone: string | number;
    status: 'Duplicate' | 'Not Duplicate' | string;
};
type ApiResponse = {
    data: ApiResponseItem[];
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
    };

    const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

    const processBatch = useCallback(
        async (
            rows: ExcelRow[],
            index: number,
            tempDup: ExcelRow[],
            tempNonDup: ExcelRow[]
        ) => {
            const phones = rows
                .map((r) => r[index])
                .filter((num) => /^\d{10}$/.test(String(num).replace(/\D/g, '').slice(-10)))
                .map((num) => Number(String(num).replace(/\D/g, '').slice(-10)));

            if (!phones.length) return;

            const MAX_RETRIES = 3;
            const RETRY_DELAY = 1000;
            let attempt = 0;
            let success = false;
            let resultData: ApiResponseItem[] = [];

            while (attempt < MAX_RETRIES && !success) {
                try {
                    const res = await fetch('https://keshvacredit.com/api/v1/getAll/check-data', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phone: phones }),
                    });

                    if (!res.ok) throw new Error(`Status ${res.status}`);
                    const json: ApiResponse = await res.json();
                    resultData = json.data;
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
                    if (status === 'Duplicate') tempDup.push(row);
                    else if (status === 'Not Duplicate') tempNonDup.push(row);
                });
            }

            const BETWEEN_BATCH_DELAY = 10;
            await sleep(BETWEEN_BATCH_DELAY);
        },
        []
    );

    const processData = async (allRows: ExcelRow[], discoveredPhoneColIndex: number) => {
        setProcessing(true);
        setUploadMessage('Processing data...');
        setProgress(0);
        setTotalRows(allRows.length);
        setProcessedRows(0);

        const BATCH_SIZE = 7000;
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
                await processBatch(batch, discoveredPhoneColIndex, tempDuplicates, tempNonDuplicates);
                processedCount += batch.length;
                setProcessedRows(processedCount);
                setProgress(Math.floor((processedCount / allRows.length) * 100));
                setDuplicates([...tempDuplicates]);
                setNotDuplicates([...tempNonDuplicates]);
            }
        }

        setUploadMessage('✅ Processing complete!');
        setProgress(100);
        setProcessing(false);
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
                    const headerRow = allCsvRows[0];
                    const dataRows = allCsvRows.slice(1);

                    const keywords = ['phone', 'mobile', 'number', 'contact',
                        'phonenumber', 'phone_number', 'mobile_number',
                        'contact_number', 'contactnumber', 'mobilenumber'];
                    const foundIndex = headerRow.findIndex((h) =>
                        keywords.some((k) =>
                            String(h).toLowerCase().replace(/[^a-z]/g, '').includes(k)
                        )
                    );
                    if (foundIndex === -1) {
                        setUploadMessage('❌ No phone-related column found in CSV.');
                        setProcessing(false);
                        return;
                    }
                    setHeaders(headerRow as string[]);
                    setPhoneColumnIndex(foundIndex);
                    processData(dataRows, foundIndex);
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
                    setUploadMessage('❌ Error: Could not read file content.');
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

                    const headerRow = allExcelRows[0];
                    const dataRows = allExcelRows.slice(1);

                    const keywords = ['phone', 'mobile', 'number', 'contact',
                        'phonenumber', 'phone_number', 'mobile_number',
                        'contact_number', 'contactnumber', 'mobilenumber'];
                    const foundIndex = headerRow.findIndex((h) =>
                        keywords.some((k) =>
                            String(h).toLowerCase().replace(/[^a-z]/g, '').includes(k)
                        )
                    );

                    if (foundIndex === -1) {
                        setUploadMessage('❌ No phone-related column found in Excel file.');
                        setProcessing(false);
                        return;
                    }

                    setHeaders(headerRow as string[]);
                    setPhoneColumnIndex(foundIndex);
                    await processData(dataRows, foundIndex);

                } catch (error) {
                    console.error('Excel file processing error:', error);
                    setUploadMessage('❌ Failed to process Excel file.');
                    setProcessing(false);
                }
            };
            reader.onerror = (error) => {
                console.error('FileReader error:', error);
                setUploadMessage('❌ Error reading Excel file.');
                setProcessing(false);
            };
            reader.readAsArrayBuffer(file);
        } else {
            setUploadMessage('❌ Unsupported file type. Please upload a CSV or Excel (.xlsx, .xls) file.');
            setProcessing(false);
        }
    };

    const downloadCSV = (rows: ExcelRow[], filename: string) => {
        const dataToUnparse = headers.length > 0 ? [headers, ...rows] : rows;
        const csv = Papa.unparse(dataToUnparse);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
  <div className="max-w-2xl mx-auto p-4">
  <div className=" rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md">
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">
          <span className="text-blue-600">Dedupe find</span> Tool
        </h2>
        <p className="text-gray-500 mt-1">Upload your file to find duplicate records</p>
      </div>

      {/* File Upload Card */}
      <div className="bg-gray-50 rounded-lg p-5 border-2 border-dashed border-gray-200 transition-colors hover:border-blue-300">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="font-medium text-gray-700">Upload Excel/CSV File</h3>
          </div>
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label 
            htmlFor="file-upload"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Choose File
          </label>
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {processing && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Processing...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-50 p-2 rounded text-blue-700">
                <span className="font-medium">Total:</span> {totalRows}
              </div>
              <div className="bg-red-50 p-2 rounded text-red-700">
                <span className="font-medium">Duplicates:</span> {duplicates.length}
              </div>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleUpload}
            className={`px-5 py-2 rounded-md font-medium text-sm flex items-center ${processing || !file ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'}`}
            disabled={processing || !file}
          >
            {processing ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Start process'
            )}
          </button>
        </div>

        {uploadMessage && (
          <div className={`mt-3 text-center text-sm p-2 rounded ${uploadMessage.startsWith('✅') ? 'bg-green-50 text-green-700' : uploadMessage.startsWith('❌') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
            {uploadMessage}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {!processing && totalRows > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-700 mb-2">Results Summary</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-xl font-bold text-gray-800">{totalRows}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Duplicates</p>
              <p className="text-xl font-bold text-red-600">{duplicates.length}</p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <p className="text-sm text-gray-500">Unique</p>
              <p className="text-xl font-bold text-green-600">{notDuplicates.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Download Buttons */}
      {!processing && phoneColumnIndex !== null && (duplicates.length > 0 || notDuplicates.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-red-100 bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-red-700">Duplicate Records</h3>
                <p className="text-2xl font-bold text-red-600">{duplicates.length}</p>
              </div>
              <button
                onClick={() => downloadCSV(duplicates, 'Duplicates')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>

          <div className="border border-green-100 bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-green-700">Unique Records</h3>
                <p className="text-2xl font-bold text-green-600">{notDuplicates.length}</p>
              </div>
              <button
                onClick={() => downloadCSV(notDuplicates, 'Not_Duplicates')}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
</div>
    );
}