"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function getItemWithExpiry(key: string): string | null {
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


  const endpoints = [
    {
      url: "https://keshvacredit.com/api/v1/admin/login",
      body: {
        adminMail: email,
        adminName: username,
        password: password,
      },
      role: "superadmin",
      successMessage: "🪐 Superadmin detected ! Initiating full control for you.",
    },
    {
      url: "https://keshvacredit.com/api/v1/member/login",
      body: {
        MemberMail: email,
        Membername: username,
        MemberPassword: password,
      },
      role: "member",
      successMessage: "Welcome Partner! Your dashboard is ready to power your goals.",
    },
    {
      url: "https://keshvacredit.com/api/v1/agent/login",
      body: {
        AgentMail: email,
        Agentname: username,
        AgentPassword: password,
      },
      role: "agent",
      successMessage: "Welcome Agent! Time to make a difference.",
    },
  ];

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

          const expiryTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours in ms

          localStorage.setItem("token", token);
          localStorage.setItem("role", userRole);
          localStorage.setItem("userName", username);

          localStorage.setItem("token_expiry", expiryTime.toString());
          localStorage.setItem("role_expiry", expiryTime.toString());
          localStorage.setItem("userName_expiry", expiryTime.toString());

          // Show success toast
          toast.success(successMessage, {
            duration: 2000,
            position: "top-right",
          });

          // Redirect after toast is shown
          setTimeout(() => {
            if (userRole === "superadmin") router.push("/superadmin");
            else if (userRole === "member") router.push("/Partner");
            else if (userRole === "agent") router.push("/agent");
            else toast.error("Unknown role: " + userRole);
          }, 3000);

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

  useEffect(() => {
    const token = getItemWithExpiry("token");
    const userRole = getItemWithExpiry("role");

    if (token && userRole) {
      setTimeout(() => {
        if (userRole === "superadmin") router.push("/superadmin");
        else if (userRole === "member") router.push("/Partner");
        else if (userRole === "agent") router.push("/agent");
        else toast.error("Unknown role: " + userRole);
        console.log("Redirecting to home page")
      }, 2000);
    }
  }, [router]);

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <Toaster position="top-right" reverseOrder={false} />
      <form
        onSubmit={handleLogin}
        className="w-[300px] bg-[#1c3360] text-white rounded-[30px] py-6 px-5 space-y-3 text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
      >
        <h1 className="text-lg font-semibold">Login Page</h1>
        <hr className="border-t border-white w-1/2 mx-auto" />
        <p className="text-xs">Login to manage your Dashboard</p>

        <input
          type="text"
          className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none"
          placeholder="Your Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        <input
          type="email"
          className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none pr-8"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>

        <p className="text-[10px] leading-4 text-gray-200">
          Use your <span className="text-white font-medium">username, email</span> or{" "}
          <span className="text-white font-medium">password</span> to log in
        </p>

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 w-1/2 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
        >
          {loading ? "Logging in..." : "Submit"}
        </button>

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
      </form>
    </main>
  );
}