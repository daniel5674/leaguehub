import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
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

    league.matches.push(newMatch);
    league.standings = calculateStandings(league.teams, league.matches);

    await league.save();

    const savedMatch = league.matches[league.matches.length - 1];

    const homeTeam = league.teams.find(
      (team) =>
        team.name?.trim().toLowerCase() ===
        savedMatch.homeTeam?.trim().toLowerCase()
    );

    const awayTeam = league.teams.find(
      (team) =>
        team.name?.trim().toLowerCase() ===
        savedMatch.awayTeam?.trim().toLowerCase()
    );

    const captains = [
      ...(homeTeam?.players?.filter((player) => player.isCaptain) || []),
      ...(awayTeam?.players?.filter((player) => player.isCaptain) || []),
    ];

    console.log("savedMatch:", savedMatch);
    console.log("homeTeam:", homeTeam?.name);
    console.log("awayTeam:", awayTeam?.name);
    console.log(
      "captains:",
      captains.map((captain) => ({
        fullName: captain.fullName,
        email: captain.email,
        isCaptain: captain.isCaptain,
      }))
    );

    for (const captain of captains) {
      if (!captain.email) {
        console.log("Captain without email:", captain);
        continue;
      }

      const user = await User.findOne({
        email: captain.email.trim().toLowerCase(),
      });

      console.log("Looking for user:", captain.email);
      console.log("Found user:", user?.email);

      if (!user) continue;

      const alreadyHasNotification = user.notifications.some(
        (notification) =>
          String(notification.matchId) === String(savedMatch._id) &&
          notification.actionType === "report-match"
      );

      if (alreadyHasNotification) {
        console.log("Notification already exists for:", user.email);
        continue;
      }

      user.notifications.push({
        message: `יש לך משחק שממתין לדיווח: ${savedMatch.homeTeam} נגד ${savedMatch.awayTeam}`,
        leagueId: String(league._id),
        leagueName: league.name,
        matchId: String(savedMatch._id),
        actionType: "report-match",
        type: "match-report",
        read: false,
      });

      await user.save();

      console.log("Notification added to:", user.email);
    }

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
      scorers,
      assists,
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

    if (action === "RESET_CAPTAIN_REPORTS") {
      if (!isOwner) {
        return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
      }

      const updatedMatches = league.matches.map((match) => {
        if (String(match._id) !== String(matchId)) {
          return match;
        }

        return {
          ...match.toObject(),
          captainReports: [],
          homeScore: null,
          awayScore: null,
          score: "טרם נקבע",
          isFinalApproved: false,
        };
      });

      league.matches = updatedMatches;

      await league.save();

      const resetMatch = league.matches.find(
        (match) => String(match._id) === String(matchId)
      );

      const manager = await User.findOne({
        email: currentUser.email?.trim().toLowerCase(),
      });

      if (manager) {
        manager.notifications = manager.notifications.filter(
          (notification) =>
            !(
              String(notification.matchId) === String(matchId) &&
              notification.actionType === "review-match-report"
            )
        );

        await manager.save();
      }

      const homeTeam = league.teams.find(
        (team) =>
          team.name?.trim().toLowerCase() ===
          resetMatch?.homeTeam?.trim().toLowerCase()
      );

      const awayTeam = league.teams.find(
        (team) =>
          team.name?.trim().toLowerCase() ===
          resetMatch?.awayTeam?.trim().toLowerCase()
      );

      const captains = [
        ...(homeTeam?.players?.filter((player) => player.isCaptain) || []),
        ...(awayTeam?.players?.filter((player) => player.isCaptain) || []),
      ];

      for (const captain of captains) {
        if (!captain.email) continue;

        const user = await User.findOne({
          email: captain.email.trim().toLowerCase(),
        });

        if (!user) continue;

        const alreadyHasNotification = user.notifications.some(
          (notification) =>
            String(notification.matchId) === String(matchId) &&
            notification.actionType === "report-match"
        );

        if (alreadyHasNotification) continue;

        user.notifications.push({
          message: `הדיווח למשחק ${resetMatch.homeTeam} נגד ${resetMatch.awayTeam} נדחה. יש לשלוח דיווח מחדש.`,
          leagueId: String(league._id),
          leagueName: league.name,
          matchId: String(matchId),
          actionType: "report-match",
          type: "match-report",
          read: false,
        });

        await user.save();
      }

      return NextResponse.json({
        ...league.toObject(),
        id: league._id,
        matches: league.matches.map((match) => ({
          ...match.toObject(),
          id: match._id,
        })),
      });
    }

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

    if (action === "SUBMIT_MATCH_REPORT") {
      const { captainUserId, captainName, teamName } = body;

      const updatedMatches = league.matches.map((match) => {
        if (String(match._id) !== String(matchId)) {
          return match;
        }

        const reports = match.captainReports || [];

        const filteredReports = reports.filter(
          (report) => String(report.captainUserId) !== String(captainUserId)
        );

        return {
          ...match.toObject(),

          captainReports: [
            ...filteredReports,
            {
              captainUserId,
              captainName,
              teamName,

              homeScore: Number(homeScore),
              awayScore: Number(awayScore),

              scorers: scorers || [],
              assists: assists || [],

              blueCards: match.blueCards || [],
            },
          ],
        };
      });

      league.matches = updatedMatches;

      await league.save();

      const reportingUser = await User.findOne({
        email: currentUser.email?.trim().toLowerCase(),
      });

      if (reportingUser) {
        reportingUser.notifications = reportingUser.notifications.filter(
          (notification) =>
            !(
              String(notification.matchId) === String(matchId) &&
              notification.actionType === "report-match"
            )
        );

        await reportingUser.save();
      }

      const updatedMatch = league.matches.find(
        (match) => String(match._id) === String(matchId)
      );

      if ((updatedMatch?.captainReports?.length || 0) >= 2) {
        const manager = await User.findOne({
          email: String(league.createdBy).trim().toLowerCase(),
        });

        if (manager) {
          const alreadyHasNotification = manager.notifications?.some(
            (notification) =>
              String(notification.matchId) === String(matchId) &&
              notification.actionType === "review-match-report"
          );

          if (!alreadyHasNotification) {
            manager.notifications.push({
              message: `התקבלו שני דיווחים למשחק ${updatedMatch.homeTeam} נגד ${updatedMatch.awayTeam}.`,
              leagueId: String(league._id),
              leagueName: league.name,
              matchId: String(matchId),
              actionType: "review-match-report",
              type: "match-review",
              read: false,
            });

            await manager.save();
          }
        }
      }

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

      const matchToApprove = league.matches.find(
        (match) => String(match._id) === String(matchId)
      );

      if (!matchToApprove) {
        return NextResponse.json({ message: "המשחק לא נמצא" }, { status: 404 });
      }

      if (matchToApprove.isFinalApproved) {
        return NextResponse.json(
          { message: "המשחק כבר אושר" },
          { status: 400 }
        );
      }

      const approvedReport = matchToApprove.captainReports?.[0];

      const addGoalsToTable = (scorers = []) => {
        scorers.forEach((scorer) => {
          const goalsToAdd = Number(scorer.goals) || 0;
          if (!scorer.playerName || !scorer.teamName || goalsToAdd <= 0) return;

          const existingScorer = league.topScorers.find(
            (item) =>
              item.playerName?.trim().toLowerCase() ===
                scorer.playerName?.trim().toLowerCase() &&
              item.teamName?.trim().toLowerCase() ===
                scorer.teamName?.trim().toLowerCase()
          );

          if (existingScorer) {
            existingScorer.goals += goalsToAdd;
          } else {
            league.topScorers.push({
              playerName: scorer.playerName,
              teamName: scorer.teamName,
              goals: goalsToAdd,
            });
          }
        });
      };

      const addAssistsToTable = (assists = []) => {
        assists.forEach((assist) => {
          const assistsToAdd = Number(assist.assists) || 0;
          if (!assist.playerName || !assist.teamName || assistsToAdd <= 0)
            return;

          const existingAssist = league.topAssists.find(
            (item) =>
              item.playerName?.trim().toLowerCase() ===
                assist.playerName?.trim().toLowerCase() &&
              item.teamName?.trim().toLowerCase() ===
                assist.teamName?.trim().toLowerCase()
          );

          if (existingAssist) {
            existingAssist.assists += assistsToAdd;
          } else {
            league.topAssists.push({
              playerName: assist.playerName,
              teamName: assist.teamName,
              assists: assistsToAdd,
            });
          }
        });
      };

      addGoalsToTable(approvedReport?.scorers || []);
      addAssistsToTable(approvedReport?.assists || []);

      const updatedMatches = league.matches.map((match) => {
        if (String(match._id) !== String(matchId)) return match;

        return {
          ...match.toObject(),
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
          score: `${homeScore}-${awayScore}`,
          isFinalApproved: true,
        };
      });

      const updatedStandings = calculateStandings(league.teams, updatedMatches);

      league.matches = updatedMatches;
      league.standings = updatedStandings;

      const manager = await User.findOne({
        email: currentUser.email?.trim().toLowerCase(),
      });

      if (manager) {
        manager.notifications = manager.notifications.filter(
          (notification) =>
            !(
              String(notification.matchId) === String(matchId) &&
              notification.actionType === "review-match-report"
            )
        );

        await manager.save();
      }
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
