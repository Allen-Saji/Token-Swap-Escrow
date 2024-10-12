import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import React from "react";
import WalletContextProvider from "./providers/WalletContextProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Swap Vault",
  description:
    "Swap Vault is a trustless escrow program to swap spl tokensw ithout relying on any intermediary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" />{" "}
      </head>
      <body>
        <WalletContextProvider>
          <header className="container z-40">
            <div className="flex h-20 items-center justify-between py-6">
              <Navbar />
            </div>
          </header>
          <main className="mx-4 overflow-x-hidden">{children}</main>
          <Toaster />
        </WalletContextProvider>
      </body>
    </html>
  );
}
