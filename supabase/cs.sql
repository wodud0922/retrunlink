-- =====================================================================
-- 리턴링크 CS 센터: 주문 조회(입금·발송 예정일·송장) + 1:1 문의
-- Supabase → SQL Editor → New query 에 전체를 붙여 넣고 Run 하세요.
-- schema.sql 을 실행한 뒤에 실행해 주세요. 여러 번 실행해도 괜찮아요.
-- =====================================================================

-- 1) 주문·송장 (사장님이 엑셀로 올리거나 직접 넣어요)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  phone4 text not null check (phone4 ~ '^[0-9]{4}$'),
  item text not null default '' check (char_length(item) <= 200),
  courier text not null default '' check (char_length(courier) <= 30),
  invoice text not null default '' check (char_length(invoice) <= 40),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
-- 입금 확인 · 발송 예정일 (예전에 cs.sql 을 실행했어도 다시 실행하면 칸이 추가돼요)
alter table public.orders add column if not exists paid boolean not null default false;
alter table public.orders add column if not exists ship_date date;

create index if not exists orders_lookup_idx on public.orders (shop_id, name, phone4);
create index if not exists orders_shop_idx on public.orders (shop_id, created_at desc);
alter table public.orders enable row level security;

drop policy if exists "orders owner" on public.orders;
create policy "orders owner" on public.orders
  for all to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- 2) 1:1 문의
create table if not exists public.asks (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  phone4 text not null check (phone4 ~ '^[0-9]{4}$'),
  message text not null check (char_length(message) between 1 and 500),
  answer text not null default '' check (char_length(answer) <= 1000),
  answered_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists asks_shop_idx on public.asks (shop_id, created_at desc);
alter table public.asks enable row level security;

drop policy if exists "asks owner" on public.asks;
create policy "asks owner" on public.asks
  for all to authenticated
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- 3) 손님: 내 주문·송장 조회 (이름 + 전화번호 뒤 4자리)
create or replace function public.lookup_orders(p_handle text, p_name text, p_phone4 text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid;
begin
  select id into v_shop from public.shops where handle = lower(trim(p_handle));
  if v_shop is null or coalesce(p_phone4, '') !~ '^[0-9]{4}$' then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(o order by o.created_at desc)
    from (
      select id, item, courier, invoice, paid, ship_date, sent_at, created_at
      from public.orders
      where shop_id = v_shop
        and replace(name, ' ', '') = replace(trim(p_name), ' ', '')
        and phone4 = p_phone4
      order by created_at desc
      limit 20
    ) o
  ), '[]'::json);
end;
$$;

-- 4) 손님: 1:1 문의 남기기 (같은 사람 하루 5개, 마켓당 하루 300개까지)
create or replace function public.submit_ask(p_handle text, p_name text, p_phone4 text, p_message text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid;
  v_name text := left(trim(coalesce(p_name, '')), 40);
  v_msg text := btrim(coalesce(p_message, ''));
begin
  select id into v_shop from public.shops where handle = lower(trim(p_handle));
  if v_shop is null then raise exception 'no shop'; end if;
  if char_length(v_name) = 0 or coalesce(p_phone4, '') !~ '^[0-9]{4}$' then raise exception 'invalid'; end if;
  if char_length(v_msg) = 0 or char_length(v_msg) > 500 then raise exception 'invalid'; end if;
  if (select count(*) from public.asks where shop_id = v_shop and name = v_name and phone4 = p_phone4
      and created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many';
  end if;
  if (select count(*) from public.asks where shop_id = v_shop and created_at > now() - interval '1 day') >= 300 then
    raise exception 'too many';
  end if;
  insert into public.asks (shop_id, name, phone4, message) values (v_shop, v_name, p_phone4, v_msg);
  return true;
end;
$$;

-- 5) 손님: 내 문의와 답변 보기
create or replace function public.lookup_asks(p_handle text, p_name text, p_phone4 text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop uuid;
begin
  select id into v_shop from public.shops where handle = lower(trim(p_handle));
  if v_shop is null or coalesce(p_phone4, '') !~ '^[0-9]{4}$' then
    return '[]'::json;
  end if;
  return coalesce((
    select json_agg(a order by a.created_at desc)
    from (
      select id, message, answer, answered_at, created_at
      from public.asks
      where shop_id = v_shop and name = left(trim(p_name), 40) and phone4 = p_phone4
      order by created_at desc
      limit 20
    ) a
  ), '[]'::json);
end;
$$;

revoke all on function public.lookup_orders(text, text, text) from public;
revoke all on function public.submit_ask(text, text, text, text) from public;
revoke all on function public.lookup_asks(text, text, text) from public;
grant execute on function public.lookup_orders(text, text, text) to anon, authenticated;
grant execute on function public.submit_ask(text, text, text, text) to anon, authenticated;
grant execute on function public.lookup_asks(text, text, text) to anon, authenticated;

-- 6) 새 문의가 사장님 화면에 바로 뜨게 (실시간)
do $$
begin
  alter publication supabase_realtime add table public.asks;
exception when duplicate_object then null;
end $$;
