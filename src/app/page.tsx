"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import Confetti from "react-confetti";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [autoLogging, setAutoLogging] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const router = useRouter();

  // ✅ LocalStorage with Expiry
  function getItemWithExpiry(key: string): string | null {
    if (typeof window === "undefined") return null; // avoid hydration issue
    const value = localStorage.getItem(key);
    const expiry = localStorage.getItem(`${key}_expiry`);
    if (!value || !expiry) return null;
    if (Date.now() > parseInt(expiry)) {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_expiry`);
      return null;
    }
    return value;
  }

  // ✅ All login endpoints
  const endpoints = [
    {
      url: "https://keshvacredit.com/api/v1/admin/login",
      body: { adminMail: email, adminName: username, password },
      role: "superadmin",
      successMessage: "🪐 Superadmin detected ! Initiating full control for you.",
    },
    {
      url: "https://keshvacredit.com/api/v1/member/login",
      body: { MemberMail: email, Membername: username, MemberPassword: password },
      role: "member",
      successMessage: "Welcome Partner! Your dashboard is ready to power your goals.",
    },
    {
      url: "https://keshvacredit.com/api/v1/agent/login",
      body: { AgentMail: email, Agentname: username, AgentPassword: password },
      role: "agent",
      successMessage: "Welcome Agent! Time to make a difference.",
    },
  ];

  // ✅ Handle role-based redirect
  function redirectByRole(role: string) {
    if (role === "superadmin") router.push("/superadmin");
    else if (role === "member") router.push("/Partner");
    else if (role === "agent") router.push("/agent");
    else toast.error("Unknown role: " + role);
  }

  // ✅ Handle login
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;

      for (const { url, body, role, successMessage } of endpoints) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok && data.token && data.role) {
          const userRole = data.role.toLowerCase();
          const token = data.token;
          const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24h

          // Save in LS
          localStorage.setItem("token", token);
          localStorage.setItem("role", userRole);
          localStorage.setItem("userName", username);
          localStorage.setItem("token_expiry", expiryTime.toString());
          localStorage.setItem("role_expiry", expiryTime.toString());
          localStorage.setItem("userName_expiry", expiryTime.toString());

          toast.success(successMessage, { duration: 2000, position: "top-right" });

          // 🎆 Confetti + redirect
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            redirectByRole(userRole);
          }, 4000);

          success = true;
          break;
        }
      }

      if (!success) {
        toast.error("Invalid credentials or unauthorized user");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Auto-login if token available
  useEffect(() => {
    const token = getItemWithExpiry("token");
    const userRole = getItemWithExpiry("role");
    if (token && userRole) {
      setAutoLogging(true);
      setTimeout(() => redirectByRole(userRole), 2000);
    }
  }, []);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4 relative">
      <Toaster position="top-right" reverseOrder={false} />
      {showConfetti && (
        <Confetti width={window.innerWidth} height={window.innerHeight} />
      )}

      <form
        onSubmit={handleLogin}
        className="w-[300px] bg-[#1c3360] text-white rounded-[30px] py-6 px-5 space-y-3 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
      >
        <h1 className="text-lg font-semibold">
          {autoLogging ? (
            <span className="animate-pulse">Auto logging in...</span>
          ) : (
            "Login Page"
          )}
        </h1>
        <hr className="border-t border-white w-1/2 mx-auto" />
        <p className="text-xs">
          {autoLogging
            ? "Please wait while we log you in automatically."
            : "Login to manage your Dashboard"}
        </p>

        {/* Username */}
        <input
          type="text"
          disabled={loading || autoLogging}
          className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none disabled:opacity-50"
          placeholder="Your Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Email */}
        <input
          type="email"
          disabled={loading || autoLogging}
          className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none disabled:opacity-50"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            disabled={loading || autoLogging}
            className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none pr-8 disabled:opacity-50"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {!autoLogging && (
            <button
              type="button"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          )}
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading || autoLogging}
          className="bg-red-600 hover:bg-red-700 w-1/2 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50 transition"
        >
          {autoLogging
            ? "Auto logging..."
            : loading
            ? "Logging in..."
            : "Submit"}
        </button>

        {/* Support section */}
        {!autoLogging && (
          <>
            <hr className="border-t border-white w-1/4 mx-auto" />
            <p className="text-[10px]">
              Need help?{" "}
              <a
                href="https://wa.me/918901229195"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 underline hover:text-blue-200"
              >
                Contact support
              </a>
            </p>
          </>
        )}
      </form>
    </main>
  );
}
