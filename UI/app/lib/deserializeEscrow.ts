import { PublicKey, Connection } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getMint } from "@solana/spl-token"; // Import to fetch mint data

export interface DeserializedEscrow {
  seed: string;
  maker: string;
  mintA: string;
  mintB: string;
  deposit: string;
  receive: string;
  bump: number;
}

export const deserializeEscrowAccount = async (
  data: Buffer,
  connection: Connection
): Promise<DeserializedEscrow> => {
  // Ensure we have enough data
  if (data.length < 101) {
    throw new Error("Insufficient data for deserialization");
  }

  let offset = 8; // Skip the 8-byte discriminator

  const seed = new BN(data.slice(offset, offset + 8), "le");
  offset += 8;

  const maker = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const mintA = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const mintB = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  const deposit = new BN(data.slice(offset, offset + 8), "le");
  offset += 8;

  const receive = new BN(data.slice(offset, offset + 8), "le");
  offset += 8;

  const bump = data[offset];

  // Fetch mint decimals
  const mintAInfo = await getMint(connection, mintA);
  const mintBInfo = await getMint(connection, mintB);

  const mintADecimals = mintAInfo.decimals;
  const mintBDecimals = mintBInfo.decimals;

  // Convert lamports (raw amounts) to token amounts by dividing by 10^decimals and using floating-point conversion
  const formattedDeposit = deposit.toNumber() / Math.pow(10, mintADecimals);
  const formattedReceive = receive.toNumber() / Math.pow(10, mintBDecimals);

  return {
    seed: seed.toString(10),
    maker: maker.toBase58(),
    mintA: mintA.toBase58(),
    mintB: mintB.toBase58(),
    deposit: formattedDeposit.toFixed(mintADecimals), // Keep decimals in output
    receive: formattedReceive.toFixed(mintBDecimals), // Keep decimals in output
    bump: bump,
  };
};
