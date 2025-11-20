-- 3ustaquio – Schema V1 + AMM V1 (CORRIGIDO)
-- Ordem ajustada: coins vem antes de wallet_balances
-- SCRIPT INICIAL, PARA CRIAR O CENÁRIO PRIMÁRIO, NÃO USAR PÓS CRIAÇÃO DO CENÁRIO
-- PODE APAGAR DADOS IMPORTANTES.

-- =========================================================
-- Extensões
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- Tipos (ENUMs)
-- =========================================================

create type user_role as enum ('TRADER', 'CREATOR', 'ADMIN');

create type wallet_type as enum (
  'USER',
  'CREATOR_TREASURY',
  'PLATFORM_TREASURY',
  'POOL'
);

create type coin_status as enum ('DRAFT', 'ACTIVE', 'PAUSED', 'BLOCKED');

create type coin_risk_zone as enum ('FRIO', 'HYPE', 'BOLHA');

create type coin_type_code as enum ('MEME', 'LASTREADA', 'COMUNIDADE');

create type trade_side as enum ('BUY', 'SELL');

create type trade_status as enum ('PENDING', 'EXECUTED', 'FAILED', 'CANCELLED');

create type tx_status as enum ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

create type fee_kind as enum ('PLATFORM', 'CREATOR', 'REFERRAL');

create type post_kind as enum ('TEXT', 'IMAGE', 'SYSTEM', 'WARNING');

-- =========================================================
-- USERS & CREATORS
-- =========================================================

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid not null references auth.users (id) on delete cascade,
  role          user_role not null default 'TRADER',
  username      text unique,
  display_name  text,
  avatar_url    text,
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_users_auth_user_id on public.users (auth_user_id);

