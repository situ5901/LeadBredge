"use client";
import { useState, useEffect } from "react";

interface Employee {
  name: string;
  attendance: { [date: string]: string };
}

export default function AttendanceApp() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  // ✅ Load from localStorage only on client side
  useEffect(() => {
    try {
      const savedData = localStorage.getItem("attendanceData");
      if (savedData) {
        setEmployees(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Error loading data from localStorage:", error);
    }
  }, []);

  // ✅ Save to localStorage when employees change
  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem("attendanceData", JSON.stringify(employees));
    }
  }, [employees]);

  const addEmployee = () => {
    if (name.trim() === "") return;
    if (!employees.some((e) => e.name.toLowerCase() === name.toLowerCase())) {
      setEmployees([...employees, { name: name.trim(), attendance: {} }]);
    }
    setName("");
  };

  const updateAttendance = (employeeName: string, status: string) => {
    setEmployees((prev) =>
      prev.map((employee) =>
        employee.name === employeeName
          ? {
              ...employee,
              attendance: {
                ...employee.attendance,
                [date]: status,
              },
            }
          : employee
      )
    );
  };

  const getSummary = () => {
    let present = 0,
      absent = 0,
      halfDay = 0,
      leave = 0;
    employees.forEach((e) => {
      const status = e.attendance[date];
      if (status === "Present") present++;
      if (status === "Absent") absent++;
      if (status === "Half Day") halfDay++;
      if (status === "Leave") leave++;
    });
    return { present, absent, halfDay, leave };
  };

  const downloadEmployeeData = (employee: Employee) => {
    const dataStr = JSON.stringify(employee, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${employee.name}_attendance.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summary = getSummary();
  const allDates = [...new Set(employees.flatMap((e) => Object.keys(e.attendance)))].sort();

    return (
        <div className="min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl p-8">
                <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8 tracking-tight">
                    📋 Attendance Manager
                </h1>

                {/* Add Employee */}
                <div className="flex gap-3 mb-8">
                    <input
                        type="text"
                        value={name}
                        placeholder="Enter employee name"
                        onChange={(e) => setName(e.target.value)}
                        className="flex-1 p-3 border-2 text-black border-blue-200 rounded-xl focus:ring-4 focus:ring-blue-300 outline-none transition"
                    />
                    <button
                        onClick={addEmployee}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-2 rounded-xl shadow-lg transition transform hover:scale-105"
                    >
                        ➕ Add
                    </button>
                </div>

                {/* Date Picker */}
                <div className="mb-6 flex justify-center">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="p-3 border-2 text-black border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-300 outline-none transition"
                    />
                </div>

                {/* Attendance Table */}
                <div className="overflow-hidden rounded-2xl shadow-lg">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gradient-to-r from-blue-300 to-purple-300 text-white">
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr key={employee.name} className="border-b hover:bg-gray-50">
                                    <td className="p-3 font-medium text-black">{employee.name}</td>
                                    <td className="p-3 text-center">
                                        <div className="flex gap-2 justify-center">
                                            {[
                                                { label: "P", status: "Present", active: "bg-green-500 text-white", inactive: "bg-green-100 text-green-700" },
                                                { label: "A", status: "Absent", active: "bg-red-500 text-white", inactive: "bg-red-100 text-red-700" },
                                                { label: "H", status: "Half Day", active: "bg-yellow-500 text-white", inactive: "bg-yellow-100 text-yellow-700" },
                                                { label: "L", status: "Leave", active: "bg-purple-500 text-white", inactive: "bg-purple-100 text-purple-700" },
                                            ].map((btn) => (
                                                <button
                                                    key={btn.status}
                                                    onClick={() => updateAttendance(employee.name, btn.status)}
                                                    className={`px-3 py-1 rounded-lg font-semibold shadow transition transform hover:scale-105 ${employee.attendance[date] === btn.status ? btn.active : btn.inactive
                                                        }`}
                                                >
                                                    {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {employees.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-4 text-center text-gray-500">
                                        No employees added yet 🚀
                                    </td>
                                </tr>

                            )}
                        </tbody>
                    </table>
                </div>

                {/* Summary */}
                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl shadow text-center">
                        <p className="text-2xl font-bold">{summary.present}</p>
                        <p>Present</p>
                    </div>
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl shadow text-center">
                        <p className="text-2xl font-bold">{summary.absent}</p>
                        <p>Absent</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 p-4 rounded-xl shadow text-center">
                        <p className="text-2xl font-bold">{summary.halfDay}</p>
                        <p>Half Day</p>
                    </div>
                    <div className="bg-purple-100 text-purple-800 p-4 rounded-xl shadow text-center">
                        <p className="text-2xl font-bold">{summary.leave}</p>
                        <p>Leave</p>
                    </div>
                </div>

                {/* --- */}
                <hr className="my-8 border-t-2 border-gray-200" />

                {/* Attendance History */}
                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-center text-gray-700 mb-6">Attendance History</h2>
                    <div className="overflow-x-auto rounded-2xl shadow-lg">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-blue-300 to-purple-300 text-white">
                                    <th className="p-3 text-left sticky left-0 bg-gradient-to-r from-blue-300 to-purple-300 z-10">Name</th>
                                    {allDates.map(d => (
                                        <th key={d} className="p-3 min-w-[100px] text-center">{d}</th>
                                    ))}
                                    <th className="p-3 sticky right-0 bg-gradient-to-r from-blue-300 to-purple-300 z-10">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(employee => (
                                    <tr key={employee.name} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium sticky left-0 bg-white text-black z-10">{employee.name}</td>
                                        {allDates.map(d => {
                                            const status = employee.attendance[d] || "N/A";
                                            let statusClass = "";
                                            switch (status) {
                                                case "Present":
                                                    statusClass = "text-green-600 font-bold";
                                                    break;
                                                case "Absent":
                                                    statusClass = "text-red-600 font-bold";
                                                    break;
                                                case "Half Day":
                                                    statusClass = "text-yellow-600 font-bold";
                                                    break;
                                                case "Leave":
                                                    statusClass = "text-purple-600 font-bold";
                                                    break;
                                                default:
                                                    statusClass = "text-gray-400";
                                                    break;
                                            }
                                            return (
                                                <td key={d} className={`p-3 text-center ${statusClass}`}>
                                                    {status.charAt(0)}
                                                </td>
                                            );
                                        })}
                                        <td className="p-3 sticky right-0 bg-white z-10 text-center">
                                            <button
                                                onClick={() => downloadEmployeeData(employee)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                                            >
                                                Download 📥
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}