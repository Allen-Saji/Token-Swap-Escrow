import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import idl from "../idl/idl.json";
import { Program, AnchorProvider, Idl, web3, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";

export function useProgram() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  if (!wallet) {
    return { program: null, provider: null };
  }

  const provider = new AnchorProvider(connection, wallet, {});
  const program = new Program(idl as Idl, provider);
  return { program, provider };
}

interface EscrowFormData {
  makerPublicKey: string;
  sendTokenMint: string;
  receiveTokenMint: string;
  sendTokenAmount: string;
  receiveTokenAmount: string;
  escrowSeed: string;
}

export async function createEscrow(
  formData: EscrowFormData,
  config: { program: Program; provider: AnchorProvider }
) {
  if (!config.program || !config.provider) {
    throw new Error("Program or provider is not initialized");
  }

  try {
    const { connection } = config.provider;

    // Public keys for the maker and mints
    const maker = new PublicKey(formData.makerPublicKey);
    const mintA = new PublicKey(formData.sendTokenMint);
    const mintB = new PublicKey(formData.receiveTokenMint);
    const seed = new BN(formData.escrowSeed);

    // Fetch the decimals for both mintA and mintB
    const mintAInfo = await getMint(connection, mintA);
    const mintBInfo = await getMint(connection, mintB);

    const mintADecimals = mintAInfo.decimals;
    const mintBDecimals = mintBInfo.decimals;

    // Convert the amounts based on the mint's decimals
    const sendTokenAmountInSmallestUnit = new BN(
      parseFloat(formData.sendTokenAmount) * Math.pow(10, mintADecimals)
    );
    const receiveTokenAmountInSmallestUnit = new BN(
      parseFloat(formData.receiveTokenAmount) * Math.pow(10, mintBDecimals)
    );

    // Find the program address for the escrow
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      config.program.programId
    );

    // Get associated token addresses
    const makerAta = await getAssociatedTokenAddress(mintA, maker);
    const vault = await getAssociatedTokenAddress(mintA, escrowPDA, true);

    // Create the instruction
    const ix = await config.program.methods
      .make(
        seed,
        sendTokenAmountInSmallestUnit,
        receiveTokenAmountInSmallestUnit
      )
      .accounts({
        maker: maker,
        mintA: mintA,
        mintB: mintB,
        makerAtaA: makerAta,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Create the transaction
    const tx = new web3.Transaction().add(ix);

    // Send and confirm the transaction
    const signature = await config.provider.sendAndConfirm(tx);
    console.log(`Transaction signature: ${signature}`);
    return signature;
  } catch (error) {
    console.error("Error creating escrow:", error);
    throw error;
  }
}
// Function to fetch escrow data from Solana
export const fetchEscrowData = async (
  escrowPublicKey: string,
  connection: web3.Connection
) => {
  const escrowAccountPubkey = new PublicKey(escrowPublicKey);

  // Fetch the account info
  const escrowAccountInfo = await connection.getAccountInfo(
    escrowAccountPubkey
  );
  if (!escrowAccountInfo) {
    throw new Error("Escrow account not found");
  }

  const result = deserializeEscrowAccount(escrowAccountInfo.data);

  return result;
};

// Function to deserialize the account data
const deserializeEscrowAccount = (data: Uint8Array) => {
  const dataBuffer = Buffer.from(data);

  // Skip the 8-byte discriminator
  let offset = 8;

  let seed = new BN(dataBuffer.slice(offset, offset + 8), "le");
  offset += 8;
  let rseed = seed.toString(10);

  const maker = new PublicKey(dataBuffer.slice(offset, offset + 32));
  offset += 32;
  let rmaker = maker.toBase58();
  const mintA = new PublicKey(dataBuffer.slice(offset, offset + 32));
  offset += 32;
  let rmintA = mintA.toBase58();

  const mintB = new PublicKey(dataBuffer.slice(offset, offset + 32));
  offset += 32;
  let rmintB = mintB.toBase58();

  const deposit = new BN(dataBuffer.slice(offset, offset + 8), "le");
  offset += 8;
  let rdeposit = deposit.toString();

  const receive = new BN(dataBuffer.slice(offset, offset + 8), "le");
  offset += 8;

  let rreceive = receive.toString();

  return { rseed, rmaker, rmintA, rmintB, rdeposit, rreceive };
};
