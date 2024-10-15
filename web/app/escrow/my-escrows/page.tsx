"use client";
import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import EscrowCard from "@/components/EscrowCard";
import { useProgram, fetchEscrowData, refundEscrow } from "@/lib/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { DeserializedEscrow } from "@/lib/deserializeEscrow";

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

      // Fetch detailed escrow data for each escrow
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

      // Call the DELETE function after successful refund
      const response = await fetch(
        `/api/escrow?walletAddress=${publicKey.toBase58()}&escrowId=${address}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove escrow from database");
      }

      console.log("Escrow removed from database successfully");

      // After successful withdrawal and database update, refetch the escrows
      await fetchEscrows();
    } catch (err) {
      console.error("Error withdrawing from escrow or updating database:", err);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        Please connect your wallet to view your escrows.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-6">My Escrows</h1>
        {isLoading ? (
          <p>Loading escrows...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : escrows.length === 0 ? (
          <p>You have no escrows.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {escrows.map((escrow) => (
              <EscrowCard
                key={escrow.address}
                escrowData={escrow}
                escrowAddress={escrow.address}
                onWithdraw={() => handleWithdraw(escrow, escrow.address)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
