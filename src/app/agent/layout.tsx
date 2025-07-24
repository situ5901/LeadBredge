"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "react-hot-toast";
import { Menu, X, LayoutDashboard, Send, LogOut } from "lucide-react";

export default function MemberPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    const checkTokenAndRole = () => {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");

      if (!token || role !== "agent") {
        router.push("/");
      }
    };
    checkTokenAndRole();
  }, [router]);


  const handleLogout = () => {
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    router.push("/");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const name = localStorage.getItem("userName") || "User";
    setUserName(name);

    router.prefetch("/agent/");
    router.prefetch("/agent/lead-status");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white z-30 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <Link href="/member/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Keshvacredit
              </span>
            </Link>
            <button
              className="md:hidden text-gray-400 hover:text-white"
              onClick={toggleSidebar}
              aria-label="Close Sidebar"
            >
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/agent/"
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${pathname === "/agent/"
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  <LayoutDashboard className="w-5 h-5 mr-3" />
                  Dashboard
                </Link>
              </li>

              <li>
                <Link
                  href="/agent/lead-status"
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${pathname === "/agent/lead-status"
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  <Send className="w-5 h-5 mr-3" />
                  Lead Status
                </Link>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </aside>
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        <header className="fixed top-0 right-0 left-0 md:left-64 bg-white shadow-sm z-20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button
                onClick={toggleSidebar}
                className="mr-4 text-gray-500 hover:text-gray-700 md:hidden"
                aria-label="Toggle Sidebar"
              >
                <Menu size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-800 capitalize">
                {pathname.split("/").pop()?.replace("-", " ") || "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium text-sm">
                    {userName?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-700">{userName}</p>
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto mt-16 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="p-4 md:p-6">
              <Toaster position="top-right" />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}