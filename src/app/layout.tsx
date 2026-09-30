import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focus — Advanced Pomodoro & Time Tracker",
  description: "Turn focused time into visible progress. Accurate Pomodoro timer, task-linked time tracking, and transparent analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased selection:bg-amber-400 selection:text-neutral-950 min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
