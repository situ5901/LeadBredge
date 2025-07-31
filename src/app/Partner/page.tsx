"use client";
import React from "react";
import Dedupe from "./dedupe-check/page"
import {
  Send,
  CheckCircle,
  XCircle,
  Users,
} from "lucide-react";

export default function MemberDashboard() {
  const stats = [
    {
      label: "Data Sent",
      value: "1,050",
      icon: <Send className="w-6 h-6 text-blue-600" />,
    },
    {
      label: "Disbursed",
      value: "785",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
    },
    {
      label: "Rejected",
      value: "120",
      icon: <XCircle className="w-6 h-6 text-red-600" />,
    },
    {
      label: "Leads",
      value: "235",
      icon: <Users className="w-6 h-6 text-yellow-600" />,
    },
  ];

  return (
    <div className="">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="p-6 bg-white rounded-2xl shadow hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded-full">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="  text-center">
       <Dedupe/>
      </div>
    </div>
  );
}
