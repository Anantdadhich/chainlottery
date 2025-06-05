import * as anchor from "@coral-xyz/anchor";
import * as sb from "@switchboard-xyz/on-demand";
import { Program } from "@coral-xyz/anchor";
import { TokenLottery } from "../target/types/token_lottery";
import { TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";


describe("token-lottery", () => {
  const provider=anchor.AnchorProvider.env() ;

  const connection=provider.connection ;

  const wallet = provider.wallet as anchor.Wallet ;


  anchor.setProvider(provider) 


  

  const program = anchor.workspace.TokenLottery as Program<TokenLottery>;
  let switchboardprogram ;
  const rngkp=anchor.web3.Keypair.generate() ;

  const TOKEN_METADATA_PROGRAM_ID=new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");


 before("before switchboard program load",async()=>{
  const switchboardidl=await anchor.Program.fetchIdl(
    sb.SB_ON_DEMAND_PID,
    {
      connection:new anchor.web3.Connection("https://api.mainnet-beta.solana.com")
    }
  )
  switchboardprogram=new anchor.Program(switchboardidl,provider)
 })




  async function buyTicket(){
    const buyTicketix=await program.methods.buyTicket().accounts(
      {
        tokenProgram:TOKEN_PROGRAM_ID
      }
    ).instruction() ;


     const blockhashcontext=await connection.getLatestBlockhash();


     const computeinstruction =anchor.web3.ComputeBudgetProgram.setComputeUnitLimit(
      {
        units:300000
      }
     )

     const priorityinstrcution =anchor.web3.ComputeBudgetProgram.setComputeUnitPrice({
      microLamports:1
     })
   
    const transaction=new anchor.web3.Transaction(
      {
        blockhash:blockhashcontext.blockhash,
        lastValidBlockHeight:blockhashcontext.lastValidBlockHeight,
        feePayer:wallet.payer.publicKey
      }
    ).add(buyTicketix).add(computeinstruction).add(priorityinstrcution)


    const signature=await anchor.web3.sendAndConfirmTransaction(connection,transaction,[wallet.payer])

    console.log("buy ticket ",signature);

  }



   it("Is Initalize",async()=>{
    const slot=await connection.getSlot(); 


    console.log("Current slot",slot) ;


    const mint=anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("collection_mint")] ,
      program.programId,
    )[0];

    const metadata=anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"),TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      TOKEN_METADATA_PROGRAM_ID
    )[0]
    


    const masteredition=anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("metadata"),TOKEN_METADATA_PROGRAM_ID.toBuffer(),mint.toBuffer(),Buffer.from("edition")],
      TOKEN_METADATA_PROGRAM_ID
    )[0]


    const initConfigIx=await program.methods.configinitialize(
      new anchor.BN(0),
      new anchor.BN(slot +10),
      new anchor.BN(10000)
    ).instruction();


    const initLottery=await program.methods.lotteryinitalize()
    .accounts(
      {
        masterEdition:masteredition,
        metadata:metadata,
        tokenProgram:TOKEN_PROGRAM_ID
      }
    ).instruction()

    const blockhashcontext=await connection.getLatestBlockhash();

    
    const tx=new anchor.web3.Transaction(
      {
        blockhash:blockhashcontext.blockhash,
        lastValidBlockHeight:blockhashcontext.lastValidBlockHeight,
        feePayer:wallet.payer.publicKey
      }
    ).add(initConfigIx).add(initLottery);

    const signature=await anchor.web3.sendAndConfirmTransaction(connection,tx,[wallet.payer]);
    console.log(signature)


   })




   it("buying tickets",async()=>{
    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket();
    await buyTicket()
   })
   
          

   it("is commiting a reveal a winner",async()=>{
    const queue=new anchor.web3.PublicKey("A43DyUGA7s8eXPxqEjJY6EBu1KKbNgfxF8h17VAHn13w");
    const queueaccount=new sb.Queue(switchboardprogram,queue);

   console.log("queue account",queue.toString());

   try {
    await queueaccount.loadData();
   } catch (error) {
console.log("queue account not found")
process.exit(1)
   }
    const [randomness,ix]=await sb.Randomness.create(switchboardprogram,rngkp,queue);

    console.log("Randomness account");
    console.log("randomness account",randomness.pubkey.toBase58()) ;
    console.log("rnghlp account",rngkp.publicKey.toBase58())

   const  createRandomnesstx=await sb.asV0Tx({
    connection:connection,
    ixs:[ix],
    payer:wallet.publicKey,
    signers:[wallet.payer,rngkp],
    computeUnitPrice:75_000,
    computeUnitLimitMultiple:1.3
   });


   const blockhashcontext=await connection.getLatestBlockhashAndContext();

   const createRandomnessSignature=await connection.sendTransaction(createRandomnesstx);

   await connection.confirmTransaction({
    signature:createRandomnessSignature,
    blockhash:blockhashcontext.value.blockhash,
    lastValidBlockHeight:blockhashcontext.value.lastValidBlockHeight
   })


  console.log("transaction ",createRandomnessSignature);

   const sbCommitix=await randomness.commitIx(queue);

   const commitinstruction=await program.methods.commitWinner()
   .accounts(
    {
      randomnessAccountData:randomness.pubkey
    }
   ).instruction()
  
  const committrans=await sb.asV0Tx({
    connection:switchboardprogram.provider.connection,
    ixs:[sbCommitix,commitinstruction],
    payer:wallet.publicKey,
    signers:[wallet.payer],
    computeUnitPrice:75_000,
    computeUnitLimitMultiple:1.3

  })

  const commitsignature=await connection.sendTransaction(committrans);

  await connection.confirmTransaction({
    signature:commitsignature,
    blockhash:blockhashcontext.value.blockhash,
    lastValidBlockHeight:blockhashcontext.value.lastValidBlockHeight
  })

  console.log("transaction signature commit ",commitsignature)
   
   const revealsbinstruction=await randomness.revealIx();

   const revealinstructio=await program.methods.chooseWinner().accounts({
    randomnessAccountData:randomness.pubkey
   }).instruction();



   const revealtransaction=await sb.asV0Tx({
    connection:switchboardprogram.provider.connection,
    ixs:[revealinstructio,revealsbinstruction],
    payer:wallet.publicKey,
    signers:[wallet.payer],
    computeUnitPrice:75_000,
    computeUnitLimitMultiple:1.3
   })


   const revealsignature=await connection.sendTransaction(revealtransaction);

   await connection.confirmTransaction({
    signature:revealsignature,
    blockhash:blockhashcontext.value.blockhash,
    lastValidBlockHeight:blockhashcontext.value.lastValidBlockHeight
   })
 



console.log("reveal signature ",revealsignature);
   })


   it("is claiming a prize",async()=>{

    const tokenlotteryaddress=anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("token_lottery")],
      program.programId
    )[0]


    const lotteryconfid=await program.account.tokenLottery.fetch(tokenlotteryaddress) ;


    console.log("lottery config winner",lotteryconfid.winner);
    console.log("lottery config ",lotteryconfid);
   

    const token_accounts=await connection.getParsedTokenAccountsByOwner(
      wallet.publicKey,{programId:TOKEN_PROGRAM_ID}
    );

    token_accounts.value.forEach(async(account)=>{
       console.log("token accounts mint ",account.account.data.parsed.info.mint);
       console.log("token account add",account.pubkey.toBase58())
    })


    const winningmint=anchor.web3.PublicKey.findProgramAddressSync(
      [new anchor.BN(lotteryconfid.winner).toArrayLike(Buffer,"le",8)],
      program.programId
    )[0];

    console.log("winning mint ",winningmint.toBase58());

    const winningtokenaddress=getAssociatedTokenAddressSync(
      winningmint,
      wallet.publicKey
    )


     console.log("winnig token address",winningtokenaddress.toBase58()) ;


     const claiminstruction=await program.methods.claimPrize().accounts(
      {
       tokenProgram:TOKEN_PROGRAM_ID
      }
     ).instruction() ;


     const blockhashcontext=await connection.getLatestBlockhash() ;


     const claimtransaction=new anchor.web3.Transaction(
      {
        blockhash:blockhashcontext.blockhash,
        feePayer:wallet.payer.publicKey ,
        lastValidBlockHeight:blockhashcontext.lastValidBlockHeight
      }
     ).add(claiminstruction) 

     const claimsig=await anchor.web3.sendAndConfirmTransaction(connection,claimtransaction,[wallet.payer]);
     console.log(claimsig)


   })
 
   


});
