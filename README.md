# 🍉 Fruity Slice Token Game on Solana (Devnet)

A fun, blockchain-integrated Fruit Ninja-style game built using React (JSX) and powered by the Solana blockchain. Players slash fruits to earn tokens solana based on their score.

---

## 📁 Tech Stack

- **Frontend**: React (JSX)
- **Backend**: Node.js (Express via `server.js`)
- **Blockchain**: Solana 
- **Token**: Custom SPL Token

---

## 🚀 Features

- 🍉 Fruit Ninja-style gameplay
- 🔐 JWT-secured score submission & token claim
- 💰 Token rewards based on score tiers
- 💸 Airdrops from a House Wallet
- 🌐 Solana Devnet integration

---

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/Anantdadhich/fruityslice.git
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create your `.env` file
Create a `.env` file in the root of your project and fill in:
```env
PAYER_WALLET=your_base58_encoded_secret_key
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=1h
AUTH_TOKEN=static_auth_token_if_applicable
VITE_BACKEND=http://localhost:3001
```

### 4. Run the Solana setup (Devnet)
Run your wallet/token setup script to generate:
- ✅ House Wallet Address
- ✅ Token Mint Address
- ✅ House Token Account

Save those and update the frontend/backend with:
```js
const TOKEN_MINT = new PublicKey("your_token_mint");
const PAYER = Keypair.fromSecretKey(bs58.decode(process.env.PAYER_WALLET));
const HOUSE_WALLET = PAYER.publicKey;
```

---

## 🧠 Game Logic (Frontend)

- The frontend renders the Fruit Ninja game
- Player score is tracked
- On game over, players can **claim rewards**
- `handleClaim()` sends the score to the backend, which validates it, calculates rewards, and triggers a token transfer

---

## 🛠 Backend (`server.js`)

Handles:
- ✅ JWT authentication
- ✅ `POST /api/login` — returns JWT token
- ✅ `POST /api/transfer-tokens` — transfers SPL tokens to player’s wallet based on score

---

## 🎮 Reward System
```js
export const getSliceReward = (score) => {
  if (score < 10) return 0;
  if (score < 20) return 0.005 * LAMPORTS_PER_SOL;
  if (score < 50) return 0.01 * LAMPORTS_PER_SOL;
  if (score < 100) return 0.03 * LAMPORTS_PER_SOL;
  return 0.05 * LAMPORTS_PER_SOL;
};
```

---

## 💡 Notes

- Everything runs on **Solana Devnet**, no real SOL involved.
- Make sure to fund your house wallet with devnet SOL using:
- there is error in claim rewards so anyone wants to contribute contribute there
- In future we can add leaderboard logic proper auth where the user in month have good score according 
 to leaderboard the user can win nft 
- we will shift to mainnet due to cost issues or developer friendly i try to make it in devnet 

---



