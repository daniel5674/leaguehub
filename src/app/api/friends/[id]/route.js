import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import { getUserFromToken } from "@/lib/getUserFromToken";
import Friendship from "@/models/Friendship";
import User from "@/models/User";

const findFriendship = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return Friendship.findById(id);
};

export async function PATCH(request, { params }) {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await request.json();
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ message: "פעולה לא תקינה" }, { status: 400 });
    }

    const friendship = await findFriendship(id);
    if (!friendship || friendship.status !== "pending") {
      return NextResponse.json(
        { message: "בקשת החברות לא נמצאה" },
        { status: 404 }
      );
    }
    if (String(friendship.recipient) !== String(authUser.userId)) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    if (action === "reject") {
      await friendship.deleteOne();
      return NextResponse.json({ message: "בקשת החברות נדחתה" });
    }

    friendship.status = "accepted";
    friendship.acceptedAt = new Date();
    await friendship.save();

    const recipient = await User.findById(authUser.userId).select("fullName");
    await User.updateOne(
      { _id: friendship.requester },
      {
        $push: {
          notifications: {
            message: `${recipient?.fullName || "המשתמש"} אישר את בקשת החברות שלך`,
            actorUserId: String(authUser.userId),
            actorName: recipient?.fullName || "המשתמש",
            actionType: "friend-accepted",
            type: "friend-accepted",
          },
        },
      }
    );

    return NextResponse.json({ message: "בקשת החברות אושרה" });
  } catch (error) {
    console.error("PATCH friendship error:", error);
    return NextResponse.json(
      { message: "שגיאה בעדכון בקשת החברות" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectToDB();

    const authUser = await getUserFromToken();
    if (!authUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const { id } = await params;
    const friendship = await findFriendship(id);
    if (!friendship) {
      return NextResponse.json({ message: "הקשר לא נמצא" }, { status: 404 });
    }

    const isParticipant =
      String(friendship.requester) === String(authUser.userId) ||
      String(friendship.recipient) === String(authUser.userId);
    const canDelete =
      isParticipant &&
      (friendship.status === "accepted" ||
        String(friendship.requester) === String(authUser.userId));

    if (!canDelete) {
      return NextResponse.json({ message: "אין הרשאה" }, { status: 403 });
    }

    await friendship.deleteOne();
    return NextResponse.json({
      message:
        friendship.status === "accepted"
          ? "החברות הוסרה"
          : "בקשת החברות בוטלה",
    });
  } catch (error) {
    console.error("DELETE friendship error:", error);
    return NextResponse.json(
      { message: "שגיאה בהסרת החברות" },
      { status: 500 }
    );
  }
}
