"use client"

import { useState, useEffect, useMemo } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { Ticket, Sparkles, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"
import Navbar from "@/components/navbar"
import ThreeBackground from "@/components/three-background"
import CountdownTimer from "@/components/countdown-timer"
import TicketAnimation from "@/components/ticket-animation"

import { AnchorProvider} from '@coral-xyz/anchor';
import { Cluster, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { getTokenlotteryProgram, getTokenLotteryProgramId } from "@/lib/anchor"
import { BN } from "bn.js"


const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export default function LotteryPage() {
  const { connected, publicKey, signTransaction, signAllTransactions, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { toast } = useToast();

  const [prizePool, setPrizePool] = useState(100);
  const [ticketPrice, setTicketPrice] = useState(1);
  const [endTime, setEndTime] = useState(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const [numTickets, setNumTickets] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [currentCharity, setCurrentCharity] = useState({
    id: 1,
    name: "Global Education Fund",
  });
  const [lotteryData, setLotteryData] = useState<any>(null); // Define a custom type later if needed
  const [isProgramLoading, setIsProgramLoading] = useState(true);
  const [programAccountExists, setProgramAccountExists] = useState(true);
  const [userTickets, setUserTickets] = useState<number>(0);
  const [pastWinners, setPastWinners] = useState<Array<{address: string, amount: number, timestamp: number}>>([]);
  const [isTransactionPending, setIsTransactionPending] = useState(false);

  const programId = useMemo(() => {
    return getTokenLotteryProgramId("devnet" as Cluster);
  }, []);

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !signAllTransactions) return null;
    return new AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { preflightCommitment: "processed" }
    );
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  const program = useMemo(() => {
    if (!provider) return null;
    return getTokenlotteryProgram(provider);
  }, [provider]);

  useEffect(() => {
    if (!programId || !connection) return;

    const checkProgramAccount = async () => {
      try {
        setIsProgramLoading(true);
        const account = await connection.getParsedAccountInfo(programId as PublicKey);
        setProgramAccountExists(!!account.value);
      } catch (error) {
        console.error("Error checking program account:", error);
        setProgramAccountExists(false);
      } finally {
        setIsProgramLoading(false);
      }
    };

    checkProgramAccount();
  }, [programId, connection]);

  const fetchLotteryData = async () => {
    if (!program) return;
    try {
      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_lottery")],
        program.programId
      );

      try {
        //@ts-ignore
        const lotteryData = await program.account.tokenLottery.fetch(lotteryPDA);
        setTicketPrice(lotteryData.price.toNumber() / 1_000_000_000);
        setEndTime(lotteryData.lottery_end.toNumber() * 1000);
        setPrizePool(lotteryData.token_lottery_pot.toNumber() / 1_000_000_000);
        setCurrentCharity({
          id: lotteryData.charity_id?.toNumber() || 1,
          name: "Global Education Fund", 
        });
      } catch (error: any) {
        // If account doesn't exist, initialize it
        if (error?.message?.includes("Account does not exist")) {
          if (!publicKey) {
            throw new Error("Wallet not connected");
          }
          
          const [collectionMintPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("collection_mint")],
            program.programId
          );

          const tx = await program.methods
            .lotteryinitalize()
            .accounts({
              authority: publicKey,
              token_lottery: lotteryPDA,
              collection_mint: collectionMintPDA,
              system_program: SystemProgram.programId,
              rent: SYSVAR_RENT_PUBKEY,
            })
            .rpc();

          await connection.confirmTransaction(tx);
          
          // Fetch the data again after initialization
          //@ts-ignore
          const lotteryData = await program.account.tokenLottery.fetch(lotteryPDA);
          setTicketPrice(lotteryData.price.toNumber() / 1_000_000_000);
          setEndTime(lotteryData.lottery_end.toNumber() * 1000);
          setPrizePool(lotteryData.token_lottery_pot.toNumber() / 1_000_000_000);
          setCurrentCharity({
            id: lotteryData.charity_id?.toNumber() || 1,
            name: "Global Education Fund", 
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to fetch lottery data:", error);
      toast({
        title: "Error loading lottery data",
        description: "Failed to load lottery information",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!program || !programAccountExists) return;
    fetchLotteryData();
    const interval = setInterval(fetchLotteryData, 10000);
    return () => clearInterval(interval);
  }, [program, programAccountExists, toast]);

  const fetchUserTickets = async () => {
    if (!program || !publicKey) return;
    try {
      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_lottery")],
        program.programId
      );
      try {
        //@ts-ignore
        const lotteryData = await program.account.tokenLottery.fetch(lotteryPDA);
        const userTicketCount = lotteryData.ticket_number.toNumber();
        setUserTickets(userTicketCount);
      } catch (error: any) {
        if (error?.message?.includes("Account does not exist")) {
          setUserTickets(0);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to fetch user tickets:", error);
    }
  };

  const fetchPastWinners = async () => {
    if (!program) return;
    try {
      // This would need to be implemented in your program
      // For now, we'll use mock data
      setPastWinners([
        { address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", amount: 1.5, timestamp: Date.now() - 86400000 },
        { address: "8xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU", amount: 2.1, timestamp: Date.now() - 172800000 },
      ]);
    } catch (error) {
      console.error("Failed to fetch past winners:", error);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
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

      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("token_lottery")],
        program.programId
      );

      // Get collection mint PDA
      const [collectionMintPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_mint")],
        program.programId
      );

      // Get current ticket number
      //@ts-ignore
      const lotteryData = await program.account.tokenLottery.fetch(lotteryPDA);
      const currentTicketNumber = lotteryData.ticket_number;

      // Get ticket mint PDA using current ticket number
      const [ticketMintPDA] = PublicKey.findProgramAddressSync(
        [currentTicketNumber.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );

      // Get destination PDA (Associated Token Account)
      const [destinationPDA] = PublicKey.findProgramAddressSync(
        [publicKey.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), ticketMintPDA.toBuffer()],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // Get metadata PDA
      const [metadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), ticketMintPDA.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Get master edition PDA
      const [masterEditionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), ticketMintPDA.toBuffer(), Buffer.from("edition")],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Get collection metadata PDA
      const [collectionMetadataPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), collectionMintPDA.toBuffer()],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Get collection master edition PDA
      const [collectionMasterEditionPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("metadata"), TOKEN_METADATA_PROGRAM_ID.toBuffer(), collectionMintPDA.toBuffer(), Buffer.from("edition")],
        TOKEN_METADATA_PROGRAM_ID
      );

      const tx = await program.methods
        .buy_ticket(new BN(numTickets))
        .accounts({
          payer: publicKey,
          token_lottery: lotteryPDA,
          ticket_mint: ticketMintPDA,
          destination: destinationPDA,
          metadata: metadataPDA,
          master_edition: masterEditionPDA,
          collection_metadata: collectionMetadataPDA,
          collection_master_edition: collectionMasterEditionPDA,
          collection_mint: collectionMintPDA,
          associated_token_program: ASSOCIATED_TOKEN_PROGRAM_ID,
          token_program: TOKEN_PROGRAM_ID,
          system_program: SystemProgram.programId,
          token_metadata_program: TOKEN_METADATA_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      // Wait for confirmation
      await connection.confirmTransaction(tx);

      setShowAnimation(true);
      toast({
        title: "Tickets purchased!",
        description: `Successfully purchased ${numTickets} ticket${numTickets > 1 ? "s" : ""}`,
        variant: "default",
      });
      
      // Refresh data
      await Promise.all([fetchLotteryData(), fetchUserTickets()]);
    } catch (err: any) {
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
          <p className="mb-4">Loading program...</p>
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
                          <p className="text-sm text-gray-400">10% of prize pool will be donated</p>
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

            {/* User's Tickets */}
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
                    <span className="text-2xl font-bold">{userTickets * ticketPrice} SOL</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Past Winners */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Past Winners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastWinners.map((winner, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                      <div>
                        <p className="font-medium">{winner.address.slice(0, 4)}...{winner.address.slice(-4)}</p>
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
                      Purchase tickets to enter the lottery. Each ticket costs {ticketPrice} SOL. The more tickets you
                      buy, the higher your chances of winning.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1">Prize Distribution</h3>
                    <p className="text-gray-400">
                      90% of the prize pool goes to the winner. 10% is donated to the selected charity.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1">Winner Selection</h3>
                    <p className="text-gray-400">
                      The winner is randomly selected on-chain when the lottery ends. The selection process is
                      transparent and verifiable on the Solana blockchain.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-1">Claiming Prizes</h3>
                    <p className="text-gray-400">
                      If you win, you can claim your prize directly from the lottery page. Prizes are automatically
                      transferred to your wallet.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  )
}