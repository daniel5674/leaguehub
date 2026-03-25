export default function TeamsSection({
  league,
  teamName,
  setTeamName,
  handleAddTeam,
  handleRemoveTeam,
  canManage,
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">קבוצות בליגה</h2>
        <span className="text-sm text-gray-500">סה״כ: {league.teamsCount}</span>
      </div>

      {canManage ? (
        <form onSubmit={handleAddTeam} className="mb-6 flex gap-3">
          <input
            type="text"
            placeholder="הכנס שם קבוצה"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
          />
          <button className="rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-800">
            הוסף
          </button>
        </form>
      ) : (
        <p className="mb-6 text-sm text-gray-500">
          רק יוצר הליגה יכול להוסיף או למחוק קבוצות.
        </p>
      )}

      <ul className="space-y-3">
        {league.teams.length === 0 ? (
          <li className="text-gray-500">אין עדיין קבוצות בליגה.</li>
        ) : (
          league.teams.map((team) => (
            <li
              key={team}
              className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3"
            >
              <span>{team}</span>

              {canManage && (
                <button
                  onClick={() => handleRemoveTeam(team)}
                  className="text-sm text-red-500 transition hover:scale-105 hover:text-red-700"
                >
                  מחק
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
