
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";      
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { MPL_TOKEN_METADATA_PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

import { getTokenLotteryProgram, getTokenLotteryProgramId } from "./anchor";
import type { TokenLottery } from "../../target/types/token_lottery";


export const PROGRAM_ID = getTokenLotteryProgramId("devnet");


interface LotteryData {
  authority: PublicKey;
  price: BN;
  lotteryStart: BN;
  lotteryEnd: BN;
  ticketNumber: BN;
  winner: number;
  winnerChosen: boolean;
  tokenLotteryPot: BN;
  charityId?: BN;
}

 
export function useCharityLotteryProgram(): Program<TokenLottery> | null {
  const wallet = useAnchorWallet();
  const [program, setProgram] = useState<Program<TokenLottery> | null>(null);

  useEffect(() => {
    if (!wallet) return;

    try {

      const connection = new Connection("http://localhost:8899", {
        commitment: "confirmed",
        confirmTransactionInitialTimeout: 60000,
      });

    
      const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      });

      // 3) Build a typed Program<TokenLottery>
      const prog = getTokenLotteryProgram(provider);
      //@ts-ignore
      setProgram(prog);
    } catch (err) {
      console.error("Error initializing Anchor program:", err);
    }
  }, [wallet]);

  return program;
}


export async function getLotteryData(
  program: Program<TokenLottery>
): Promise<{ lotteryAccount: PublicKey; lotteryData: LotteryData } | null> {
  try {
    // Derive PDA for [ "token_lottery" ]
    const [lotteryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    );

    // Because we used Program<TokenLottery>, TS knows `tokenLottery` exists:
    const rawAccount = await program.account.tokenLottery.fetch(lotteryPda);
    const lotteryAccount = rawAccount as unknown as LotteryData;

    return {
      lotteryAccount: lotteryPda,
      lotteryData: lotteryAccount,
    };
  } catch (err) {
    console.error("Error in getLotteryData:", err);
    return null;
  }
}

export async function getCharityVotes(
  program: Program<TokenLottery>
): Promise<
  Array<{
    publicKey: PublicKey;
    account: {
      charityId: number;
      voteCount: BN;
      name: string;
      description: string;
      toNumber: () => number;
    };
  }>
> {
  try {
    console.log("Fetching charity votes (mock)...");
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
    ];
  } catch (error) {
    console.error("Error fetching charity votes:", error);
    return [];
  }
}

export async function buyTickets(
  program: Program<TokenLottery>,
  numTickets: number
): Promise<string> {
  try {
 
    const [lotteryPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    );


    const [collectionMintPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("collection_mint")],
      program.programId
    );

   
    const rawAccount = await program.account.tokenLottery.fetch(lotteryPda);
    const lotteryAccount = rawAccount as unknown as LotteryData;

    
    const ticketNumberBytes = new Uint8Array(8);
    lotteryAccount.ticketNumber.toArray("le", 8).forEach((b, i) => {
      ticketNumberBytes[i] = b;
    });


    const [ticketMintPda] = PublicKey.findProgramAddressSync(
      [ticketNumberBytes],
      program.programId
    );


    if (!program.provider.publicKey) {
      throw new Error("Wallet not connected");
    }


    const destination = await getAssociatedTokenAddress(
      ticketMintPda,
      program.provider.publicKey
    );

    
    const metadataProgramId = new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID);

    const [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        ticketMintPda.toBuffer(),
      ],
      metadataProgramId
    );
    const [masterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        ticketMintPda.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgramId
    );

   
    const [collectionMetadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        collectionMintPda.toBuffer(),
      ],
      metadataProgramId
    );
    const [collectionMasterEditionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        metadataProgramId.toBuffer(),
        collectionMintPda.toBuffer(),
        Buffer.from("edition"),
      ],
      metadataProgramId
    );

 
    const txSignature = await program.methods
      .buyTicket()  
      .accounts({
        payer: program.provider.publicKey,
        //@ts-ignore
        tokenLottery: lotteryPda,
        ticketMint: ticketMintPda,
        destination,
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
      .rpc();

    return txSignature;
  } catch (err) {
    console.error("Error buying tickets:", err);
    throw err;
  }
}


export async function claimPrize(program: Program<TokenLottery>): Promise<string> {
  try {
    console.log("Mock claiming prize");
    await new Promise((r) => setTimeout(r, 1000));
    return "mock_tx_" + Math.random().toString(36).substring(2, 12);
  } catch (error) {
    console.error("Error claiming prize:", error);
    throw error;
  }
}
