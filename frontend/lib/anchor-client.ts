"use client"

import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { Program, AnchorProvider, BN } from "@project-serum/anchor"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { useEffect, useState } from "react"
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata"

// This is a placeholder for the actual IDL
// In a real application, you would import the IDL from a file
export const CHARITY_LOTTERY_IDL = {
  version: "0.1.0",
  name: "charity_lottery",
  instructions: [
    {
      name: "initializeLottery",
      accounts: [
        { name: "lottery", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [
        { name: "ticketPrice", type: "u64" },
        { name: "duration", type: "u64" },
      ],
    },
    {
      name: "buyTicket",
      accounts: [
        { name: "lottery", isMut: true, isSigner: false },
        { name: "buyer", isMut: true, isSigner: true },
        { name: "poolTokenAccount", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "numTickets", type: "u32" }],
    },
    {
      name: "voteCharity",
      accounts: [
        { name: "charityVote", isMut: true, isSigner: false },
        { name: "voter", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
      ],
      args: [{ name: "charityId", type: "u8" }],
    },
    {
      name: "drawWinner",
      accounts: [
        { name: "lottery", isMut: true, isSigner: false },
        { name: "authority", isMut: true, isSigner: true },
      ],
      args: [],
    },
    {
      name: "claimPrize",
      accounts: [
        { name: "lottery", isMut: true, isSigner: false },
        { name: "winner", isMut: true, isSigner: true },
        { name: "poolTokenAccount", isMut: true, isSigner: false },
        { name: "winnerTokenAccount", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
      ],
      args: [],
    },
  ],
  accounts: [
    {
      name: "Lottery",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "ticketPrice", type: "u64" },
          { name: "startTime", type: "i64" },
          { name: "endTime", type: "i64" },
          { name: "participants", type: { vec: "publicKey" } },
          { name: "winner", type: { option: "publicKey" } },
          { name: "charityId", type: "u8" },
          { name: "charityDonationPercentage", type: "u8" },
        ],
      },
    },
    {
      name: "CharityVote",
      type: {
        kind: "struct",
        fields: [
          { name: "charityId", type: "u8" },
          { name: "voteCount", type: "u32" },
          { name: "name", type: "string" },
          { name: "description", type: "string" },
        ],
      },
    },
  ],
  errors: [
    { code: 6000, name: "LotteryNotActive", msg: "Lottery is not active" },
    { code: 6001, name: "LotteryNotEnded", msg: "Lottery has not ended yet" },
    { code: 6002, name: "NotWinner", msg: "You are not the winner" },
    { code: 6003, name: "NotAuthority", msg: "You are not the authority" },
    { code: 6004, name: "InvalidCharityId", msg: "Invalid charity ID" },
  ],
}

// Program ID (replace with your local program ID)
export const PROGRAM_ID = new PublicKey("9nKa1x4vcnDnPFAQm9VFCrWZgUR4HFyuK69L7kGgXXRC")

interface LotteryData {
  authority: PublicKey;
  ticketPrice: BN;
  startTime: BN;
  endTime: BN;
  participants: number;
  winner: number;
  winnerChosen: boolean;
  tokenLotteryPot: BN;
}

// Helper function to create a program instance
export function useCharityLotteryProgram() {
  const wallet = useAnchorWallet()
  const [program, setProgram] = useState<Program | null>(null)

  useEffect(() => {
    if (!wallet) return

    try {
      // Use localhost RPC endpoint
      const connection = new Connection("http://localhost:8899", {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
        disableRetryOnRateLimit: false,
      })

      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      })

      const prog = new Program(CHARITY_LOTTERY_IDL as any, PROGRAM_ID, provider)
      setProgram(prog)
    } catch (error) {
      console.error("Error initializing Anchor program:", error)
    }
  }, [wallet])

  return program
}

// Helper function to get lottery data
export async function getLotteryData(program: Program): Promise<{ lotteryAccount: PublicKey; lotteryData: LotteryData } | null> {
  try {
    const [lotteryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    )

    const lotteryAccount = await program.account.tokenLottery.fetch(lotteryPda) as {
      authority: PublicKey;
      price: BN;
      lotteryStart: BN;
      lotteryEnd: BN;
      ticketNumber: BN;
      winner: number;
      winnerChosen: boolean;
      tokenLotteryPot: BN;
    }
    
    return {
      lotteryAccount: lotteryPda,
      lotteryData: {
        authority: lotteryAccount.authority,
        ticketPrice: lotteryAccount.price,
        startTime: lotteryAccount.lotteryStart,
        endTime: lotteryAccount.lotteryEnd,
        participants: lotteryAccount.ticketNumber.toNumber(),
        winner: lotteryAccount.winner,
        winnerChosen: lotteryAccount.winnerChosen,
        tokenLotteryPot: lotteryAccount.tokenLotteryPot,
      },
    }
  } catch (error) {
    console.error("Error in getLotteryData:", error)
    return null
  }
}

