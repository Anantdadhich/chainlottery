use anchor_lang::prelude::*;
use anchor_spl::token_interface::spl_token_metadata_interface::instruction::Initialize;

declare_id!("Fq7vmjuU79yXFSb8pPC14Mrw1yWH3rEPrPkWPhKbnMj7");

#[program]
pub mod token_lottery {
    use super::*;

    pub fn configinitialize(ctx: Context<ConfigInitialize>,start:u64,end:u64,price:u64) -> Result<()> {
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


}

#[derive(Accounts)]
pub struct ConfigInitialize<'info> {

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