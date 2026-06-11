import Link from "next/link";
import LeagueVisual from "@/components/LeagueVisual";

export default function LeagueCard({ league }) {
  return (
    <Link href={`/leagues/${league.id}`}>
      <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md hover:-translate-y-1">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-emerald-300/20 bg-emerald-400/10 font-black text-emerald-700">
              <LeagueVisual league={league} size={48} />
            </div>

            <div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {league.name}
              </h2>
              <p className="text-sm text-gray-500">
                {league.sport} | {league.location}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {league.status}
          </span>
        </div>

        <p className="mb-4 text-gray-600">{league.description}</p>

        <div className="text-sm text-gray-500">
          מספר קבוצות:{" "}
          <span className="font-semibold">{league.teamsCount}</span>
        </div>
      </div>
    </Link>
  );
}
