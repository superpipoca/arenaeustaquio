-- 3ustaquio – Schema V1 + AMM V1
-- Pensado para Postgres / Supabase

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
-- WALLETS & BALANCES
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

create table if not exists public.wallet_balances (
  wallet_id         uuid not null references public.wallets (id) on delete cascade,
  coin_id           uuid not null references public.coins (id) on delete cascade,
  balance_available numeric(30, 8) not null default 0,
  balance_locked    numeric(30, 8) not null default 0,
  updated_at        timestamptz not null default now(),
  primary key (wallet_id, coin_id)
);

-- o índice por coin é útil para ver quem segura determinada moeda
create index if not exists idx_wallet_balances_coin_id on public.wallet_balances (coin_id);

-- =========================================================
-- COINS / TYPES / COLLATERAL
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
-- FUNÇÃO: swap_buy (usuário compra token da pool AMM)
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

  -- =========================
  -- Atualização de saldos
  -- =========================

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

  -- =========================
  -- Atualiza estado de mercado
  -- =========================

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

  -- =========================
  -- Registra trade + fees
  -- =========================

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
-- FUNÇÃO: swap_sell (usuário vende token para a pool AMM)
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

  -- =========================
  -- Atualização de saldos
  -- =========================

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

  -- =========================
  -- Atualiza estado de mercado
  -- =========================

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

  -- =========================
  -- Registra trade + fees
  -- =========================

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
