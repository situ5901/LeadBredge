"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const endpoints = [
    {
      url: "https://keshvacredit.com/api/v1/admin/login",
      body: {
        adminMail: email,
        adminName: username,
        password: password,
      },
    },
    {
      url: "https://keshvacredit.com/api/v1/member/login",
      body: {
        MemberMail: email,
        Membername: username,
        MemberPassword: password,
      },
    },
    {
      url: "https://keshvacredit.com/api/v1/agent/login",
      body: {
        AgentMail: email,
        Agentname: username,
        AgentPassword: password,
      },
    },
  ];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      let success = false;

      for (const { url, body } of endpoints) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (res.ok && data.token && data.role) {
          const role = data.role.toLowerCase();
          const token = data.token;

          localStorage.setItem("token", token);
          localStorage.setItem("role", role);

          // 🔀 Redirect based on role
          if (role === "superadmin") router.push("/superadmin");
          else if (role === "member") router.push("/member");
          else if (role === "agent") router.push("/agent");
          else toast.error("Unknown role: " + role);

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

        <input
          type="password"
          className="w-full bg-white text-black text-xs px-3 py-1.5 rounded-md outline-none"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <p className="text-[10px] leading-4 text-gray-200">
          Use your <span className="text-white font-medium">username, email</span> or <span className="text-white font-medium">password</span> to log in
        </p>


        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 w-1/2 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
        >
          {loading ? "Logging..." : "Submit"}
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
