import TokneLotteryIDL from "../../target/idl/token_lottery.json"
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Cluster, PublicKey } from '@solana/web3.js';

import type {TokenLottery} from "../../target/types/token_lottery"


export {TokenLottery,TokneLotteryIDL} ;


export const TOKEN_LOTTERY_PROGRAMID=new PublicKey(TokneLotteryIDL.address)


export function getTokenlotteryProgram(provider:AnchorProvider){
    return new Program(TokneLotteryIDL as TokenLottery,provider);
}

export function getTokenLotteryProgramId(cluster:Cluster){
    switch (cluster) {
        case 'devnet':
        case 'testnet':
          // This is the program ID  on devnet and testnet.
          return new PublicKey('9nKa1x4vcnDnPFAQm9VFCrWZgUR4HFyuK69L7kGgXXRC');
        case 'mainnet-beta':
        default:
          return TOKEN_LOTTERY_PROGRAMID;
      }
}