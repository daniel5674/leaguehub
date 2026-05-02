"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "player",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (form.password !== form.confirmPassword) {
      setMessage("הסיסמאות לא תואמות");
      return;
    }

    setLoading(true);

    const result = await register({
      email: form.email,
      password: form.password,
      role: form.role,
      fullName: form.fullName,
    });

    if (!result.success) {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/login");
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-6 py-12">
      <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">הרשמה</h1>
        <p className="mb-6 text-gray-500">צור חשבון חדש ב-LeagueHub</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="אימייל"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="אימות סיסמה"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          <input
            type="text"
            name="fullName"
            placeholder="שם מלא"
            value={form.fullName}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          >
            <option value="player">שחקן</option>
            <option value="manager">מנהל</option>
          </select>

          {message && <p className="text-sm text-red-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "נרשם..." : "צור חשבון"}
          </button>
        </form>
      </div>
    </main>
  );
}
