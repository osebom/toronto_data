import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toronto Data - Maps App",
  description: "A maps-focused web app for exploring Toronto",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

