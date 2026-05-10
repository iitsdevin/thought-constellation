import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import LogoutButton from "@/components/LogoutButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thought Constellation",
  description: "A private thought log that turns rough thoughts into connected notes."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand" aria-label="Thought Constellation home">
            <span className="brand-mark">✦</span>
            <span>Thought Constellation</span>
          </Link>
          <nav className="nav-links" aria-label="Primary navigation">
            <Link href="/notes">Notes</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/constellation">Constellation</Link>
            <Link href="/settings">Settings</Link>
            <LogoutButton />
          </nav>
        </header>
        <main className="page-shell">{children}</main>
      </body>
    </html>
  );
}
