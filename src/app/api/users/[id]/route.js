import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import PlayerProfile from "@/models/PlayerProfile";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function GET(request, { params }) {
  try {
    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;
    const user = await User.findById(id).select("fullName email role").lean();

    if (!user) {
      return NextResponse.json({ message: "המשתמש לא נמצא" }, { status: 404 });
    }

    const normalizedEmail = user.email?.trim().toLowerCase();
    const [profile, leagues] = await Promise.all([
      PlayerProfile.findOne({ userId: String(user._id) }).lean(),
      League.find({
        $or: [
          { "teams.players.email": normalizedEmail },
          { "personalPlayers.email": normalizedEmail },
        ],
      })
        .select("name leagueType teams personalPlayers")
        .lean(),
    ]);

    const memberships = leagues.map((league) => {
      if (league.leagueType === "personal") {
        return {
          leagueId: league._id,
          leagueName: league.name,
          teamName: "ליגה אישית",
        };
      }

      const team = league.teams?.find((item) =>
        item.players?.some(
          (player) => player.email?.trim().toLowerCase() === normalizedEmail
        )
      );

      return {
        leagueId: league._id,
        leagueName: league.name,
        teamName: team?.name || "",
      };
    });

    return NextResponse.json({
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      image: profile?.image || "",
      position: profile?.position || "",
      preferredFoot: profile?.preferredFoot || "",
      memberships,
    });
  } catch (error) {
    console.error("GET public user profile error:", error);
    return NextResponse.json(
      { message: "שגיאה בטעינת המשתמש" },
      { status: 500 }
    );
  }
}
