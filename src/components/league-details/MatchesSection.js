export default function MatchesSection({
  league,
  matchForm,
  handleMatchChange,
  handleAddMatch,
  scoreInputs,
  handleScoreChange,
  handleSaveScore,
  handleRemoveMatch,
  canManage,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold">משחקים אחרונים</h2>

      {canManage ? (
        <form onSubmit={handleAddMatch} className="mb-6 space-y-3">
          <select
            name="homeTeam"
            value={matchForm.homeTeam}
            onChange={handleMatchChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          >
            <option value="">בחר קבוצה בית</option>
            {league.teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <select
            name="awayTeam"
            value={matchForm.awayTeam}
            onChange={handleMatchChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          >
            <option value="">בחר קבוצה חוץ</option>
            {league.teams
              .filter((team) => team !== matchForm.homeTeam)
              .map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
          </select>

          <input
            type="date"
            name="date"
            value={matchForm.date}
            onChange={handleMatchChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <input
            type="time"
            name="time"
            value={matchForm.time}
            onChange={handleMatchChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <input
            type="text"
            name="location"
            placeholder="מיקום"
            value={matchForm.location}
            onChange={handleMatchChange}
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />

          <button
            disabled={league.teams.length < 2}
            className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            הוסף משחק
          </button>

          {league.teams.length < 2 && (
            <p className="text-sm text-red-500">
              צריך לפחות 2 קבוצות כדי ליצור משחק.
            </p>
          )}
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500">
          רק יוצר הליגה יכול להוסיף משחקים, למחוק ולעדכן תוצאות.
        </p>
      )}

      <div className="space-y-4">
        {league.matches.length === 0 ? (
          <p className="text-gray-500">אין עדיין משחקים בליגה.</p>
        ) : (
          league.matches.map((match) => (
            <div
              key={match.id}
              className="rounded-xl border border-gray-200 p-4"
            >
              <p className="mb-2 font-semibold">
                {match.homeTeam} נגד {match.awayTeam}
              </p>

              <p className="text-sm text-gray-600">
                תאריך: {match.date} | שעה: {match.time}
              </p>

              <p className="text-sm text-gray-600">מיקום: {match.location}</p>

              <p className="mt-2 font-medium text-gray-900">
                תוצאה: {match.score}
              </p>

              {canManage && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="number"
                    min="0"
                    placeholder="בית"
                    value={scoreInputs[match.id]?.homeScore ?? ""}
                    onChange={(e) =>
                      handleScoreChange(match.id, "homeScore", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black sm:w-24"
                  />

                  <input
                    type="number"
                    min="0"
                    placeholder="חוץ"
                    value={scoreInputs[match.id]?.awayScore ?? ""}
                    onChange={(e) =>
                      handleScoreChange(match.id, "awayScore", e.target.value)
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-black sm:w-24"
                  />

                  <button
                    onClick={() => handleSaveScore(match.id)}
                    className="rounded-xl bg-black px-4 py-2 text-white hover:bg-gray-800"
                  >
                    שמור תוצאה
                  </button>
                </div>
              )}

              {canManage && (
                <button
                  onClick={() => handleRemoveMatch(match.id)}
                  className="mt-3 text-sm text-red-500 transition hover:scale-105 hover:text-red-700"
                >
                  מחק משחק
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
