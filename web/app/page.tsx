import React from "react";
import { Shield, Zap, ArrowRight } from "lucide-react";
import { FeatureCard } from "../components/ui/FeatureCard";
import { StepCard } from "../components/ui/StepCard";
import Link from "next/link";

export default function LandingPageBody() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-16">
      <div className="container mx-auto px-4">
        <section className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Secure Token Swaps on Solana
          </h1>
          <p className="text-xl mb-8">
            Trustless, decentralized escrow service for seamless token exchanges
          </p>
          <Link href="/escrow/create">
            <button className="bg-violet-900 hover:bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition duration-300">
              Create an Escrow
            </button>
          </Link>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-blue-400" />}
            title="Secure"
            description="Smart contract-powered escrow ensures safe token swaps"
          />
          <FeatureCard
            icon={<Zap className="w-12 h-12 text-yellow-400" />}
            title="Fast"
            description="Lightning-quick transactions on the Solana blockchain"
          />
          <FeatureCard
            icon={<ArrowRight className="w-12 h-12 text-green-400" />}
            title="Easy"
            description="User-friendly interface for effortless token exchanges"
          />
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <StepCard
              number="1"
              title="Create an Escrow"
              description="Specify the tokens you want to swap and set up the escrow contract"
            />
            <StepCard
              number="2"
              title="Share Escrow Link"
              description="Generate a Solana Blink link and share it with your swap partner"
            />
            <StepCard
              number="3"
              title="Complete the Swap"
              description="Your partner fulfills the escrow, and tokens are exchanged securely"
            />
            <StepCard
              number="4"
              title="Find Existing Escrows"
              description="Search for escrows using their unique address to complete swaps"
            />
          </div>
        </section>

        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">Ready to Swap?</h2>
          <p className="text-xl mb-8">
            Start your secure token exchange journey today
          </p>
          <Link href="/escrow/create">
            <button className="bg-violet-900 hover:bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-semibold transition duration-300">
              Create an Escrow
            </button>
          </Link>
        </section>
      </div>
    </main>
  );
}
