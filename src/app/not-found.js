import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 text-5xl font-bold">404</h1>
      <p className="mb-6 text-lg text-gray-600">הדף שחיפשת לא נמצא.</p>

      <Link
        href="/"
        className="rounded-xl bg-black px-6 py-3 text-white hover:bg-gray-800"
      >
        חזרה לדף הבית
      </Link>
    </main>
  );
}
