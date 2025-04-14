use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface}
};
use anchor_spl::metadata::{
    Metadata,
    MetadataAccount,
    CreateMetadataAccountsV3,
    CreateMasterEditionV3,
    SignMetadata,
    SetAndVerifySizedCollectionItem,
    create_master_edition_v3,
    create_metadata_accounts_v3,
    sign_metadata,
    set_and_verify_sized_collection_item,
    mpl_token_metadata::types::{
            CollectionDetails,
            Creator, 
            DataV2,
        },
};

//on chain address of our program  which is public key of our account  
declare_id!("Fq7vmjuU79yXFSb8pPC14Mrw1yWH3rEPrPkWPhKbnMj7");

#[constant]
pub const NAME: &str="Token Lottery";

#[constant] 
pub const URI:&str ="Token lottery url" ;

#[constant]
pub const SYMBOL:&str="lottery";

 

//our program will be written there entrypoint of our pro
#[program]
//module of our program 
pub mod token_lottery {


    //here we can import all to use in our program module 
    use super::*;
    //now we define the function or intruction that the client can call 
    //Context intialize config means which holds the accounts define in that like metadata or all accounts 
    pub fn configinitialize(ctx: Context<InitializeConfig>,start:u64,end:u64,price:u64) ->Result<()> {
             ctx.accounts.token_lottery.lottery_start=start;
             ctx.accounts.token_lottery.lottery_end=end;
             ctx.accounts.token_lottery.price=price;
             ctx.accounts.token_lottery.authority=ctx.accounts.payer.key();
             ctx.accounts.token_lottery.ticket_number=0;     //how mant tickets have been sold 
             ctx.accounts.token_lottery.winner_chosen=false;
             ctx.accounts.token_lottery.randomness_account=Pubkey::default();
             ctx.accounts.token_lottery.bump=ctx.bumps.token_lottery;
        Ok(())
    }
   
     //context is set where we define accounts later  
   pub fn lotteryinitalize(ctx:Context<InitializeLottery>)->Result<()>{
       //now we create the collection

          let signer_seeds:&[&[&[u8]]]=&[&[      //this  creates the seed info  about to sign on be half of the pda  
            b"collection_mint".as_ref(),          //we created the refrence to the lsit 
            &[ctx.bumps.collection_mint],     //bump value for collection of the 
           ]];

          msg!("Creating mint accounts") ;
          //we create helper function to mint new tokens to an account  
          mint_to(CpiContext::new_with_signer(
           ctx.accounts.token_program.to_account_info(),   //account info of the account to mint the spl token  
           //structure need to call the mint instruction 
           MintTo{
            mint:ctx.accounts.collection_mint.to_account_info(),
            to:ctx.accounts.collection_token_account.to_account_info(),
            authority:ctx.accounts.collection_mint.to_account_info()
           },
           signer_seeds,

          ) ,
          1,    //the amount to minted is one  
        )?;
       

       msg!("Creating metadata account") ;

       create_metadata_accounts_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info() ,
            CreateMetadataAccountsV3{
                metadata:ctx.accounts.metadata.to_account_info(), 
                mint:ctx.accounts.collection_mint.to_account_info(),
                mint_authority:ctx.accounts.collection_mint.to_account_info(),
                payer:ctx.accounts.payer.to_account_info() ,
                update_authority:ctx.accounts.collection_mint.to_account_info(),
                system_program:ctx.accounts.system_program.to_account_info(), 
                rent:ctx.accounts.rent.to_account_info() 
            },
            &signer_seeds ,
          
        ),
        DataV2 {
            name:NAME.to_string(),
            symbol:SYMBOL.to_string(),
            uri:URI.to_string(),
            seller_fee_basis_points:0 ,
            creators:Some(vec![Creator{
                address:ctx.accounts.collection_mint.key(),
            verified:false,
            share:100
            }]),
            collection:None,
            uses:None
        },
        true,
        true,
        Some(CollectionDetails::V1 { size: 0 })
       )?;

   msg!("Creating master editions ") ;

       create_master_edition_v3(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info() ,
              CreateMasterEditionV3{
                payer:ctx.accounts.payer.to_account_info(),
                edition:ctx.accounts.master_edition.to_account_info(),
                mint:ctx.accounts.collection_mint.to_account_info(),
                update_authority:ctx.accounts.collection_mint.to_account_info(),
                mint_authority:ctx.accounts.collection_mint.to_account_info(),
                metadata:ctx.accounts.metadata.to_account_info(),
                token_program:ctx.accounts.token_program.to_account_info(),
                system_program:ctx.accounts.system_program.to_account_info(),
                rent:ctx.accounts.rent.to_account_info(),
              },
              
              &signer_seeds ,
        ),
        Some(0),
       )?;


       msg!("Verifying collection ") ; 
       sign_metadata(
        CpiContext::new_with_signer(
            ctx.accounts.token_metadata_program.to_account_info() ,
            SignMetadata{
                creator:ctx.accounts.collection_mint.to_account_info(),
                metadata:ctx.accounts.metadata.to_account_info()
            },
            &signer_seeds,
        )
       )?;

    Ok(())
   }
    


    pub fn buy_ticket(ctx:Context<InitializeBuyTicket>)->Result<()> {
         

        Ok(())
    } 
    
    

    pub fn choose_winner(ctx:Context<InitializeChooseWinner>)->Result<()> {
        Ok(())
    }


    pub fn commit_winner(ctx:Context<InitializeCommitWinner>)->Result<()> {
        Ok(() )
    } 

    pub fn  claim_prize(ctx:Context<InitializeClaimPrize>)->Result<()>{

        Ok(())
    }


}

