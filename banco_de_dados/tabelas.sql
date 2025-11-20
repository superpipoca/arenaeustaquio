-- 3ustaquio – Schema V1 + AMM V1 (CORRIGIDO)
-- Ordem ajustada: coins vem antes de wallet_balances

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
