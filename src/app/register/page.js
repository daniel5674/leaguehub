"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";

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
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12" dir="rtl">

      {/* Deep navy background */}
      <div className="absolute inset-0 bg-[#040b18]" />

      {/* Pitch at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5">
        <div className="absolute inset-0 bg-gradient-to-t from-green-900/80 to-transparent" />
        <svg className="absolute inset-0 h-full w-full opacity-25" viewBox="0 0 800 300" preserveAspectRatio="xMidYMax slice">
          <line x1="400" y1="0" x2="400" y2="300" stroke="white" strokeWidth="1.5" />
          <ellipse cx="400" cy="300" rx="140" ry="80" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x="270" y="220" width="260" height="80" fill="none" stroke="white" strokeWidth="1.5" />
          <rect x="340" y="260" width="120" height="40" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="0" y1="0" x2="800" y2="0" stroke="white" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Floodlight beams */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1/3 opacity-60"
          style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-60"
          style={{ background: "linear-gradient(225deg, rgba(255,255,255,0.06) 0%, transparent 60%)" }} />
      </div>

      {/* Stars */}
      {[...Array(30)].map((_, i) => (
        <div key={i} className="absolute h-px w-px rounded-full bg-white"
          style={{ opacity: Math.random() * 0.6 + 0.2, top: `${Math.random() * 55}%`, left: `${Math.random() * 100}%` }} />
      ))}

      {/* Content */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Glowing football */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/[0.03] shadow-[0_0_24px_rgba(74,222,128,0.45),0_0_55px_rgba(34,197,94,0.18)]">
            <Image
              src="/icons/champions-ball.png"
              alt="כדור בסגנון ליגת האלופות"
              width={88}
              height={88}
              className="h-[88px] w-[88px] object-contain drop-shadow-[0_8px_12px_rgba(0,0,0,0.5)]"
              priority
            />
          </div>
        </div>

        <div className="mb-2 text-center">
          <p className="text-xl font-black tracking-widest text-white">LEAGUE<span className="text-green-400">HUB</span></p>
          <p className="mt-1 text-xs text-gray-500">צור חשבון חדש</p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-7 shadow-2xl backdrop-blur-xl">

          {/* Role selector */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              { value: "player", label: "שחקן", desc: "הצטרף לקבוצות" },
              { value: "manager", label: "מנהל", desc: "נהל ליגות" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: option.value }))}
                className={`rounded-2xl border p-3 text-right transition ${
                  form.role === option.value
                    ? "border-green-500/50 bg-green-500/15 text-white"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <p className="text-sm font-bold">{option.label}</p>
                <p className="mt-0.5 text-xs opacity-60">{option.desc}</p>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">שם מלא</label>
              <input
                type="text"
                name="fullName"
                placeholder="ישראל ישראלי"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">אימייל</label>
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">סיסמה</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">אימות סיסמה</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                required
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-green-500 py-3 text-sm font-bold text-black transition hover:bg-green-400 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "יוצר חשבון..." : "צור חשבון"}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-600">
          יש לך כבר חשבון?{" "}
          <Link href="/login" className="font-bold text-green-400 hover:text-green-300">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}
