import express from 'express';
import bs58 from "bs58"
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js';
import jwt from "jsonwebtoken"
import { ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

import nacl from 'tweetnacl';


dotenv.config();

const app = express();
const connection=new Connection(process.env.RPC || "https://api.devnet.solana.com")

const TOKEN_MINT=new PublicKey("7vXhVju7VpZGh62C4DjVy6pTgkAGubRHtXwHbKqTz6iT");
const PAYER=Keypair.fromSecretKey(bs58.decode(process.env.PAYER_WALLET));
const HOUSE_WALLET=PAYER.publicKey;
const JWT_SECRET=process.env.JWT_SECRET
const JWT_EXPIRY=process.env.JWT_EXPIRY
const authtoken=process.env.AUTH_TOKEN;
const specialrewardClaimed=new Set()    //we store the address that claimed special rewards


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false, 
});


const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  methods: ['POST'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiting to all routes
app.use(limiter);

function getSliceRewards(score, playerAddress) {
  // Special reward for high scores (only once per address)
  if (score >= 1000 && !specialrewardClaimed.has(playerAddress)) {
    specialrewardClaimed.add(playerAddress);
    return 0.05; // This is 0.05 token units
  }
  
  // Regular rewards based on score
  if (score < 10) return 0  // Minimum score required
  if (score < 20) return 0.005 *LAMPORTS_PER_SOL; // 0.005 tokens
  if (score < 50) return 0.01 *LAMPORTS_PER_SOL; // 0.01 tokens
  if (score < 100) return 0.03 *LAMPORTS_PER_SOL; // 0.03 tokens
  return 0.05 *LAMPORTS_PER_SOL; // 0.05 tokens for top scores
}
 

async function getorCreateAssociatedTokenAccount(owner){
  try {
    
  
  const associatedtoken=await getAssociatedTokenAddress(
    TOKEN_MINT,
    owner,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  try {
    await connection.getTokenAccountBalance(associatedtoken)
    return associatedtoken

  } catch (error) {
const transaction=new Transaction().add(
  createAssociatedTokenAccountInstruction(
    PAYER.publicKey,
    associatedtoken,
    owner,
    TOKEN_MINT,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )
)

const signature=await connection.sendTransaction(transaction,[PAYER])
await connection.confirmTransaction(signature);
return associatedtoken
  }

}catch (error) {
   console.error("Error in get or create associatedaccount",error)
   throw error  
  }
}


function cleanExpiredNonces() {
  const now = Date.now();
  for (const [key, value] of noncestore.entries()) {
    if (now - value.timestamp > EXPIRY_TIME_NOUNCE) {
      noncestore.delete(key);
    }
  }
}


setInterval(cleanExpiredNonces, 60000);


app.post('/api/login', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;
    
    if (!walletAddress || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields: walletAddress, signature, or message' });
    }
    
   
    try {
      new PublicKey(walletAddress);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid wallet address format' });
    }
    
    try {
      // Verify signature
      const publicKey = new PublicKey(walletAddress);
      const messageBytes = new TextEncoder().encode(message);
      
      // Convert base64 signature to bytes
      let signatureBytes;
      try {
        signatureBytes = Buffer.from(signature, 'base64');
      } catch (error) {
        return res.status(400).json({ error: 'Invalid signature format (must be base64)' });
      }
      
      // Verify the signature
      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKey.toBytes()
      );
      
      if (!verified) {
        console.log('Failed signature verification for wallet:', walletAddress);
        return res.status(401).json({ error: 'Invalid signature' });
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { walletAddress },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY || '24h' }
      );
      
      // Send token back to client
      res.json({
        success: true,
        token,
        expiresIn: JWT_EXPIRY || '24h'
      });
      
    } catch (error) {
      console.error('Signature verification error:', error);
      res.status(400).json({ error: 'Invalid wallet address or signature: ' + error.message });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login: ' + error.message });
  }
});

