import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import UploadProgressWidget from "@/components/UploadProgressWidget";

export const metadata: Metadata = {
  title: "Photochron",
  description: "Photos, arranged by when they happened, not when you posted them.",
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
