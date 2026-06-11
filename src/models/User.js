import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["manager", "player"],
      required: true,
    },

    notifications: [
      {
        message: { type: String },
        leagueId: { type: String },
        leagueName: { type: String },
        invitationId: { type: String, default: "" },
        teamName: { type: String, default: "" },

        matchId: { type: String, default: "" },

        actionType: {
          type: String,
          default: "info",
        },

        type: { type: String, default: "info" },
        read: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const notificationsSchema = User.schema.path("notifications")?.schema;

if (notificationsSchema && !notificationsSchema.path("invitationId")) {
  notificationsSchema.add({
    invitationId: { type: String, default: "" },
    teamName: { type: String, default: "" },
  });
}

export default User;
