import TokenLotteryIDL from "../../target/idl/token_lottery.json"
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';

import type {TokenLottery} from "../../target/types/token_lottery"

export { TokenLottery, TokenLotteryIDL };


export const TOKEN_LOTTERY_PROGRAMID = new PublicKey(TokenLotteryIDL.address);


export function getTokenLotteryProgram(provider: AnchorProvider) {
  return new Program(TokenLotteryIDL as TokenLottery, provider);
}

export function getTokenLotteryProgramId(cluster: Cluster) {
  switch (cluster) {
    case 'devnet':
    case 'testnet':

      return new PublicKey('2vKg76rA1Ho27YD4uuc2Z2FCwRTySxdyHup1JjsXS6dp');
    case 'mainnet-beta':
    default:
      return TOKEN_LOTTERY_PROGRAMID;
  }
}