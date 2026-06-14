import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import PlayerProfile from "@/models/PlayerProfile";
import League from "@/models/League";
import Friendship from "@/models/Friendship";
import { createFriendPairKey } from "@/lib/friendships";
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
    const [profile, leagues, friendship] = await Promise.all([
      PlayerProfile.findOne({ userId: String(user._id) }).lean(),
      League.find({
        $or: [
          { "teams.players.email": normalizedEmail },
          { "personalPlayers.email": normalizedEmail },
        ],
      })
        .select("name leagueType teams personalPlayers")
        .lean(),
      String(currentUser.userId) === String(user._id)
        ? null
        : Friendship.findOne({
            pairKey: createFriendPairKey(currentUser.userId, user._id),
          }).lean(),
    ]);

    const memberships = leagues.map((league) => {
      if (league.leagueType === "personal") {
        const personalPlayer = league.personalPlayers?.find(
          (player) => player.email?.trim().toLowerCase() === normalizedEmail
        );

        return {
          leagueId: league._id,
          leagueName: league.name,
          teamName: "ליגה אישית",
          playerId: personalPlayer?._id || "",
        };
      }

      const team = league.teams?.find((item) =>
        item.players?.some(
          (player) => player.email?.trim().toLowerCase() === normalizedEmail
        )
      );
      const player = team?.players?.find(
        (item) => item.email?.trim().toLowerCase() === normalizedEmail
      );

      return {
        leagueId: league._id,
        leagueName: league.name,
        teamName: team?.name || "",
        playerId: player?.playerId || "",
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
      friendship: friendship
        ? {
            id: String(friendship._id),
            status: friendship.status,
            direction:
              String(friendship.requester) === String(currentUser.userId)
                ? "outgoing"
                : "incoming",
          }
        : null,
      isCurrentUser: String(currentUser.userId) === String(user._id),
    });
  } catch (error) {
    console.error("GET public user profile error:", error);
    return NextResponse.json(
      { message: "שגיאה בטעינת המשתמש" },
      { status: 500 }
    );
  }
}
