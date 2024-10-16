"use client";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);
import "@solana/wallet-adapter-react-ui/styles.css";

const Navbar = () => {
  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 transition-all duration-300 
    w-full bg-black`}
    >
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
      <div className="flex space-x-8">
        <Link href="/escrow/create">
          <div className="text-gray-300 hover:text-white text-xl mx-4">
            Create an Escrow
          </div>
        </Link>
        <Link href="/escrow/find">
          <div className="text-gray-300 hover:text-white text-xl mx-4">
            Find an Escrow
          </div>
        </Link>
        <Link href="/escrow/my-escrows">
          <div className="text-gray-300 hover:text-white text-xl mx-4">
            My Escrows
          </div>
        </Link>
      </div>
      <div>
        <WalletMultiButton />
      </div>
    </nav>
  );
};

export default Navbar;
