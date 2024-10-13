import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");
    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ escrows: user.escrows });
  } catch (error) {
    console.error("Error fetching escrows:", error);
    return NextResponse.json(
      { error: "Failed to fetch escrows" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, escrowAddress } = await req.json();

    if (!walletAddress || !escrowAddress) {
      return NextResponse.json(
        { error: "Wallet address and escrow address are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (user) {
      // User exists, update the escrows array
      const updatedUser = await prisma.user.update({
        where: { walletAddress },
        data: {
          escrows: {
            push: escrowAddress,
          },
        },
      });
      return NextResponse.json({ user: updatedUser });
    } else {
      // User doesn't exist, create a new user
      const newUser = await prisma.user.create({
        data: {
          walletAddress,
          escrows: [escrowAddress],
        },
      });
      return NextResponse.json({ user: newUser }, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const walletAddress = req.nextUrl.searchParams.get("walletAddress");
    const escrowId = req.nextUrl.searchParams.get("escrowId");
    if (!walletAddress || !escrowId) {
      return NextResponse.json(
        { error: "Wallet address and escrow ID are required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const updatedEscrows = user.escrows.filter((escrow) => escrow !== escrowId);
    await prisma.user.update({
      where: { walletAddress },
      data: { escrows: updatedEscrows },
    });
    return NextResponse.json({ message: "Escrow removed successfully" });
  } catch (error) {
    console.error("Error removing escrow:", error);
    return NextResponse.json(
      { error: "Failed to remove escrow" },
      { status: 500 }
    );
  }
}
