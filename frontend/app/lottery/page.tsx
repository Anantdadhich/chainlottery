
"use client";

import { useState, useEffect, useMemo } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Ticket, Sparkles, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/navbar";
import ThreeBackground from "@/components/three-background";
import CountdownTimer from "@/components/countdown-timer";
import TicketAnimation from "@/components/ticket-animation";

import { AnchorProvider } from "@coral-xyz/anchor";
import {
  Cluster,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

import {
  getTokenLotteryProgram,
  getTokenLotteryProgramId,
} from "@/lib/anchor";
import {

  getLotteryData,
  buyTickets,
} from "@/lib/anchor-client"; 
import { BN } from "bn.js";



export default function LotteryPage() {
  const { connected, publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const [prizePool, setPrizePool] = useState(0);
  const [ticketPrice, setTicketPrice] = useState(1);
  const [endTime, setEndTime] = useState(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [numTickets, setNumTickets] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentCharity, setCurrentCharity] = useState({
    id: 1,
    name: "Global Education Fund",
  });
  const [isProgramLoading, setIsProgramLoading] = useState(true);
  const [programAccountExists, setProgramAccountExists] = useState(true);
  const [userTickets, setUserTickets] = useState<number>(0);
  const [pastWinners, setPastWinners] = useState<
    Array<{ address: string; amount: number; timestamp: number }>
  >([]);
  const [isTransactionPending, setIsTransactionPending] = useState(false);


  const programId = useMemo(() => getTokenLotteryProgramId("devnet" as Cluster), []);
  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      { publicKey, signTransaction, signAllTransactions },
      { preflightCommitment: "processed" }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

 
  const program = useMemo(() => {
    if (!provider) return null;
    return getTokenLotteryProgram(provider);
  }, [provider]);

  useEffect(() => {
    if (!programId || !connection) return;

    (async () => {
      setIsProgramLoading(true);
      try {
        const accountInfo = await connection.getParsedAccountInfo(programId as PublicKey);
        setProgramAccountExists(!!accountInfo.value);
      } catch (err) {
        console.error("Error checking program account:", err);
        setProgramAccountExists(false);
      } finally {
        setIsProgramLoading(false);
      }
    })();
  }, [programId, connection]);

  const fetchLotteryData = async () => {
    if (!program) return;

    try {
      //@ts-ignore
      const result = await getLotteryData(program);
      if (result === null) {

        if (!publicKey) {
          throw new Error("Wallet not connected");
        }

        const [lotteryPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("token_lottery")],
          program.programId
        );
        const [collectionMintPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("collection_mint")],
          program.programId
        );

       
        const tx = await program.methods
          .initializeLottery(
            new BN(ticketPrice * 1_000_000_000),
            new BN(3 * 24 * 60 * 60)
          )
          .accounts({
            authority: publicKey,
            tokenLottery: lotteryPDA,
            collectionMint: collectionMintPDA,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          })
          .rpc();
        await connection.confirmTransaction(tx);

        
        //@ts-ignore
        const secondFetch = await getLotteryData(program);
        if (secondFetch) {
          setTicketPrice(secondFetch.lotteryData.price.toNumber() / 1_000_000_000);
          setEndTime(secondFetch.lotteryData.lotteryEnd.toNumber() * 1000);
          setPrizePool(secondFetch.lotteryData.tokenLotteryPot.toNumber() / 1_000_000_000);
          setCurrentCharity({
            id: secondFetch.lotteryData.charityId?.toNumber() || 1,
            name: "Global Education Fund",
          });
        }
      } else {
     
        setTicketPrice(result.lotteryData.price.toNumber() / 1_000_000_000);
        setEndTime(result.lotteryData.lotteryEnd.toNumber() * 1000);
        setPrizePool(result.lotteryData.tokenLotteryPot.toNumber() / 1_000_000_000);
        setCurrentCharity({
          id: result.lotteryData.charityId?.toNumber() || 1,
          name: "Global Education Fund",
        });
      }
    } catch (err: any) {
      console.error("Failed to fetch lottery data:", err);
      toast({
        title: "Error loading lottery data",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!program || !programAccountExists) return;
    fetchLotteryData();
    const interval = setInterval(fetchLotteryData, 10_000);
    return () => clearInterval(interval);
  }, [program, programAccountExists, toast]);

  
  const fetchUserTickets = async () => {
    if (!program || !publicKey) return;
    try {
      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_lottery")],
        program.programId
      );
      //@ts-ignore
      const rawAccount = await program.account.tokenLottery.fetch(lotteryPDA);
      const userTicketCount = rawAccount.ticketNumber.toNumber();
      setUserTickets(userTicketCount);
    } catch (err: any) {
      // If account does not exist yet, we’ll treat it as 0
      if (err.message.includes("Account does not exist")) {
        setUserTickets(0);
      } else {
        console.error("Failed to fetch user tickets:", err);
      }
    }
  };

  
  const fetchPastWinners = async () => {
    setPastWinners([
      {
        address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        amount: 1.5,
        timestamp: Date.now() - 86_400_000,
      },
      {
        address: "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
        amount: 2.1,
        timestamp: Date.now() - 172_800_000,
      },
    ]);
  };

  useEffect(() => {
    if (connected && publicKey && program) {
      fetchUserTickets();
    }
    fetchPastWinners();
  }, [connected, publicKey, program]);
 
  const handleBuyTickets = async () => {
    if (!connected || !publicKey || !program) {
      toast({
        title: "Error",
        description: !connected ? "Please connect your wallet" : "Program not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setIsTransactionPending(true);
       //@ts-ignore
      const txSignature = await buyTickets(program, numTickets);
      await connection.confirmTransaction(txSignature);

      setShowAnimation(true);
      toast({
        title: "Tickets purchased!",
        description: `Bought ${numTickets} ticket${numTickets > 1 ? "s" : ""}`,
        variant: "default",
      });

    
      await Promise.all([fetchLotteryData(), fetchUserTickets()]);
    } catch (err: any) {
      console.error("Error buying tickets:", err);
      toast({
        title: "Error buying tickets",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsTransactionPending(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
  };

 
  if (isProgramLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Loading program…</p>
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </main>
    );
  }

 
  return (
    <main className="min-h-screen">
      <ThreeBackground />
      <Navbar />

      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center gradient-text">Lottery</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div>
              <Card className="glass-card h-full">
                <CardHeader>
                  <CardTitle>Current Lottery Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">Prize Pool</h3>
                      <p className="text-4xl font-bold gradient-text">{prizePool.toFixed(2)} SOL</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">Time Remaining</h3>
                      <CountdownTimer endTime={endTime} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-400 mb-2">Current Charity</h3>
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Sparkles size={20} className="text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{currentCharity.name}</p>
                          <p className="text-sm text-gray-400">10% of prize pool donated</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              {showAnimation ? (
                <Card className="glass-card h-full">
                  <CardHeader>
                    <CardTitle>Processing Your Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TicketAnimation numTickets={numTickets} onComplete={handleAnimationComplete} />
                  </CardContent>
                </Card>
              ) : (
                <Card className="glass-card h-full">
                  <CardHeader>
                    <CardTitle>Buy Tickets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Number of Tickets</label>
                        <div className="flex items-center space-x-4">
                          <Slider
                            value={[numTickets]}
                            min={1}
                            max={10}
                            step={1}
                            onValueChange={(value) => setNumTickets(value[0])}
                            className="flex-grow"
                          />
                          <Input
                            type="number"
                            value={numTickets}
                            onChange={(e) => setNumTickets(Number.parseInt(e.target.value) || 1)}
                            min={1}
                            max={10}
                            className="w-20"
                          />
                        </div>
                      </div>
                      <div className="bg-black/20 p-4 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span>Ticket Price:</span>
                          <span>{ticketPrice} SOL</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span>Number of Tickets:</span>
                          <span>{numTickets}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-white/10 pt-2 mt-2">
                          <span>Total Cost:</span>
                          <span className="gradient-text">{(ticketPrice * numTickets).toFixed(2)} SOL</span>
                        </div>
                      </div>
                      <Button
                        onClick={handleBuyTickets}
                        disabled={isLoading || !connected}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-black font-bold hover:opacity-90 transition-opacity"
                      >
                        {isLoading ? (
                          "Processing..."
                        ) : (
                          <>
                            <Ticket className="mr-2" size={18} />
                            Buy Tickets
                          </>
                        )}
                      </Button>
                      {!connected && (
                        <p className="text-sm text-amber-400 flex items-center">
                          <Info size={14} className="mr-1" />
                          Connect your wallet to buy tickets
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

           
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Your Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Tickets</span>
                    <span className="text-2xl font-bold">{userTickets}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Spent</span>
                    <span className="text-2xl font-bold">
                      {(userTickets * ticketPrice).toFixed(2)} SOL
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

    
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Past Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastWinners.map((winner, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {winner.address.slice(0, 4)}...{winner.address.slice(-4)}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(winner.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-lg font-bold">{winner.amount} SOL</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Lottery Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold mb-1">How it works</h3>
                    <p className="text-gray-400">
                      Purchase tickets to enter. Each ticket costs {ticketPrice} SOL.
                      The more tickets you buy, the higher your chances.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Prize Distribution</h3>
                    <p className="text-gray-400">
                      90% to the winner, 10% to charity.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Winner Selection</h3>
                    <p className="text-gray-400">
                      Winner is randomly selected on-chain at close.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">Claiming Prizes</h3>
                    <p className="text-gray-400">
                      If you win, your prize is transferred automatically.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}
