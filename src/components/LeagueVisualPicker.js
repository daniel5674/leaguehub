"use client";

import { useState } from "react";
import Image from "next/image";
import { LEAGUE_ICONS } from "@/lib/leagueVisuals";

export default function LeagueVisualPicker({
  name,
  image,
  icon,
  onChange,
  className = "",
}) {
  const [imageError, setImageError] = useState("");
  const [showIcons, setShowIcons] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    setImageError("");

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("אפשר להעלות תמונת JPG, PNG או WebP בלבד");
      event.target.value = "";
      return;
    }

    if (file.size > 1_500_000) {
      setImageError("התמונה גדולה מדי. הגודל המרבי הוא 1.5MB");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({ image: String(reader.result), icon: "" });
      setShowIcons(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`rounded-2xl border border-white/10 bg-slate-950/40 p-4 ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-emerald-400/10 text-3xl font-black text-emerald-300 shadow-lg">
          {image ? (
            <Image
              src={image}
              alt="תצוגה מקדימה של סמל הליגה"
              fill
              sizes="96px"
              className="object-cover"
              unoptimized
            />
          ) : (
            icon || name?.charAt(0) || "🏆"
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-white">סמל הליגה</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            אפשר לבחור תמונה אישית או אייקון מוכן.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-xl bg-white/10 px-4 py-2 text-xs font-black text-white transition hover:bg-white/15">
              בחירת תמונה
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>

            <button
              type="button"
              onClick={() => setShowIcons((current) => !current)}
              className="rounded-xl bg-emerald-400/15 px-4 py-2 text-xs font-black text-emerald-300 transition hover:bg-emerald-400/25"
            >
              בחירת אייקון
            </button>

            {(image || icon) && (
              <button
                type="button"
                onClick={() => onChange({ image: "", icon: "" })}
                className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
              >
                איפוס
              </button>
            )}
          </div>

          {imageError && (
            <p className="mt-2 text-xs font-bold text-red-300">{imageError}</p>
          )}
        </div>
      </div>

      {showIcons && (
        <div className="mt-4 grid grid-cols-6 gap-2 border-t border-white/10 pt-4 sm:grid-cols-12">
          {LEAGUE_ICONS.map((leagueIcon) => (
            <button
              key={leagueIcon}
              type="button"
              onClick={() => {
                onChange({ image: "", icon: leagueIcon });
                setShowIcons(false);
              }}
              aria-label={`בחירת האייקון ${leagueIcon}`}
              className={`flex aspect-square items-center justify-center rounded-xl border text-xl transition hover:-translate-y-0.5 hover:bg-white/15 ${
                icon === leagueIcon
                  ? "border-emerald-400 bg-emerald-400/20"
                  : "border-white/10 bg-white/[0.06]"
              }`}
            >
              {leagueIcon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
