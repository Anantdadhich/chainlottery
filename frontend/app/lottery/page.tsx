/*"use client"

import { useState, useEffect, useMemo } from "react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
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
import { getTokenlotteryProgram, getTokenLotteryProgramId } from "@/lib/anchor"
import { PublicKey } from "@solana/web3.js"
import { BN } from "bn.js"

export default function LotteryPage() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const cluster = useCluster(); // devnet/mainnet
  const { toast } = useToast();

  const [program, lotteryProgramId] = useMemo(() => {
    const id = getTokenLotteryProgramId(cluster);
    return [getTokenlotteryProgram({ connection, publicKey }), id];
  }, [connection, publicKey, cluster]);

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

  const fetchLotteryData = async () => {
    try {
      if (!program) return;

      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("lottery")],
        program.programId
      );

      const lotteryData = await program.account.lottery.fetch(lotteryPDA);

      setTicketPrice(lotteryData.ticketPrice.toNumber() / 1_000_000_000);
      setEndTime(lotteryData.endTime.toNumber() * 1000);

      const pool =
        (lotteryData.ticketPrice.toNumber() *
          lotteryData.participants.length) /
        1_000_000_000;

      setPrizePool(pool);

      setCurrentCharity({
        id: lotteryData.charityId,
        name: "Global Education Fund", // Hardcoded or fetch from another source
      });
    } catch (error) {
      console.error("Failed to fetch lottery data:", error);
    }
  };

  useEffect(() => {
    fetchLotteryData();
    const interval = setInterval(fetchLotteryData, 10000);
    return () => clearInterval(interval);
  }, [program]);

  const handleBuyTickets = async () => {
    if (!connected || !publicKey) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tickets",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const [lotteryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from("lottery")],
        program.programId
      );

      await program.methods
        .buyTickets(new BN(numTickets))
        .accounts({
          lottery: lotteryPDA,
          buyer: publicKey,
          systemProgram: PublicKey.default,
        })
        .rpc();

      setShowAnimation(true);
      toast({
        title: "Tickets purchased!",
        description: `Successfully purchased ${numTickets} ticket${numTickets > 1 ? "s" : ""}`,
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error buying tickets",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimationComplete = () => {
    setShowAnimation(false);
    fetchLotteryData();
  };


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

*/

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
import { Cluster,  PublicKey } from "@solana/web3.js"
import { getTokenlotteryProgram, getTokenLotteryProgramId } from "@/lib/anchor"





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

  useEffect(() => {
    if (!program || !programAccountExists) return;

    const fetchLotteryData = async () => {
      try {
        //@ts-ignore
        const accounts = await program.account.lotteryData.all();

        if (accounts.length > 0) {
          const data = accounts[0];
          setLotteryData(data);

          const calculatedPrizePool =
            (data.account.ticketPrice.toNumber() * (data.account.participants?.length || 0)) / 1_000_000_000;
          setPrizePool(calculatedPrizePool || 100);
          setTicketPrice(data.account.ticketPrice.toNumber() / 1_000_000_000);
          setEndTime(data.account.endTime.toNumber() * 1000);
          setCurrentCharity({
            id: data.account.charityId?.toNumber() || 1,
            name: "Global Education Fund", 
          });
        }
      } catch (error) {
        console.error("Error fetching lottery data:", error);
        toast({
          title: "Error loading lottery data",
          description: "Failed to load lottery information",
          variant: "destructive",
        });
      }
    };

    fetchLotteryData();
    const interval = setInterval(fetchLotteryData, 10000);
    return () => clearInterval(interval);
  }, [program, programAccountExists, toast]);

  const handleBuyTickets = async () => {
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to buy tickets",
        variant: "destructive",
      });
      return;
    }

    if (!program) {
      toast({
        title: "Error",
        description: "Program not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const tx = await program.methods.buyTickets(numTickets).rpc();

      setShowAnimation(true);

      toast({
        title: "Tickets purchased!",
        description: `Successfully purchased ${numTickets} ticket${numTickets > 1 ? "s" : ""}`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error buying tickets:", error);
      toast({
        title: "Error buying tickets",
        description: "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          </div>

          {/* Rules Section */}
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