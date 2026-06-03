import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";

const ratingValue = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

const shuffleArray = (array) => {
  return [...array].sort(() => Math.random() - 0.5);
};

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

    const sourcePlayers = Array.isArray(body.players) && body.players.length > 0
      ? body.players
      : league.personalPlayers || [];

    const players = shuffleArray([...sourcePlayers]);

    const teamsCount = Number(body.teamsCount) || 2;

    if (players.length < 2) {
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

    if (teamsCount > players.length) {
      return NextResponse.json(
        { message: "אי אפשר ליצור יותר קבוצות ממספר השחקנים" },
        { status: 400 }
      );
    }

    const teams = Array.from({ length: teamsCount }, (_, index) => ({
      name: `קבוצה ${index + 1}`,
      players: [],
      score: 0,
    }));

    const sortedPlayers = players.sort(
      (a, b) => ratingValue[b.rating] - ratingValue[a.rating]
    );

    sortedPlayers.forEach((player) => {
      teams.sort((a, b) => {
        if (a.players.length !== b.players.length) {
          return a.players.length - b.players.length;
        }

        return a.score - b.score;
      });

      teams[0].players.push({
        fullName: player.fullName,
        rating: player.rating,
      });

      teams[0].score += ratingValue[player.rating] || 1;
    });

    league.generatedTeams = teams.map((team) => ({
      name: team.name,
      players: team.players,
    }));

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("Generate teams error:", error);
    return NextResponse.json(
      { message: "שגיאה ביצירת קבוצות מאוזנות" },
      { status: 500 }
    );
  }
}
