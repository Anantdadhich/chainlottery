use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{mint_to, Mint, MintTo, TokenAccount, TokenInterface}
};
use anchor_spl::metadata::{
    Metadata,
    
};

declare_id!("Fq7vmjuU79yXFSb8pPC14Mrw1yWH3rEPrPkWPhKbnMj7");

#[program]
pub mod token_lottery {
    use super::*;

    pub fn configinitialize(ctx: Context<InitializeConfig>,start:u64,end:u64,price:u64) ->Result<()> {
             ctx.accounts.token_lottery.lottery_start=start;
             ctx.accounts.token_lottery.lottery_end=end;
             ctx.accounts.token_lottery.price=price;
             ctx.accounts.token_lottery.authority=ctx.accounts.payer.key();
             ctx.accounts.token_lottery.ticket_number=0;
             ctx.accounts.token_lottery.winner_chosen=false;
             ctx.accounts.token_lottery.randomness_account=Pubkey::default();
             ctx.accounts.token_lottery.bump=ctx.bumps.token_lottery;
        Ok(())
    }
   

   pub fn lotteryinitalize(ctx:Context<InitializeLottery>)->Result<()>{
       //now we create the collection

         let signer_seeds:&[&[&[u8]]]=&[&[
            b"collection_mint".as_ref(),
            &[ctx.bumps.collection_mint],
         ]];

          msg!("Creating mint accounts") ;

          mint_to(CpiContext::new_with_signer(
           ctx.accounts.token_program.to_account_info(),
           MintTo{
            mint:ctx.accounts.collection_mint.to_account_info(),
            to:ctx.accounts.collection_token_account.to_account_info(),
            authority:ctx.accounts.collection_mint.to_account_info()
           },
           signer_seeds,

          ) ,
          1,
        )?;


        
    Ok(())
   }

}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {

    #[account(mut)]
     pub payer:Signer <'info>,
     #[account(
        init,
        payer=payer,
        space=8+TokenLottery::INIT_SPACE,
        seeds=[b"token_lottery".as_ref()],
        bump
     )]

     pub token_lottery:Box<Account<'info,TokenLottery>> ,


     pub system_program:Program<'info,System>
}
 

#[derive(Accounts)]
pub struct InitializeLottery<'info> {
    #[account(mut)]
   pub payer:Signer<'info> ,
   #[account(
     init,
     payer=payer,
     mint::decimals=0,
     mint::authority=collection_mint,
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
        init_if_needed,
        payer=payer,
        seeds=[b"collection_token_account".as_ref()],
        bump,
        token::mint=collection_mint,
        token::authority=collection_mint
      )]


     pub collection_token_account:Box<InterfaceAccount<'info,TokenAccount>>,



    pub associated_token_program:Program<'info,AssociatedToken>,
    pub token_metadata_program:Program<'info,Metadata>,
   pub system_program:Program<'info,System>,
   pub token_program:Interface<'info,TokenInterface>,
     pub rent:Sysvar<'info,Rent>,


}



#[account]
#[derive(InitSpace)]
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