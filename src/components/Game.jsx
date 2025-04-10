/*import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { Game as GameLogic } from "../lib/game";
import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { connection } from "../lib/constant";
import { transferTokens, getSliceReward } from "../lib/token";


const HOUSE_ADDRESS = "32STPfgoC994puyF7LmqqrSUKZg6bhqFC7ekoxNQLFtN";

const GameBuild = ({ isWalletConnected = false, sendTransaction }) => {
  const { publicKey, signMessage } = useWallet();

  const [gamestate, setgamestate] = useState({ score: 0, lives: 3, isPlaying: false });
  const [copystatus, setcopystatus] = useState({ house: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardstatus, setrewardStaus] = useState({ loading: false, success: false, error: null });
  const [currentscreen, setcurrentscreen] = useState("start");
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaimProcessing, setIsClaimProcessing] = useState(false);

  const canvasRef = useRef(null);
  const gameinstanceRef = useRef(null);
  const animationRef = useRef(null);


  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

 
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setcopystatus((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setcopystatus((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  // Entry fee transaction and game initiation
  const initgame = async () => {
    if (!isWalletConnected || !publicKey || isProcessing) return;

    setIsProcessing(true);
    try {
      // Entry fee transaction: send a small amount of SOL to the persistent house wallet
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(HOUSE_ADDRESS),
          lamports: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL entry fee
        })
      );

      // Send transaction
      const txSig = await sendTransaction(transaction, connection);
      console.log("Entry fee paid:", txSig);
      await connection.confirmTransaction(txSig);

      // Start the game
      setgamestate({ score: 0, lives: 3, isPlaying: true });
      setcurrentscreen("game");
    } catch (error) {
      console.error("Game initialization error:", error);
      alert(`Error: ${error.message}. Make sure you have enough SOL for the entry fee.`);
    } finally {
      setIsProcessing(false);
    }
  };

 
  useEffect(() => {
    if (currentscreen === "game" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      if (gameinstanceRef.current) {
        gameinstanceRef.current.stop();
      }

      gameinstanceRef.current = new GameLogic(canvas, ctx);
      gameinstanceRef.current.start();

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      gameLoop();
    }
  }, [currentscreen]);


  const gameLoop = () => {
    if (!gamestate.isPlaying || !gameinstanceRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const result = gameinstanceRef.current.update(performance.now());

    if (result) {
      setgamestate((prev) => {
        const newState = {
          ...prev,
          score: prev.score + (result.slicedFruits || 0),
          lives: result.lives || prev.lives,
        };
        if (newState.lives <= 0 || result.gameOver) gameOver();
        return newState;
      });
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  };


  const gameOver = async () => {
    setgamestate((prev) => ({ ...prev, isPlaying: false }));
    if (gameinstanceRef.current) gameinstanceRef.current.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setcurrentscreen("gameOver");

    if (publicKey && gamestate.score > 0) {
      setrewardStaus({ loading: true, success: false, error: null });
      try {
        const rewardAmount = getSliceReward(gamestate.score);
        if (rewardAmount > 0) {
         
          await transferTokens(connection, publicKey, publicKey, rewardAmount);
          setrewardStaus({ loading: false, success: true, error: null });
        }
      } catch (err) {
        console.error(err);
        setrewardStaus({ loading: false, success: false, error: err.message });
      }
    }
  };

  // Handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (gameinstanceRef.current) gameinstanceRef.current.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

// Updated handleClaim method for your GameBuild component

const handleClaim = async () => {
  if (!publicKey || !gamestate.score) return;

  setIsClaimProcessing(true);
  setrewardStaus({ loading: true, success: false, error: null });

  try {
    // Check if we already have a token
    let jwtoken = localStorage.getItem("gameToken");
    
    if (!jwtoken) {
      // We need to login first - this requires signMessage from the wallet
      try {
        // Create a message to sign
        const message = `Login to Fruity Slice Game: ${Date.now()}`;
        const encodedMessage = new TextEncoder().encode(message);
        
        // Use the wallet to sign the message
        const signatureBytes = await signMessage(encodedMessage);
        const signatureBase64 = Buffer.from(signatureBytes).toString('base64');
        
        // Login to get a JWT token
        await loginUser(publicKey.toString(), signatureBase64, message);
        console.log("Successfully logged in");
      } catch (loginError) {
        throw new Error(`Authentication failed: ${loginError.message}`);
      }
    }
    
    // Now attempt to claim the reward
    const result = await transferTokens(publicKey.toString(), gamestate.score);
    
    setIsClaimed(true);
    setrewardStaus({ 
      loading: false, 
      success: true, 
      error: null 
    });
    
    console.log(`Successfully claimed ${result.amount} tokens!`);
    
  } catch (error) {
    console.error("Claim error:", error);
    setrewardStaus({ 
      loading: false, 
      success: false, 
      error: error.message || "Failed to claim reward. Please try again." 
    });
  } finally {
    setIsClaimProcessing(false);
  }
};

  const resetGame = () => {
    setIsClaimed(false);
    setIsClaimProcessing(false);
    setrewardStaus({ loading: false, success: false, error: null });
    setgamestate({ score: 0, lives: 3, isPlaying: false });
    setcurrentscreen("start");
  };

  return (
    <div className="w-full mx-auto container">
      <div className="mb-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between bg-black bg-opacity-30 p-4 rounded-xl">
          <div className="mb-2 sm:mb-0">
            <span className="text-sm text-gray-300">House Wallet:</span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-300">{formatAddress(HOUSE_ADDRESS)}</span>
              <button
                onClick={() => copyToClipboard(HOUSE_ADDRESS, "house")}
                className="text-green-400 hover:text-green-200 transition-colors duration-200"
              >
                {copystatus.house ? "✓" : "📋"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentscreen === "start" && (
        <div className="flex flex-col items-center gap-6 bg-black bg-opacity-40 p-8 rounded-xl">
          <div className="mb-4 relative">
            <h1 className="text-5xl font-pixel mb-4 text-yellow-400 drop-shadow-lg relative z-10">
              Fruity Slice
            </h1>
            <div className="absolute -top-6 -right-6 text-5xl animate-bounce">🍉</div>
            <div className="absolute -bottom-6 -left-6 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍎</div>
          </div>
          <h2 className="text-2xl font-pixel text-yellow-300 mb-6">Ready to Slice?</h2>
          <button
            onClick={initgame}
            disabled={!isWalletConnected || isProcessing}
            className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-pixel text-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Start Slicing!"}
          </button>
          {!isWalletConnected && (
            <p className="text-lg text-yellow-200 mt-4 bg-black bg-opacity-50 p-4 rounded-lg">
              Connect your wallet to play and earn rewards!
            </p>
          )}
        </div>
      )}

      {currentscreen === "game" && (
        <div className="w-full">
          <div className="flex justify-between mb-4 bg-black bg-opacity-50 p-3 rounded-lg font-pixel">
            <div className="text-yellow-300">Score: <span className="text-white">{gamestate.score}</span></div>
            <div className="text-yellow-300">Lives: <span className="text-white">{gamestate.lives}</span></div>
          </div>
          <div className="relative">
            <canvas ref={canvasRef} className="w-full h-[500px] border-4 border-yellow-500 rounded-lg shadow-lg" />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-evenly">
              {['🍎', '🍓', '🍊', '🍋', '🍉', '🍇'].map((fruit, index) => (
                <div key={index} className="text-2xl animate-bounce" style={{ animationDuration: `${1 + Math.random() * 2}s`, animationDelay: `${Math.random() * 1}s` }}>
                  {fruit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentscreen === "gameOver" && (
        <div className="text-center bg-black bg-opacity-50 p-8 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4 font-pixel">Game Over</h2>
          <div className="mb-6 bg-black bg-opacity-40 p-4 rounded-lg inline-block">
            <p className="text-xl">Final Score: <span className="text-yellow-300 font-bold">{gamestate.score}</span></p>
          </div>
          <div className="mb-6">
            {rewardstatus.loading && (
              <p className="text-blue-300 flex items-center justify-center gap-2">
                <span className="animate-spin">⌛</span> Processing your reward...
              </p>
            )}
            {rewardstatus.success && (
              <p className="text-green-400 text-xl bg-black bg-opacity-40 p-4 rounded-lg">
                ✅ You earned <span className="font-bold">{getSliceReward(gamestate.score)}</span> tokens!
              </p>
            )}
            {rewardstatus.error && (
              <p className="text-red-400 bg-black bg-opacity-40 p-4 rounded-lg">
                ❌ {rewardstatus.error}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isClaimed ? (
              <button
                onClick={handleClaim}
                disabled={isClaimProcessing}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-pixel text-lg shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isClaimProcessing ? "Claiming..." : "Claim Reward"}
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-pixel text-lg shadow-xl transform transition-all duration-300 hover:scale-105"
              >
                Play Again
              </button>
            )}
          </div>
          <div className="mt-8 flex justify-center">
            <div className="flex gap-6">
              {['🍎', '🍓', '🍊', '🍋', '🍉', '🍇'].map((fruit, index) => (
                <div key={index} className="text-3xl animate-bounce" style={{ animationDuration: `${1 + Math.random() * 2}s`, animationDelay: `${Math.random() * 1}s` }}>
                  {fruit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBuild;
*/

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useRef, useState } from "react";
import { Game as GameLogic } from "../lib/game";
import {
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { connection } from "../lib/constant";
import { transferTokens, getSliceReward, loginUser } from "../lib/token"; // Make sure loginUser is imported

const HOUSE_ADDRESS = "32STPfgoC994puyF7LmqqrSUKZg6bhqFC7ekoxNQLFtN";

const GameBuild = ({ isWalletConnected = false, sendTransaction }) => {
  const { publicKey, signMessage } = useWallet();

  const [gamestate, setgamestate] = useState({ score: 0, lives: 3, isPlaying: false });
  const [copystatus, setcopystatus] = useState({ house: false });
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewardstatus, setrewardStaus] = useState({ loading: false, success: false, error: null });
  const [currentscreen, setcurrentscreen] = useState("start");
  const [isClaimed, setIsClaimed] = useState(false);
  const [isClaimProcessing, setIsClaimProcessing] = useState(false);

  const canvasRef = useRef(null);
  const gameinstanceRef = useRef(null);
  const animationRef = useRef(null);
        
  const formatAddress = (address) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setcopystatus((prev) => ({ ...prev, [type]: true }));
      setTimeout(() => {
        setcopystatus((prev) => ({ ...prev, [type]: false }));
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };

  const initgame = async () => {
    if (!isWalletConnected || !publicKey || isProcessing) return;

    setIsProcessing(true);
    try {

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(HOUSE_ADDRESS),
          lamports: 0.0001 * LAMPORTS_PER_SOL,
        })
      );

    
      const txSig = await sendTransaction(transaction, connection);
      console.log("Entry fee paid:", txSig);
      await connection.confirmTransaction(txSig);

     
      setgamestate({ score: 0, lives: 3, isPlaying: true });
      setcurrentscreen("game");
    } catch (error) {
      console.error("Game initialization error:", error);
      alert(`Error: ${error.message}. Make sure you have enough SOL for the entry fee.`);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (currentscreen === "game" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.parentElement.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = rect.height;

      if (gameinstanceRef.current) {
        gameinstanceRef.current.stop();
      }

      gameinstanceRef.current = new GameLogic(canvas, ctx);
      gameinstanceRef.current.start();

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      gameLoop();
    }
  }, [currentscreen]);

  const gameLoop = () => {
    if (!gamestate.isPlaying || !gameinstanceRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const result = gameinstanceRef.current.update(performance.now());

    if (result) {
      setgamestate((prev) => {
        const newState = {
          ...prev,
          score: prev.score + (result.slicedFruits || 0),
          lives: result.lives || prev.lives,
        };
        if (newState.lives <= 0 || result.gameOver) gameOver();
        return newState;
      });
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const gameOver = async () => {
    setgamestate((prev) => ({ ...prev, isPlaying: false }));
    if (gameinstanceRef.current) gameinstanceRef.current.stop();
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setcurrentscreen("gameOver");
  };


  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.parentElement.getBoundingClientRect();
      canvasRef.current.width = rect.width;
      canvasRef.current.height = rect.height;
    };
   
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (gameinstanceRef.current) gameinstanceRef.current.stop();
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleClaim = async () => {
    if (!publicKey || !gamestate.score) return;
  
    setIsClaimProcessing(true);
    setrewardStaus({ loading: true, success: false, error: null });
  
    try {

      let jwtoken = localStorage.getItem("gameToken");
      

      if (!jwtoken) {
        try {
          console.log("No token found, attempting to login...");
          
      
          const message = `Login to Fruity Slice Game: ${Date.now()}`;
          const encodedMessage = new TextEncoder().encode(message);
          
      
          console.log("Requesting signature from wallet...");
          const signatureBytes = await signMessage(encodedMessage);
          const signatureBase64 = Buffer.from(signatureBytes).toString('base64');
          
          console.log("Signature obtained, logging in...");
  
          await loginUser(publicKey.toString(), signatureBase64, message);
          console.log("Login successful, token stored in localStorage");
          
  
          jwtoken = localStorage.getItem("gameToken");
          
          if (!jwtoken) {
            throw new Error("Login successful but token not stored correctly");
          }
        } catch (loginError) {
          console.error("Login error:", loginError);
          throw new Error(`Authentication failed: ${loginError.message}`);
        }
      }
      

      console.log("Attempting to transfer tokens...");
      const result = await transferTokens(publicKey.toString(), gamestate.score);
      
      setIsClaimed(true);
      setrewardStaus({ 
        loading: false, 
        success: true, 
        error: null 
      });
      
      console.log(`Successfully claimed ${result.amount} tokens!`);
      
    } catch (error) {
      console.error("Claim error:", error);
      setrewardStaus({ 
        loading: false, 
        success: false, 
        error: error.message || "Failed to claim reward. Please try again." 
      });
    } finally {
      setIsClaimProcessing(false);
    }
  };

  const resetGame = () => {
    setIsClaimed(false);
    setIsClaimProcessing(false);
    setrewardStaus({ loading: false, success: false, error: null });
    setgamestate({ score: 0, lives: 3, isPlaying: false });
    setcurrentscreen("start");
  };

  return (
    <div className="w-full mx-auto container">
      <div className="mb-4 w-full">
        <div className="flex flex-col sm:flex-row justify-between bg-black bg-opacity-30 p-4 rounded-xl">
          <div className="mb-2 sm:mb-0">
            <span className="text-sm text-gray-300">House Wallet:</span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-300">{formatAddress(HOUSE_ADDRESS)}</span>
              <button
                onClick={() => copyToClipboard(HOUSE_ADDRESS, "house")}
                className="text-green-400 hover:text-green-200 transition-colors duration-200"
              >
                {copystatus.house ? "✓" : "📋"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {currentscreen === "start" && (
        <div className="flex flex-col items-center gap-6 bg-black bg-opacity-40 p-8 rounded-xl">
          <div className="mb-4 relative">
            <h1 className="text-5xl font-pixel mb-4 text-yellow-400 drop-shadow-lg relative z-10">
              Fruity Slice
            </h1>
            <div className="absolute -top-6 -right-6 text-5xl animate-bounce">🍉</div>
            <div className="absolute -bottom-6 -left-6 text-5xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍎</div>
          </div>
          <h2 className="text-2xl font-pixel text-yellow-300 mb-6">Ready to Slice?</h2>
          <button
            onClick={initgame}
            disabled={!isWalletConnected || isProcessing}
            className="px-10 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-pixel text-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? "Processing..." : "Start Slicing!"}
          </button>
          {!isWalletConnected && (
            <p className="text-lg text-yellow-200 mt-4 bg-black bg-opacity-50 p-4 rounded-lg">
              Connect your wallet to play and earn rewards!
            </p>
          )}
        </div>
      )}

      {currentscreen === "game" && (
        <div className="w-full">
          <div className="flex justify-between mb-4 bg-black bg-opacity-50 p-3 rounded-lg font-pixel">
            <div className="text-yellow-300">Score: <span className="text-white">{gamestate.score}</span></div>
            <div className="text-yellow-300">Lives: <span className="text-white">{gamestate.lives}</span></div>
          </div>
          <div className="relative">
            <canvas ref={canvasRef} className="w-full h-[500px] border-4 border-yellow-500 rounded-lg shadow-lg" />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-evenly">
              {['🍎', '🍓', '🍊', '🍋', '🍉', '🍇'].map((fruit, index) => (
                <div key={index} className="text-2xl animate-bounce" style={{ animationDuration: `${1 + Math.random() * 2}s`, animationDelay: `${Math.random() * 1}s` }}>
                  {fruit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentscreen === "gameOver" && (
        <div className="text-center bg-black bg-opacity-50 p-8 rounded-xl shadow-xl">
          <h2 className="text-3xl font-bold text-yellow-400 mb-4 font-pixel">Game Over</h2>
          <div className="mb-6 bg-black bg-opacity-40 p-4 rounded-lg inline-block">
            <p className="text-xl">Final Score: <span className="text-yellow-300 font-bold">{gamestate.score}</span></p>
          </div>
          <div className="mb-6">
            {rewardstatus.loading && (
              <p className="text-blue-300 flex items-center justify-center gap-2">
                <span className="animate-spin">⌛</span> Processing your reward...
              </p>
            )}
            {rewardstatus.success && (
              <p className="text-green-400 text-xl bg-black bg-opacity-40 p-4 rounded-lg">
                ✅ You earned <span className="font-bold">{getSliceReward(gamestate.score)}</span> tokens!
              </p>
            )}
            {rewardstatus.error && (
              <p className="text-red-400 bg-black bg-opacity-40 p-4 rounded-lg">
                ❌ {rewardstatus.error}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isClaimed ? (
              <button
                onClick={handleClaim}
                disabled={isClaimProcessing}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl font-pixel text-lg shadow-xl transform transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                {isClaimProcessing ? "Claiming..." : "Claim Reward"}
              </button>
            ) : (
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl font-pixel text-lg shadow-xl transform transition-all duration-300 hover:scale-105"
              >
                Play Again
              </button>
            )}
          </div>
          <div className="mt-8 flex justify-center">
            <div className="flex gap-6">
              {['🍎', '🍓', '🍊', '🍋', '🍉', '🍇'].map((fruit, index) => (
                <div key={index} className="text-3xl animate-bounce" style={{ animationDuration: `${1 + Math.random() * 2}s`, animationDelay: `${Math.random() * 1}s` }}>
                  {fruit}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBuild;