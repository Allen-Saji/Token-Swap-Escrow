"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import EscrowCard from "@/components/EscrowCard";
import { useProgram, fetchEscrowData, refundEscrow } from "@/lib/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { DeserializedEscrow } from "@/lib/deserializeEscrow";
import { Card } from "@/components/ui/card";

interface EscrowWithAddress extends DeserializedEscrow {
  address: string;
}

export default function MyEscrowPage() {
  const { publicKey, connected } = useWallet();
  const [escrows, setEscrows] = useState<EscrowWithAddress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { program, provider } = useProgram();
  const { connection } = useConnection();

  useEffect(() => {
    if (connected && publicKey) {
      fetchEscrows();
    }
  }, [connected, publicKey]);

  const fetchEscrows = async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/escrow?walletAddress=${publicKey.toBase58()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch escrows");
      }
      const data = await response.json();

      const escrowsWithData: EscrowWithAddress[] = await Promise.all(
        data.escrows.map(async (escrowAddress: string) => {
          const escrowData = await fetchEscrowData(escrowAddress, connection);
          return { ...escrowData, address: escrowAddress };
        })
      );

      setEscrows(escrowsWithData);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async (
    escrow: DeserializedEscrow,
    address: string
  ) => {
    if (!program || !provider || !publicKey) {
      console.error("Program, provider, or wallet not initialized");
      return;
    }
    try {
      await refundEscrow(escrow, { program, provider });
      console.log("Refunding escrow deposit to:", escrow.maker);

      const response = await fetch(
        `/api/escrow?walletAddress=${publicKey.toBase58()}&escrowId=${address}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove escrow from database");
      }

      await fetchEscrows();
    } catch (err) {
      console.error("Error withdrawing from escrow or updating database:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

  if (!connected) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <Card className="p-6">
          <p className="text-lg font-medium text-center">
            Please connect your wallet to view your escrows.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-h-[calc(100vh-4rem)] px-4 py-8 flex flex-col items-center">
      <div className="mb-8 text-center w-full">
        <h1 className="text-3xl font-bold">My Escrows</h1>
        <p className="mt-2 text-gray-600">
          Manage your active escrow positions
        </p>
      </div>

      <div className="w-full max-w-6xl">
        {isLoading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-lg">Loading your escrows...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-6 bg-red-50">
            <p className="text-red-600 text-center">Error: {error}</p>
            <div className="flex justify-center mt-4">
              <button
                onClick={fetchEscrows}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </Card>
        ) : escrows.length === 0 ? (
          <Card className="p-6">
            <div className="text-center">
              <p className="text-lg">You don&apos;t have any active escrows.</p>
              <p className="mt-2 text-gray-600">
                Create a new escrow to get started.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 place-items-center">
            {escrows.map((escrow) => (
              <EscrowCard
                key={escrow.address}
                escrowData={escrow}
                escrowAddress={escrow.address}
                onWithdraw={() => handleWithdraw(escrow, escrow.address)}
                buttonText="Withdraw"
                blink={`${SITE_URL}/api/actions/token_swap?escrowAddress=${escrow.address}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
