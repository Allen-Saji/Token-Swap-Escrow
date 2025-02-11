"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { createEscrow, useProgram } from "../lib/anchor";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// Define the interface to match the expected EscrowFormData type
interface EscrowFormData {
  makerPublicKey: string;
  escrowSeed: string;
  sendTokenMint: string;
  sendTokenAmount: string; // Changed to string to match form input
  receiveTokenMint: string;
  receiveTokenAmount: string; // Changed to string to match form input
}

const formSchema = z.object({
  makerPublicKey: z.string().min(32, "Invalid public key"),
  escrowSeed: z.coerce
    .number()
    .int("Must be an integer")
    .positive("Must be a positive number")
    .min(1, "Must be greater than 0"),
  sendTokenMint: z.string().min(32, "Invalid token mint address"),
  sendTokenAmount: z
    .string() // Changed to string to match form input
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Must be a positive number"
    ),
  receiveTokenMint: z.string().min(32, "Invalid token mint address"),
  receiveTokenAmount: z
    .string() // Changed to string to match form input
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) > 0,
      "Must be a positive number"
    ),
});

const CreateEscrowForm = () => {
  const { publicKey, connected } = useWallet();
  const config = useProgram();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<EscrowFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      makerPublicKey: "",
      escrowSeed: "",
      sendTokenMint: "",
      sendTokenAmount: "",
      receiveTokenMint: "",
      receiveTokenAmount: "",
    },
  });

  useEffect(() => {
    if (connected && publicKey) {
      form.setValue("makerPublicKey", publicKey.toBase58());
    } else {
      form.setValue("makerPublicKey", "");
    }
  }, [connected, publicKey, form]);

  const onSubmit = async (data: EscrowFormData) => {
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
        await createEscrow(data, config);

      const response = await fetch("/api/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: data.makerPublicKey,
          escrowAddress: escrowAddress,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save escrow data");
      }

      toast({
        title: "Success",
        description: `Escrow created successfully. Signature: ${signature.slice(
          0,
          8
        )}...`,
      });

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
    <Card className="max-w-5xl mx-auto p-8 bg-black">
      <CardHeader className="pb-8">
        <CardTitle className="text-3xl font-bold text-gray-300 text-center">
          Create Escrow
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="makerPublicKey"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">
                      Maker Public Key
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Your wallet address"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                        disabled={!!publicKey}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="escrowSeed"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">Escrow Seed</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter a positive integer (e.g., 12345)"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sendTokenMint"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">
                      Send Token Mint
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Token mint address you want to send"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sendTokenAmount"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">
                      Send Token Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0.000000001"
                        step="0.000000001"
                        placeholder="Amount of tokens to send (> 0)"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="receiveTokenMint"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">
                      Receive Token Mint
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Token mint address you want to receive"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="receiveTokenAmount"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-gray-300">
                      Receive Token Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0.000000001"
                        step="0.000000001"
                        placeholder="Amount of tokens to receive (> 0)"
                        className="bg-gray-800 text-gray-300 border-gray-600 h-12 text-lg"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <button
              type="submit"
              className="w-full p-4 mt-6 bg-gray-300 text-black text-lg font-semibold rounded-md hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!connected}
            >
              {connected ? "Create Escrow" : "Connect Wallet First"}
            </button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateEscrowForm;
