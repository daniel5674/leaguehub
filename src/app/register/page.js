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
  const [visiblePasswords, setVisiblePasswords] = useState({
    password: false,
    confirmPassword: false,
  });

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
      <Image
        src="/backgrounds/auth-stadium-wide.png"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        quality={95}
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />

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
          <p className="mt-1 text-xs text-gray-200">צור חשבון חדש</p>
        </div>

        {/* Card */}
        <div className="mt-6 rounded-3xl border border-white/20 bg-black/55 p-7 shadow-2xl backdrop-blur-xl">

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
              <div className="relative">
                <input
                  type={visiblePasswords.password ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-4 pl-14 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisiblePasswords((current) => ({
                      ...current,
                      password: !current.password,
                    }))
                  }
                  aria-label={visiblePasswords.password ? "הסתר סיסמה" : "הצג סיסמה"}
                  aria-pressed={visiblePasswords.password}
                  className={`absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
                    visiblePasswords.password
                      ? "border-green-400/60 bg-green-400/20 shadow-[0_0_12px_rgba(74,222,128,0.55)]"
                      : "border-white/15 bg-black/25 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src="/icons/champions-ball.png"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-400">אימות סיסמה</label>
              <div className="relative">
                <input
                  type={visiblePasswords.confirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pr-4 pl-14 text-sm text-white placeholder-gray-600 outline-none transition focus:border-green-500/50 focus:ring-2 focus:ring-green-500/20"
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisiblePasswords((current) => ({
                      ...current,
                      confirmPassword: !current.confirmPassword,
                    }))
                  }
                  aria-label={visiblePasswords.confirmPassword ? "הסתר סיסמה" : "הצג סיסמה"}
                  aria-pressed={visiblePasswords.confirmPassword}
                  className={`absolute top-1/2 left-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400 ${
                    visiblePasswords.confirmPassword
                      ? "border-green-400/60 bg-green-400/20 shadow-[0_0_12px_rgba(74,222,128,0.55)]"
                      : "border-white/15 bg-black/25 opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image
                    src="/icons/champions-ball.png"
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 object-contain"
                  />
                </button>
              </div>
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

        <p className="mt-5 text-center text-xs text-gray-200">
          יש לך כבר חשבון?{" "}
          <Link href="/login" className="font-bold text-green-400 hover:text-green-300">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}
