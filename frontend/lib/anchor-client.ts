import { Connection, PublicKey } from "@solana/web3.js"
import { Program, AnchorProvider, BN } from "@project-serum/anchor"
import { useAnchorWallet } from "@solana/wallet-adapter-react"

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

// Program ID (replace with actual program ID)
export const PROGRAM_ID = new PublicKey("11111111111111111111111111111111")

// Helper function to create a program instance
export function useCharityLotteryProgram() {
  const wallet = useAnchorWallet()

  if (!wallet) return null

  const connection = new Connection("https://api.devnet.solana.com", "confirmed")

  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" })

  return new Program(CHARITY_LOTTERY_IDL as any, PROGRAM_ID, provider)
}

// Helper function to get lottery data - now always returns mock data for demo
export async function getLotteryData(program: Program) {
  try {
    // For demo purposes, always return mock data instead of trying to fetch real data
    // This avoids the "Account does not exist" error
    return {
      lotteryAccount: new PublicKey("11111111111111111111111111111111"),
      lotteryData: {
        authority: program.provider.publicKey,
        ticketPrice: new BN(1_000_000_000), // 1 SOL in lamports
        startTime: new BN(Date.now() / 1000 - 86400), // 1 day ago
        endTime: new BN(Date.now() / 1000 + 259200), // 3 days from now
        participants: Array(25).fill(program.provider.publicKey), // 25 participants for a realistic prize pool
        winner: null,
        charityId: 1,
        charityDonationPercentage: 10,
        toNumber: function () {
          return this
        },
      },
    }
  } catch (error) {
    console.error("Error in getLotteryData:", error)
    // Fallback mock data in case of any error
    return {
      lotteryAccount: new PublicKey("11111111111111111111111111111111"),
      lotteryData: {
        authority: program.provider.publicKey,
        ticketPrice: new BN(1_000_000_000),
        startTime: new BN(Date.now() / 1000 - 86400),
        endTime: new BN(Date.now() / 1000 + 259200),
        participants: Array(25).fill(program.provider.publicKey),
        winner: null,
        charityId: 1,
        charityDonationPercentage: 10,
        toNumber: function () {
          return this
        },
      },
    }
  }
}

// Helper function to get charity vote accounts - now returns mock data
export async function getCharityVotes(program: Program) {
  try {
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

// Helper function to buy tickets - now returns mock transaction
export async function buyTickets(program: Program, numTickets: number) {
  try {
    // For demo purposes, return a mock transaction ID
    console.log(`Mock buying ${numTickets} tickets`)
    return "mock_transaction_id_" + Math.random().toString(36).substring(2, 15)
  } catch (error) {
    console.error("Error buying tickets:", error)
    throw error
  }
}

// Helper function to vote for a charity - now returns mock transaction
export async function voteForCharity(program: Program, charityId: number) {
  try {
    // For demo purposes, return a mock transaction ID
    console.log(`Mock voting for charity ID ${charityId}`)
    return "mock_transaction_id_" + Math.random().toString(36).substring(2, 15)
  } catch (error) {
    console.error("Error voting for charity:", error)
    throw error
  }
}

// Helper function to claim prize - now returns mock transaction
export async function claimPrize(program: Program) {
  try {
    // For demo purposes, return a mock transaction ID
    console.log("Mock claiming prize")
    return "mock_transaction_id_" + Math.random().toString(36).substring(2, 15)
  } catch (error) {
    console.error("Error claiming prize:", error)
    throw error
  }
}
