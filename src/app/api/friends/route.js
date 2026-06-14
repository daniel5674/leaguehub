import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { createFriendPairKey, getOtherFriendId } from "@/lib/friendships";
import { getUserFromToken } from "@/lib/getUserFromToken";
import Friendship from "@/models/Friendship";
import PlayerProfile from "@/models/PlayerProfile";
import User from "@/models/User";

const publicUserFields = "fullName role";

const serializeUser = (user, profilesByUserId) => ({
  id: String(user._id),
  fullName: user.fullName,
  role: user.role,
  image: profilesByUserId.get(String(user._id))?.image || "",
  position: profilesByUserId.get(String(user._id))?.position || "",
});

export async function GET() {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const friendships = await Friendship.find({
      $or: [{ requester: authUser.userId }, { recipient: authUser.userId }],
    })
      .sort({ updatedAt: -1 })
      .lean();

    const connectedIds = friendships.map((friendship) =>
      String(getOtherFriendId(friendship, authUser.userId))
    );
    const users = await User.find({
      _id: { $in: connectedIds },
    })
      .select(publicUserFields)
      .lean();

    const excludedIds = [authUser.userId, ...connectedIds];
    const suggestions = await User.find({
      _id: { $nin: excludedIds },
    })
      .select(publicUserFields)
      .sort({ fullName: 1 })
      .limit(100)
      .lean();

    const allUsers = [...users, ...suggestions];
    const profiles = await PlayerProfile.find({
      userId: { $in: allUsers.map((user) => String(user._id)) },
    })
      .select("userId image position")
      .lean();

    const profilesByUserId = new Map(
      profiles.map((profile) => [String(profile.userId), profile])
    );
    const usersById = new Map(
      users.map((user) => [
        String(user._id),
        serializeUser(user, profilesByUserId),
      ])
    );

    const result = {
      friends: [],
      incoming: [],
      outgoing: [],
      suggestions: suggestions.map((user) =>
        serializeUser(user, profilesByUserId)
      ),
    };

    friendships.forEach((friendship) => {
      const otherId = String(getOtherFriendId(friendship, authUser.userId));
      const user = usersById.get(otherId);
      if (!user) return;

      const item = {
        id: String(friendship._id),
        user,
        createdAt: friendship.createdAt,
      };

      if (friendship.status === "accepted") {
        result.friends.push(item);
      } else if (String(friendship.recipient) === String(authUser.userId)) {
        result.incoming.push(item);
      } else {
        result.outgoing.push(item);
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET friends error:", error);
    return NextResponse.json(
      { message: "שגיאה בטעינת החברים" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const { recipientId } = await request.json();
    if (!mongoose.isValidObjectId(recipientId)) {
      return NextResponse.json({ message: "משתמש לא תקין" }, { status: 400 });
    }
    if (String(recipientId) === String(authUser.userId)) {
      return NextResponse.json(
        { message: "אי אפשר לשלוח בקשת חברות לעצמך" },
        { status: 400 }
      );
    }

    const [requester, recipient] = await Promise.all([
      User.findById(authUser.userId).select("fullName"),
      User.findById(recipientId).select("fullName"),
    ]);
    if (!requester || !recipient) {
      return NextResponse.json({ message: "המשתמש לא נמצא" }, { status: 404 });
    }

    const pairKey = createFriendPairKey(authUser.userId, recipientId);
    const existing = await Friendship.findOne({ pairKey });
    if (existing) {
      return NextResponse.json(
        {
          message:
            existing.status === "accepted"
              ? "אתם כבר חברים"
              : "כבר קיימת בקשת חברות",
        },
        { status: 409 }
      );
    }

    const friendship = await Friendship.create({
      pairKey,
      requester: authUser.userId,
      recipient: recipientId,
    });

    await User.updateOne(
      { _id: recipientId },
      {
        $push: {
          notifications: {
            message: `${requester.fullName} שלח לך בקשת חברות`,
            actorUserId: String(requester._id),
            actorName: requester.fullName,
            actionType: "friend-request",
            type: "friend-request",
          },
        },
      }
    );

    return NextResponse.json(
      { id: String(friendship._id), message: "בקשת החברות נשלחה" },
      { status: 201 }
    );
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json(
        { message: "כבר קיימת בקשת חברות" },
        { status: 409 }
      );
    }
    console.error("POST friend request error:", error);
    return NextResponse.json(
      { message: "שגיאה בשליחת בקשת החברות" },
      { status: 500 }
    );
  }
}
