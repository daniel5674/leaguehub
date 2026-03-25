export default function StandingsTable({ standings }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold">טבלת ליגה</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-right">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">קבוצה</th>
              <th className="px-4 py-3">מש'</th>
              <th className="px-4 py-3">נצ'</th>
              <th className="px-4 py-3">ת'</th>
              <th className="px-4 py-3">הפ'</th>
              <th className="px-4 py-3">ז'</th>
              <th className="px-4 py-3">ח'</th>
              <th className="px-4 py-3">הפרש</th>
              <th className="px-4 py-3">נק'</th>
            </tr>
          </thead>

          <tbody>
            {standings.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-gray-500">
                  עדיין אין נתוני טבלה לליגה הזאת.
                </td>
              </tr>
            ) : (
              standings.map((row, index) => (
                <tr
                  key={row.team}
                  className={`border-b border-gray-100 transition-all duration-300 ${
                    index === 0
                      ? "bg-yellow-100 scale-[1.01] shadow-md"
                      : index === 1
                      ? "bg-gray-100"
                      : index === 2
                      ? "bg-orange-100"
                      : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold">
                    {index === 0
                      ? "🥇"
                      : index === 1
                      ? "🥈"
                      : index === 2
                      ? "🥉"
                      : index + 1}
                  </td>

                  <td className="px-4 py-3 font-medium">{row.team}</td>
                  <td className="px-4 py-3">{row.played}</td>
                  <td className="px-4 py-3">{row.wins}</td>
                  <td className="px-4 py-3">{row.draws}</td>
                  <td className="px-4 py-3">{row.losses}</td>
                  <td className="px-4 py-3">{row.goalsFor}</td>
                  <td className="px-4 py-3">{row.goalsAgainst}</td>
                  <td className="px-4 py-3">{row.goalDifference}</td>
                  <td className="px-4 py-3 font-bold">{row.points}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
