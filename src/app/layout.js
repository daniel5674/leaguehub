import "./globals.css";
import SiteShell from "@/components/layout/SiteShell";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "LeagueHub",
  description: "ניהול ליגות שכונתיות",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <AuthProvider>
          <SiteShell>{children}</SiteShell>
        </AuthProvider>
      </body>
    </html>
  );
}
