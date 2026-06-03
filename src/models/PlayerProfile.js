import mongoose from "mongoose";

const PlayerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "player",
    },

    position: {
      type: String,
      default: "",
    },

    preferredFoot: {
      type: String,
      default: "",
    },

    age: {
      type: Number,
      default: null,
    },

    rating: {
      type: String,
      default: "D",
    },

    goals: {
      type: Number,
      default: 0,
    },

    assists: {
      type: Number,
      default: 0,
    },

    gamesPlayed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.PlayerProfile ||
  mongoose.model("PlayerProfile", PlayerProfileSchema);
