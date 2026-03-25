import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

function calculateStandings(teams, matches) {
  const teamNames = teams.map((team) => team.name);

  const table = teamNames.map((team) => ({
    team,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  }));

  const findTeamRow = (teamName) => table.find((row) => row.team === teamName);

  matches.forEach((match) => {
    if (match.homeScore === "" || match.awayScore === "") return;
    if (match.homeScore === undefined || match.awayScore === undefined) return;
    if (match.homeScore === null || match.awayScore === null) return;

    const home = findTeamRow(match.homeTeam);
    const away = findTeamRow(match.awayTeam);

    if (!home || !away) return;

    const homeScore = Number(match.homeScore);
    const awayScore = Number(match.awayScore);

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;

    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeScore < awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  return table.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team, "he");
  });
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { teamName } = await request.json();

    if (!teamName?.trim()) {
      return NextResponse.json(
        { message: "צריך לשלוח שם קבוצה" },
        { status: 400 }
      );
    }

    await connectToDB();

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    const trimmedName = teamName.trim();

    const alreadyExists = league.teams.some(
      (team) => team.name?.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (alreadyExists) {
      return NextResponse.json(
        { message: "הקבוצה כבר קיימת" },
        { status: 400 }
      );
    }

    const updatedTeams = [
      ...league.teams,
      {
        name: trimmedName,
        players: [],
      },
    ];

    const updatedStandings = calculateStandings(updatedTeams, league.matches);

    league.teams = updatedTeams;
    league.teamsCount = updatedTeams.length;
    league.standings = updatedStandings;

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("POST team error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהוספת קבוצה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { teamName } = await request.json();

    await connectToDB();

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    if (!isOwner) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    const normalizedTeamName = teamName.trim().toLowerCase();

    const updatedTeams = league.teams.filter(
      (team) => team.name?.trim().toLowerCase() !== normalizedTeamName
    );

    const updatedMatches = league.matches.filter(
      (match) =>
        match.homeTeam.trim().toLowerCase() !== normalizedTeamName &&
        match.awayTeam.trim().toLowerCase() !== normalizedTeamName
    );

    const updatedStandings = calculateStandings(updatedTeams, updatedMatches);

    league.teams = updatedTeams;
    league.teamsCount = updatedTeams.length;
    league.matches = updatedMatches;
    league.standings = updatedStandings;

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("DELETE team error:", error);

    return NextResponse.json(
      {
        message: "שגיאה במחיקת קבוצה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
