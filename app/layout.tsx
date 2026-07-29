import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodyFont = Inter({ subsets: ["latin"], variable: "--font-body" });
const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Film Studio Classroom AI",
  description: "The Complete Educational Operating System for Film & Television Production",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
