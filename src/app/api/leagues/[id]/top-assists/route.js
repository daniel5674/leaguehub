import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";

export async function POST(req, { params }) {
  try {
    await connectToDB();

    const { id } = await params;

    const body = await req.json();

    const { playerName, teamName, assists } = body;

    if (!playerName || !teamName || assists === undefined) {
      return NextResponse.json({ message: "חסרים נתונים" }, { status: 400 });
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const normalizedPlayerName = playerName.trim();
    const normalizedTeamName = teamName.trim();

    const team = league.teams.find(
      (team) =>
        team.name?.trim().toLowerCase() === normalizedTeamName.toLowerCase()
    );

    if (!team) {
      return NextResponse.json(
        { message: "הקבוצה לא קיימת בליגה" },
        { status: 404 }
      );
    }

    const playerExistsInTeam = team.players?.some(
      (player) =>
        player.fullName?.trim().toLowerCase() ===
        normalizedPlayerName.toLowerCase()
    );

    if (!playerExistsInTeam) {
      return NextResponse.json(
        { message: "השחקן לא קיים בקבוצה הזאת" },
        { status: 400 }
      );
    }

    league.topAssists.push({
      playerName: normalizedPlayerName,
      teamName: normalizedTeamName,
      assists,
    });

    await league.save();

    return NextResponse.json(league);
  } catch (error) {
    console.error("Failed to add top assist:", error);

    return NextResponse.json({ message: "שגיאת שרת" }, { status: 500 });
  }
}