#[derive(Accounts)]   //attribute for the account instruction
//accounts we setup config function 
pub struct InitializeConfig<'info> {

     #[account(mut)]
     pub payer:Signer <'info>,   //we used signer means the accounts should sign the transaction
     #[account(
        init,       //we use the inti attribute to init the account  
        payer=payer,      //this means that payer account will pay for the account instruction 
        space=8+TokenLottery::INIT_SPACE,    //8 means resverd space for account discr    token lottery means that the additiona space for the 
        seeds=[b"token_lottery".as_ref()],    //here we init the pda one  seed is static 
        bump      //bump auto by anchor  
     )]

     pub token_lottery:Box<Account<'info,TokenLottery>> ,   //we created the heap   


     pub system_program:Program<'info,System>
}
 

#[derive(Accounts)]
pub struct InitializeLottery<'info> {
    #[account(mut)]
    pub payer:Signer<'info> ,

   //this account is init as spl token mint  
    #[account(
     init,
     payer=payer,
     mint::decimals=0,   //the token will produce the token mint for th 0decimal space 
     mint::authority=collection_mint,    //set to pda means giving the authority to the over mint and freeze 
     mint::freeze_authority=collection_mint,
    seeds=[b"collection_mint".as_ref()],
    bump
)]

    pub collection_mint:Box<InterfaceAccount<'info,Mint>>,   

  /// CHECK: This account will be initialized by the metaplex program
    #[account(mut)]
    pub metadata:UncheckedAccount<'info> ,
  /// CHECK: This account will be initialized by the metaplex program
    #[account(mut)] 
    pub master_edition:UncheckedAccount<'info>,

      #[account(
        init_if_needed,   //only init if account does not init  
        payer=payer,
        seeds=[b"collection_token_account".as_ref()],
        bump,
        token::mint=collection_mint,   //which account we habe to mint  
        token::authority=collection_token_account
      )]

    //this account holds the token minted by collection mint 
     pub collection_token_account:Box<InterfaceAccount<'info,TokenAccount>>,



    pub associated_token_program:Program<'info,AssociatedToken>,
    pub token_metadata_program:Program<'info,Metadata>,
    pub system_program:Program<'info,System>,
    pub token_program:Interface<'info,TokenInterface>,
    pub rent:Sysvar<'info,Rent>,


}

#[derive(Accounts)] 
pub struct InitializeBuyTicket<'info> {
    #[account(mut)] 
    pub payer:Signer<'info> ,

    #[account(mut,
     seeds=[b"token_lottery".as_ref()] ,
     bump=token_lottery.bump
    )]

    pub token_lottery:Account<'info,TokenLottery> ,
    #[account(
        init,
        payer=payer,
        mint::decimals=0,
        mint::authority=collection_mint,
        mint::freeze_authority=collection_mint,
        mint::token_program=token_program,
        seeds=[token_lottery.ticket_number.to_le_bytes().as_ref()],
        bump

    )]
    pub ticket_mint:InterfaceAccount<'info,Mint> ,

    #[account(
        init,
        payer=payer,
        associated_token::mint=ticket_mint,
        associated_token::authority=payer,
        associated_token::token_program=token_program
    )]
    pub destination:InterfaceAccount<'info,TokenAccount>,
   


      
    /// CHECK: This account will be initialized by the metaplex program
     #[account(mut,
     seeds=[b"metadata",token_metadata_program.key().as_ref(),
     ticket_mint.key().as_ref()],
     bump,
     seeds::program=token_metadata_program.key()
    )]
     pub metadata:UncheckedAccount<'info> ,
    /// CHECK: This account will be initialized by the metaplex program
     #[account(mut,
    seeds=[b"metadata",token_metadata_program.key().as_ref(),
      ticket_mint.key().as_ref(),b"edition" ],
      bump,
     seeds::program=token_metadata_program.key()
)] 
     pub master_edition:UncheckedAccount<'info>,
     
      /// CHECK: This account will be initialized by the metaplex program   
      #[account(mut,
       seeds=[b"metadata",token_metadata_program.key().as_ref(),collection_mint.key().as_ref()],
       bump,
       seeds::program=token_metadata_program
    )]
      pub collection_metadata:UncheckedAccount<'info> ,

        
       /// CHECK: This account will be initialized by the metaplex program
       #[account(mut,
       seeds=[b"metadata",token_metadata_program.key().as_ref(),
       ticket_mint.key().as_ref(),b"edition"],
       bump,
       seeds::program=token_metadata_program.key()
    )]
       pub collection_master_edition:UncheckedAccount<'info>,



     

    #[account(
        mut,
        seeds=[b"collection_mint".as_ref()],
        bump
    )]
    pub collection_mint:InterfaceAccount<'info,Mint> ,


    pub associated_account_program:Program<'info,AssociatedToken>,
    pub token_program:Interface<'info,TokenInterface>,
    pub system_program:Program<'info,System>,
    pub token_metadata_program:Program<'info,Metadata> ,
    pub rent:Sysvar<'info,Rent>

}

#[account]    //this will stata that it is account which stored on chain  
#[derive(InitSpace)]  //calulat derive space for the account  enusre we allocate enough bytes 
pub struct TokenLottery{
    pub bump:u8 ,
    pub winner:u64,
    pub lottery_start:u64,
    pub lottery_end:u64,
    pub winner_chosen:bool,
    pub ticket_number:u64,
    pub token_lottery_pot:u64,
    pub authority:Pubkey,
    pub price:u64,
    pub randomness_account:Pubkey
}