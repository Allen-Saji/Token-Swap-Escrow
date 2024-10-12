"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createEscrow, useProgram } from "../lib/anchor";
import { useToast } from "@/hooks/use-toast";

const CreateEscrowForm = () => {
  const { publicKey, connected } = useWallet();
  const config = useProgram();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    makerPublicKey: "",
    escrowSeed: "",
    sendTokenMint: "",
    sendTokenAmount: "",
    receiveTokenMint: "",
    receiveTokenAmount: "",
  });

  // When the wallet is connected, set the makerPublicKey to the wallet's public key
  // If disconnected, clear the makerPublicKey
  useEffect(() => {
    if (connected && publicKey) {
      setFormData((prevData) => ({
        ...prevData,
        makerPublicKey: publicKey.toBase58(), // Automatically fill with public key
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        makerPublicKey: "", // Clear public key field when disconnected
      }));
    }
  }, [connected, publicKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please connect your wallet before creating an escrow.",
      });
      return;
    }

    if (!config.program || !config.provider) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Program or provider is not initialized",
      });
      return;
    }

    try {
      const signature = await createEscrow(formData, config);
      toast({
        title: "Escrow created",
        description: `Escrow created with signature: ${signature}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create escrow: ${
          error instanceof Error ? error.message : String(error)
        }`,
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-black rounded-md">
      <h2 className="text-2xl font-bold text-gray-300 mb-6 text-center">
        Create Escrow
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Maker Public Key */}
        <div>
          <label className="block text-gray-300 mb-2" htmlFor="makerPublicKey">
            Maker Public Key
          </label>
          <input
            type="text"
            id="makerPublicKey"
            name="makerPublicKey"
            value={formData.makerPublicKey} // Field is populated if wallet is connected
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            disabled={!!publicKey} // Disable input if the wallet is connected
            required
          />
        </div>

        {/* Escrow Seed */}
        <div>
          <label className="block text-gray-300 mb-2" htmlFor="escrowSeed">
            Escrow Seed
          </label>
          <input
            type="text"
            id="escrowSeed"
            name="escrowSeed"
            value={formData.escrowSeed}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            required
          />
        </div>

        {/* Send Token Mint */}
        <div>
          <label className="block text-gray-300 mb-2" htmlFor="sendTokenMint">
            Send Token Mint
          </label>
          <input
            type="text"
            id="sendTokenMint"
            name="sendTokenMint"
            value={formData.sendTokenMint}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            required
          />
        </div>

        {/* No. of send Token */}
        <div>
          <label className="block text-gray-300 mb-2" htmlFor="sendTokenAmount">
            No. of Send Token
          </label>
          <input
            type="number"
            id="sendTokenAmount"
            name="sendTokenAmount"
            value={formData.sendTokenAmount}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            required
          />
        </div>

        {/* Receive Token Mint */}
        <div>
          <label
            className="block text-gray-300 mb-2"
            htmlFor="receiveTokenMint"
          >
            Receive Token Mint
          </label>
          <input
            type="text"
            id="receiveTokenMint"
            name="receiveTokenMint"
            value={formData.receiveTokenMint}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            required
          />
        </div>

        {/* No. of Receive Token */}
        <div>
          <label
            className="block text-gray-300 mb-2"
            htmlFor="receiveTokenAmount"
          >
            No. of Receive Token
          </label>
          <input
            type="number"
            id="receiveTokenAmount"
            name="receiveTokenAmount"
            value={formData.receiveTokenAmount}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
            required
          />
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="w-full p-2 bg-gray-300 text-black font-semibold rounded-md hover:bg-gray-400 transition"
          >
            {connected ? "Create Escrow" : "Connect Wallet First"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEscrowForm;