import Link from "next/link";

export default function HomePage() {
  return (
    <main
      dir="rtl"
      className="relative min-h-screen overflow-hidden bg-[#050b14] text-white"
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

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-90px)] max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-[1fr_480px]">
        <div>
          <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-black text-emerald-300">
            🏆 LeagueHub
          </span>

          <h1 className="max-w-3xl text-5xl font-black leading-tight md:text-7xl">
            ניהול ליגות
            <span className="block text-emerald-300">במקום אחד</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            צור ליגה, הוסף קבוצות, נהל משחקים, אשר תוצאות ועקוב אחרי סטטיסטיקות
            בצורה פשוטה ונקייה.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/leagues/create"
              className="rounded-2xl bg-emerald-400 px-6 py-4 text-center font-black text-slate-950 transition hover:bg-emerald-300"
            >
              צור ליגה
            </Link>

            <Link
              href="/leagues"
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 text-center font-black text-white backdrop-blur transition hover:bg-white/15"
            >
              צפה בליגות
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-emerald-300">
                Live Preview
              </p>
              <h2 className="mt-1 text-2xl font-black">ליגת הדגמה</h2>
            </div>

            <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-black text-emerald-300">
              פעילה
            </span>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-3">
            <MiniStat value="8" label="קבוצות" />
            <MiniStat value="24" label="משחקים" />
            <MiniStat value="96" label="שערים" />
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">טבלת הליגה</h3>
              <span className="text-xs font-bold text-slate-400">מחזור 3</span>
            </div>

            <div className="space-y-2">
              <PreviewRow place="🥇" team="הפועל" points="21" active />
              <PreviewRow place="🥈" team="ביתר" points="18" />
              <PreviewRow place="🥉" team="מכבי" points="16" />
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <p className="text-xs font-bold text-slate-300">מלך השערים</p>
              <p className="mt-2 text-lg font-black">דניאל אברהם</p>
              <p className="mt-3 text-3xl font-black text-emerald-300">12</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs font-bold text-slate-300">משחק קרוב</p>
              <p className="mt-2 font-black">הפועל נגד ביתר</p>
              <p className="mt-2 text-sm text-slate-400">חמישי · 20:00</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-4 md:grid-cols-4">
          <InfoCard value="25+" label="ליגות פעילות" />
          <InfoCard value="120+" label="קבוצות" />
          <InfoCard value="850+" label="משחקים" />
          <InfoCard value="5000+" label="שערים" />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8">
          <h2 className="text-3xl font-black">כל מה שצריך לניהול ליגה</h2>
          <p className="mt-2 text-slate-400">בלי עומס, בלי אקסלים, בלי בלגן.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon="🏆"
            title="ניהול קבוצות"
            text="הוסף קבוצות, שחקנים וקפטנים בצורה פשוטה."
          />

          <FeatureCard
            icon="⚽"
            title="ניהול משחקים"
            text="צור משחקים, עדכן תוצאות ואשר דיווחים."
          />

          <FeatureCard
            icon="📊"
            title="סטטיסטיקות"
            text="טבלאות, שערים, בישולים, MVP וכרטיסים."
          />
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl backdrop-blur">
          <h2 className="text-3xl font-black">מוכן להקים את הליגה שלך?</h2>

          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            פתח ליגה חדשה ותתחיל לנהל אותה תוך כמה דקות.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/leagues/create"
              className="rounded-2xl bg-emerald-400 px-6 py-3 font-black text-slate-950 transition hover:bg-emerald-300"
            >
              צור ליגה עכשיו
            </Link>

            <Link
              href="/leagues"
              className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-black text-white transition hover:bg-white/15"
            >
              צפייה בליגות
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniStat({ value, label }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-center">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-400">{label}</p>
    </div>
  );
}

function PreviewRow({ place, team, points, active }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
        active
          ? "bg-emerald-400 text-slate-950"
          : "border border-white/10 bg-white/[0.05] text-white"
      }`}
    >
      <span className="font-black">
        {place} {team}
      </span>
      <span className="font-black">{points} נק׳</span>
    </div>
  );
}

function InfoCard({ value, label }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center backdrop-blur">
      <p className="text-3xl font-black text-emerald-300">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-400">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.09]">
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
