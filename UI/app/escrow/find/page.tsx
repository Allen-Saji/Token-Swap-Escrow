"use client";

import React, { useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchEscrowData, payAndClose, useProgram } from "@/app/lib/anchor";
import EscrowCard from "@/app/components/EscrowCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DeserializedEscrow } from "@/app/lib/deserializeEscrow";

export default function EscrowSearchPage() {
  const [escrowPublicKey, setEscrowPublicKey] = useState("");
  const [escrowData, setEscrowData] = useState<DeserializedEscrow | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { connection } = useConnection();
  const { program, provider } = useProgram();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!escrowPublicKey) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter an escrow public key",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchEscrowData(escrowPublicKey, connection);
      setEscrowData(data);
    } catch (error) {
      console.error("Error fetching escrow data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Failed to fetch escrow data. Please check the public key and try again.",
      });
      setEscrowData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!escrowData || !program || !provider) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot withdraw at this time. Please try again later.",
      });
      return;
    }

    try {
      await payAndClose(escrowData, provider.wallet.publicKey.toString(), {
        program,
        provider,
      });
      // Call the DELETE function after successful refund
      const response = await fetch(
        `/api/escrow?walletAddress=${escrowData.maker}&escrowId=${escrowPublicKey}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove escrow from database");
      }

      console.log("Escrow removed from database successfully");
      toast({
        title: "Success",
        description: "Escrow withdrawn successfully",
      });
      setEscrowData(null);
    } catch (error) {
      console.error("Error withdrawing escrow:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to withdraw escrow. Please try again.",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-300">
        Search Escrow
      </h1>
      <div className="flex space-x-4 mb-8">
        <Input
          type="text"
          placeholder="Enter escrow public key"
          value={escrowPublicKey}
          onChange={(e) => setEscrowPublicKey(e.target.value)}
          className="flex-grow bg-gray-800 text-gray-300 border-gray-700"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading}
          className="bg-gray-700 text-gray-300 hover:bg-gray-600"
        >
          {isLoading ? "Searching..." : "Search"}
        </Button>
      </div>
      {escrowData && (
        <div className="flex justify-center">
          <EscrowCard
            escrowData={{
              maker: escrowData.maker,
              mintA: escrowData.mintA,
              mintB: escrowData.mintB,
              deposit: escrowData.deposit.toString(),
              receive: escrowData.receive.toString(),
            }}
            escrowAddress={escrowPublicKey}
            onWithdraw={handleWithdraw}
          />
        </div>
      )}
    </div>
  );
}
