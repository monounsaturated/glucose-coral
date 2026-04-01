import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Glucose Coral — Understand Your Glucose Patterns",
  description:
    "Upload your Abbott FreeStyle Libre data and explore how meals and workouts affect your glucose levels. Interactive charts, deterministic analytics, and AI-powered insights.",
  keywords: ["glucose", "CGM", "FreeStyle Libre", "nutrition", "health analytics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
