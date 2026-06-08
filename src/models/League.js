import mongoose from "mongoose";

const MatchReportSchema = new mongoose.Schema(
  {
    captainUserId: { type: String, required: true },
    captainName: { type: String, default: "" },
    teamName: { type: String, required: true },

    homeScore: { type: Number, required: true },
    awayScore: { type: Number, required: true },

    scorers: [
      {
        playerId: { type: String, default: "" },
        playerName: { type: String, required: true },
        teamName: { type: String, required: true },
        goals: { type: Number, default: 1 },
      },
    ],

    assists: [
      {
        playerId: { type: String, default: "" },
        playerName: { type: String, required: true },
        teamName: { type: String, required: true },
        assists: { type: Number, default: 1 },
      },
    ],

    mvpPlayerId: {
      type: String,
      default: "",
    },

    mvpPlayerName: {
      type: String,
      default: "",
    },

    blueCards: [
      {
        playerId: { type: String, default: "" },
        playerName: { type: String, required: true },
        teamName: { type: String, required: true },
        minute: { type: Number, default: null },
      },
    ],

    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

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

    isFinalApproved: {
      type: Boolean,
      default: false,
    },

    captainReports: [MatchReportSchema],

    isApprovedByManager: {
      type: Boolean,
      default: false,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    mvpPlayerId: {
      type: String,
      default: "",
    },

    mvpPlayerName: {
      type: String,
      default: "",
    },
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

const TopMvpSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true },
    teamName: { type: String, required: true },
    mvpAwards: { type: Number, default: 0 },
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

const PersonalPlayerSchema = new mongoose.Schema(
  {
    userId: { type: String, default: "" },
    email: { type: String, default: "" },
    fullName: { type: String, required: true },

    rating: {
      type: String,
      enum: ["", "A", "B", "C", "D"],
      default: "",
    },

    goals: { type: Number, default: 0 },
    assists: { type: Number, default: 0 },
    gamesPlayed: { type: Number, default: 0 },

    mvpAwards: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const GeneratedTeamSchema = new mongoose.Schema(
  {
    name: String,

    players: [
      {
        fullName: String,
        rating: String,
      },
    ],
  },
  { _id: true }
);

const LeagueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sport: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: "" },

    leagueType: {
      type: String,
      enum: ["regular", "personal"],
      default: "regular",
    },

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

            isCaptain: {
              type: Boolean,
              default: false,
            },

            mvpAwards: {
              type: Number,
              default: 0,
            },
          },
        ],
      },
    ],

    matches: [MatchSchema],
    standings: [StandingSchema],
    topScorers: [TopScorerSchema],
    topAssists: [TopAssistSchema],

    topMvps: {
      type: [TopMvpSchema],
      default: [],
    },

    members: [MemberSchema],
    joinRequests: [JoinRequestSchema],
    personalPlayers: [PersonalPlayerSchema],
    generatedTeams: [GeneratedTeamSchema],
  },
  { timestamps: true }
);

export default mongoose.models.League || mongoose.model("League", LeagueSchema);
