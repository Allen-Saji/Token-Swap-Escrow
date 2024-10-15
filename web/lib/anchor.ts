import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import idl from "../app/idl/idl.json";
import { Program, AnchorProvider, Idl, web3, BN } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getMint,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  deserializeEscrowAccount,
  DeserializedEscrow,
} from "./deserializeEscrow";

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
    return { txSignature: signature, escrow: escrowPDA.toBase58() };
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

  const result = deserializeEscrowAccount(escrowAccountInfo.data, connection);

  return result;
};

// New refund function
export async function refundEscrow(
  escrowAccount: DeserializedEscrow,
  config: { program: Program; provider: AnchorProvider }
) {
  if (!config.program || !config.provider) {
    throw new Error("Program or provider is not initialized");
  }

  try {
    // Get the maker's public key from the escrow account
    const maker = new PublicKey(escrowAccount.maker);

    // Get the mint A from the escrow account
    const mintA = new PublicKey(escrowAccount.mintA);

    // Get the seed from the escrow account
    const seed = new BN(escrowAccount.seed);

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
      .refund()
      .accounts({
        maker: maker,
        mintA: mintA,
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
    console.log(`Refund transaction signature: ${signature}`);
    return { txSignature: signature };
  } catch (error) {
    console.error("Error refunding escrow:", error);
    throw error;
  }
}

export async function payAndClose(
  escrowAccount: DeserializedEscrow,
  takerPublicKey: string,
  config: { program: Program; provider: AnchorProvider }
) {
  if (!config.program || !config.provider) {
    throw new Error("Program or provider is not initialized");
  }
  console.log("escrowAccount:", escrowAccount);

  try {
    const { connection } = config.provider;

    // Get the public keys
    const taker = new PublicKey(takerPublicKey);
    const maker = new PublicKey(escrowAccount.maker);
    const mintA = new PublicKey(escrowAccount.mintA);
    const mintB = new PublicKey(escrowAccount.mintB);
    const seed = new BN(escrowAccount.seed);

    console.log("maker:", maker.toBase58());
    console.log("taker:", taker.toBase58());

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
    const takerAtaA = await getAssociatedTokenAddress(mintA, taker);
    const takerAtaB = await getAssociatedTokenAddress(mintB, taker);
    const makerAtaB = await getAssociatedTokenAddress(mintB, maker);
    const vault = await getAssociatedTokenAddress(mintA, escrowPDA, true);
    console.log("takerAtaA:", takerAtaA.toBase58());
    console.log("takerAtaB:", takerAtaB.toBase58());
    console.log("makerAtaB:", makerAtaB.toBase58());
    console.log("vault:", vault.toBase58());

    // Check if maker's ATA for token B exists
    const makerAtaBInfo = await connection.getAccountInfo(makerAtaB);

    // Create a transaction
    const tx = new web3.Transaction();

    // If maker's ATA for token B doesn't exist, add instruction to create it
    if (!makerAtaBInfo) {
      console.log("Creating maker's ATA for token B");
      const createAtaIx = createAssociatedTokenAccountInstruction(
        taker, // payer
        makerAtaB, // ata
        maker, // owner
        mintB // mint
      );
      tx.add(createAtaIx);
    }

    // Create the take instruction
    const takeIx = await config.program.methods
      .take()
      .accounts({
        taker: taker,
        maker: maker,
        mintA: mintA,
        mintB: mintB,
        takerAtaA: takerAtaA,
        takerAtaB: takerAtaB,
        makerAtaB: makerAtaB,
        escrow: escrowPDA,
        vault: vault,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    // Add the take instruction to the transaction
    tx.add(takeIx);

    // Send and confirm the transaction
    const signature = await config.provider.sendAndConfirm(tx);
    console.log(`Pay and Close transaction signature: ${signature}`);
    return { txSignature: signature };
  } catch (error) {
    console.error("Error in Pay and Close:", error);
    throw error;
  }
}
