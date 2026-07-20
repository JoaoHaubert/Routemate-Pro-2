-- FleetCost schema. Run this once in the Supabase SQL editor
-- (Project → SQL Editor → New query → paste → Run).
--
-- Multi-tenant model: every row carries owner_id, the tenant key.
-- For an admin, owner_id = their own auth.uid(). For a driver, owner_id
-- = the admin's id they joined via a fleet code. profiles.role decides
-- what a user is. current_owner_id()/app_role() are SECURITY
-- DEFINER helpers so RLS policies can look itself up without recursive
-- policy evaluation.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  owner_id uuid not null,
  role text not null check (role in ('admin', 'driver')),
  full_name text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.settings (
  owner_id uuid primary key,
  company_name text not null default 'My Fleet',
  currency text not null default 'EUR',
  default_useful_life_years numeric not null default 7,
  default_residual_pct numeric not null default 35,
  fleet_code text not null unique
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  color text not null
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  type text not null default 'car',
  make text not null,
  model text not null,
  year int,
  plate text,
  purchase_date date,
  purchase_price numeric not null default 0,
  residual_value numeric not null default 0,
  useful_life_years numeric not null default 7,
  annual_insurance numeric not null default 0,
  annual_tax numeric not null default 0,
  initial_odometer numeric not null default 0,
  current_odometer numeric not null default 0,
  status text not null default 'in_service',
  group_id uuid references public.groups (id) on delete set null,
  last_odometer_update_at timestamptz,
  last_odometer_update_value numeric,
  created_at timestamptz not null default now()
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  user_id uuid unique references auth.users (id) on delete set null,
  full_name text not null,
  license_no text,
  phone text,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.cost_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  driver_id uuid references public.drivers (id) on delete set null,
  date date not null,
  odometer numeric,
  category text not null default 'other',
  amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index vehicles_owner_id_idx on public.vehicles (owner_id);
create index groups_owner_id_idx on public.groups (owner_id);
create index drivers_owner_id_idx on public.drivers (owner_id);
create index drivers_user_id_idx on public.drivers (user_id);
create index cost_logs_owner_id_idx on public.cost_logs (owner_id);
create index cost_logs_vehicle_id_idx on public.cost_logs (vehicle_id);

-- ---------------------------------------------------------------------
-- Helpers (SECURITY DEFINER so they bypass RLS on profiles internally
-- and don't trigger recursive-policy evaluation)
-- ---------------------------------------------------------------------

create or replace function public.current_owner_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select owner_id from public.profiles where id = auth.uid()
$$;

create or replace function public.app_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_driver_vehicle_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select vehicle_id from public.drivers where user_id = auth.uid()
$$;

-- Called right after supabase.auth.signUp() for a fleet owner. Creates
-- their profile (owner_id = their own id) plus a settings row with a
-- fresh fleet code to hand out to drivers.
create or replace function public.bootstrap_admin(p_company_name text default 'My Fleet')
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
begin
  insert into public.profiles (id, owner_id, role)
  values (auth.uid(), auth.uid(), 'admin')
  on conflict (id) do nothing;

  insert into public.settings (owner_id, company_name, fleet_code)
  values (auth.uid(), p_company_name, v_code)
  on conflict (owner_id) do nothing;
end;
$$;

grant execute on function public.bootstrap_admin(text) to authenticated;

-- Called right after supabase.auth.signUp() for a driver. Resolves the
-- fleet code to a tenant, creates the driver's profile + drivers row.
create or replace function public.join_fleet(p_fleet_code text, p_full_name text, p_phone text default null)
returns table (owner_id uuid, driver_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id uuid;
  v_driver_id uuid;
begin
  select settings.owner_id into v_owner_id from public.settings where fleet_code = upper(p_fleet_code);
  if v_owner_id is null then
    raise exception 'Invalid fleet code';
  end if;

  insert into public.profiles (id, owner_id, role, full_name, phone)
  values (auth.uid(), v_owner_id, 'driver', p_full_name, p_phone)
  on conflict (id) do update set owner_id = excluded.owner_id, role = 'driver';

  insert into public.drivers (owner_id, user_id, full_name, phone)
  values (v_owner_id, auth.uid(), p_full_name, p_phone)
  on conflict (user_id) do update set full_name = excluded.full_name, phone = excluded.phone
  returning id into v_driver_id;

  return query select v_owner_id, v_driver_id;
end;
$$;

grant execute on function public.join_fleet(text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.groups enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.cost_logs enable row level security;

-- profiles: see your own row, or every row in your tenant if you're the admin
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or owner_id = current_owner_id());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or (app_role() = 'admin' and owner_id = current_owner_id()));

-- settings: whole tenant can read (drivers need the default cost
-- assumptions for onboarding); only the admin can write
create policy settings_select on public.settings for select
  using (owner_id = current_owner_id());
create policy settings_write on public.settings for update
  using (app_role() = 'admin' and owner_id = current_owner_id());

-- groups: whole tenant can read; only the admin writes
create policy groups_select on public.groups for select
  using (owner_id = current_owner_id());
create policy groups_write on public.groups for all
  using (app_role() = 'admin' and owner_id = current_owner_id())
  with check (app_role() = 'admin' and owner_id = current_owner_id());

-- vehicles: admin has full tenant access; a driver can only see/update
-- the single vehicle assigned to them, and can insert a new vehicle
-- for themselves during onboarding
create policy vehicles_admin_all on public.vehicles for all
  using (app_role() = 'admin' and owner_id = current_owner_id())
  with check (app_role() = 'admin' and owner_id = current_owner_id());
create policy vehicles_driver_select on public.vehicles for select
  using (app_role() = 'driver' and id = current_driver_vehicle_id());
create policy vehicles_driver_update on public.vehicles for update
  using (app_role() = 'driver' and id = current_driver_vehicle_id());
create policy vehicles_driver_insert on public.vehicles for insert
  with check (app_role() = 'driver' and owner_id = current_owner_id());

-- drivers: admin has full tenant access; a driver can see/update their
-- own row only (to link vehicle_id after onboarding)
create policy drivers_admin_all on public.drivers for all
  using (app_role() = 'admin' and owner_id = current_owner_id())
  with check (app_role() = 'admin' and owner_id = current_owner_id());
create policy drivers_self_select on public.drivers for select
  using (user_id = auth.uid());
create policy drivers_self_update on public.drivers for update
  using (user_id = auth.uid());

-- cost_logs: admin has full tenant access; a driver can insert/read
-- only entries for their own assigned vehicle
create policy cost_logs_admin_all on public.cost_logs for all
  using (app_role() = 'admin' and owner_id = current_owner_id())
  with check (app_role() = 'admin' and owner_id = current_owner_id());
create policy cost_logs_driver_select on public.cost_logs for select
  using (app_role() = 'driver' and vehicle_id = current_driver_vehicle_id());
create policy cost_logs_driver_insert on public.cost_logs for insert
  with check (app_role() = 'driver' and vehicle_id = current_driver_vehicle_id() and owner_id = current_owner_id());
