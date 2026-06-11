import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import { getUserFromToken } from "@/lib/getUserFromToken";
import { isValidLeagueIcon, isValidLeagueImage } from "@/lib/leagueVisuals";

export async function GET(request, { params }) {
  try {
    await connectToDB();

    const { id } = await params;

    const league = await League.findById(id);

    if (!league) {
      return NextResponse.json({ message: "ליגה לא נמצאה" }, { status: 404 });
    }

    const currentUser = await getUserFromToken();
    const isOwner =
      currentUser &&
      (String(league.createdBy) === String(currentUser.email) ||
        String(league.createdBy) === String(currentUser.userId));
    const leagueData = league.toObject();

    if (!isOwner) {
      delete leagueData.blockedPlayers;
      delete leagueData.invitations;
    }

    return NextResponse.json({
      ...leagueData,
      id: league._id,
    });
  } catch (error) {
    console.error("GET league by id error:", error);
    return NextResponse.json(
      {
        message: "שגיאה בקבלת הליגה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();

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

    if (!body.name?.trim() || !body.sport?.trim() || !body.location?.trim()) {
      return NextResponse.json(
        { message: "שם, ספורט ומיקום הם שדות חובה" },
        { status: 400 }
      );
    }

    const image = body.image || "";
    const icon = body.icon || "";

    if (!isValidLeagueImage(image)) {
      return NextResponse.json(
        { message: "תמונת הליגה אינה תקינה או גדולה מדי" },
        { status: 400 }
      );
    }

    if (!isValidLeagueIcon(icon)) {
      return NextResponse.json({ message: "אייקון הליגה אינו תקין" }, { status: 400 });
    }

    league.name = body.name.trim();
    league.sport = body.sport.trim();
    league.location = body.location.trim();
    league.description = body.description?.trim() || "";
    league.status = ["פתוחה", "פעילה", "סגורה"].includes(body.status)
      ? body.status
      : league.status;
    league.image = image;
    league.icon = image ? "" : icon;

    await league.save();

    return NextResponse.json({
      ...league.toObject(),
      id: league._id,
    });
  } catch (error) {
    console.error("PUT league error:", error);

    return NextResponse.json(
      {
        message: "שגיאה בעריכת ליגה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

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

    await League.findByIdAndDelete(id);

    return NextResponse.json({
      message: "הליגה נמחקה בהצלחה",
    });
  } catch (error) {
    console.error("DELETE league error:", error);

    return NextResponse.json({ message: "שגיאה במחיקת ליגה" }, { status: 500 });
  }
}
