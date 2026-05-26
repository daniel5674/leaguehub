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
    const match = await request.json();

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

    const homeExists = league.teams.some(
      (team) =>
        team.name?.trim().toLowerCase() === match.homeTeam?.trim().toLowerCase()
    );

    const awayExists = league.teams.some(
      (team) =>
        team.name?.trim().toLowerCase() === match.awayTeam?.trim().toLowerCase()
    );

    if (!homeExists || !awayExists) {
      return NextResponse.json(
        { message: "אחת הקבוצות לא קיימת בליגה" },
        { status: 400 }
      );
    }

    const newMatch = {
      ...match,
      score: "טרם נקבע",
      homeScore: null,
      awayScore: null,
    };

    const updatedMatches = [...league.matches, newMatch];
    const updatedStandings = calculateStandings(league.teams, updatedMatches);

    league.matches = updatedMatches;
    league.standings = updatedStandings;

    await league.save();

    return NextResponse.json(
      {
        ...league.toObject(),
        id: league._id,
        matches: league.matches.map((match) => ({
          ...match.toObject(),
          id: match._id,
        })),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST match error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהוספת משחק",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { matchId } = await request.json();

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

    const updatedMatches = league.matches.filter(
      (match) => String(match._id) !== String(matchId)
    );

    const updatedStandings = calculateStandings(league.teams, updatedMatches);

    league.matches = updatedMatches;
    league.standings = updatedStandings;

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      matches: league.matches.map((match) => ({
        ...match.toObject(),
        id: match._id,
      })),
    });
  } catch (error) {
    console.error("DELETE match error:", error);

    return NextResponse.json(
      {
        message: "שגיאה במחיקת משחק",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      action,
      matchId,
      homeScore,
      awayScore,
      playerId,
      playerName,
      teamName,
      minute,
    } = body;

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

    if (action === "ADD_BLUE_CARD") {
      const updatedMatches = league.matches.map((match) => {
        if (String(match._id) !== String(matchId)) {
          return match;
        }

        return {
          ...match.toObject(),
          blueCards: [
            ...(match.blueCards || []),
            {
              playerId,
              playerName,
              teamName,
              minute: minute || null,
            },
          ],
        };
      });

      league.matches = updatedMatches;

      await league.save();

      return NextResponse.json({
        ...league.toObject(),
        id: league._id,
        matches: league.matches.map((match) => ({
          ...match.toObject(),
          id: match._id,
        })),
      });
    }

    if (action === "UPDATE_SCORE") {
      if (!isOwner) {
        return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
      }

      const updatedMatches = league.matches.map((match) => {
        if (String(match._id) !== String(matchId)) return match;

        return {
          ...match.toObject(),
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          score: `${homeScore}-${awayScore}`,
        };
      });

      const updatedStandings = calculateStandings(league.teams, updatedMatches);

      league.matches = updatedMatches;
      league.standings = updatedStandings;
    }

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
      matches: league.matches.map((match) => ({
        ...match.toObject(),
        id: match._id,
      })),
    });
  } catch (error) {
    console.error("PATCH match error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בעדכון תוצאה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
