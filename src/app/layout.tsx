import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blades & Bravery",
  description: "A fantasy browser RPG inspired by Shakes & Fidget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
