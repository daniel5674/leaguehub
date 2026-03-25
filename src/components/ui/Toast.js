"use client";

import { useEffect } from "react";

export default function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, 2500);

    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const baseClasses =
    "fixed bottom-6 left-1/2 z-[9999] -translate-x-1/2 rounded-2xl px-5 py-3 text-sm font-medium shadow-lg transition";

  const typeClasses =
    type === "error"
      ? "bg-red-500 text-white"
      : type === "info"
      ? "bg-blue-500 text-white"
      : "bg-black text-white";

  return <div className={`${baseClasses} ${typeClasses}`}>{message}</div>;
}
