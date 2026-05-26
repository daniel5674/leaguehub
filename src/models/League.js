import mongoose from "mongoose";

const MatchSchema = new mongoose.Schema(
  {
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },

    score: { type: String, default: "טרם נקבע" },
    homeScore: { type: Number, default: null },
    awayScore: { type: Number, default: null },

    blueCards: [
      {
        playerId: { type: String, default: "" },
        playerName: { type: String, required: true },
        teamName: { type: String, required: true },
        minute: { type: Number, default: null },
      },
    ],
  },
  { _id: true }
);

const StandingSchema = new mongoose.Schema(
  {
    team: { type: String, required: true },
    played: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    draws: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    goalsFor: { type: Number, default: 0 },
    goalsAgainst: { type: Number, default: 0 },
    goalDifference: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
  },
  { _id: false }
);

const TopScorerSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    teamName: { type: String, required: true },
    goals: { type: Number, default: 0 },
  },
  { _id: true }
);

const TopAssistSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    teamName: { type: String, required: true },
    assists: { type: Number, default: 0 },
  },
  { _id: true }
);

const MemberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    fullName: { type: String, default: "" },
  },
  { _id: false }
);

const JoinRequestSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["player"],
      default: "player",
    },
    playerId: {
      type: String,
      required: true,
    },
    playerEmail: { type: String, required: true },
    playerName: { type: String, default: "" },
    teamName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const LeagueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sport: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, default: "פתוחה" },
    teamsCount: { type: Number, default: 0 },
    createdBy: { type: String, required: true },
    teams: [
      {
        name: { type: String, required: true },
        players: [
          {
            playerId: String,
            email: String,
            fullName: String,

            shirtNumber: {
              type: Number,
              default: null,
            },

            position: {
              type: String,
              default: "",
            },

            image: {
              type: String,
              default: "",
            },
          },
        ],
      },
    ],
    matches: [MatchSchema],
    standings: [StandingSchema],
    topScorers: [TopScorerSchema],
    topAssists: [TopAssistSchema],
    members: [MemberSchema],
    joinRequests: [JoinRequestSchema],
  },
  { timestamps: true }
);

export default mongoose.models.League || mongoose.model("League", LeagueSchema);
