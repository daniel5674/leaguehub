export const LEAGUE_ICONS = [
  "🏆",
  "⚽",
  "🥇",
  "🏟️",
  "🛡️",
  "⭐",
  "🔥",
  "⚡",
  "👑",
  "🎯",
  "🏅",
  "💪",
];

export function isValidLeagueImage(image) {
  return (
    !image ||
    (/^data:image\/(jpeg|png|webp);base64,/.test(image) &&
      image.length <= 2_100_000)
  );
}

export function isValidLeagueIcon(icon) {
  return !icon || LEAGUE_ICONS.includes(icon);
}
