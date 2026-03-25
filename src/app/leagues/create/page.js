"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function CreateLeaguePage() {
  const router = useRouter();
  const { currentUser, isLoaded } = useAuth();

  const [form, setForm] = useState({
    name: "",
    sport: "",
    location: "",
    description: "",
  });

  useEffect(() => {
    if (!isLoaded) return;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    if (currentUser.role !== "manager") {
      router.push("/");
    }
  }, [isLoaded, currentUser, router]);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "שגיאה ביצירת ליגה");
        return;
      }

      router.push("/leagues");
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("שגיאה ביצירת ליגה");
    }
  };

  if (!isLoaded) return null;
  if (!currentUser) return null;
  if (currentUser.role !== "manager") return null;

  return (
    <main className="mx-auto max-w-xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">צור ליגה חדשה</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="שם הליגה"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-xl border p-3"
          required
        />

        <input
          name="sport"
          placeholder="ספורט"
          value={form.sport}
          onChange={handleChange}
          className="w-full rounded-xl border p-3"
          required
        />

        <input
          name="location"
          placeholder="מיקום"
          value={form.location}
          onChange={handleChange}
          className="w-full rounded-xl border p-3"
          required
        />

        <textarea
          name="description"
          placeholder="תיאור"
          value={form.description}
          onChange={handleChange}
          className="w-full rounded-xl border p-3"
        />

        <button className="w-full rounded-xl bg-black py-3 text-white">
          צור ליגה
        </button>
      </form>
    </main>
  );
}