// Helper function to get charity vote accounts - now returns mock data
export async function getCharityVotes(program: Program) {
  try {
    console.log("Fetching charity votes (mock)...")

    // For demo purposes, return mock charity votes
    return [
      {
        publicKey: new PublicKey("11111111111111111111111111111111"),
        account: {
          charityId: 1,
          voteCount: new BN(120),
          name: "Global Education Fund",
          description: "Providing education to children in underserved communities worldwide.",
          toNumber: () => 120,
        },
      },
      {
        publicKey: new PublicKey("22222222222222222222222222222222"),
        account: {
          charityId: 2,
          voteCount: new BN(85),
          name: "Ocean Conservation",
          description: "Working to protect marine ecosystems and reduce ocean pollution.",
          toNumber: () => 85,
        },
      },
      {
        publicKey: new PublicKey("33333333333333333333333333333333"),
        account: {
          charityId: 3,
          voteCount: new BN(97),
          name: "Hunger Relief",
          description: "Providing meals and sustainable food solutions to those in need.",
          toNumber: () => 97,
        },
      },
      {
        publicKey: new PublicKey("44444444444444444444444444444444"),
        account: {
          charityId: 4,
          voteCount: new BN(64),
          name: "Medical Research",
          description: "Funding research for treatments and cures for various diseases.",
          toNumber: () => 64,
        },
      },
    ]
  } catch (error) {
    console.error("Error fetching charity votes:", error)
    return []
  }
}

// Helper function to buy tickets
export async function buyTickets(program: Program, numTickets: number) {
  try {
    const [lotteryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    )

    const [collectionMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_mint")],
      program.programId
    )

    const lotteryAccount = await program.account.tokenLottery.fetch(lotteryPda) as {
      authority: PublicKey;
      price: BN;
      lotteryStart: BN;
      lotteryEnd: BN;
      ticketNumber: BN;
      winner: number;
      winnerChosen: boolean;
      tokenLotteryPot: BN;
    }
    
    const ticketNumber = lotteryAccount.ticketNumber
    
    const ticketNumberBytes = new Uint8Array(8)
    ticketNumber.toArray("le", 8).forEach((byte, index) => {
      ticketNumberBytes[index] = byte
    })
    
    const [ticketMintPda] = PublicKey.findProgramAddressSync(
      [ticketNumberBytes],
      program.programId
    )

    if (!program.provider.publicKey) {
      throw new Error("Wallet not connected")
    }

    const destination = await getAssociatedTokenAddress(
      ticketMintPda,
      program.provider.publicKey
    )

    const metadataProgramId = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        ticketMintPda.toBuffer(),
      ],
      metadataProgramId
    )

    const [masterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        ticketMintPda.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgramId
    )

    const [collectionMetadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        collectionMintPda.toBuffer(),
      ],
      metadataProgramId
    )

    const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        collectionMintPda.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgramId
    )

    const tx = await program.methods
      .buyTicket()
      .accounts({
        payer: program.provider.publicKey,
        tokenLottery: lotteryPda,
        ticketMint: ticketMintPda,
        destination: destination,
        metadata: metadataPda,
        masterEdition: masterEditionPda,
        collectionMetadata: collectionMetadataPda,
        collectionMasterEdition: collectionMasterEditionPda,
        collectionMint: collectionMintPda,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        tokenMetadataProgram: metadataProgramId,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .rpc()

    return tx
  } catch (error) {
    console.error("Error buying tickets:", error)
    throw error
  }
}

// Helper function to vote for a charity - now returns mock transaction
export async function voteForCharity(program: Program, charityId: number) {
  try {
    console.log(`Mock voting for charity ID ${charityId}`)

    // Simulate network delay for a more realistic experience
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, return a mock transaction ID
    return "mock_transaction_id_" + Math.random().toString(36).substring(2, 15)
  } catch (error) {
    console.error("Error voting for charity:", error)
    throw error
  }
}

// Helper function to claim prize - now returns mock transaction
export async function claimPrize(program: Program) {
  try {
    console.log("Mock claiming prize")

    // Simulate network delay for a more realistic experience
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // For demo purposes, return a mock transaction ID
    return "mock_transaction_id_" + Math.random().toString(36).substring(2, 15)
  } catch (error) {
    console.error("Error claiming prize:", error)
    throw error
  }
}
