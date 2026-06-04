import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";

const ratingOrder = { A: 0, B: 1, C: 2, D: 3 };

const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

export async function POST(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;
    const body = await request.json();

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    if (league.leagueType !== "personal") {
      return NextResponse.json(
        { message: "אפשר ליצור קבוצות רק בליגה אישית" },
        { status: 400 }
      );
    }

    const sourcePlayers =
      Array.isArray(body.players) && body.players.length > 0
        ? body.players
        : league.personalPlayers || [];

    const teamsCount = Number(body.teamsCount) || 2;

    if (sourcePlayers.length < 2) {
      return NextResponse.json(
        { message: "צריך לפחות 2 שחקנים כדי ליצור קבוצות" },
        { status: 400 }
      );
    }

    if (teamsCount < 2) {
      return NextResponse.json(
        { message: "צריך לבחור לפחות 2 קבוצות" },
        { status: 400 }
      );
    }

    if (teamsCount > sourcePlayers.length) {
      return NextResponse.json(
        { message: "אי אפשר ליצור יותר קבוצות ממספר השחקנים" },
        { status: 400 }
      );
    }

    // Shuffle within rating groups, then sort by rating for snake draft
    const shuffled = shuffleArray([...sourcePlayers]);
    const sorted = shuffled.sort(
      (a, b) => (ratingOrder[a.rating] ?? 3) - (ratingOrder[b.rating] ?? 3)
    );

    // Equal teams: only assign players that fit evenly
    const playersPerTeam = Math.floor(sorted.length / teamsCount);
    const assignable = sorted.slice(0, playersPerTeam * teamsCount);

    const teams = Array.from({ length: teamsCount }, (_, i) => ({
      name: `קבוצה ${i + 1}`,
      players: [],
    }));

    // Snake draft: A→T1, A→T2, B→T2, B→T1, C→T1, ...
    assignable.forEach((player, idx) => {
      const round = Math.floor(idx / teamsCount);
      const pos = idx % teamsCount;
      const teamIdx = round % 2 === 0 ? pos : teamsCount - 1 - pos;
      teams[teamIdx].players.push({
        fullName: player.fullName,
        rating: player.rating,
      });
    });

    league.generatedTeams = teams;
    await league.save();

    return NextResponse.json({ ...league.toObject(), id: league._id });
  } catch (error) {
    console.error("Generate teams error:", error);
    return NextResponse.json(
      { message: "שגיאה ביצירת קבוצות מאוזנות" },
      { status: 500 }
    );
  }
}
