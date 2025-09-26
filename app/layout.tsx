import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import Link from "next/link";

/* eslint-disable @next/next/no-img-element */

export const metadata: Metadata = {
  title: "Kaimana Klassik 37 - Konnections",
  description: "Bid Details for Team: Konnections",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="mx-auto flex max-w-screen-md flex-col gap-4 bg-stone-50 p-4 text-stone-900 sm:p-8">
        <Suspense>{children}</Suspense>
      </body>
    </html>
  );
}
