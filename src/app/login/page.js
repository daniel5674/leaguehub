// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";

// export default function LoginPage() {
//   const router = useRouter();
//   const { login } = useAuth();

//   const [form, setForm] = useState({
//     email: "",
//     password: "",
//   });

//   const [message, setMessage] = useState("");
//   const [messageType, setMessageType] = useState("error");

//   const handleChange = (e) => {
//     setForm({
//       ...form,
//       [e.target.name]: e.target.value,
//     });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     if (!form.email.trim() || !form.password.trim()) {
//       setMessage("צריך למלא אימייל וסיסמה");
//       setMessageType("error");
//       return;
//     }

//     const result = login(form);

//     setMessage(result.message);
//     setMessageType(result.success ? "success" : "error");

//     if (result.success) {
//       setTimeout(() => {
//         router.push("/dashboard");
//       }, 1000);
//     }
//   };

//   return (
//     <main className="mx-auto max-w-md px-6 py-12">
//       <h1 className="mb-6 text-3xl font-bold">התחברות</h1>

//       <form
//         onSubmit={handleSubmit}
//         className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
//       >
//         <div>
//           <label className="mb-2 block text-sm font-medium">אימייל</label>
//           <input
//             type="email"
//             name="email"
//             placeholder="הכנס אימייל"
//             value={form.email}
//             onChange={handleChange}
//             className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
//           />
//         </div>

//         <div>
//           <label className="mb-2 block text-sm font-medium">סיסמה</label>
//           <input
//             type="password"
//             name="password"
//             placeholder="הכנס סיסמה"
//             value={form.password}
//             onChange={handleChange}
//             className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
//           />
//         </div>

//         {message && (
//           <p
//             className={`text-sm ${
//               messageType === "success" ? "text-green-600" : "text-red-500"
//             }`}
//           >
//             {message}
//           </p>
//         )}

//         <button className="w-full rounded-xl bg-black py-3 text-white hover:bg-gray-800">
//           התחבר
//         </button>
//       </form>
//     </main>
//   );
// }

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await login(form);

    if (!result.success) {
      setMessage(result.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md items-center px-6 py-12">
      <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">התחברות</h1>
        <p className="mb-6 text-gray-500">התחבר לחשבון שלך ב-LeagueHub</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="אימייל"
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="סיסמה"
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
            required
          />

          {message && <p className="text-sm text-red-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-3 text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? "מתחבר..." : "התחבר"}
          </button>
        </form>
      </div>
    </main>
  );
}
