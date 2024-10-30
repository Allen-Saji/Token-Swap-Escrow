"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createEscrow, useProgram } from "../lib/anchor";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

const CreateEscrowForm = () => {
  const { publicKey, connected } = useWallet();
  const config = useProgram();
  const { toast } = useToast();
  const router = useRouter();

  const [formData, setFormData] = useState({
    makerPublicKey: "",
    escrowSeed: "",
    sendTokenMint: "",
    sendTokenAmount: "",
    receiveTokenMint: "",
    receiveTokenAmount: "",
  });

  useEffect(() => {
    if (connected && publicKey) {
      setFormData((prevData) => ({
        ...prevData,
        makerPublicKey: publicKey.toBase58(),
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        makerPublicKey: "",
      }));
    }
  }, [connected, publicKey]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Ensure the token amounts can only be positive numbers
    if (name === "sendTokenAmount" || name === "receiveTokenAmount") {
      if (value === "" || Number(value) > 0) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
      const { txSignature: signature, escrow: escrowAddress } =
        await createEscrow(formData, config);

      const response = await fetch("/api/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: formData.makerPublicKey,
          escrowAddress: escrowAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save escrow data");
      }

      toast({
        title: "Escrow created",
        description: `Escrow created with signature: ${signature}`,
      });

      // Redirect to the my-escrows page after successful creation
      router.push("/escrow/my-escrows");
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
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="makerPublicKey"
          >
            Maker Public Key
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is the public key of the wallet making the escrow.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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

        {/* Escrow Seed */}
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="escrowSeed"
          >
            Escrow Seed
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is a random integer to ensure each user escrow is unique.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="text"
          id="escrowSeed"
          name="escrowSeed"
          value={formData.escrowSeed}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
          required
        />

        {/* Send Token Mint */}
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="sendTokenMint"
          >
            Send Token Mint
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is the mint of the token you want to send.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="text"
          id="sendTokenMint"
          name="sendTokenMint"
          value={formData.sendTokenMint}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
          required
        />

        {/* No. of send Token */}
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="sendTokenAmount"
          >
            No. of Send Token
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is the number of tokens you want to send.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="number"
          id="sendTokenAmount"
          name="sendTokenAmount"
          value={formData.sendTokenAmount}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
          required
        />

        {/* Receive Token Mint */}
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="receiveTokenMint"
          >
            Receive Token Mint
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is the mint of the token you want to receive.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="text"
          id="receiveTokenMint"
          name="receiveTokenMint"
          value={formData.receiveTokenMint}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
          required
        />

        {/* No. of Receive Token */}
        <div className="flex items-center">
          <label
            className="block text-gray-300 mb-2 flex-1"
            htmlFor="receiveTokenAmount"
          >
            No. of Receive Token
          </label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="text-gray-400 hover:text-gray-300 ml-2 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                This is the number of tokens you want to receive.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <input
          type="number"
          id="receiveTokenAmount"
          name="receiveTokenAmount"
          value={formData.receiveTokenAmount}
          onChange={handleChange}
          className="w-full p-2 bg-gray-800 text-gray-300 rounded-md border border-gray-600"
          required
        />

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
