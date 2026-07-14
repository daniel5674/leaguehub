import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDB } from "@/lib/mongodb";
import User from "@/models/User";
import PlayerProfile from "@/models/PlayerProfile";

export async function POST(request) {
  try {
    const { email, password, role, fullName } = await request.json();

    if (!email || !password || !role || !fullName) {
      return NextResponse.json(
        { message: "צריך אימייל, סיסמה, שם וסוג משתמש" },
        { status: 400 }
      );
    }

    if (!["manager", "player"].includes(role)) {
      return NextResponse.json(
        { message: "סוג משתמש לא תקין" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "הסיסמה חייבת להכיל לפחות 6 תווים" },
        { status: 400 }
      );
    }

    await connectToDB();

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json({ message: "המשתמש כבר קיים" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role,
      fullName,
    });

    if (role === "player") {
      await PlayerProfile.create({
        userId: user._id.toString(),
        email: normalizedEmail,
        fullName,
        role,
      });
    }

    return NextResponse.json(
      {
        message: "המשתמש נוצר בהצלחה",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);

    return NextResponse.json(
      { message: "שגיאה ביצירת משתמש" },
      { status: 500 }
    );
  }
}
