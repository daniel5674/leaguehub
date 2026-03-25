import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    await connectToDB();

    const currentUser = await getUserFromToken();

    if (!currentUser) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    const normalizedCurrentEmail = currentUser.email?.trim().toLowerCase();

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "הליגה לא נמצאה" }, { status: 404 });
    }

    const isOwner =
      String(league.createdBy) === String(currentUser.email) ||
      String(league.createdBy) === String(currentUser.userId);

    if (isOwner) {
      return NextResponse.json(
        { message: "יוצר הליגה לא יכול לעזוב" },
        { status: 400 }
      );
    }

    const updatedLeague = await League.findByIdAndUpdate(
      id,
      {
        $pull: {
          members: {
            email: normalizedCurrentEmail,
          },
        },
      },
      { new: true }
    );

    return NextResponse.json({
      ...updatedLeague.toObject(),
      id: updatedLeague._id,
    });
  } catch (error) {
    console.error("Leave league error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בעזיבת הליגה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
