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

  const handleLogout = () => {
    localStorage.removeItem("role");
    router.push("/");
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    router.prefetch("/member/dashboard");
    router.prefetch("/member/Dedupe-check");
  }, [router]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white z-30 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 transition-transform duration-300 ease-in-out shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <Link href="/member/dashboard" className="flex items-center space-x-2">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Partner
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

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1">
              <li>
                <Link
                  href="/member/dashboard"
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${pathname === "/member/dashboard"
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
                  href="/member/dedupe-check"
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${pathname === "/member/dedupe-check"
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`}
                >
                  <Send className="w-5 h-5 mr-3" />
                  Dedupe-check
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-64">
        {/* Top Navbar */}
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
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto mt-16 p-4 md:p-6 ">
          <div className="max-w-7xl mx-auto">
            <div className=" shadow p-4 md:p-6">
              <Toaster position="top-right" />
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
