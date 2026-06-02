import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl"></div>

      <div className="absolute top-40 -right-40 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl"></div>

      <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl"></div>
      <div className="mx-auto my-4 h-px max-w-6xl bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white shadow-md">
              🏆 LeagueHub
            </span>

            <h1 className="mb-6 text-5xl font-extrabold leading-tight text-gray-900 md:text-7xl">
              הפלטפורמה החכמה
              <span className="block text-slate-500">לניהול ליגות ספורט</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-gray-600">
              נהל ליגות, קבוצות, משחקים, טבלאות וסטטיסטיקות בזמן אמת — הכל במקום
              אחד.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/leagues"
                className="rounded-2xl bg-black px-6 py-4 text-center text-base font-medium text-white transition hover:bg-gray-800"
              >
                בוא נתחיל
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-gray-300 px-6 py-4 text-center text-base font-medium text-gray-700 transition hover:bg-gray-50"
              >
                לאזור האישי
              </Link>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">ליגת הדגמה</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                פעילה
              </span>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">12</p>
                <p className="text-sm text-gray-500">קבוצות</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">34</p>
                <p className="text-sm text-gray-500">משחקים</p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-sm text-gray-500">מחזורים</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                <span className="font-medium text-gray-800">האריות</span>
                <span className="font-bold text-gray-900">21 נק'</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                <span className="font-medium text-gray-800">הנשרים</span>
                <span className="font-bold text-gray-900">18 נק'</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                <span className="font-medium text-gray-800">הירוקים</span>
                <span className="font-bold text-gray-900">16 נק'</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto my-4 h-px max-w-6xl bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900">
              למה לבחור ב-LeagueHub?
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              כל מה שצריך לניהול ליגה במקום אחד.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm">
              <div className="mb-4 text-5xl">🏆</div>
              <h3 className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
                ניהול ליגות
              </h3>
              <p className="text-gray-600">
                יצירת ליגות וניהול קבוצות בצורה פשוטה ומהירה.
              </p>
            </div>

            <div className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm">
              <div className="mb-4 text-5xl">⚽</div>
              <h3 className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
                ניהול משחקים
              </h3>
              <p className="text-gray-600">
                קביעת משחקים, עדכון תוצאות ומעקב אחרי מחזורים.
              </p>
            </div>

            <div className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm">
              <div className="mb-4 text-5xl">📊</div>
              <h3 className="rounded-3xl bg-gray-50 p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
                סטטיסטיקות בזמן אמת
              </h3>
              <p className="text-gray-600">
                טבלאות, מלך שערים, בישולים וכרטיסים במקום אחד.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto my-4 h-px max-w-6xl bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900">איך זה עובד?</h2>

            <p className="mt-4 text-lg text-gray-600">
              תוך כמה דקות אפשר להקים ליגה מלאה.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl bg-white p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 text-6xl">1️⃣</div>
              <h3 className="mb-2 text-xl font-bold">צור ליגה</h3>
              <p className="text-sm text-gray-600">
                פתח ליגה חדשה תוך פחות מדקה.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 text-6xl">2️⃣</div>
              <h3 className="mb-2 text-xl font-bold">הוסף קבוצות</h3>
              <p className="text-sm text-gray-600">
                בנה את הליגה שלך עם כל הקבוצות המשתתפות.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 text-6xl">3️⃣</div>
              <h3 className="mb-2 text-xl font-bold">נהל משחקים</h3>
              <p className="text-sm text-gray-600">
                קבע משחקים ועדכן תוצאות בקלות.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-8 text-center shadow-sm transition hover:-translate-y-2 hover:shadow-xl">
              <div className="mb-4 text-6xl">4️⃣</div>
              <h3 className="mb-2 text-xl font-bold">עקוב אחרי סטטיסטיקות</h3>
              <p className="text-sm text-gray-600">
                טבלאות, מלך שערים ובישולים בזמן אמת.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto my-4 h-px max-w-6xl bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      <section className="bg-slate-900 py-24 text-center text-white">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-4xl font-extrabold">מוכן להקים את הליגה שלך?</h2>

          <p className="mt-6 text-lg text-slate-300">
            צור ליגה, הוסף קבוצות, נהל משחקים וסטטיסטיקות במקום אחד.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/leagues/create"
              className="rounded-2xl bg-white px-8 py-4 font-bold text-black transition hover:bg-gray-200"
            >
              🏆 צור ליגה עכשיו
            </Link>

            <Link
              href="/leagues"
              className="rounded-2xl border border-white/30 px-8 py-4 font-bold text-white transition hover:bg-white/10"
            >
              ⚽ צפה בליגות
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
