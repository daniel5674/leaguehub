// import Link from "next/link";
// import LeagueCard from "@/components/LeagueCard";
// import { leagues } from "@/data/leagues";

// export default function Home() {
//   const featuredLeagues = leagues.slice(0, 2);

//   return (
//     <main>
//       <section className="bg-gray-100">
//         <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
//           <h1 className="mb-4 text-5xl font-bold">ברוכים הבאים ל-LeagueHub</h1>

//           <p className="mb-8 max-w-2xl text-lg text-gray-600">
//             פלטפורמה חכמה לניהול ליגות שכונתיות, קבוצות, משחקים, תוצאות וטבלאות
//             במקום אחד.
//           </p>

//           <div className="flex flex-col gap-4 sm:flex-row">
//             <Link
//               href="/leagues/create"
//               className="rounded-xl bg-black px-6 py-3 text-white transition hover:bg-gray-800"
//             >
//               צור ליגה
//             </Link>

//             <Link
//               href="/leagues"
//               className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-gray-900 transition hover:bg-gray-50"
//             >
//               צפה בליגות
//             </Link>
//           </div>
//         </div>
//       </section>

//       <section className="mx-auto max-w-7xl px-6 py-16">
//         <div className="mb-8 flex items-center justify-between">
//           <div>
//             <h2 className="mb-2 text-3xl font-bold">ליגות מובילות</h2>
//             <p className="text-gray-600">
//               כמה ליגות לדוגמה שכבר פעילות במערכת.
//             </p>
//           </div>

//           <Link href="/leagues" className="text-sm font-medium hover:underline">
//             לכל הליגות
//           </Link>
//         </div>

//         <div className="grid gap-6 md:grid-cols-2">
//           {featuredLeagues.map((league) => (
//             <LeagueCard key={league.id} league={league} />
//           ))}
//         </div>
//       </section>
//     </main>
//   );
// }

import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-6 py-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <span className="mb-4 inline-block rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              LeagueHub
            </span>

            <h1 className="mb-6 text-4xl font-bold leading-tight text-gray-900 md:text-6xl">
              ניהול ליגות, קבוצות ומשחקים
              <span className="block text-gray-500">במקום אחד</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-8 text-gray-600">
              LeagueHub היא מערכת לניהול ליגות ספורט בצורה פשוטה, מסודרת ונוחה.
              אפשר ליצור ליגה, להוסיף קבוצות, לקבוע משחקים, לעדכן תוצאות ולעקוב
              אחרי טבלת הליגה בזמן אמת.
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
    </main>
  );
}
