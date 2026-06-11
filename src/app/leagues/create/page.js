"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LeagueVisualPicker from "@/components/LeagueVisualPicker";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { currentUser, isLoaded } = useAuth();

  const [form, setForm] = useState({
    name: "",
    sport: "",
    location: "",
    description: "",
    leagueType: "regular",
    image: "",
    icon: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "manager") {
      router.push("/");
    }
  }, [isLoaded, currentUser, router]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה ביצירת ליגה");
        return;
      }

      router.push("/leagues");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("שגיאה ביצירת ליגה");
    }
  };

  if (!isLoaded) return null;
  if (!currentUser) return null;
  if (currentUser.role !== "manager") return null;

  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-white"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/2 h-[700px] w-[1200px] -translate-x-1/2 opacity-[0.06]">
          <div className="absolute bottom-0 h-full w-full rounded-t-[500px] border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute bottom-0 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full border-4 border-white" />
          <div className="absolute bottom-0 left-1/2 h-72 w-[420px] -translate-x-1/2 border-4 border-white" />
        </div>
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
          <span className="mb-3 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm font-bold text-emerald-300">
            יצירת ליגה
          </span>

          <h1 className="text-4xl font-black">צור ליגה חדשה</h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            מלא את פרטי הליגה, בחר את סוג הליגה, והתחל לנהל קבוצות, משחקים
            וטבלאות במקום אחד.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-6">
              <h2 className="text-xl font-black">פרטי הליגה</h2>
              <p className="mt-1 text-sm text-slate-400">
                הפרטים האלו יוצגו לשחקנים ולמשתמשים באתר.
              </p>
            </div>

            <div className="space-y-4">
              <input
                name="name"
                placeholder="שם הליגה"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60"
                required
              />

              <LeagueVisualPicker
                name={form.name}
                image={form.image}
                icon={form.icon}
                onChange={(visual) =>
                  setForm((prev) => ({ ...prev, ...visual }))
                }
              />

              <select
                name="leagueType"
                value={form.leagueType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400/60"
                required
              >
                <option value="regular">ליגה רגילה - קבוצות קבועות</option>
                <option value="personal">
                  ליגה אישית - שחקנים ללא קבוצות קבועות
                </option>
              </select>

              <input
                name="sport"
                placeholder="ספורט"
                value={form.sport}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60"
                required
              />

              <input
                name="location"
                placeholder="מיקום"
                value={form.location}
                onChange={handleChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60"
                required
              />

              <textarea
                name="description"
                placeholder="תיאור"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/60"
              />

              <button className="w-full rounded-2xl bg-emerald-400 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300">
                צור ליגה
              </button>
            </div>
          </form>

          <aside className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-3xl">
              🏆
            </div>

            <h2 className="text-xl font-black">מה קורה אחרי יצירה?</h2>

            <div className="mt-5 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl bg-slate-950/40 p-4">
                תוכל להוסיף קבוצות ושחקנים לליגה.
              </div>

              <div className="rounded-2xl bg-slate-950/40 p-4">
                תוכל ליצור משחקים ולעדכן תוצאות.
              </div>

              <div className="rounded-2xl bg-slate-950/40 p-4">
                הטבלאות והסטטיסטיקות יתעדכנו לפי המשחקים.
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
