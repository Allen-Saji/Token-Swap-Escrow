"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 ${
        isScrolled ? "bg-black bg-opacity-50" : "bg-transparent"
      } max-w-screen-lg mx-auto`}
    >
      {/* Logo */}
      <div className="text-gray-300  font-bold">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="Logo"
            width={100}
            height={100}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex space-x-8">
        {" "}
        {/* Increased space between links */}
        <Link href="/escrow/create">
          <div className="text-gray-300 hover:text-white text-xl mx-4">
            Create an Escrow
          </div>
        </Link>
        <Link href="/find-escrow">
          <div className="text-gray-300 hover:text-white text-xl mx-4">
            Find an Escrow
          </div>
        </Link>
      </div>

      {/* Connect Wallet Button */}
      <div>
        <WalletMultiButton />
      </div>
    </nav>
  );
};

export default Navbar;
