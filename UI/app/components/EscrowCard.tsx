import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyIcon } from "lucide-react";

interface EscrowData {
  maker: string;
  mintA: string;
  mintB: string;
  deposit: string;
  receive: string;
}

interface EscrowCardProps {
  escrowData: EscrowData;
  escrowAddress: string;
  onWithdraw: () => void;
}

function EscrowCard({
  escrowData,
  escrowAddress,
  onWithdraw,
}: EscrowCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const shortenAddress = (address: string) =>
    `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <Card className="w-full max-w-md bg-black text-gray-300">
      <CardHeader>
        <CardTitle>Escrow Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <strong>Escrow Address:</strong>{" "}
            <span className="text-sm">{shortenAddress(escrowAddress)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(escrowAddress, "escrowAddress")}
            className="p-2"
          >
            <CopyIcon className="w-4 h-4" />
            {copiedField === "escrowAddress" && (
              <span className="ml-2 text-xs text-green-500">Copied!</span>
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <strong>Mint A:</strong>{" "}
            <span className="text-sm mx-2">
              {shortenAddress(escrowData.mintA)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(escrowData.mintA, "mintA")}
            className="p-2"
          >
            <CopyIcon className="w-4 h-4" />
            {copiedField === "mintA" && (
              <span className="ml-2 text-xs text-green-500">Copied!</span>
            )}
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <strong>Mint B:</strong>{" "}
            <span className="text-sm mx-2">
              {shortenAddress(escrowData.mintB)}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => copyToClipboard(escrowData.mintB, "mintB")}
            className="p-2"
          >
            <CopyIcon className="w-4 h-4" />
            {copiedField === "mintB" && (
              <span className="ml-2 text-xs text-green-500">Copied!</span>
            )}
          </Button>
        </div>
        <div className="text-left">
          <strong>Deposit Amount:</strong> {escrowData.deposit}
        </div>
        <div className="text-left">
          <strong>Receive Amount:</strong> {escrowData.receive}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onWithdraw}
          className="w-full bg-black text-gray-300 border  border-gray-300"
        >
          Withdraw
        </Button>
      </CardFooter>
    </Card>
  );
}

export default EscrowCard;
