import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/lib/mongodb";
import League from "@/models/League";
import User from "@/models/User";
import { isValidLeagueIcon, isValidLeagueImage } from "@/lib/leagueVisuals";

export async function GET() {
  try {
    await connectToDB();

    const leagues = await League.find().select("-invitations -blockedPlayers");

    return NextResponse.json(
      leagues.map((l) => ({
        ...l.toObject(),
        id: l._id,
      }))
    );
  } catch (error) {
    console.error("GET leagues error FULL:", error);
    return NextResponse.json(
      {
        message: "שגיאה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectToDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "טוקן לא תקין" }, { status: 401 });
    }

    const currentUser = await User.findById(decoded.userId);

    if (!currentUser) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    if (currentUser.role !== "manager") {
      return NextResponse.json(
        { message: "רק מנהל יכול ליצור ליגה" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const image = body.image || "";
    const icon = body.icon || "";
    const status = ["פתוחה", "פעילה", "סגורה"].includes(body.status)
      ? body.status
      : "פתוחה";

    if (!isValidLeagueImage(image)) {
      return NextResponse.json(
        { message: "תמונת הליגה אינה תקינה או גדולה מדי" },
        { status: 400 }
      );
    }

    if (!isValidLeagueIcon(icon)) {
      return NextResponse.json({ message: "אייקון הליגה אינו תקין" }, { status: 400 });
    }

    const newLeague = await League.create({
      name: body.name,
      sport: body.sport,
      location: body.location,
      description: body.description || "",
      image,
      icon: image ? "" : icon,
      leagueType: body.leagueType || "regular",
      status,
      teamsCount: 0,
      createdBy: currentUser.email,
      teams: [],
      matches: [],
      standings: [],
      members: [],
      personalPlayers: [],
      generatedTeams: [],
    });

    return NextResponse.json(
      {
        ...newLeague.toObject(),
        id: newLeague._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST league error:", error);
    return NextResponse.json(
      {
        message: "שגיאה ביצירת ליגה",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
