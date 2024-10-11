use anchor_lang::prelude::*;

pub mod contexts;
use contexts::*;

pub mod state;
pub use state::*;

declare_id!("BijCEyP7WqxbuYWpBaHjgV2pigN166NMjhMvE1d3moYx");

#[program]
pub mod token_swap_escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed: u64,  deposit: u64, receive: u64) -> Result<()> {
        ctx.accounts.deposit(deposit)?;
        ctx.accounts.save_escrow(seed, deposit, receive, &ctx.bumps)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }

    pub fn take(ctx: Context<Take>) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.withdraw_and_close_vault()
    }
}