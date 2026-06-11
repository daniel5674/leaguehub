import Image from "next/image";

export default function LeagueVisual({ league, size = 56 }) {
  return league.image ? (
    <Image
      src={league.image}
      alt={league.name || "תמונת ליגה"}
      fill
      sizes={`${size}px`}
      className="object-cover"
      unoptimized
    />
  ) : (
    league.icon || league.name?.charAt(0) || "🏆"
  );
}
