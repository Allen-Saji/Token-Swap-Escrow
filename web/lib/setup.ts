import { Idl, Program } from "@coral-xyz/anchor";
import { PublicKey, Connection, clusterApiUrl } from "@solana/web3.js";
import idl from "../app/idl/idl.json";

export const programId = new PublicKey(
  "6U2q3J5Ubi7gdboM1baGiz51kam7puCRo3QyztpEZ4FY"
);

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

export const program = new Program(idl as Idl, {
  connection,
});
