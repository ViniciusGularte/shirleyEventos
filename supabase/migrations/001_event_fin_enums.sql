create extension if not exists citext;
create extension if not exists pgcrypto;

do $$ begin
  create type event_fin_system_role as enum ('student', 'platform_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_member_role as enum ('owner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_workspace_status as enum ('active', 'grace', 'suspended', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_event_status as enum ('scheduled', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_wallet_type as enum ('cash', 'bank', 'digital', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_payment_method as enum ('pix', 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_fin_invite_status as enum ('pending', 'accepted', 'expired', 'cancelled');
exception when duplicate_object then null; end $$;
