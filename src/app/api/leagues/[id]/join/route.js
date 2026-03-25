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
        { message: "יוצר הליגה כבר שייך לליגה" },
        { status: 400 }
      );
    }

    const alreadyMember =
      Array.isArray(league.members) &&
      league.members.some(
        (member) =>
          member?.email?.trim().toLowerCase() === normalizedCurrentEmail
      );

    if (alreadyMember) {
      return NextResponse.json(
        { message: "כבר הצטרפת לליגה" },
        { status: 400 }
      );
    }

    const updatedLeague = await League.findByIdAndUpdate(
      id,
      {
        $addToSet: {
          members: {
            email: normalizedCurrentEmail,
            joinedAt: new Date(),
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
    console.error("Join league error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בהצטרפות לליגה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