app.post("/api/transfer-tokens",async (req,res)=>{
  

   try {
    const requesttokens=req.headers["authorization"]

    const token=requesttokens.split(" ")[1];


    if(!token){
      res.status(403).json({message:"not auth"})
      return
    }


    try {
      const decode=jwt.verify(token,JWT_SECRET)
      req.user=decode
    } catch (error) {
      res.status(403).json({message:"not valid auth"})
      return 
    }


    const {playerAddress,score}=req.body;

    if(!playerAddress || !score ){
      res.status(400).json({message:"player add not found"})
      return
    }

    const player=new PublicKey(playerAddress);
    
    const amount=getSliceRewards(score,playerAddress);

    
    if(amount <=0 ){
      res.status(400).json({error:"not have good score to recive the tokens "})
    }
 
   // now we create player token account 
   const palyertokenAccount=await getorCreateAssociatedTokenAccount(player);
   const housetokenAccount=await getorCreateAssociatedTokenAccount(HOUSE_WALLET);


   //check the house wallet balance 

    const housewalletbalance=await connection.getTokenAccountBalance(housetokenAccount);
      if(housewalletbalance.value.uiAmount< amount){
        res.status(400).json({messge:"insuffcient funds"})
        return 
      }


      const transaction=new Transaction().add(
        createTransferInstruction(
          housetokenAccount,
          palyertokenAccount,
          PAYER.publicKey,
          amount * 10 ** 6 

        )
      )

      transaction.feePayer=PAYER.publicKey;
      transaction.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;

      const simulateResult=await connection.simulateTransaction(transaction);

      if(simulateResult.value.err){
        throw new Error(`transaction simulation failed ${simulateResult.value.err}`)
      }
      //now we send transaction 

      const signature=await connection.sendTransaction(transaction,[PAYER]);
      await connection.confirmTransaction(signature)


      res.json({
        success:true,
        signature,
        amount,
        message:`succesfully transferred ${amount} tokens to ${playerAddress}`
      })

   } catch (error) {
    console.error(`error transfering tokens`,error)
    res.status(500).json({
      error:"failed to tranfer token",
      details:error.message
    })
   }
})


const noncestore=new Map()
const EXPIRY_TIME_NOUNCE=5 * 60 *1000;

/*
app.post("/api/get-nonce",(req,res)=>{
  try {
    const requestauthtoken=req.headers["authorization"]

    if (!requestauthtoken  || requestauthtoken !== `Bearer ${authtoken}`){
      res.status(400).json({
        messgae:"error invalid auth"
      })
      return 
    }

    //generate a random nounce 

    const nonce= crypto.randomBytes(32).toString('hex')
    noncestore.set(nonce,{
      timeStamp:Date.now(),
      used:false
    })
    


    for(const[storenounce,data] of noncestore.entries()){
      if(Date.now() - data.timestamp > EXPIRY_TIME_NOUNCE){
        nouncestore.delete(storenounce)
      }
    }


    res.json({
      success:true,
      nonce,
      expiresin:EXPIRY_TIME_NOUNCE
    })
  } catch (error) {
    console.log(error)
  }
})

app.post("/api/verify-wallet",async(req,res)=>{

  try {
    const {signature,publicKey,message,nonce}=req.body;

    if(!signature || !publicKey || !message || !nonce) {
      res.status(400).json({message:"missing parameters"})
      return 
    }

    const noncedata=noncestore.get(nonce);
    if(!noncedata){
      res.status(400).json({message:"invalid nonce"})
      return 
    }

    //now we check the nonce is experied

    if(Date.now()-noncedata.timestamp > EXPIRY_TIME_NOUNCE){
      noncestore.delete(nonce)
      res.status(400).json({message:"expired"})
      return 
    }
    
    if(noncedata.used){
      res.status(400).json({message:"data  used"})
      return 
    }
     
    const messageBytes=new TextEncoder().encode(message)
     

    const signatureBytes=new Uint8Array(
      Buffer.from(signature,"base64")
    );


    const publickeybytes=new PublicKey(publicKey).toBytes()


    const verified=nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publickeybytes
    )

    if(!verified){
      res.status(401).json({message:"invalid signature"})
    }

    noncedata.used=true


    const token=jwt.sign({
      publicKey,
      wallet:publicKey
    },
  JWT_SECRET,{
    expiresIn:JWT_EXPIRY
  })


  res.json({
    success:true,
    token
  });
  } catch (error) {
    console.log(error)
  }
})
  */

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 