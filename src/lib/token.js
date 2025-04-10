
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const BACKEND_URL = process.env.VITE_BACKEND || "http://localhost:3001";


export const getSliceReward = (score) => {
  if (score < 10) return 0 ; 
  if (score < 20) return 0.005 * LAMPORTS_PER_SOL; // 0.005 tokens
  if (score < 50) return 0.01 * LAMPORTS_PER_SOL; // 0.01 tokens
  if (score < 100) return 0.03 * LAMPORTS_PER_SOL; // 0.03 tokens
  return 0.05 * LAMPORTS_PER_SOL; // 0.05 tokens for top scores
};


export async function loginUser(walletAddress, signatureBase64, message) {
  console.log("Attempting to login with wallet:", walletAddress);
  
  try {
   
    
    
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        walletAddress,
        signature: signatureBase64,
        message
      }),
    
    });
    

    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Login error response:", errorData);
      throw new Error(errorData.error || errorData.message || `Login failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Store the JWT token for future requests
    localStorage.setItem("gameToken", data.token);
    console.log("Login successful, token stored");
    
    return { success: true, token: data.token };
  } catch (error) {
    console.error("Login error:", error);
    if (error.name === 'AbortError') {
      throw new Error("Login request timed out. Please try again.");
    }
    throw error;
  }
}


export async function transferTokens(playerAddress, score) {
  try {
    const jwtoken = localStorage.getItem("gameToken");
    
    if (!jwtoken) {
      console.error("No auth token found");
      throw new Error("No auth token found. Please login again.");
    }
    
    console.log(`Attempting to transfer tokens for score: ${score} to address: ${playerAddress}`);
    
     
    const message = `CLAIM_REWARD-${Date.now()}`;
  const encodedMessage = new TextEncoder().encode(message);
  const signatureBytes = await signMessage(encodedMessage);
  const signatureBase64 = Buffer.from(signatureBytes).toString("base64");
    
    const response = await fetch(`${BACKEND_URL}/api/transfer-tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtoken}`,
      },
      body: JSON.stringify({ 
        playerAddress, 
        score ,
        signature:signatureBase64,
        message
      }),
      signal: controller.signal
    });
    
 
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("gameToken");
        throw new Error("Authentication expired. Please login again.");
      }
      
      throw new Error(errorData.error || errorData.message || `Failed to transfer tokens with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Transfer response:", data);
    
    return {
      success: true,
      signature: data.signature,
      amount: data.amount
    };
  } catch (error) {
    console.error("Error transferring tokens:", error);
    if (error.name === 'AbortError') {
      throw new Error("Token transfer request timed out. Please try again.");
    }
    throw error;
  }
}