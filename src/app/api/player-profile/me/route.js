import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import PlayerProfile from "@/models/PlayerProfile";
import { getUserFromToken } from "@/lib/getUserFromToken";
import League from "@/models/League";

export async function GET() {
  try {
    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const normalizedEmail = currentUser.email?.trim().toLowerCase();

    const profile = await PlayerProfile.findOne({
      email: normalizedEmail,
    });

    if (!profile) {
      return NextResponse.json(
        { message: "לא נמצא כרטיס שחקן" },
        { status: 404 }
      );
    }

    const leagues = await League.find({
      "teams.players.email": normalizedEmail,
    });

    const leagueStats = leagues.map((league) => {
      let playerTeam = null;
      let playerInLeague = null;

      league.teams?.forEach((team) => {
        const player = team.players?.find(
          (p) => p.email?.trim().toLowerCase() === normalizedEmail
        );

        if (player) {
          playerTeam = team;
          playerInLeague = player;
        }
      });

      const goals =
        league.topScorers?.find(
          (scorer) =>
            scorer.playerName?.trim().toLowerCase() ===
              playerInLeague?.fullName?.trim().toLowerCase() &&
            scorer.teamName?.trim().toLowerCase() ===
              playerTeam?.name?.trim().toLowerCase()
        )?.goals || 0;

      const assists =
        league.topAssists?.find(
          (assist) =>
            assist.playerName?.trim().toLowerCase() ===
              playerInLeague?.fullName?.trim().toLowerCase() &&
            assist.teamName?.trim().toLowerCase() ===
              playerTeam?.name?.trim().toLowerCase()
        )?.assists || 0;

      const blueCards =
        league.matches?.reduce((total, match) => {
          const count =
            match.blueCards?.filter(
              (card) =>
                String(card.playerId) === String(playerInLeague?.playerId)
            ).length || 0;

          return total + count;
        }, 0) || 0;

      return {
        leagueId: league._id,
        leagueName: league.name,
        teamName: playerTeam?.name || "",
        isCaptain: !!playerInLeague?.isCaptain,
        goals,
        assists,
        blueCards,
      };
    });

    const totals = leagueStats.reduce(
      (sum, league) => ({
        goals: sum.goals + league.goals,
        assists: sum.assists + league.assists,
        blueCards: sum.blueCards + league.blueCards,
      }),
      { goals: 0, assists: 0, blueCards: 0 }
    );

    return NextResponse.json({
      ...profile.toObject(),
      goals: totals.goals,
      assists: totals.assists,
      blueCards: totals.blueCards,
      leagues: leagueStats,
    });
  } catch (error) {
    console.error("GET player profile error:", error);

    return NextResponse.json(
      { message: "שגיאה בטעינת כרטיס שחקן" },
      { status: 500 }
    );
  }
}
export async function PATCH(request) {
  try {
    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const body = await request.json();

    const updateData = {
      shirtNumber: body.shirtNumber || "",
      position: body.position || "",
      image: body.image || "",
    };

    const profile = await PlayerProfile.findOneAndUpdate(
      { email: currentUser.email?.trim().toLowerCase() },
      updateData,
      { new: true }
    );

    if (!profile) {
      return NextResponse.json(
        { message: "לא נמצא כרטיס שחקן" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("PATCH player profile error:", error);

    return NextResponse.json(
      { message: "שגיאה בעדכון כרטיס שחקן" },
      { status: 500 }
    );
  }
}
