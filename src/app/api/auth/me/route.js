import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "לא מחובר" }, { status: 401 });
    }

    let userData;

    try {
      userData = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "טוקן לא תקין" }, { status: 401 });
    }

    await connectToDB();

    const user = await User.findById(userData.userId).select("-password");

    if (!user) {
      return NextResponse.json({ message: "משתמש לא נמצא" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("ME error:", error);
    return NextResponse.json(
      {
        message: "שגיאה בקבלת המשתמש",
        error: error?.message || "unknown error",
      },
      { status: 500 }
    );
  }
}
