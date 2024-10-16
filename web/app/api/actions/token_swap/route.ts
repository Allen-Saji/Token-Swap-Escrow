import {
  ACTIONS_CORS_HEADERS,
  createPostResponse,
  ActionGetResponse,
  ActionPostRequest,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import { deserializeEscrowAccount } from "@/lib/deserializeEscrow";
import { NextRequest, NextResponse } from "next/server";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { program, programId } from "@/lib/setup";
import { BN } from "@coral-xyz/anchor";

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const escrowAddress = req.nextUrl.searchParams.get("escrowAddress");
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    if (!escrowAddress)
      return NextResponse.json(
        { error: "Escrow address is required" },
        { status: 400 }
      );
    const escrowDataInfo = await connection.getAccountInfo(
      new PublicKey(escrowAddress)
    );
    if (!escrowDataInfo)
      return NextResponse.json(
        { error: "Escrow account not found" },
        { status: 404 }
      );
    const escrowData = await deserializeEscrowAccount(
      escrowDataInfo.data,
      connection
    );

    const receiveTokenName = escrowData.mintB;
    const sendTokenName = escrowData.mintA;

    const baseHref = new URL(
      `/api/actions/token_swap?escrowAddress=${escrowAddress}`,
      requestUrl.origin
    ).toString();

    const payload: ActionGetResponse = {
      title: "Token Swap",
      description: `Swap ${escrowData.receive} ${receiveTokenName} for ${escrowData.deposit} ${sendTokenName}`,
      icon: new URL("/logo.png", requestUrl.origin).toString(),
      label: "Swap",
      links: {
        actions: [{ label: "Swap", href: baseHref, type: "transaction" }],
      },
    };
    return new Response(JSON.stringify(payload), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    console.error("Error occurred:", error);
    return NextResponse.json(
      { error: "Failed to fetch blink data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const escrowAddress = req.nextUrl.searchParams.get("escrowAddress");
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    if (!escrowAddress)
      return NextResponse.json(
        { error: "Escrow address is required" },
        { status: 400 }
      );
    const escrowDataInfo = await connection.getAccountInfo(
      new PublicKey(escrowAddress)
    );
    if (!escrowDataInfo)
      return NextResponse.json(
        { error: "Escrow account not found" },
        { status: 404 }
      );
    const escrowAccount = await deserializeEscrowAccount(
      escrowDataInfo.data,
      connection
    );

    const body: ActionPostRequest = await req.json();

    // Validate the provided account
    let takerPubKey: PublicKey;
    try {
      takerPubKey = new PublicKey(body.account);
    } catch (err) {
      console.error("Error occurred:", err);
      return NextResponse.json(
        { error: "Invalid account provided" },
        { status: 400 }
      );
    }

    const taker = new PublicKey(takerPubKey);
    const maker = new PublicKey(escrowAccount.maker);
    const mintA = new PublicKey(escrowAccount.mintA);
    const mintB = new PublicKey(escrowAccount.mintB);
    const seed = new BN(escrowAccount.seed);

    // Find the program address for the escrow
    const [escrowPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.toBuffer(),
        seed.toArrayLike(Buffer, "le", 8),
      ],
      programId
    );

    // Get associated token addresses
    const takerAtaA = await getAssociatedTokenAddress(mintA, taker);
    const takerAtaB = await getAssociatedTokenAddress(mintB, taker);
    const makerAtaB = await getAssociatedTokenAddress(mintB, maker);
    const vault = await getAssociatedTokenAddress(mintA, escrowPDA, true);

    // Check if maker's ATA for token B exists
    const makerAtaBInfo = await connection.getAccountInfo(makerAtaB);

    // Get the latest blockhash
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    // Create a transaction
    const transaction = new Transaction({
      feePayer: takerPubKey,
      blockhash,
      lastValidBlockHeight,
    });

    // If maker's ATA for token B doesn't exist, add instruction to create it
    if (!makerAtaBInfo) {
      console.log("Creating maker's ATA for token B");
      const createAtaIx = createAssociatedTokenAccountInstruction(
        taker, // payer
        makerAtaB, // ata
        maker, // owner
        mintB // mint
      );
      transaction.add(createAtaIx);
    }

    // Create the take instruction
    const takeIx = await program.methods
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
    transaction.add(takeIx);

    const response = await createPostResponse({
      fields: {
        transaction: transaction,
        type: "transaction",
      },
    });
    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

    await fetch(
      `${SITE_URL}/api/escrow?walletAddress=${
        escrowAccount.maker
      }&escrowId=${escrowPDA.toString()}`,
      {
        method: "DELETE",
      }
    );
    return Response.json(response, {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 400 }
    );
  }
}
