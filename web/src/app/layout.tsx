import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Probability Press",
  description: "Speculative intelligence for the price of tomorrow.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
