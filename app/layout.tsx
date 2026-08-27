import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import UploadProgressWidget from "@/components/UploadProgressWidget";

export const metadata: Metadata = {
  title: "Photochron",
  description: "Photos, arranged by when they happened, not when you posted them.",
  manifest: "/manifest.json",
  themeColor: "#151313",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body">
        <Nav />
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-8">{children}</main>
        <UploadProgressWidget />
      </body>
    </html>
  );
}
