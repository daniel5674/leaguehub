import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { playerName, teamName, goals } = await request.json();

    if (!playerName?.trim() || !teamName?.trim()) {
      return NextResponse.json(
        { message: "צריך שם שחקן ושם קבוצה" },
        { status: 400 }
      );
    }

    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    if (!league.topScorers) {
      league.topScorers = [];
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

    const scorerIndex = league.topScorers.findIndex(
      (scorer) =>
        scorer.playerName?.trim().toLowerCase() ===
          normalizedPlayerName.toLowerCase() &&
        scorer.teamName?.trim().toLowerCase() ===
          normalizedTeamName.toLowerCase()
    );

    if (scorerIndex === -1) {
      league.topScorers.push({
        playerName: normalizedPlayerName,
        teamName: normalizedTeamName,
        goals: Number(goals) || 0,
      });
    } else {
      league.topScorers[scorerIndex].goals = Number(goals) || 0;
    }

    league.topScorers.sort((a, b) => b.goals - a.goals);

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("POST top scorers error:", error);

    return NextResponse.json(
      { message: "שגיאה בעדכון מלך השערים" },
      { status: 500 }
    );
  }
}
