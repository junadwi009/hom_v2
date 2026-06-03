import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/features/shell/app-shell";
import { getOptionalShellUser } from "@/lib/auth/current-user";
import { getAuthMode } from "@/lib/env/app-mode";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HOM Studio OS v2",
  description: "AI-governed Clinical Studio Operating System foundation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shellUser = await getOptionalShellUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background-app text-foreground">
        {shellUser ? (
          <AppShell
            shellUser={shellUser}
            showSignOut={getAuthMode() === "supabase"}
          >
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