create table if not exists public.creators (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users (id) on delete cascade,
  handle           text unique, -- @nomecriador
  is_verified      boolean not null default false,
  website_url      text,
  socials          jsonb,  -- { instagram: "...", x: "..." }
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_creators_user_id on public.creators (user_id);

-- =========================================================
-- COIN TYPES / COINS / COLLATERAL
-- =========================================================

create table if not exists public.coin_types (
  id          smallserial primary key,
  code        coin_type_code not null unique,
  name        text not null,
  description text
);

insert into public.coin_types (code, name, description)
values
  ('MEME',       'Meme / Narrativa pura', 'Token puramente narrativo / especulativo'),
  ('LASTREADA',  'Lastreada',             'Token com algum tipo de lastro declarado'),
  ('COMUNIDADE', 'Comunidade',            'Token de comunidade / projeto coletivo')
on conflict (code) do nothing;

-- wallets vem antes de coins (porque coins referencia wallet pool)
-- =========================================================
-- WALLETS
-- =========================================================

create table if not exists public.wallets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.users (id) on delete set null,
  wallet_type  wallet_type not null default 'USER',
  label        text,
  provider     text default 'INTERNAL',
  address      text,
  -- saldo em "base token" interno (ex.: BRL interno / stable da casa)
  balance_base numeric(30, 8) not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_wallets_user_id on public.wallets (user_id);

-- =========================================================
-- COINS
-- =========================================================

create table if not exists public.coins (
  id                 uuid primary key default gen_random_uuid(),
  slug               text not null unique,        -- "mglh", "shotz"
  symbol             text not null,               -- MGLH, SHOTZ
  name               text not null,
  creator_id         uuid not null references public.creators (id),
  coin_type_id       smallint not null references public.coin_types (id),
  status             coin_status not null default 'DRAFT',

  narrative_short    text not null,
  narrative_long     text,
  risk_disclaimer    text not null,

  supply_max         numeric(30, 8),
  supply_initial     numeric(30, 8),
  supply_circulating numeric(30, 8) not null default 0,

  is_featured        boolean not null default false,
  tags               text[],

  -- wallet da POOL de AMM (reserva de base + coin)
  pool_wallet_id     uuid references public.wallets (id),

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists idx_coins_creator_id on public.coins (creator_id);
create index if not exists idx_coins_status_type on public.coins (status, coin_type_id);
create index if not exists idx_coins_created_at on public.coins (created_at desc);

create table if not exists public.coin_collateral (
  id                       uuid primary key default gen_random_uuid(),
  coin_id                  uuid not null references public.coins (id) on delete cascade,
  collateral_type          text not null, -- FIAT, CRYPTO, OFFCHAIN, MISTO
  description              text not null,
  evidence_urls            text[],
  estimated_value_fiat     numeric(30, 2),
  estimated_currency       text default 'BRL',
  last_verified_at         timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists idx_coin_collateral_coin_id on public.coin_collateral (coin_id);

-- =========================================================
-- WALLET BALANCES (agora DEPOIS de coins)
-- =========================================================

create table if not exists public.wallet_balances (
  wallet_id         uuid not null references public.wallets (id) on delete cascade,
  coin_id           uuid not null references public.coins (id) on delete cascade,
  balance_available numeric(30, 8) not null default 0,
  balance_locked    numeric(30, 8) not null default 0,
  updated_at        timestamptz not null default now(),
  primary key (wallet_id, coin_id)
);

create index if not exists idx_wallet_balances_coin_id on public.wallet_balances (coin_id);

-- =========================================================
-- MARKET STATE (AMM) / PERFORMANCE
-- =========================================================

create table if not exists public.coin_market_state (
  coin_id             uuid primary key references public.coins (id) on delete cascade,

  base_reserve        numeric(30, 8) not null,
  coin_reserve        numeric(30, 8) not null,

  price_current       numeric(30, 8) not null,
  k_last              numeric(60, 16) not null,

  volume_24h_base     numeric(30, 8) not null default 0,
  volume_24h_coin     numeric(30, 8) not null default 0,
  trades_24h          integer not null default 0,

  risk_zone           coin_risk_zone not null default 'FRIO',
  volatility_score    numeric(10, 4),
  hype_score          numeric(10, 4),

  last_trade_at       timestamptz,
  updated_at          timestamptz not null default now()
);

create index if not exists idx_coin_market_state_risk on public.coin_market_state (risk_zone);
create index if not exists idx_coin_market_state_hype on public.coin_market_state (hype_score desc);

-- =========================================================
-- TRADES / FEES / DEPOSITS / WITHDRAWALS
-- =========================================================

create table if not exists public.trades (
  id                uuid primary key default gen_random_uuid(),
  coin_id           uuid not null references public.coins (id),

  buyer_wallet_id   uuid not null references public.wallets (id),
  seller_wallet_id  uuid not null references public.wallets (id),

  side              trade_side not null, -- ponto de vista do usuário que iniciou
  amount_coin       numeric(30, 8) not null,
  amount_base       numeric(30, 8) not null,
  price_effective   numeric(30, 8) not null,

  fee_total_base    numeric(30, 8) not null default 0,
  status            trade_status not null default 'EXECUTED',

  executed_at       timestamptz not null default now(),
  created_at        timestamptz not null default now()
);

create index if not exists idx_trades_coin_time on public.trades (coin_id, executed_at desc);
create index if not exists idx_trades_buyer_time on public.trades (buyer_wallet_id, executed_at desc);
create index if not exists idx_trades_seller_time on public.trades (seller_wallet_id, executed_at desc);

create table if not exists public.trade_fees (
  id              uuid primary key default gen_random_uuid(),
  trade_id        uuid not null references public.trades (id) on delete cascade,
  kind            fee_kind not null,
  target_user_id  uuid references public.users (id),
  amount_base     numeric(30, 8) not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_trade_fees_trade_id on public.trade_fees (trade_id);
create index if not exists idx_trade_fees_target_user on public.trade_fees (target_user_id);

create table if not exists public.deposits (
  id              uuid primary key default gen_random_uuid(),
  wallet_id       uuid not null references public.wallets (id),
  provider        text not null,            -- CELCOIN
  provider_ref    text,
  amount_base     numeric(30, 8) not null,
  currency        text not null default 'BRL',
  status          tx_status not null default 'PENDING',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_deposits_wallet_time on public.deposits (wallet_id, created_at desc);
create index if not exists idx_deposits_status_time on public.deposits (status, created_at desc);

create table if not exists public.withdrawals (
  id              uuid primary key default gen_random_uuid(),
  wallet_id       uuid not null references public.wallets (id),
  provider        text not null,
  provider_ref    text,
  amount_base     numeric(30, 8) not null,
  currency        text not null default 'BRL',
  status          tx_status not null default 'PENDING',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_withdrawals_wallet_time on public.withdrawals (wallet_id, created_at desc);
create index if not exists idx_withdrawals_status_time on public.withdrawals (status, created_at desc);

-- =========================================================
-- REFERRALS
-- =========================================================

create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_user_id  uuid not null references public.users (id),
  referred_user_id  uuid references public.users (id),
  referral_code     text not null,
  source            text,
  created_at        timestamptz not null default now(),
  unique (referral_code, referrer_user_id)
);

create index if not exists idx_referrals_referrer on public.referrals (referrer_user_id);
create index if not exists idx_referrals_referred on public.referrals (referred_user_id);

create table if not exists public.referral_rewards (
  id              uuid primary key default gen_random_uuid(),
  referral_id     uuid not null references public.referrals (id) on delete cascade,
  trade_id        uuid not null references public.trades (id) on delete cascade,
  amount_base     numeric(30, 8) not null,
  created_at      timestamptz not null default now()
);

create index if not exists idx_referral_rewards_referral on public.referral_rewards (referral_id);

-- =========================================================
-- POSTS (FEED POR MOEDA)
-- =========================================================

create table if not exists public.posts (
  id             uuid primary key default gen_random_uuid(),
  coin_id        uuid not null references public.coins (id) on delete cascade,
  author_user_id uuid references public.users (id),
  kind           post_kind not null default 'TEXT',
  content        text not null,
  meta           jsonb,
  is_pinned      boolean not null default false,
  is_system      boolean not null default false,
  created_at     timestamptz not null default now()
);

create index if not exists idx_posts_coin_time on public.posts (coin_id, created_at desc);
create index if not exists idx_posts_author_time on public.posts (author_user_id, created_at desc);

-- =========================================================
-- FUNÇÃO: inicializar estado de mercado (AMM)
-- =========================================================

create or replace function public.init_coin_market_state(
  p_coin_id          uuid,
  p_base_reserve     numeric,
  p_coin_reserve     numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price numeric;
  v_k     numeric;
begin
  if p_base_reserve <= 0 or p_coin_reserve <= 0 then
    raise exception 'Reserves must be > 0';
  end if;

  v_price := p_base_reserve / p_coin_reserve;
  v_k := p_base_reserve * p_coin_reserve;

  insert into public.coin_market_state (
    coin_id,
    base_reserve,
    coin_reserve,
    price_current,
    k_last,
    volume_24h_base,
    volume_24h_coin,
    trades_24h,
    risk_zone,
    updated_at
  ) values (
    p_coin_id,
    p_base_reserve,
    p_coin_reserve,
    v_price,
    v_k,
    0,
    0,
    0,
    'FRIO',
    now()
  )
  on conflict (coin_id) do update
    set base_reserve  = excluded.base_reserve,
        coin_reserve  = excluded.coin_reserve,
        price_current = excluded.price_current,
        k_last        = excluded.k_last,
        updated_at    = now();
end;
$$;

-- =========================================================
-- FUNÇÃO: swap_buy (usuário compra da pool AMM)
-- =========================================================

create or replace function public.swap_buy(
  p_coin_id           uuid,
  p_buyer_wallet_id   uuid,
  p_amount_base_in    numeric,
  p_min_amount_out    numeric default 0
) returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market          public.coin_market_state%rowtype;
  v_coin            public.coins%rowtype;

  v_buyer_wallet    public.wallets%rowtype;
  v_pool_wallet     public.wallets%rowtype;
  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0075; -- 0.75%
  v_fee_creator_rate  numeric := 0.0025; -- 0.25%

  v_fee_platform    numeric;
  v_fee_creator     numeric;
  v_amount_base_net numeric;

  v_k               numeric;
  v_new_base_reserve numeric;
  v_new_coin_reserve numeric;
  v_amount_coin_out  numeric;
  v_price_effective  numeric;

  v_trade           public.trades%rowtype;
begin
  if p_amount_base_in <= 0 then
    raise exception 'amount_base_in must be > 0';
  end if;

  -- wallet do comprador
  select *
  into v_buyer_wallet
  from public.wallets
  where id = p_buyer_wallet_id
  for update;

  if not found then
    raise exception 'buyer wallet not found';
  end if;

  if v_buyer_wallet.balance_base < p_amount_base_in then
    raise exception 'insufficient base balance in buyer wallet';
  end if;

  -- coin
  select *
  into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  if v_coin.pool_wallet_id is null then
    raise exception 'coin has no pool_wallet_id configured';
  end if;

  -- estado de mercado (trava linha para evitar corrida)
  select *
  into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not initialized for this coin';
  end if;

  if v_market.base_reserve <= 0 or v_market.coin_reserve <= 0 then
    raise exception 'invalid reserves for coin %', p_coin_id;
  end if;

  -- pool wallet
  select *
  into v_pool_wallet
  from public.wallets
  where id = v_coin.pool_wallet_id
  for update;

  if not found then
    raise exception 'pool wallet not found';
  end if;

  -- platform treasury wallet (única)
  select *
  into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet (prioriza CREATOR_TREASURY, senão USER)
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY', 'USER')
  order by case when w.wallet_type = 'CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  -- fees
  v_fee_platform    := round(p_amount_base_in * v_fee_platform_rate, 8);
  v_fee_creator     := round(p_amount_base_in * v_fee_creator_rate, 8);
  v_amount_base_net := p_amount_base_in - v_fee_platform - v_fee_creator;

  if v_amount_base_net <= 0 then
    raise exception 'amount_base_net <= 0 after fees';
  end if;

  -- AMM x * y = k
  v_k := v_market.base_reserve * v_market.coin_reserve;

  v_new_base_reserve := v_market.base_reserve + v_amount_base_net;
  v_new_coin_reserve := v_k / v_new_base_reserve;

  v_amount_coin_out := v_market.coin_reserve - v_new_coin_reserve;

  if v_amount_coin_out <= 0 then
    raise exception 'calculated amount_coin_out <= 0';
  end if;

  if p_min_amount_out > 0 and v_amount_coin_out < p_min_amount_out then
    raise exception 'slippage too high: expected at least %, got %',
      p_min_amount_out, v_amount_coin_out;
  end if;

  -- sanity: pool tem que ter moeda suficiente
  if v_market.coin_reserve < v_amount_coin_out then
    raise exception 'pool has not enough coin reserve';
  end if;

  v_price_effective := p_amount_base_in / v_amount_coin_out;

  -- base: debita comprador, credita pool, plataforma e creator
  update public.wallets
  set balance_base = balance_base - p_amount_base_in,
      updated_at   = now()
  where id = v_buyer_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_amount_base_net,
      updated_at   = now()
  where id = v_pool_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_platform,
      updated_at   = now()
  where id = v_platform_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_creator,
      updated_at   = now()
  where id = v_creator_wallet.id;

  -- coin: debita pool, credita comprador
  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_buyer_wallet.id, p_coin_id, v_amount_coin_out, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_pool_wallet.id, p_coin_id, -v_amount_coin_out, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  -- atualiza estado de mercado
  update public.coin_market_state
  set base_reserve     = v_new_base_reserve,
      coin_reserve     = v_new_coin_reserve,
      price_current    = v_new_base_reserve / v_new_coin_reserve,
      k_last           = v_k,
      volume_24h_base  = volume_24h_base + p_amount_base_in,
      volume_24h_coin  = volume_24h_coin + v_amount_coin_out,
      trades_24h       = trades_24h + 1,
      last_trade_at    = now(),
      updated_at       = now()
  where coin_id = p_coin_id;

  -- registra trade + fees
  insert into public.trades (
    coin_id,
    buyer_wallet_id,
    seller_wallet_id,
    side,
    amount_coin,
    amount_base,
    price_effective,
    fee_total_base,
    status,
    executed_at,
    created_at
  ) values (
    p_coin_id,
    v_buyer_wallet.id,
    v_pool_wallet.id,
    'BUY',
    v_amount_coin_out,
    p_amount_base_in,
    v_price_effective,
    v_fee_platform + v_fee_creator,
    'EXECUTED',
    now(),
    now()
  )
  returning * into v_trade;

  insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
  values
    (v_trade.id, 'PLATFORM', null, v_fee_platform),
    (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

  return v_trade;
end;
$$;

-- =========================================================
-- FUNÇÃO: swap_sell (usuário vende para a pool AMM)
-- =========================================================

create or replace function public.swap_sell(
  p_coin_id            uuid,
  p_seller_wallet_id   uuid,
  p_amount_coin_in     numeric,
  p_min_base_out       numeric default 0
) returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market          public.coin_market_state%rowtype;
  v_coin            public.coins%rowtype;

  v_seller_wallet   public.wallets%rowtype;
  v_pool_wallet     public.wallets%rowtype;
  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0075; -- 0.75%
  v_fee_creator_rate  numeric := 0.0025; -- 0.25%

  v_fee_platform    numeric;
  v_fee_creator     numeric;
  v_amount_base_out numeric;
  v_amount_base_net numeric;

  v_k               numeric;
  v_new_base_reserve numeric;
  v_new_coin_reserve numeric;
  v_price_effective  numeric;

  v_current_balance  numeric;

  v_trade           public.trades%rowtype;
begin
  if p_amount_coin_in <= 0 then
    raise exception 'amount_coin_in must be > 0';
  end if;

  -- wallet do vendedor
  select *
  into v_seller_wallet
  from public.wallets
  where id = p_seller_wallet_id
  for update;

  if not found then
    raise exception 'seller wallet not found';
  end if;

  -- coin
  select *
  into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  if v_coin.pool_wallet_id is null then
    raise exception 'coin has no pool_wallet_id configured';
  end if;

  -- estado de mercado (trava linha)
  select *
  into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not initialized for this coin';
  end if;

  if v_market.base_reserve <= 0 or v_market.coin_reserve <= 0 then
    raise exception 'invalid reserves for coin %', p_coin_id;
  end if;

  -- pool wallet
  select *
  into v_pool_wallet
  from public.wallets
  where id = v_coin.pool_wallet_id
  for update;

  if not found then
    raise exception 'pool wallet not found';
  end if;

  -- platform treasury wallet
  select *
  into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY', 'USER')
  order by case when w.wallet_type = 'CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  -- checa saldo de coin do vendedor
  select balance_available
  into v_current_balance
  from public.wallet_balances
  where wallet_id = v_seller_wallet.id
    and coin_id   = p_coin_id
  for update;

  if not found or v_current_balance < p_amount_coin_in then
    raise exception 'insufficient coin balance to sell';
  end if;

  -- AMM: venda adiciona coin na pool e retira base
  v_k := v_market.base_reserve * v_market.coin_reserve;

  v_new_coin_reserve := v_market.coin_reserve + p_amount_coin_in;
  v_new_base_reserve := v_k / v_new_coin_reserve;

  v_amount_base_out := v_market.base_reserve - v_new_base_reserve;

  if v_amount_base_out <= 0 then
    raise exception 'calculated amount_base_out <= 0';
  end if;

  if p_min_base_out > 0 and v_amount_base_out < p_min_base_out then
    raise exception 'slippage too high: expected at least %, got %',
      p_min_base_out, v_amount_base_out;
  end if;

  if v_market.base_reserve < v_amount_base_out then
    raise exception 'pool has not enough base reserve';
  end if;

  -- fees sobre amount_base_out
  v_fee_platform := round(v_amount_base_out * v_fee_platform_rate, 8);
  v_fee_creator  := round(v_amount_base_out * v_fee_creator_rate, 8);
  v_amount_base_net := v_amount_base_out - v_fee_platform - v_fee_creator;

  if v_amount_base_net <= 0 then
    raise exception 'amount_base_net <= 0 after fees';
  end if;

  v_price_effective := v_amount_base_out / p_amount_coin_in;

  -- coin: debita vendedor, credita pool
  update public.wallet_balances
  set balance_available = balance_available - p_amount_coin_in,
      updated_at        = now()
  where wallet_id = v_seller_wallet.id
    and coin_id   = p_coin_id;

  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_pool_wallet.id, p_coin_id, p_amount_coin_in, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  -- base: debita pool, credita vendedor, plataforma, creator
  update public.wallets
  set balance_base = balance_base - v_amount_base_out,
      updated_at   = now()
  where id = v_pool_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_amount_base_net,
      updated_at   = now()
  where id = v_seller_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_platform,
      updated_at   = now()
  where id = v_platform_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_creator,
      updated_at   = now()
  where id = v_creator_wallet.id;

  -- atualiza estado de mercado
  update public.coin_market_state
  set base_reserve     = v_new_base_reserve,
      coin_reserve     = v_new_coin_reserve,
      price_current    = v_new_base_reserve / v_new_coin_reserve,
      k_last           = v_k,
      volume_24h_base  = volume_24h_base + v_amount_base_out,
      volume_24h_coin  = volume_24h_coin + p_amount_coin_in,
      trades_24h       = trades_24h + 1,
      last_trade_at    = now(),
      updated_at       = now()
  where coin_id = p_coin_id;

  -- registra trade + fees
  insert into public.trades (
    coin_id,
    buyer_wallet_id,
    seller_wallet_id,
    side,
    amount_coin,
    amount_base,
    price_effective,
    fee_total_base,
    status,
    executed_at,
    created_at
  ) values (
    p_coin_id,
    v_pool_wallet.id,
    v_seller_wallet.id,
    'SELL',
    p_amount_coin_in,
    v_amount_base_out,
    v_price_effective,
    v_fee_platform + v_fee_creator,
    'EXECUTED',
    now(),
    now()
  )
  returning * into v_trade;

  insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
  values
    (v_trade.id, 'PLATFORM', null, v_fee_platform),
    (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

  return v_trade;
end;
$$;

alter type coin_risk_zone add value if not exists 'NEUTRO';

alter table public.coin_market_state
alter column risk_zone set default 'NEUTRO';

-- =========================================================
-- Tabela de candles diários por moeda (1d)
-- Usada pela função compute_risk_zone para calcular:
-- - preço 24h atrás
-- - média de preço 7d
-- - média de volume 7d
-- - volatilidade (stddev dos retornos)
-- =========================================================

create table if not exists public.coin_candles_1d (
  coin_id       uuid not null references public.coins (id) on delete cascade,
  bucket_date   date not null,                 -- dia (YYYY-MM-DD)

  open_price    numeric(30, 8) not null,
  high_price    numeric(30, 8) not null,
  low_price     numeric(30, 8) not null,
  close_price   numeric(30, 8) not null,

  volume_base   numeric(30, 8) not null default 0, -- volume em token base (ex: "BRL interno")
  volume_coin   numeric(30, 8) not null default 0, -- volume em unidades da coin
  trades_count  integer        not null default 0,

  created_at    timestamptz    not null default now(),
  updated_at    timestamptz    not null default now(),

  primary key (coin_id, bucket_date)
);

create index if not exists idx_coin_candles_1d_coin_date
  on public.coin_candles_1d (coin_id, bucket_date desc);

alter type coin_risk_zone add value if not exists 'NEUTRO';

create table if not exists public.coin_candles_1d (
  coin_id       uuid not null references public.coins (id) on delete cascade,
  bucket_date   date not null,                 -- dia (YYYY-MM-DD)

  open_price    numeric(30, 8) not null,
  high_price    numeric(30, 8) not null,
  low_price     numeric(30, 8) not null,
  close_price   numeric(30, 8) not null,

  volume_base   numeric(30, 8) not null default 0, -- volume em token base (ex: "BRL interno")
  volume_coin   numeric(30, 8) not null default 0, -- volume em unidades da coin
  trades_count  integer        not null default 0,

  created_at    timestamptz    not null default now(),
  updated_at    timestamptz    not null default now(),

  primary key (coin_id, bucket_date)
);

create index if not exists idx_coin_candles_1d_coin_date
  on public.coin_candles_1d (coin_id, bucket_date desc);

create or replace function public.compute_risk_zone(p_coin_id uuid)
returns coin_risk_zone
language sql
stable
as $$
with
-- ==========================
-- estado atual: preço e volume 24h
-- ==========================
current as (
  select
    cms.price_current   as p_now,
    cms.volume_24h_base as vol24
  from public.coin_market_state cms
  where cms.coin_id = p_coin_id
),

-- ==========================
-- candles dos últimos dias (base para métricas)
-- ==========================
candles as (
  select
    bucket_date,
    close_price,
    volume_base,
    -- retorno log entre dias consecutivos
    ln(
      close_price
      / nullif(lag(close_price) over (order by bucket_date), 0)
    ) as ret
  from public.coin_candles_1d
  where coin_id = p_coin_id
    and bucket_date >= current_date - 7
),

-- ==========================
-- agregados (preço médio, volume médio, vol)
-- ==========================
hist as (
  select
    -- preço de 24h atrás
    max(close_price) filter (where bucket_date = current_date - 1) as p_24h,
    -- média de preço 7d
    avg(close_price)                                               as p_avg_7d,
    -- média de volume 7d
    avg(volume_base)                                               as v_avg_7d,
    -- volatilidade dos retornos log (últimos dias)
    stddev_pop(ret)                                                as vol7
  from candles
),

metrics as (
  select
    c.p_now,
    h.p_24h,
    h.p_avg_7d,
    h.v_avg_7d,
    h.vol7,
    -- retornos e razões
    case
      when h.p_24h is not null and h.p_24h > 0
      then ln(c.p_now / h.p_24h)
      else null
    end as r24,
    case
      when h.v_avg_7d is not null and h.v_avg_7d > 0
      then c.vol24 / h.v_avg_7d
      else null
    end as vr,
    case
      when h.p_avg_7d is not null and h.p_avg_7d > 0
      then c.p_now / h.p_avg_7d
      else null
    end as pr
  from current c, hist h
)

select
  case
    -- ==========================
    -- sem histórico suficiente => NEUTRO
    -- ==========================
    when m.p_24h is null
      or m.p_24h <= 0
      or m.p_avg_7d is null
      or m.p_avg_7d <= 0
      or m.v_avg_7d is null
      or m.v_avg_7d <= 0
    then 'NEUTRO'::coin_risk_zone

    -- ==========================
    -- 🔴 BOLHA
    -- ==========================
    when (
      -- bolha inflando
      m.r24 is not null
      and m.r24 >= ln(1.5)          -- +50% ou mais em 24h
      and m.vr  is not null
      and m.vr  >= 3                -- volume >= 3x média
      and m.pr  is not null
      and m.pr  >= 2                -- preço >= 2x média 7d
    )
    or (
      -- bolha estourando: -40% ou mais com volume insano
      m.r24 is not null
      and m.r24 <= ln(0.6)
      and m.vr  is not null
      and m.vr  >= 3
    )
    then 'BOLHA'::coin_risk_zone

    -- ==========================
    -- 🟠 HYPE
    -- ==========================
    when (
      -- alta moderada com volume forte
      m.r24 is not null
      and m.r24 between ln(1.1) and ln(1.5)
      and m.vr  is not null
      and m.vr  >= 1.5
    )
    or (
      -- volatilidade alta + volume bem acima da média
      m.vol7 is not null
      and m.vol7 >= 0.15
      and m.vr   is not null
      and m.vr   >= 2
    )
    then 'HYPE'::coin_risk_zone

    -- ==========================
    -- 🔵 FRIO
    -- ==========================
    when
      m.r24 is not null
      and abs(m.r24) <= ln(1.03)      -- variação <= ±3% em 24h
      and m.vr  is not null
      and m.vr  < 0.7                 -- volume < 70% da média
      and (
        m.vol7 is null                -- sem histórico suficiente
        or m.vol7 <= 0.08             -- baixa volatilidade (~8%)
      )
    then 'FRIO'::coin_risk_zone

    -- ==========================
    -- ⚪ Caso padrão: NEUTRO
    -- ==========================
    else 'NEUTRO'::coin_risk_zone
  end
from metrics m;
$$;


create or replace view public.arena_tokens_view as
with last_24h as (
  select
    coin_id,
    close_price as price_24h
  from public.coin_candles_1d
  where bucket_date = current_date - 1
),
last_7d as (
  select
    coin_id,
    close_price as price_7d
  from public.coin_candles_1d
  where bucket_date = current_date - 7
),
vol_7d as (
  select
    coin_id,
    sum(volume_base)  as volume_7d,
    sum(trades_count) as trades_7d
  from public.coin_candles_1d
  where bucket_date >= current_date - 7
  group by coin_id
)
select
  c.id   as coin_id,
  c.name,
  c.symbol               as ticker,
  c.tags,                                -- vamos inferir tipo (PESSOA/LOCAL/PROJETO/COMUNIDADE) daqui
  cms.risk_zone,
  cms.price_current      as price,
  cms.volume_24h_base,
  cms.hype_score,
  coalesce(v7.volume_7d,  0) as volume_7d,
  coalesce(v7.trades_7d,  0) as trades_7d,
  case
    when l24.price_24h is not null and l24.price_24h > 0
    then (cms.price_current / l24.price_24h - 1) * 100
    else null
  end as change_24h,
  case
    when l7.price_7d is not null and l7.price_7d > 0
    then (cms.price_current / l7.price_7d - 1) * 100
    else null
  end as change_7d,
  least(
    100,
    greatest(
      0,
      round(
        coalesce(log(10, cms.volume_24h_base + 1) * 10, 0)
        + coalesce(v7.trades_7d, 0) * 0.5
      )
    )
  )::int as liquidity_score,
  c.narrative_short,
  c.risk_disclaimer
from public.coins c
join public.coin_market_state cms on cms.coin_id = c.id
left join last_24h l24 on l24.coin_id = c.id
left join last_7d  l7  on l7.coin_id = c.id
left join vol_7d   v7  on v7.coin_id = c.id
where c.status = 'ACTIVE';


-- =========================================================
-- ORDERS / ORDER FILLS (Orderbook opcional)
-- =========================================================

create type order_kind as enum ('MARKET', 'LIMIT', 'STOP');
create type order_status as enum ('OPEN', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED', 'REJECTED');

create table if not exists public.orders (
  id                  uuid primary key default gen_random_uuid(),
  coin_id             uuid not null references public.coins (id) on delete cascade,
  wallet_id           uuid not null references public.wallets (id) on delete cascade,

  side                trade_side not null,              -- BUY / SELL
  kind                order_kind not null default 'LIMIT',

  amount_coin_total   numeric(30, 8) not null,          -- qty total desejada
  amount_coin_open    numeric(30, 8) not null,          -- qty restante em aberto
  price_limit         numeric(30, 8),                   -- LIMIT: preço alvo
  stop_price          numeric(30, 8),                   -- STOP: gatilho
  expires_at          timestamptz,                      -- opcional

  status              order_status not null default 'OPEN',

  meta                jsonb,                            -- { client_ref, note, ... }

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index if not exists idx_orders_coin_status_price
  on public.orders (coin_id, status, side, price_limit);

create index if not exists idx_orders_wallet_time
  on public.orders (wallet_id, created_at desc);

create table if not exists public.order_fills (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders (id) on delete cascade,
  trade_id            uuid references public.trades (id) on delete set null,

  amount_coin_fill    numeric(30, 8) not null,
  amount_base_fill    numeric(30, 8) not null,
  price_fill          numeric(30, 8) not null,

  created_at          timestamptz not null default now()
);

create index if not exists idx_order_fills_order_id
  on public.order_fills (order_id, created_at desc);

-- =========================================================
-- FUNÇÃO: place_order (só registra e trava saldo)
-- Matching engine roda fora (Edge Function) e gera fills.
-- =========================================================

create or replace function public.place_order(
  p_coin_id            uuid,
  p_wallet_id          uuid,
  p_side               trade_side,
  p_kind               order_kind,
  p_amount_coin        numeric,
  p_price_limit        numeric default null,
  p_stop_price         numeric default null,
  p_expires_at         timestamptz default null,
  p_meta               jsonb default '{}'::jsonb
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wallet public.wallets%rowtype;
  v_market public.coin_market_state%rowtype;
  v_price  numeric;
  v_cost_base numeric;
  v_order public.orders%rowtype;
begin
  if p_amount_coin <= 0 then
    raise exception 'amount_coin must be > 0';
  end if;

  select * into v_wallet
  from public.wallets
  where id = p_wallet_id and is_active
  for update;

  if not found then
    raise exception 'wallet not found/active';
  end if;

  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id;

  if not found then
    raise exception 'coin_market_state not initialized';
  end if;

  v_price := coalesce(p_price_limit, v_market.price_current);

  if p_kind = 'LIMIT' and (p_price_limit is null or p_price_limit <= 0) then
    raise exception 'LIMIT requires price_limit > 0';
  end if;

  if p_kind = 'STOP' and (p_stop_price is null or p_stop_price <= 0) then
    raise exception 'STOP requires stop_price > 0';
  end if;

  -- Trava saldo:
  if p_side = 'BUY' then
    v_cost_base := p_amount_coin * v_price * (1 + 0.02); -- margem 2% anti volta
    if v_wallet.balance_base < v_cost_base then
      raise exception 'insufficient base for order lock';
    end if;

    update public.wallets
    set balance_base = balance_base - v_cost_base,
        updated_at = now()
    where id = v_wallet.id;

    -- guarda lock em meta (engine libera sobra)
    p_meta := jsonb_set(p_meta, '{locked_base}', to_jsonb(v_cost_base), true);
  else
    -- SELL: trava coin
    update public.wallet_balances
    set balance_available = balance_available - p_amount_coin,
        balance_locked    = balance_locked + p_amount_coin,
        updated_at        = now()
    where wallet_id = v_wallet.id and coin_id = p_coin_id
      and balance_available >= p_amount_coin;

    if not found then
      raise exception 'insufficient coin to lock sell order';
    end if;
  end if;

  insert into public.orders (
    coin_id, wallet_id, side, kind,
    amount_coin_total, amount_coin_open,
    price_limit, stop_price, expires_at,
    status, meta
  ) values (
    p_coin_id, v_wallet.id, p_side, p_kind,
    p_amount_coin, p_amount_coin,
    p_price_limit, p_stop_price, p_expires_at,
    'OPEN', coalesce(p_meta, '{}'::jsonb)
  )
  returning * into v_order;

  return v_order;
end;
$$;

-- =========================================================
-- FUNÇÃO: cancel_order (destrava saldo do que sobrou)
-- =========================================================

create or replace function public.cancel_order(
  p_order_id uuid,
  p_wallet_id uuid
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_wallet public.wallets%rowtype;
  v_locked_base numeric;
begin
  select * into v_order
  from public.orders
  where id = p_order_id and wallet_id = p_wallet_id
  for update;

  if not found then
    raise exception 'order not found for wallet';
  end if;

  if v_order.status not in ('OPEN','PARTIALLY_FILLED') then
    raise exception 'order cannot be cancelled';
  end if;

  select * into v_wallet
  from public.wallets
  where id = p_wallet_id
  for update;

  -- destrava conforme lado
  if v_order.side = 'BUY' then
    v_locked_base := coalesce((v_order.meta->>'locked_base')::numeric, 0);
    if v_locked_base > 0 then
      update public.wallets
      set balance_base = balance_base + v_locked_base,
          updated_at = now()
      where id = v_wallet.id;
    end if;
  else
    update public.wallet_balances
    set balance_available = balance_available + v_order.amount_coin_open,
        balance_locked    = balance_locked - v_order.amount_coin_open,
        updated_at        = now()
    where wallet_id = v_wallet.id and coin_id = v_order.coin_id;
  end if;

  update public.orders
  set status = 'CANCELLED',
      amount_coin_open = 0,
      updated_at = now()
  where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

-- =========================================================
-- LEDGER ENTRIES (auditoria contábil)
-- =========================================================

create type ledger_reason as enum (
  'DEPOSIT',
  'WITHDRAWAL',
  'TRADE_BUY',
  'TRADE_SELL',
  'FEE_PLATFORM',
  'FEE_CREATOR',
  'REFERRAL_REWARD',
  'ADJUSTMENT',
  'ORDER_LOCK',
  'ORDER_UNLOCK'
);

create table if not exists public.ledger_entries (
  id                uuid primary key default gen_random_uuid(),
  wallet_id         uuid not null references public.wallets (id) on delete cascade,
  coin_id           uuid references public.coins (id) on delete set null,

  delta_base        numeric(30, 8) not null default 0,
  delta_coin        numeric(30, 8) not null default 0,

  reason            ledger_reason not null,
  ref_trade_id      uuid references public.trades (id) on delete set null,
  ref_order_id      uuid references public.orders (id) on delete set null,
  ref_deposit_id    uuid references public.deposits (id) on delete set null,
  ref_withdrawal_id uuid references public.withdrawals (id) on delete set null,

  meta              jsonb,

  created_at        timestamptz not null default now()
);

create index if not exists idx_ledger_wallet_time
  on public.ledger_entries (wallet_id, created_at desc);
create index if not exists idx_ledger_coin_time
  on public.ledger_entries (coin_id, created_at desc);

-- =========================================================
-- TRIGGER: gera ledger quando trade executa
-- =========================================================

create or replace function public.trg_ledger_on_trade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'EXECUTED' then
    return new;
  end if;

  -- comprador: -base, +coin
  insert into public.ledger_entries (
    wallet_id, coin_id, delta_base, delta_coin, reason, ref_trade_id, meta
  ) values (
    new.buyer_wallet_id, new.coin_id,
    -new.amount_base, new.amount_coin,
    'TRADE_BUY', new.id,
    jsonb_build_object('price_effective', new.price_effective)
  );

  -- vendedor: +base, -coin
  insert into public.ledger_entries (
    wallet_id, coin_id, delta_base, delta_coin, reason, ref_trade_id, meta
  ) values (
    new.seller_wallet_id, new.coin_id,
    new.amount_base - new.fee_total_base, -new.amount_coin,
    'TRADE_SELL', new.id,
    jsonb_build_object('price_effective', new.price_effective)
  );

  return new;
end;
$$;

drop trigger if exists trg_trades_ledger on public.trades;
create trigger trg_trades_ledger
after insert on public.trades
for each row execute function public.trg_ledger_on_trade();

-- =========================================================
-- TRIGGER: ledger em depósitos / saques (quando COMPLETED)
-- =========================================================

create or replace function public.trg_ledger_on_deposit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' and (old.status is distinct from new.status) then
    insert into public.ledger_entries (
      wallet_id, delta_base, reason, ref_deposit_id
    ) values (
      new.wallet_id, new.amount_base, 'DEPOSIT', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_deposits_ledger on public.deposits;
create trigger trg_deposits_ledger
after update on public.deposits
for each row execute function public.trg_ledger_on_deposit();

create or replace function public.trg_ledger_on_withdrawal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'COMPLETED' and (old.status is distinct from new.status) then
    insert into public.ledger_entries (
      wallet_id, delta_base, reason, ref_withdrawal_id
    ) values (
      new.wallet_id, -new.amount_base, 'WITHDRAWAL', new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_withdrawals_ledger on public.withdrawals;
create trigger trg_withdrawals_ledger
after update on public.withdrawals
for each row execute function public.trg_ledger_on_withdrawal();


-- =========================================================
-- POSITIONS VIEW (avg cost, pnl realizado/não realizado)
-- Fórmula simples baseada no ledger
-- =========================================================

create or replace view public.positions_view as
with buys as (
  select
    wallet_id,
    coin_id,
    sum(delta_coin) as qty_buy,
    sum(-delta_base) as cost_base
  from public.ledger_entries
  where reason = 'TRADE_BUY'
  group by wallet_id, coin_id
),
sells as (
  select
    wallet_id,
    coin_id,
    sum(-delta_coin) as qty_sell,
    sum(delta_base) as proceeds_base
  from public.ledger_entries
  where reason = 'TRADE_SELL'
  group by wallet_id, coin_id
),
hold as (
  select
    wallet_id,
    coin_id,
    sum(delta_coin) as qty_net
  from public.ledger_entries
  group by wallet_id, coin_id
)
select
  h.wallet_id,
  h.coin_id,
  h.qty_net,
  case when b.qty_buy > 0 then b.cost_base / b.qty_buy else null end as avg_cost_base,
  coalesce(s.proceeds_base, 0) - coalesce((s.qty_sell * (case when b.qty_buy>0 then b.cost_base/b.qty_buy else 0 end)), 0)
    as realized_pnl_base,
  cms.price_current * h.qty_net as market_value_base,
  (cms.price_current * h.qty_net) - (coalesce(b.cost_base,0) - coalesce(s.qty_sell,0) * coalesce((case when b.qty_buy>0 then b.cost_base/b.qty_buy else 0 end),0))
    as unrealized_pnl_base,
  cms.price_current
from hold h
left join buys b on b.wallet_id=h.wallet_id and b.coin_id=h.coin_id
left join sells s on s.wallet_id=h.wallet_id and s.coin_id=h.coin_id
left join public.coin_market_state cms on cms.coin_id=h.coin_id
where h.coin_id is not null;

-- =========================================================
-- CANDLES 1m (mercado vivo)
-- =========================================================

create table if not exists public.coin_candles_1m (
  coin_id       uuid not null references public.coins (id) on delete cascade,
  bucket_ts     timestamptz not null, -- minuto (truncado)

  open_price    numeric(30, 8) not null,
  high_price    numeric(30, 8) not null,
  low_price     numeric(30, 8) not null,
  close_price   numeric(30, 8) not null,

  volume_base   numeric(30, 8) not null default 0,
  volume_coin   numeric(30, 8) not null default 0,
  trades_count  integer not null default 0,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  primary key (coin_id, bucket_ts)
);

create index if not exists idx_coin_candles_1m_coin_ts
  on public.coin_candles_1m (coin_id, bucket_ts desc);

-- =========================================================
-- FUNÇÃO: rollup 1m -> 5m / 1h / 1d (scheduler)
-- =========================================================

create or replace function public.rollup_candles(
  p_coin_id uuid,
  p_from timestamptz,
  p_to timestamptz,
  p_bucket interval
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Exemplo: p_bucket = '5 minutes' ou '1 hour'
  -- Crie tabelas target separadas (coin_candles_5m, coin_candles_1h) se quiser.
  -- Aqui só retorna agregação via insert on conflict em coin_candles_1d (se p_bucket='1 day').

  if p_bucket = interval '1 day' then
    insert into public.coin_candles_1d (
      coin_id, bucket_date,
      open_price, high_price, low_price, close_price,
      volume_base, volume_coin, trades_count,
      created_at, updated_at
    )
    select
      coin_id,
      (date_trunc('day', bucket_ts))::date as bucket_date,
      first_value(open_price) over w as open_price,
      max(high_price) over w as high_price,
      min(low_price) over w as low_price,
      last_value(close_price) over w as close_price,
      sum(volume_base) over w as volume_base,
      sum(volume_coin) over w as volume_coin,
      sum(trades_count) over w as trades_count,
      now(), now()
    from public.coin_candles_1m
    where coin_id = p_coin_id
      and bucket_ts >= p_from
      and bucket_ts < p_to
    window w as (partition by coin_id, date_trunc('day', bucket_ts) order by bucket_ts
                 rows between unbounded preceding and unbounded following)
    on conflict (coin_id, bucket_date) do update
      set open_price  = excluded.open_price,
          high_price  = excluded.high_price,
          low_price   = excluded.low_price,
          close_price = excluded.close_price,
          volume_base = excluded.volume_base,
          volume_coin = excluded.volume_coin,
          trades_count= excluded.trades_count,
          updated_at  = now();
  end if;
end;
$$;

-- =========================================================
-- CIRCUIT BREAKER CAMPOS NO MARKET STATE
-- =========================================================

alter table public.coin_market_state
add column if not exists trading_paused_until timestamptz,
add column if not exists max_impact_pct numeric(10,4) default 35, -- trava se impacto > 35%
add column if not exists max_slippage_pct numeric(10,4) default 20; -- trava se slippage > 20%

-- =========================================================
-- FUNÇÃO: check_circuit_breaker
-- Usar no começo de swap_buy/swap_sell (ou no engine).
-- =========================================================

create or replace function public.check_circuit_breaker(
  p_coin_id uuid,
  p_estimated_impact_pct numeric,
  p_estimated_slippage_pct numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.coin_market_state%rowtype;
begin
  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id;

  if not found then
    raise exception 'market not found';
  end if;

  if v_market.trading_paused_until is not null
     and v_market.trading_paused_until > now() then
    raise exception 'trading paused until %', v_market.trading_paused_until;
  end if;

  if v_market.max_impact_pct is not null
     and p_estimated_impact_pct > v_market.max_impact_pct then
    raise exception 'impact too high (%.%)', p_estimated_impact_pct, v_market.max_impact_pct;
  end if;

  if v_market.max_slippage_pct is not null
     and p_estimated_slippage_pct > v_market.max_slippage_pct then
    raise exception 'slippage too high (%.%)', p_estimated_slippage_pct, v_market.max_slippage_pct;
  end if;
end;
$$;

-- =========================================================
-- FUNÇÃO: pause_trading (admin / sistema)
-- =========================================================

create or replace function public.pause_trading(
  p_coin_id uuid,
  p_minutes int default 10,
  p_reason text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coin_market_state
  set trading_paused_until = now() + make_interval(mins => p_minutes),
      updated_at = now()
  where coin_id = p_coin_id;

  insert into public.posts(
    coin_id, kind, content, is_system, meta
  ) values (
    p_coin_id, 'WARNING',
    coalesce(p_reason, 'Circuit breaker acionado. Trade pausado temporariamente.'),
    true,
    jsonb_build_object('paused_minutes', p_minutes)
  );
end;
$$;


create or replace function public.swap_buy(
  p_coin_id           uuid,
  p_buyer_wallet_id   uuid,
  p_amount_base_in    numeric,
  p_min_amount_out    numeric default 0
) returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market          public.coin_market_state%rowtype;
  v_coin            public.coins%rowtype;

  v_buyer_wallet    public.wallets%rowtype;
  v_pool_wallet     public.wallets%rowtype;
  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0075; -- 0.75%
  v_fee_creator_rate  numeric := 0.0025; -- 0.25%

  v_fee_platform    numeric;
  v_fee_creator     numeric;
  v_amount_base_net numeric;

  v_k                numeric;
  v_new_base_reserve numeric;
  v_new_coin_reserve numeric;
  v_amount_coin_out  numeric;
  v_price_effective  numeric;

  -- circuit breaker
  v_price_now      numeric;
  v_price_new      numeric;
  v_slippage_pct   numeric;
  v_impact_pct     numeric;

  v_trade           public.trades%rowtype;
begin
  if p_amount_base_in <= 0 then
    raise exception 'amount_base_in must be > 0';
  end if;

  -- wallet do comprador
  select *
  into v_buyer_wallet
  from public.wallets
  where id = p_buyer_wallet_id
  for update;

  if not found then
    raise exception 'buyer wallet not found';
  end if;

  if v_buyer_wallet.balance_base < p_amount_base_in then
    raise exception 'insufficient base balance in buyer wallet';
  end if;

  -- coin
  select *
  into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  if v_coin.pool_wallet_id is null then
    raise exception 'coin has no pool_wallet_id configured';
  end if;

  -- estado de mercado (trava linha para evitar corrida)
  select *
  into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not initialized for this coin';
  end if;

  if v_market.base_reserve <= 0 or v_market.coin_reserve <= 0 then
    raise exception 'invalid reserves for coin %', p_coin_id;
  end if;

  v_price_now := v_market.price_current;

  -- pool wallet
  select *
  into v_pool_wallet
  from public.wallets
  where id = v_coin.pool_wallet_id
  for update;

  if not found then
    raise exception 'pool wallet not found';
  end if;

  -- platform treasury wallet (única)
  select *
  into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet (prioriza CREATOR_TREASURY, senão USER)
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY', 'USER')
  order by case when w.wallet_type = 'CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  -- fees
  v_fee_platform    := round(p_amount_base_in * v_fee_platform_rate, 8);
  v_fee_creator     := round(p_amount_base_in * v_fee_creator_rate, 8);
  v_amount_base_net := p_amount_base_in - v_fee_platform - v_fee_creator;

  if v_amount_base_net <= 0 then
    raise exception 'amount_base_net <= 0 after fees';
  end if;

  -- AMM x * y = k
  v_k := v_market.base_reserve * v_market.coin_reserve;

  v_new_base_reserve := v_market.base_reserve + v_amount_base_net;
  v_new_coin_reserve := v_k / v_new_base_reserve;

  v_amount_coin_out := v_market.coin_reserve - v_new_coin_reserve;

  if v_amount_coin_out <= 0 then
    raise exception 'calculated amount_coin_out <= 0';
  end if;

  if p_min_amount_out > 0 and v_amount_coin_out < p_min_amount_out then
    raise exception 'slippage too high: expected at least %, got %',
      p_min_amount_out, v_amount_coin_out;
  end if;

  if v_market.coin_reserve < v_amount_coin_out then
    raise exception 'pool has not enough coin reserve';
  end if;

  v_price_effective := p_amount_base_in / v_amount_coin_out;
  v_price_new := v_new_base_reserve / v_new_coin_reserve;

  -- ======================================
  -- CIRCUIT BREAKER (nativo)
  -- ======================================
  v_slippage_pct := abs((v_price_effective / nullif(v_price_now,0) - 1) * 100);
  v_impact_pct   := abs((v_price_new / nullif(v_price_now,0) - 1) * 100);

  perform public.check_circuit_breaker(
    p_coin_id,
    coalesce(v_impact_pct, 0),
    coalesce(v_slippage_pct, 0)
  );

  -- base: debita comprador, credita pool, plataforma e creator
  update public.wallets
  set balance_base = balance_base - p_amount_base_in,
      updated_at   = now()
  where id = v_buyer_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_amount_base_net,
      updated_at   = now()
  where id = v_pool_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_platform,
      updated_at   = now()
  where id = v_platform_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_creator,
      updated_at   = now()
  where id = v_creator_wallet.id;

  -- coin: debita pool, credita comprador
  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_buyer_wallet.id, p_coin_id, v_amount_coin_out, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_pool_wallet.id, p_coin_id, -v_amount_coin_out, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  -- atualiza estado de mercado
  update public.coin_market_state
  set base_reserve     = v_new_base_reserve,
      coin_reserve     = v_new_coin_reserve,
      price_current    = v_price_new,
      k_last           = v_k,
      volume_24h_base  = volume_24h_base + p_amount_base_in,
      volume_24h_coin  = volume_24h_coin + v_amount_coin_out,
      trades_24h       = trades_24h + 1,
      last_trade_at    = now(),
      updated_at       = now()
  where coin_id = p_coin_id;

  -- registra trade + fees
  insert into public.trades (
    coin_id,
    buyer_wallet_id,
    seller_wallet_id,
    side,
    amount_coin,
    amount_base,
    price_effective,
    fee_total_base,
    status,
    executed_at,
    created_at
  ) values (
    p_coin_id,
    v_buyer_wallet.id,
    v_pool_wallet.id,
    'BUY',
    v_amount_coin_out,
    p_amount_base_in,
    v_price_effective,
    v_fee_platform + v_fee_creator,
    'EXECUTED',
    now(),
    now()
  )
  returning * into v_trade;

  insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
  values
    (v_trade.id, 'PLATFORM', null, v_fee_platform),
    (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

  return v_trade;
end;
$$;


create or replace function public.swap_sell(
  p_coin_id            uuid,
  p_seller_wallet_id   uuid,
  p_amount_coin_in     numeric,
  p_min_base_out       numeric default 0
) returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market          public.coin_market_state%rowtype;
  v_coin            public.coins%rowtype;

  v_seller_wallet   public.wallets%rowtype;
  v_pool_wallet     public.wallets%rowtype;
  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0075; -- 0.75%
  v_fee_creator_rate  numeric := 0.0025; -- 0.25%

  v_fee_platform    numeric;
  v_fee_creator     numeric;
  v_amount_base_out numeric;
  v_amount_base_net numeric;

  v_k                numeric;
  v_new_base_reserve numeric;
  v_new_coin_reserve numeric;
  v_price_effective  numeric;

  v_current_balance  numeric;

  -- circuit breaker
  v_price_now      numeric;
  v_price_new      numeric;
  v_slippage_pct   numeric;
  v_impact_pct     numeric;

  v_trade           public.trades%rowtype;
begin
  if p_amount_coin_in <= 0 then
    raise exception 'amount_coin_in must be > 0';
  end if;

  -- wallet do vendedor
  select *
  into v_seller_wallet
  from public.wallets
  where id = p_seller_wallet_id
  for update;

  if not found then
    raise exception 'seller wallet not found';
  end if;

  -- coin
  select *
  into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  if v_coin.pool_wallet_id is null then
    raise exception 'coin has no pool_wallet_id configured';
  end if;

  -- estado de mercado (trava linha)
  select *
  into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not initialized for this coin';
  end if;

  if v_market.base_reserve <= 0 or v_market.coin_reserve <= 0 then
    raise exception 'invalid reserves for coin %', p_coin_id;
  end if;

  v_price_now := v_market.price_current;

  -- pool wallet
  select *
  into v_pool_wallet
  from public.wallets
  where id = v_coin.pool_wallet_id
  for update;

  if not found then
    raise exception 'pool wallet not found';
  end if;

  -- platform treasury wallet
  select *
  into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY', 'USER')
  order by case when w.wallet_type = 'CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  -- checa saldo de coin do vendedor
  select balance_available
  into v_current_balance
  from public.wallet_balances
  where wallet_id = v_seller_wallet.id
    and coin_id   = p_coin_id
  for update;

  if not found or v_current_balance < p_amount_coin_in then
    raise exception 'insufficient coin balance to sell';
  end if;

  -- AMM: venda adiciona coin na pool e retira base
  v_k := v_market.base_reserve * v_market.coin_reserve;

  v_new_coin_reserve := v_market.coin_reserve + p_amount_coin_in;
  v_new_base_reserve := v_k / v_new_coin_reserve;

  v_amount_base_out := v_market.base_reserve - v_new_base_reserve;

  if v_amount_base_out <= 0 then
    raise exception 'calculated amount_base_out <= 0';
  end if;

  if p_min_base_out > 0 and v_amount_base_out < p_min_base_out then
    raise exception 'slippage too high: expected at least %, got %',
      p_min_base_out, v_amount_base_out;
  end if;

  if v_market.base_reserve < v_amount_base_out then
    raise exception 'pool has not enough base reserve';
  end if;

  -- fees sobre amount_base_out
  v_fee_platform := round(v_amount_base_out * v_fee_platform_rate, 8);
  v_fee_creator  := round(v_amount_base_out * v_fee_creator_rate, 8);
  v_amount_base_net := v_amount_base_out - v_fee_platform - v_fee_creator;

  if v_amount_base_net <= 0 then
    raise exception 'amount_base_net <= 0 after fees';
  end if;

  v_price_effective := v_amount_base_out / p_amount_coin_in;
  v_price_new := v_new_base_reserve / v_new_coin_reserve;

  -- ======================================
  -- CIRCUIT BREAKER (nativo)
  -- ======================================
  v_slippage_pct := abs((v_price_effective / nullif(v_price_now,0) - 1) * 100);
  v_impact_pct   := abs((v_price_new / nullif(v_price_now,0) - 1) * 100);

  perform public.check_circuit_breaker(
    p_coin_id,
    coalesce(v_impact_pct, 0),
    coalesce(v_slippage_pct, 0)
  );

  -- coin: debita vendedor, credita pool
  update public.wallet_balances
  set balance_available = balance_available - p_amount_coin_in,
      updated_at        = now()
  where wallet_id = v_seller_wallet.id
    and coin_id   = p_coin_id;

  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (v_pool_wallet.id, p_coin_id, p_amount_coin_in, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at        = now();

  -- base: debita pool, credita vendedor, plataforma, creator
  update public.wallets
  set balance_base = balance_base - v_amount_base_out,
      updated_at   = now()
  where id = v_pool_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_amount_base_net,
      updated_at   = now()
  where id = v_seller_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_platform,
      updated_at   = now()
  where id = v_platform_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_creator,
      updated_at   = now()
  where id = v_creator_wallet.id;

  -- atualiza estado de mercado
  update public.coin_market_state
  set base_reserve     = v_new_base_reserve,
      coin_reserve     = v_new_coin_reserve,
      price_current    = v_price_new,
      k_last           = v_k,
      volume_24h_base  = volume_24h_base + v_amount_base_out,
      volume_24h_coin  = volume_24h_coin + p_amount_coin_in,
      trades_24h       = trades_24h + 1,
      last_trade_at    = now(),
      updated_at       = now()
  where coin_id = p_coin_id;

  -- registra trade + fees
  insert into public.trades (
    coin_id,
    buyer_wallet_id,
    seller_wallet_id,
    side,
    amount_coin,
    amount_base,
    price_effective,
    fee_total_base,
    status,
    executed_at,
    created_at
  ) values (
    p_coin_id,
    v_pool_wallet.id,
    v_seller_wallet.id,
    'SELL',
    p_amount_coin_in,
    v_amount_base_out,
    v_price_effective,
    v_fee_platform + v_fee_creator,
    'EXECUTED',
    now(),
    now()
  )
  returning * into v_trade;

  insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
  values
    (v_trade.id, 'PLATFORM', null, v_fee_platform),
    (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

  return v_trade;
end;
$$;


-- =========================================================
-- HARD MODE: Circuit Breaker Config + Trading Halt State
-- =========================================================

alter table public.coin_market_state
  add column if not exists max_impact_pct     numeric(10,4) not null default 18.0, -- impacto máximo permitido (%)
  add column if not exists max_slippage_pct   numeric(10,4) not null default 12.0, -- slippage máximo permitido (%)
  add column if not exists halt_cooldown_sec  integer not null default 300,        -- tempo mínimo de pause quando breaker estoura

  add column if not exists is_halted          boolean not null default false,
  add column if not exists halted_until       timestamptz,
  add column if not exists halt_reason        text,
  add column if not exists halts_24h          integer not null default 0,
  add column if not exists halts_updated_at   timestamptz;


-- =========================================================
-- HARD MODE: Trading Halts Log
-- =========================================================

create table if not exists public.coin_trading_halts (
  id               uuid primary key default gen_random_uuid(),
  coin_id          uuid not null references public.coins (id) on delete cascade,
  triggered_by     uuid references public.trades (id), -- trade que disparou (se houver)
  impact_pct       numeric(10,4),
  slippage_pct     numeric(10,4),
  max_impact_pct   numeric(10,4),
  max_slippage_pct numeric(10,4),
  reason           text not null, -- "IMPACT_BREAKER" | "SLIPPAGE_BREAKER" | manual etc
  halted_until     timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_coin_trading_halts_coin_time
  on public.coin_trading_halts (coin_id, created_at desc);

-- =========================================================
-- FUNÇÃO: pause_trading (hard halt)
-- =========================================================
create or replace function public.pause_trading(
  p_coin_id        uuid,
  p_reason         text,
  p_minutes        integer default null,
  p_impact_pct     numeric default null,
  p_slippage_pct   numeric default null,
  p_trigger_trade  uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.coin_market_state%rowtype;
  v_until  timestamptz;
  v_minutes integer;
begin
  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not found for coin %', p_coin_id;
  end if;

  v_minutes := coalesce(p_minutes, ceil(v_market.halt_cooldown_sec / 60.0)::int);
  v_until := now() + make_interval(mins => v_minutes);

  update public.coin_market_state
  set is_halted        = true,
      halted_until     = v_until,
      halt_reason      = p_reason,
      halts_24h        = case
                           when v_market.halts_updated_at is null
                             or v_market.halts_updated_at < now() - interval '24 hours'
                           then 1
                           else v_market.halts_24h + 1
                         end,
      halts_updated_at = now(),
      updated_at       = now()
  where coin_id = p_coin_id;

  insert into public.coin_trading_halts (
    coin_id, triggered_by,
    impact_pct, slippage_pct,
    max_impact_pct, max_slippage_pct,
    reason, halted_until
  )
  values (
    p_coin_id, p_trigger_trade,
    p_impact_pct, p_slippage_pct,
    v_market.max_impact_pct, v_market.max_slippage_pct,
    p_reason, v_until
  );

  -- Post WARNING no feed da moeda (estilo "bolsa pausada")
  insert into public.posts (
    coin_id, kind, content, is_system, created_at
  ) values (
    p_coin_id,
    'WARNING',
    format(
      '⚠️ Mercado pausado (%s). Impacto=%s%%, Slippage=%s%%. Volta prevista: %s. Isso é arena, não é parque.',
      p_reason,
      coalesce(round(p_impact_pct,2)::text,'n/a'),
      coalesce(round(p_slippage_pct,2)::text,'n/a'),
      to_char(v_until, 'YYYY-MM-DD HH24:MI:SS')
    ),
    true,
    now()
  );

end;
$$;


-- =========================================================
-- FUNÇÃO: resume_trading
-- =========================================================
create or replace function public.resume_trading(
  p_coin_id uuid,
  p_reason  text default 'MANUAL_RESUME'
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coin_market_state
  set is_halted      = false,
      halted_until   = null,
      halt_reason    = null,
      updated_at     = now()
  where coin_id = p_coin_id;

  insert into public.posts (
    coin_id, kind, content, is_system, created_at
  ) values (
    p_coin_id,
    'SYSTEM',
    format('✅ Mercado reaberto (%s). Volatilidade volta a valer. Jogo segue.', p_reason),
    true,
    now()
  );
end;
$$;


create or replace function public.place_limit_order(
  p_coin_id uuid,
  p_wallet_id uuid,
  p_side trade_side,
  p_price_limit numeric,
  p_amount_base numeric default null,
  p_amount_coin numeric default null
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.coin_market_state%rowtype;
  v_order  public.orders%rowtype;
begin
  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id;

  if not found then
    raise exception 'coin_market_state not found';
  end if;

  insert into public.orders (
    user_wallet_id, coin_id, side, type,
    price_limit, amount_base, amount_coin
  ) values (
    p_wallet_id, p_coin_id, p_side, 'LIMIT',
    p_price_limit, p_amount_base, p_amount_coin
  )
  returning * into v_order;

  -- execução imediata se preço já passou no limite
  if p_side = 'BUY' and v_market.price_current <= p_price_limit then
    perform public.swap_buy(p_coin_id, p_wallet_id, p_amount_base, 0);
    update public.orders
      set status='FILLED', updated_at=now()
      where id=v_order.id
      returning * into v_order;

  elsif p_side='SELL' and v_market.price_current >= p_price_limit then
    perform public.swap_sell(p_coin_id, p_wallet_id, p_amount_coin, 0);
    update public.orders
      set status='FILLED', updated_at=now()
      where id=v_order.id
      returning * into v_order;
  end if;

  return v_order;
end;
$$;

-- =========================================================
-- FUNÇÃO: check_circuit_breaker (hard) - FIX
-- Estoura => pause_trading + exception
-- =========================================================
create or replace function public.check_circuit_breaker(
  p_coin_id       uuid,
  p_impact_pct    numeric,
  p_slippage_pct  numeric,
  p_trigger_trade uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.coin_market_state%rowtype;
  v_reason text;
begin
  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not found for coin %', p_coin_id;
  end if;

  -- se já está halted e ainda não passou, bloqueia
  if v_market.is_halted
     and v_market.halted_until is not null
     and v_market.halted_until > now()
  then
    raise exception 'market halted until % (reason: %)',
      v_market.halted_until, coalesce(v_market.halt_reason,'UNKNOWN');
  end if;

  if p_impact_pct >= v_market.max_impact_pct then
    v_reason := 'IMPACT_BREAKER';
  elsif p_slippage_pct >= v_market.max_slippage_pct then
    v_reason := 'SLIPPAGE_BREAKER';
  end if;

  if v_reason is not null then
    perform public.pause_trading(
      p_coin_id,
      v_reason,
      null,
      p_impact_pct,
      p_slippage_pct,
      p_trigger_trade
    );

    -- usa format pra não ter treta com %% no RAISE
    raise exception using
      message = format(
        'circuit breaker triggered (%s): impact=%.4f%%, slippage=%.4f%%',
        v_reason, p_impact_pct, p_slippage_pct
      );
  end if;
end;
$$;



-- =========================================================
-- MIGRAÇÃO HARD: garante user_wallet_id
-- =========================================================
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'orders'
  ) then

    -- caso antigo: wallet_id -> user_wallet_id
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name = 'wallet_id'
    )
    and not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name = 'user_wallet_id'
    ) then
      alter table public.orders rename column wallet_id to user_wallet_id;
    end if;

    -- se ainda não existe, cria a coluna
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'orders'
        and column_name = 'user_wallet_id'
    ) then
      alter table public.orders
        add column user_wallet_id uuid references public.wallets(id) on delete cascade;
    end if;

  end if;
end $$;

-- =========================================================
-- RECRIA ÍNDICES (drop + create)
-- =========================================================
drop index if exists public.idx_orders_open_coin;
drop index if exists public.idx_orders_open_wallet;
drop index if exists public.idx_orders_book_price;

create index if not exists idx_orders_open_coin
  on public.orders (coin_id, status, created_at)
  where status = 'OPEN';

create index if not exists idx_orders_open_wallet
  on public.orders (user_wallet_id, status, created_at)
  where status = 'OPEN';

create index if not exists idx_orders_book_price
  on public.orders (coin_id, side, price_limit, created_at)
  where status = 'OPEN' and type = 'LIMIT';

-- depois que preencher user_wallet_id em todas as linhas:
alter table public.orders
  alter column user_wallet_id set not null;


-- =========================================================
-- ORDERS (book) - tipos + tabela + constraints hard
-- =========================================================

-- ENUM: order_type
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_type') then
    create type public.order_type as enum ('MARKET','LIMIT');
  end if;
end $$;

-- ENUM: order_status
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('OPEN','FILLED','CANCELLED');
  end if;
end $$;

-- Tabela orders
create table if not exists public.orders (
  id              uuid primary key default gen_random_uuid(),
  user_wallet_id  uuid not null references public.wallets(id) on delete cascade,
  coin_id         uuid not null references public.coins(id) on delete cascade,

  side            trade_side not null,                 -- BUY / SELL
  type            order_type not null default 'LIMIT', -- MARKET / LIMIT

  price_limit     numeric(30,8),  -- obrigatório em LIMIT
  amount_base     numeric(30,8),  -- BUY usa base
  amount_coin     numeric(30,8),  -- SELL usa coin

  status          order_status not null default 'OPEN',
  filled_trade_id uuid references public.trades(id),

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- ==========================
  -- Constraints HARD
  -- ==========================

  -- valores sempre positivos quando existirem
  constraint orders_amount_base_positive
    check (amount_base is null or amount_base > 0),

  constraint orders_amount_coin_positive
    check (amount_coin is null or amount_coin > 0),

  constraint orders_price_limit_positive
    check (price_limit is null or price_limit > 0),

  -- LIMIT exige price_limit; MARKET não pode ter price_limit
  constraint orders_type_price_rule
    check (
      (type = 'LIMIT'  and price_limit is not null)
      or
      (type = 'MARKET' and price_limit is null)
    ),

  -- BUY precisa amount_base e NÃO precisa amount_coin
  -- SELL precisa amount_coin e NÃO precisa amount_base
  constraint orders_side_amount_rule
    check (
      (side = 'BUY'  and amount_base is not null and amount_coin is null)
      or
      (side = 'SELL' and amount_coin is not null and amount_base is null)
    )
);

-- =========================================================
-- Índices (book / matching)
-- =========================================================

-- open orders por moeda (matching engine)
create index if not exists idx_orders_open_coin
  on public.orders (coin_id, status, created_at)
  where status = 'OPEN';

-- open orders por wallet (minha fila)
create index if not exists idx_orders_open_wallet
  on public.orders (user_wallet_id, status, created_at)
  where status = 'OPEN';

-- book por preço (para LIMIT)
create index if not exists idx_orders_book_price
  on public.orders (coin_id, side, price_limit, created_at)
  where status = 'OPEN' and type = 'LIMIT';


-- =========================================================
-- HARDEN ORDERS: remaining + filled
-- =========================================================
alter table public.orders
  add column if not exists amount_base_remaining numeric(30,8),
  add column if not exists amount_coin_remaining numeric(30,8),
  add column if not exists filled_base numeric(30,8) not null default 0,
  add column if not exists filled_coin numeric(30,8) not null default 0;

-- backfill p/ ordens antigas OPEN
update public.orders
set amount_base_remaining = coalesce(amount_base_remaining, amount_base),
    amount_coin_remaining = coalesce(amount_coin_remaining, amount_coin)
where status = 'OPEN';

-- =========================================================
-- ORDER FILLS (trade tape por ordem)
-- =========================================================
create table if not exists public.order_fills (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  trade_id       uuid not null references public.trades(id) on delete cascade,
  maker_order_id uuid not null references public.orders(id),
  taker_order_id uuid not null references public.orders(id),
  amount_coin    numeric(30,8) not null,
  amount_base    numeric(30,8) not null,
  price          numeric(30,8) not null,
  created_at     timestamptz not null default now()
);

create index if not exists idx_order_fills_order
  on public.order_fills (order_id, created_at desc);

create index if not exists idx_order_fills_trade
  on public.order_fills (trade_id);


-- =========================================================
-- FUNÇÃO: upsert_candle_1m
-- =========================================================
create or replace function public.upsert_candle_1m(
  p_coin_id      uuid,
  p_bucket_time  timestamptz,
  p_price        numeric,
  p_volume_base  numeric,
  p_volume_coin  numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.coin_candles_1m (
    coin_id, bucket_time,
    open_price, high_price, low_price, close_price,
    volume_base, volume_coin, trades_count,
    created_at, updated_at
  ) values (
    p_coin_id, p_bucket_time,
    p_price, p_price, p_price, p_price,
    p_volume_base, p_volume_coin, 1,
    now(), now()
  )
  on conflict (coin_id, bucket_time) do update
  set high_price   = greatest(public.coin_candles_1m.high_price, excluded.high_price),
      low_price    = least(public.coin_candles_1m.low_price, excluded.low_price),
      close_price  = excluded.close_price,
      volume_base  = public.coin_candles_1m.volume_base + excluded.volume_base,
      volume_coin  = public.coin_candles_1m.volume_coin + excluded.volume_coin,
      trades_count = public.coin_candles_1m.trades_count + 1,
      updated_at   = now();
end;
$$;

-- =========================================================
-- FUNÇÃO: execute_order_fill (CLOB hard)
-- Move saldos, cria trade, fees, market_state e candle 1m.
-- =========================================================
create or replace function public.execute_order_fill(
  p_coin_id            uuid,
  p_buyer_wallet_id    uuid,
  p_seller_wallet_id   uuid,
  p_amount_coin        numeric,
  p_price              numeric,
  p_taker_order_id     uuid,
  p_maker_order_id     uuid
) returns public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_coin public.coins%rowtype;

  v_buyer_wallet  public.wallets%rowtype;
  v_seller_wallet public.wallets%rowtype;

  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0010; -- 0.10% hard CLOB
  v_fee_creator_rate  numeric := 0.0010; -- 0.10%

  v_amount_base numeric;
  v_fee_platform numeric;
  v_fee_creator  numeric;
  v_amount_base_net numeric;

  v_seller_balance numeric;

  v_trade public.trades%rowtype;

  v_bucket_time timestamptz := date_trunc('minute', now());
begin
  if p_amount_coin <= 0 then
    raise exception 'amount_coin must be > 0';
  end if;
  if p_price <= 0 then
    raise exception 'price must be > 0';
  end if;

  v_amount_base := round(p_amount_coin * p_price, 8);

  -- lock coin
  select * into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;
  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  -- lock wallets
  select * into v_buyer_wallet
  from public.wallets where id = p_buyer_wallet_id for update;

  select * into v_seller_wallet
  from public.wallets where id = p_seller_wallet_id for update;

  if v_buyer_wallet.balance_base < v_amount_base then
    raise exception 'insufficient base in buyer wallet';
  end if;

  select balance_available into v_seller_balance
  from public.wallet_balances
  where wallet_id = p_seller_wallet_id
    and coin_id   = p_coin_id
  for update;

  if not found or v_seller_balance < p_amount_coin then
    raise exception 'insufficient coin in seller wallet';
  end if;

  -- platform treasury
  select * into v_platform_wallet
  from public.wallets
  where wallet_type='PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator treasury / user wallet
  select w.* into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY','USER')
  order by case when w.wallet_type='CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin';
  end if;

  -- fees
  v_fee_platform := round(v_amount_base * v_fee_platform_rate, 8);
  v_fee_creator  := round(v_amount_base * v_fee_creator_rate, 8);
  v_amount_base_net := v_amount_base - v_fee_platform - v_fee_creator;

  if v_amount_base_net <= 0 then
    raise exception 'amount_base_net <= 0 after fees';
  end if;

  -- move base
  update public.wallets
  set balance_base = balance_base - v_amount_base,
      updated_at = now()
  where id = p_buyer_wallet_id;

  update public.wallets
  set balance_base = balance_base + v_amount_base_net,
      updated_at = now()
  where id = p_seller_wallet_id;

  update public.wallets
  set balance_base = balance_base + v_fee_platform,
      updated_at = now()
  where id = v_platform_wallet.id;

  update public.wallets
  set balance_base = balance_base + v_fee_creator,
      updated_at = now()
  where id = v_creator_wallet.id;

  -- move coin
  update public.wallet_balances
  set balance_available = balance_available - p_amount_coin,
      updated_at = now()
  where wallet_id = p_seller_wallet_id
    and coin_id   = p_coin_id;

  insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
  values (p_buyer_wallet_id, p_coin_id, p_amount_coin, 0, now())
  on conflict (wallet_id, coin_id) do update
    set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
        updated_at = now();

  -- trade row
  insert into public.trades (
    coin_id,
    buyer_wallet_id,
    seller_wallet_id,
    side, -- lado do taker (ordem iniciadora)
    amount_coin,
    amount_base,
    price_effective,
    fee_total_base,
    status,
    executed_at,
    created_at
  )
  values (
    p_coin_id,
    p_buyer_wallet_id,
    p_seller_wallet_id,
    (select side from public.orders where id = p_taker_order_id),
    p_amount_coin,
    v_amount_base,
    p_price,
    v_fee_platform + v_fee_creator,
    'EXECUTED',
    now(),
    now()
  )
  returning * into v_trade;

  -- fees ledger
  insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
  values
    (v_trade.id, 'PLATFORM', null, v_fee_platform),
    (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

  -- market_state: last price + volumes
  update public.coin_market_state
  set price_current   = p_price,
      volume_24h_base = volume_24h_base + v_amount_base,
      volume_24h_coin = volume_24h_coin + p_amount_coin,
      trades_24h      = trades_24h + 1,
      last_trade_at   = now(),
      updated_at      = now()
  where coin_id = p_coin_id;

  -- candle 1m
  perform public.upsert_candle_1m(
    p_coin_id,
    v_bucket_time,
    p_price,
    v_amount_base,
    p_amount_coin
  );

  return v_trade;
end;
$$;


do $$
begin
  -- tabela existe?
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'coin_candles_1m'
  ) then

    -- se NÃO tem bucket_time...
    if not exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'coin_candles_1m'
        and column_name = 'bucket_time'
    ) then

      -- tenta renomear bucket_date -> bucket_time
      if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'coin_candles_1m'
          and column_name = 'bucket_date'
      ) then
        alter table public.coin_candles_1m
          rename column bucket_date to bucket_time;

      -- tenta renomear bucket_ts -> bucket_time
      elsif exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'coin_candles_1m'
          and column_name = 'bucket_ts'
      ) then
        alter table public.coin_candles_1m
          rename column bucket_ts to bucket_time;

      else
        -- não achou coluna equivalente → cria bucket_time nova
        alter table public.coin_candles_1m
          add column bucket_time timestamptz;

        -- backfill: usa created_at como proxy (ajusta por minuto)
        update public.coin_candles_1m
        set bucket_time = date_trunc('minute', created_at)
        where bucket_time is null;

        -- agora vira not null
        alter table public.coin_candles_1m
          alter column bucket_time set not null;
      end if;
    end if;

    -- garante PK no padrão (coin_id, bucket_time)
    alter table public.coin_candles_1m
      drop constraint if exists coin_candles_1m_pkey;

    alter table public.coin_candles_1m
      add primary key (coin_id, bucket_time);

  else
    -- tabela não existe → cria do zero
    create table public.coin_candles_1m (
      coin_id      uuid not null references public.coins (id) on delete cascade,
      bucket_time  timestamptz not null, -- date_trunc('minute', ts)

      open_price   numeric(30,8) not null,
      high_price   numeric(30,8) not null,
      low_price    numeric(30,8) not null,
      close_price  numeric(30,8) not null,

      volume_base  numeric(30,8) not null default 0,
      volume_coin  numeric(30,8) not null default 0,
      trades_count integer not null default 0,

      created_at   timestamptz not null default now(),
      updated_at   timestamptz not null default now(),

      primary key (coin_id, bucket_time)
    );
  end if;
end$$;

-- índice no padrão hard
create index if not exists idx_coin_candles_1m_coin_time
  on public.coin_candles_1m (coin_id, bucket_time desc);



-- =========================================================
-- ENUMs de Orders / Fills (hard)
-- =========================================================
do $$
begin
  create type public.order_type as enum ('MARKET','LIMIT');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('OPEN','PARTIAL','FILLED','CANCELLED');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.fill_role as enum ('MAKER','TAKER');
exception when duplicate_object then null;
end $$;


-- =========================================================
-- ORDERS (Order Book)
-- BUY  => amount_base obrigatório
-- SELL => amount_coin obrigatório
-- LIMIT => price_limit obrigatório
-- MARKET => price_limit deve ser NULL (a função converte internamente)
-- =========================================================
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_wallet_id    uuid not null references public.wallets(id),
  coin_id           uuid not null references public.coins(id),

  side              trade_side not null,           -- BUY / SELL
  type              public.order_type not null default 'LIMIT',
  price_limit       numeric(30,8),                -- obrigatório em LIMIT

  amount_base       numeric(30,8),                -- BUY usa base total (inclui fees)
  amount_coin       numeric(30,8),                -- SELL usa coin

  filled_base_total numeric(30,8) not null default 0, -- total debita base do BUY
  filled_coin       numeric(30,8) not null default 0, -- total debita coin do SELL

  avg_price         numeric(30,8),
  status            public.order_status not null default 'OPEN',
  filled_trade_id   uuid references public.trades(id),

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- checks duras
  check (
    (side = 'BUY'  and amount_base is not null and amount_base > 0 and amount_coin is null)
    or
    (side = 'SELL' and amount_coin is not null and amount_coin > 0 and amount_base is null)
  ),
  check (
    (type = 'LIMIT' and price_limit is not null and price_limit > 0)
    or
    (type = 'MARKET' and price_limit is null)
  )
);

create index if not exists idx_orders_open_coin
  on public.orders (coin_id, status, created_at);

create index if not exists idx_orders_coin_side_price
  on public.orders (coin_id, side, price_limit, created_at);

create index if not exists idx_orders_wallet_time
  on public.orders (user_wallet_id, created_at desc);

-- =========================================================
-- ORDER_FILLS (cada trade pode preencher 2 ordens)
-- =========================================================
create table if not exists public.order_fills (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references public.orders(id) on delete cascade,
  trade_id      uuid not null references public.trades(id) on delete cascade,
  role          public.fill_role not null,
  price         numeric(30,8) not null,
  amount_coin   numeric(30,8) not null,
  amount_base   numeric(30,8) not null, -- BUY: base total; SELL: notional

  created_at    timestamptz not null default now()
);

create index if not exists idx_order_fills_order
  on public.order_fills (order_id, created_at desc);

create index if not exists idx_order_fills_trade
  on public.order_fills (trade_id);


-- =========================================================
-- CANDLES 1m (hard)
-- =========================================================
create table if not exists public.coin_candles_1m (
  coin_id      uuid not null references public.coins (id) on delete cascade,
  bucket_time  timestamptz not null, -- date_trunc('minute', ts)

  open_price   numeric(30,8) not null,
  high_price   numeric(30,8) not null,
  low_price    numeric(30,8) not null,
  close_price  numeric(30,8) not null,

  volume_base  numeric(30,8) not null default 0,
  volume_coin  numeric(30,8) not null default 0,
  trades_count integer not null default 0,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (coin_id, bucket_time)
);

create index if not exists idx_coin_candles_1m_coin_time
  on public.coin_candles_1m (coin_id, bucket_time desc);


-- =========================================================
-- RPC: upsert_candle_1m
-- =========================================================
create or replace function public.upsert_candle_1m(
  p_coin_id uuid,
  p_price numeric,
  p_volume_base numeric,
  p_volume_coin numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('minute', now());
begin
  insert into public.coin_candles_1m (
    coin_id, bucket_time,
    open_price, high_price, low_price, close_price,
    volume_base, volume_coin, trades_count,
    created_at, updated_at
  ) values (
    p_coin_id, v_bucket,
    p_price, p_price, p_price, p_price,
    p_volume_base, p_volume_coin, 1,
    now(), now()
  )
  on conflict (coin_id, bucket_time) do update
    set high_price   = greatest(public.coin_candles_1m.high_price, excluded.high_price),
        low_price    = least(public.coin_candles_1m.low_price, excluded.low_price),
        close_price  = excluded.close_price,
        volume_base  = public.coin_candles_1m.volume_base + excluded.volume_base,
        volume_coin  = public.coin_candles_1m.volume_coin + excluded.volume_coin,
        trades_count = public.coin_candles_1m.trades_count + 1,
        updated_at   = now();
end;
$$;

-- =========================================================
-- RPC: match_orderbook (hard)
-- - Cruza LIMIT BUY x LIMIT SELL
-- - Preço do maker (ordem mais antiga)
-- - Fee cobrada do BUY (base_total)
-- - Atualiza trades, order_fills, balances, market_state e candle 1m
-- =========================================================
create or replace function public.match_orderbook(
  p_coin_id uuid,
  p_max_matches int default 50
) returns setof public.trades
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buy  public.orders%rowtype;
  v_sell public.orders%rowtype;

  v_coin public.coins%rowtype;

  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;

  v_fee_platform_rate numeric := 0.0075;
  v_fee_creator_rate  numeric := 0.0025;
  v_fee_total_rate    numeric := 0.01;

  v_price numeric;
  v_coin_qty numeric;
  v_notional numeric;
  v_base_total numeric;
  v_fee_platform numeric;
  v_fee_creator numeric;

  v_trade public.trades%rowtype;
  v_matches int := 0;

  v_buy_base_rem numeric;
  v_buy_max_coin numeric;
  v_sell_coin_rem numeric;
begin
  select * into v_coin
  from public.coins
  where id = p_coin_id;

  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    raise exception 'coin must be ACTIVE to trade';
  end if;

  -- platform treasury wallet
  select *
  into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY','USER')
  order by case when w.wallet_type='CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  loop
    exit when v_matches >= p_max_matches;

    -- best BUY (maior preço, mais antigo)
    select * into v_buy
    from public.orders
    where coin_id = p_coin_id
      and status in ('OPEN','PARTIAL')
      and side = 'BUY'
      and type = 'LIMIT'
      and (amount_base - filled_base_total) > 0
    order by price_limit desc, created_at asc
    limit 1
    for update skip locked;

    if not found then exit; end if;

    -- best SELL (menor preço, mais antigo)
    select * into v_sell
    from public.orders
    where coin_id = p_coin_id
      and status in ('OPEN','PARTIAL')
      and side = 'SELL'
      and type = 'LIMIT'
      and (amount_coin - filled_coin) > 0
    order by price_limit asc, created_at asc
    limit 1
    for update skip locked;

    if not found then exit; end if;

    -- book não cruza
    if v_buy.price_limit < v_sell.price_limit then
      exit;
    end if;

    -- preço do maker = ordem mais antiga
    v_price := case
      when v_buy.created_at <= v_sell.created_at then v_buy.price_limit
      else v_sell.price_limit
    end;

    v_buy_base_rem := v_buy.amount_base - v_buy.filled_base_total;
    v_buy_max_coin := (v_buy_base_rem * (1 - v_fee_total_rate)) / v_price;

    v_sell_coin_rem := v_sell.amount_coin - v_sell.filled_coin;

    v_coin_qty := least(v_buy_max_coin, v_sell_coin_rem);
    v_coin_qty := round(v_coin_qty, 8);

    if v_coin_qty <= 0 then
      exit;
    end if;

    v_notional   := v_coin_qty * v_price;
    v_base_total := v_notional / (1 - v_fee_total_rate);

    v_fee_platform := round(v_base_total * v_fee_platform_rate, 8);
    v_fee_creator  := round(v_base_total * v_fee_creator_rate, 8);

    -- trava wallets
    perform 1 from public.wallets where id=v_buy.user_wallet_id for update;
    perform 1 from public.wallets where id=v_sell.user_wallet_id for update;

    -- checa saldo comprador
    if (select balance_base from public.wallets where id=v_buy.user_wallet_id) < v_base_total then
      raise exception 'insufficient base balance in buyer wallet';
    end if;

    -- checa saldo seller coin
    if coalesce(
      (select balance_available
       from public.wallet_balances
       where wallet_id=v_sell.user_wallet_id and coin_id=p_coin_id
       for update),
      0
    ) < v_coin_qty then
      raise exception 'insufficient coin balance in seller wallet';
    end if;

    -- base: buyer paga total, seller recebe notional, fees vão pra tesourarias
    update public.wallets
      set balance_base = balance_base - v_base_total,
          updated_at = now()
      where id = v_buy.user_wallet_id;

    update public.wallets
      set balance_base = balance_base + v_notional,
          updated_at = now()
      where id = v_sell.user_wallet_id;

    update public.wallets
      set balance_base = balance_base + v_fee_platform,
          updated_at = now()
      where id = v_platform_wallet.id;

    update public.wallets
      set balance_base = balance_base + v_fee_creator,
          updated_at = now()
      where id = v_creator_wallet.id;

    -- coin: seller -> buyer
    update public.wallet_balances
      set balance_available = balance_available - v_coin_qty,
          updated_at = now()
      where wallet_id=v_sell.user_wallet_id and coin_id=p_coin_id;

    insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
    values (v_buy.user_wallet_id, p_coin_id, v_coin_qty, 0, now())
    on conflict (wallet_id, coin_id) do update
      set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
          updated_at = now();

    -- trade
    insert into public.trades (
      coin_id,
      buyer_wallet_id,
      seller_wallet_id,
      side,
      amount_coin,
      amount_base,
      price_effective,
      fee_total_base,
      status,
      executed_at,
      created_at
    ) values (
      p_coin_id,
      v_buy.user_wallet_id,
      v_sell.user_wallet_id,
      'BUY',
      v_coin_qty,
      v_base_total,
      v_price,
      v_fee_platform + v_fee_creator,
      'EXECUTED',
      now(),
      now()
    )
    returning * into v_trade;

    -- fills
    insert into public.order_fills (order_id, trade_id, role, price, amount_coin, amount_base)
    values
      (v_buy.id,  v_trade.id, 'TAKER', v_price, v_coin_qty, v_base_total),
      (v_sell.id, v_trade.id, 'MAKER', v_price, v_coin_qty, v_notional);

    -- update BUY order
    update public.orders
      set filled_base_total = filled_base_total + v_base_total,
          avg_price = coalesce(
            ((avg_price * (filled_base_total)) + (v_price * v_base_total)) / nullif(filled_base_total + v_base_total,0),
            v_price
          ),
          status = case
            when filled_base_total + v_base_total >= amount_base then 'FILLED'
            else 'PARTIAL'
          end,
          filled_trade_id = case
            when filled_base_total + v_base_total >= amount_base then v_trade.id
            else filled_trade_id
          end,
          updated_at=now()
      where id=v_buy.id;

    -- update SELL order
    update public.orders
      set filled_coin = filled_coin + v_coin_qty,
          avg_price = coalesce(
            ((avg_price * (filled_coin)) + (v_price * v_coin_qty)) / nullif(filled_coin + v_coin_qty,0),
            v_price
          ),
          status = case
            when filled_coin + v_coin_qty >= amount_coin then 'FILLED'
            else 'PARTIAL'
          end,
          filled_trade_id = case
            when filled_coin + v_coin_qty >= amount_coin then v_trade.id
            else filled_trade_id
          end,
          updated_at=now()
      where id=v_sell.id;

    -- ticker / mercados (sem mexer em reserves do AMM)
    update public.coin_market_state
      set price_current   = v_price,
          volume_24h_base = volume_24h_base + v_notional,
          volume_24h_coin = volume_24h_coin + v_coin_qty,
          trades_24h      = trades_24h + 1,
          last_trade_at   = now(),
          updated_at      = now()
      where coin_id = p_coin_id;

    perform public.upsert_candle_1m(p_coin_id, v_price, v_notional, v_coin_qty);

    insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
    values
      (v_trade.id, 'PLATFORM', null, v_fee_platform),
      (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

    v_matches := v_matches + 1;
    return next v_trade;
  end loop;

  return;
end;
$$;

-- =========================================================
-- RPC: cancel_order
-- só cancela OPEN/PARTIAL
-- =========================================================
create or replace function public.cancel_order(
  p_order_id uuid,
  p_wallet_id uuid
) returns public.orders
language plpgsql
security definer
set search_path=public
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
    and user_wallet_id = p_wallet_id
  for update;

  if not found then
    raise exception 'order not found';
  end if;

  if v_order.status in ('FILLED','CANCELLED') then
    raise exception 'order already closed';
  end if;

  update public.orders
    set status='CANCELLED',
        updated_at=now()
  where id=p_order_id
  returning * into v_order;

  return v_order;
end;
$$;


-- =========================================================
-- PATCH HARD: adiciona colunas faltantes na orders existente
-- =========================================================

-- 1) garante que order_status tem PARTIAL (se já existe)
do $$
begin
  alter type public.order_status add value if not exists 'PARTIAL';
exception
  when undefined_object then
    -- se não existe, cria no padrão hard
    create type public.order_status as enum ('OPEN','PARTIAL','FILLED','CANCELLED');
end$$;

-- 2) adiciona colunas de fill/avg_price se faltarem
alter table public.orders
  add column if not exists filled_base_total numeric(30,8) not null default 0,
  add column if not exists filled_coin       numeric(30,8) not null default 0,
  add column if not exists avg_price         numeric(30,8);

-- 3) se sua coluna status estava com enum antigo, mantém,
-- mas garante default OPEN
alter table public.orders
  alter column status set default 'OPEN';

-- =========================================================
-- ORDERBOOK LEVELS (depth) - HARD
-- BUY qty_coin = (remaining_base_total * (1-fee_total)) / price
-- SELL qty_coin = remaining_coin
-- =========================================================
create or replace view public.orderbook_levels_view as
select
  coin_id,
  side,
  price_limit as price,
  case
    when side = 'BUY' then
      sum(
        (
          (amount_base - filled_base_total)
          * (1 - 0.01)    -- fee_total=1%
        ) / nullif(price_limit, 0)
      )
    else
      sum(amount_coin - filled_coin)
  end as qty_coin,
  count(*) as orders
from public.orders
where status in ('OPEN','PARTIAL')
  and type = 'LIMIT'
  and price_limit is not null
group by coin_id, side, price_limit;


--Cria a carteira da corretora para receber as comissões :-)
insert into public.wallets (
  wallet_type,
  label,
  provider,
  balance_base,
  is_active
) values (
  'PLATFORM_TREASURY',
  'Tesouraria da Plataforma',
  'INTERNAL',
  0,
  true
);

drop function if exists public.check_circuit_breaker(uuid, numeric, numeric);
drop function if exists public.check_circuit_breaker(uuid, numeric, numeric, uuid);

create or replace function public.check_circuit_breaker(
  p_coin_id       uuid,
  p_impact_pct    numeric,
  p_slippage_pct  numeric,
  p_trigger_trade uuid default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_market public.coin_market_state%rowtype;
  v_reason text;
begin
  select * into v_market
  from public.coin_market_state
  where coin_id = p_coin_id
  for update;

  if not found then
    raise exception 'coin_market_state not found for coin %', p_coin_id;
  end if;

  if v_market.is_halted
     and v_market.halted_until is not null
     and v_market.halted_until > now() then
    raise exception 'market halted until % (reason: %)',
      v_market.halted_until,
      coalesce(v_market.halt_reason,'UNKNOWN');
  end if;

  v_reason := null;

  if p_impact_pct >= v_market.max_impact_pct then
    v_reason := 'IMPACT_BREAKER';
  elsif p_slippage_pct >= v_market.max_slippage_pct then
    v_reason := 'SLIPPAGE_BREAKER';
  end if;

  if v_reason is not null then
    perform public.pause_trading(
      p_coin_id,
      v_reason,
      null,
      p_impact_pct,
      p_slippage_pct,
      p_trigger_trade
    );

    raise exception 'circuit breaker triggered (%): impact=% slippage=%',
      v_reason, p_impact_pct, p_slippage_pct;
  end if;
end;
$$;



drop view if exists public.orderbook_levels_view cascade;

drop function if exists public.match_orders(uuid, int) cascade;
drop function if exists public.place_order(uuid, uuid, trade_side, order_type, numeric, numeric, numeric) cascade;
drop function if exists public.upsert_candle_1m(uuid, numeric, numeric, numeric, timestamptz) cascade;

drop table if exists public.order_fills cascade;
drop table if exists public.orders cascade;
drop table if exists public.coin_candles_1m cascade;

-- =========================================================
-- HARD MODE V1: ORDERS + FILLS + BOOK + CANDLES 1m + MATCHING
-- =========================================================

-- ---------------------------
-- TYPES (Postgres não tem CREATE TYPE IF NOT EXISTS)
-- ---------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'order_type') then
    create type public.order_type as enum ('MARKET','LIMIT');
  end if;

  if not exists (select 1 from pg_type where typname = 'order_status') then
    create type public.order_status as enum ('OPEN','PARTIAL','FILLED','CANCELLED');
  else
    if not exists (
      select 1
      from pg_enum e
      join pg_type t on t.oid = e.enumtypid
      where t.typname = 'order_status' and e.enumlabel = 'PARTIAL'
    ) then
      alter type public.order_status add value 'PARTIAL';
    end if;
  end if;
end $$;

-- ---------------------------
-- ORDERS
-- ---------------------------
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_wallet_id    uuid not null references public.wallets(id),
  coin_id           uuid not null references public.coins(id),
  side              trade_side not null,                 -- BUY / SELL (do usuário)
  type              order_type not null default 'LIMIT', -- MARKET / LIMIT
  price_limit       numeric(30,8),                       -- obrigatório no LIMIT
  amount_base       numeric(30,8),                       -- BUY usa base
  amount_coin       numeric(30,8),                       -- SELL usa coin

  filled_base_total numeric(30,8) not null default 0,
  filled_coin_total numeric(30,8) not null default 0,

  status            order_status not null default 'OPEN',
  meta              jsonb not null default '{}'::jsonb,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- constraints (quando já existe, não quebra)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'orders_limit_requires_price') then
    alter table public.orders
      add constraint orders_limit_requires_price
      check (type <> 'LIMIT' or price_limit is not null);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_buy_requires_base') then
    alter table public.orders
      add constraint orders_buy_requires_base
      check (
        (side <> 'BUY') or (amount_base is not null and amount_base > 0)
      );
  end if;

  if not exists (select 1 from pg_constraint where conname = 'orders_sell_requires_coin') then
    alter table public.orders
      add constraint orders_sell_requires_coin
      check (
        (side <> 'SELL') or (amount_coin is not null and amount_coin > 0)
      );
  end if;
end $$;

create index if not exists idx_orders_open_coin_side_price
  on public.orders (coin_id, side, status, price_limit, created_at);

create index if not exists idx_orders_wallet_time
  on public.orders (user_wallet_id, created_at desc);

-- ---------------------------
-- FILLS (cada match parcial vira um fill)
-- ---------------------------
create table if not exists public.order_fills (
  id              uuid primary key default gen_random_uuid(),
  coin_id         uuid not null references public.coins(id) on delete cascade,
  maker_order_id  uuid not null references public.orders(id) on delete cascade,
  taker_order_id  uuid not null references public.orders(id) on delete cascade,
  trade_id        uuid not null references public.trades(id) on delete cascade,

  price           numeric(30,8) not null,
  amount_coin     numeric(30,8) not null,
  amount_base     numeric(30,8) not null,

  created_at      timestamptz not null default now()
);

create index if not exists idx_order_fills_coin_time
  on public.order_fills (coin_id, created_at desc);

-- ---------------------------
-- CANDLES 1m (garante coluna bucket_time)
-- ---------------------------
create table if not exists public.coin_candles_1m (
  coin_id      uuid not null references public.coins (id) on delete cascade,
  bucket_time  timestamptz not null, -- date_trunc('minute', ts)

  open_price   numeric(30,8) not null,
  high_price   numeric(30,8) not null,
  low_price    numeric(30,8) not null,
  close_price  numeric(30,8) not null,

  volume_base  numeric(30,8) not null default 0,
  volume_coin  numeric(30,8) not null default 0,
  trades_count integer not null default 0,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  primary key (coin_id, bucket_time)
);

drop index if exists public.idx_coin_candles_1m_coin_time;
create index if not exists idx_coin_candles_1m_coin_time
  on public.coin_candles_1m (coin_id, bucket_time desc);

-- ---------------------------
-- UPSERT candle 1m por trade/fill
-- ---------------------------
create or replace function public.upsert_candle_1m(
  p_coin_id      uuid,
  p_price        numeric,
  p_amount_base  numeric,
  p_amount_coin  numeric,
  p_ts           timestamptz default now()
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bucket timestamptz := date_trunc('minute', p_ts);
begin
  insert into public.coin_candles_1m (
    coin_id, bucket_time,
    open_price, high_price, low_price, close_price,
    volume_base, volume_coin, trades_count,
    created_at, updated_at
  ) values (
    p_coin_id, v_bucket,
    p_price, p_price, p_price, p_price,
    p_amount_base, p_amount_coin, 1,
    now(), now()
  )
  on conflict (coin_id, bucket_time) do update
    set high_price   = greatest(public.coin_candles_1m.high_price, excluded.high_price),
        low_price    = least(public.coin_candles_1m.low_price, excluded.low_price),
        close_price  = excluded.close_price,
        volume_base  = public.coin_candles_1m.volume_base + excluded.volume_base,
        volume_coin  = public.coin_candles_1m.volume_coin + excluded.volume_coin,
        trades_count = public.coin_candles_1m.trades_count + 1,
        updated_at   = now();
end;
$$;

-- ---------------------------
-- ORDERBOOK LEVELS VIEW (corrigida)
-- BUY qty em coin = base restante líquido / price
-- SELL qty em coin = coin restante
-- ---------------------------
create or replace view public.orderbook_levels_view as
select
  coin_id,
  side,
  price_limit as price,
  case
    when side = 'BUY' then
      sum( ((amount_base - filled_base_total) * (1 - (0.0075 + 0.0025))) / price_limit )
    else
      sum( amount_coin - filled_coin_total )
  end as qty_coin,
  count(*) as orders
from public.orders
where status in ('OPEN','PARTIAL')
  and type = 'LIMIT'
group by coin_id, side, price_limit;

-- ---------------------------
-- PLACE_ORDER (LIMIT entra no book; MARKET continua no AMM no edge)
-- ---------------------------
create or replace function public.place_order(
  p_user_wallet_id uuid,
  p_coin_id        uuid,
  p_side           trade_side,
  p_type           order_type,
  p_price_limit    numeric default null,
  p_amount_base    numeric default null,
  p_amount_coin    numeric default null
) returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
begin
  -- lock leve por moeda pra evitar corrida book/matcher
  perform pg_advisory_xact_lock(hashtext(p_coin_id::text));

  insert into public.orders (
    user_wallet_id, coin_id, side, type, price_limit, amount_base, amount_coin
  ) values (
    p_user_wallet_id, p_coin_id, p_side, p_type, p_price_limit, p_amount_base, p_amount_coin
  )
  returning * into v_order;

  -- tenta casar imediatamente se for LIMIT
  if p_type = 'LIMIT' then
    perform public.match_orders(p_coin_id, 25);
  end if;

  return v_order;
end;
$$;

-- ---------------------------
-- MATCH_ORDERS (engine HARD, lote curto)
-- - SKIP LOCKED evita deadlock
-- - advisory lock por moeda evita 2 matchers simultâneos
-- ---------------------------
create or replace function public.match_orders(
  p_coin_id   uuid,
  p_max_fills int default 50
) returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fills int := 0;

  v_bid public.orders%rowtype;
  v_ask public.orders%rowtype;

  v_price numeric;
  v_coin_qty numeric;
  v_base_qty numeric;

  v_buyer_wallet public.wallets%rowtype;
  v_seller_wallet public.wallets%rowtype;

  v_platform_wallet public.wallets%rowtype;
  v_creator_wallet  public.wallets%rowtype;
  v_coin public.coins%rowtype;

  v_fee_platform_rate numeric := 0.0075;
  v_fee_creator_rate  numeric := 0.0025;
  v_fee_platform numeric;
  v_fee_creator  numeric;

  v_trade public.trades%rowtype;

  v_seller_coin_balance numeric;
begin
  perform pg_advisory_xact_lock(hashtext(p_coin_id::text));

  select * into v_coin from public.coins where id = p_coin_id;
  if not found then
    raise exception 'coin not found';
  end if;

  if v_coin.status <> 'ACTIVE' then
    return 0;
  end if;

  -- platform treasury wallet
  select * into v_platform_wallet
  from public.wallets
  where wallet_type = 'PLATFORM_TREASURY'
    and is_active
  order by created_at
  limit 1
  for update;

  if not found then
    raise exception 'platform treasury wallet not configured';
  end if;

  -- creator wallet (mesma lógica do swap)
  select w.*
  into v_creator_wallet
  from public.wallets w
  join public.users u on u.id = w.user_id
  join public.creators c on c.user_id = u.id
  where c.id = v_coin.creator_id
    and w.is_active
    and w.wallet_type in ('CREATOR_TREASURY','USER')
  order by case when w.wallet_type = 'CREATOR_TREASURY' then 0 else 1 end,
           w.created_at
  limit 1
  for update;

  if not found then
    raise exception 'creator wallet not found for coin %', p_coin_id;
  end if;

  loop
    exit when v_fills >= p_max_fills;

    -- melhor BID
    select * into v_bid
    from public.orders
    where coin_id = p_coin_id
      and side = 'BUY'
      and type = 'LIMIT'
      and status in ('OPEN','PARTIAL')
    order by price_limit desc, created_at asc
    limit 1
    for update skip locked;

    -- melhor ASK
    select * into v_ask
    from public.orders
    where coin_id = p_coin_id
      and side = 'SELL'
      and type = 'LIMIT'
      and status in ('OPEN','PARTIAL')
    order by price_limit asc, created_at asc
    limit 1
    for update skip locked;

    if v_bid.id is null or v_ask.id is null then
      exit;
    end if;

    -- spread não cruzou
    if v_bid.price_limit < v_ask.price_limit then
      exit;
    end if;

    -- preço por prioridade de tempo: ASK define
    v_price := v_ask.price_limit;

    -- restantes
    v_base_qty := greatest(0, v_bid.amount_base - v_bid.filled_base_total);
    v_coin_qty := greatest(0, v_ask.amount_coin - v_ask.filled_coin_total);

    if v_base_qty <= 0 then
      update public.orders set status='FILLED', updated_at=now() where id=v_bid.id;
      continue;
    end if;

    if v_coin_qty <= 0 then
      update public.orders set status='FILLED', updated_at=now() where id=v_ask.id;
      continue;
    end if;

    -- capacidade de coin que o BUY consegue levar considerando fees
    v_coin_qty := least(
      v_coin_qty,
      (v_base_qty * (1 - (v_fee_platform_rate + v_fee_creator_rate))) / v_price
    );

    if v_coin_qty <= 0 then
      exit;
    end if;

    v_base_qty := v_coin_qty * v_price; -- base gross

    -- lock wallets
    select * into v_buyer_wallet from public.wallets where id=v_bid.user_wallet_id for update;
    select * into v_seller_wallet from public.wallets where id=v_ask.user_wallet_id for update;

    if v_buyer_wallet.balance_base < v_base_qty then
      update public.orders
        set status='CANCELLED',
            updated_at=now(),
            meta = meta || jsonb_build_object('cancel_reason','INSUFFICIENT_BASE')
      where id=v_bid.id;
      continue;
    end if;

    select balance_available
    into v_seller_coin_balance
    from public.wallet_balances
    where wallet_id=v_seller_wallet.id
      and coin_id=p_coin_id
    for update;

    if v_seller_coin_balance is null or v_seller_coin_balance < v_coin_qty then
      update public.orders
        set status='CANCELLED',
            updated_at=now(),
            meta = meta || jsonb_build_object('cancel_reason','INSUFFICIENT_COIN')
      where id=v_ask.id;
      continue;
    end if;

    -- fees
    v_fee_platform := round(v_base_qty * v_fee_platform_rate, 8);
    v_fee_creator  := round(v_base_qty * v_fee_creator_rate, 8);

    -- base transfers
    update public.wallets
      set balance_base = balance_base - v_base_qty, updated_at=now()
    where id=v_buyer_wallet.id;

    update public.wallets
      set balance_base = balance_base + (v_base_qty - v_fee_platform - v_fee_creator),
          updated_at=now()
    where id=v_seller_wallet.id;

    update public.wallets
      set balance_base = balance_base + v_fee_platform, updated_at=now()
    where id=v_platform_wallet.id;

    update public.wallets
      set balance_base = balance_base + v_fee_creator, updated_at=now()
    where id=v_creator_wallet.id;

    -- coin transfers
    update public.wallet_balances
      set balance_available = balance_available - v_coin_qty, updated_at=now()
    where wallet_id=v_seller_wallet.id and coin_id=p_coin_id;

    insert into public.wallet_balances (wallet_id, coin_id, balance_available, balance_locked, updated_at)
    values (v_buyer_wallet.id, p_coin_id, v_coin_qty, 0, now())
    on conflict (wallet_id, coin_id) do update
      set balance_available = public.wallet_balances.balance_available + excluded.balance_available,
          updated_at=now();

    -- trade P2P
    insert into public.trades (
      coin_id,
      buyer_wallet_id,
      seller_wallet_id,
      side,
      amount_coin,
      amount_base,
      price_effective,
      fee_total_base,
      status,
      executed_at,
      created_at
    ) values (
      p_coin_id,
      v_buyer_wallet.id,
      v_seller_wallet.id,
      'BUY',
      v_coin_qty,
      v_base_qty,
      v_price,
      v_fee_platform + v_fee_creator,
      'EXECUTED',
      now(),
      now()
    )
    returning * into v_trade;

    insert into public.trade_fees (trade_id, kind, target_user_id, amount_base)
    values
      (v_trade.id, 'PLATFORM', null, v_fee_platform),
      (v_trade.id, 'CREATOR',  v_creator_wallet.user_id, v_fee_creator);

    insert into public.order_fills (
      coin_id, maker_order_id, taker_order_id, trade_id,
      price, amount_coin, amount_base
    ) values (
      p_coin_id, v_ask.id, v_bid.id, v_trade.id,
      v_price, v_coin_qty, v_base_qty
    );

    -- atualiza ordens
    update public.orders
      set filled_base_total = filled_base_total + v_base_qty,
          status = case
            when (amount_base - (filled_base_total + v_base_qty)) <= 0 then 'FILLED'
            else 'PARTIAL'
          end,
          updated_at=now()
    where id=v_bid.id;

    update public.orders
      set filled_coin_total = filled_coin_total + v_coin_qty,
          status = case
            when (amount_coin - (filled_coin_total + v_coin_qty)) <= 0 then 'FILLED'
            else 'PARTIAL'
          end,
          updated_at=now()
    where id=v_ask.id;

    -- market state segue last trade (não mexe em reservas AMM)
    update public.coin_market_state
      set price_current   = v_price,
          volume_24h_base = volume_24h_base + v_base_qty,
          volume_24h_coin = volume_24h_coin + v_coin_qty,
          trades_24h      = trades_24h + 1,
          last_trade_at   = now(),
          updated_at      = now()
    where coin_id=p_coin_id;

    perform public.upsert_candle_1m(p_coin_id, v_price, v_base_qty, v_coin_qty, now());

    v_fills := v_fills + 1;
  end loop;

  return v_fills;
end;
$$;

