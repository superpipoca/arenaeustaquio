-- TRUNCATE SCRIPT OTIMIZADO USANDO CASCADE
-- Limpa o conteúdo de todas as tabelas e reinicia as sequências.

-- A ordem aqui não é estritamente necessária devido ao CASCADE,
-- mas listar as tabelas principais simplifica.

TRUNCATE TABLE 
  public.referral_rewards,
  public.trade_fees,
  public.trades,
  public.deposits,
  public.withdrawals,
  public.coin_candles_1d,
  public.coin_market_state,
  public.posts,
  public.referrals,
  public.wallet_balances,
  public.coin_collateral,
  public.coins,
  public.wallets,
  public.creators,
  public.users
RESTART IDENTITY CASCADE;

-- A tabela public.coin_types (que tem os ENUMs 'MEME', 'LASTREADA', etc.)
-- não precisa ser incluída, pois não contém dados transacionais.

SELECT 'Conteúdo de todas as tabelas zerado usando TRUNCATE ... CASCADE.' AS Resultado;