-- =====================================================================
-- 리턴링크 운영실 (/ops) 설정
-- Supabase → SQL Editor → New query 에 전체를 붙여 넣고 Run 하세요.
-- 여러 번 실행해도 괜찮아요.
--
-- 맨 아래 11) 에서 "가장 먼저 가입한 마켓의 주인"을 운영자로 자동 등록해요.
-- (사장님 1호 = 나) 다른 계정을 운영자로 넣고 싶으면 11) 아래 예시를 쓰세요.
-- =====================================================================

-- 1) 요금제·결제일 칸 (지금은 모두 무료)
alter table public.shops add column if not exists plan text not null default 'free';
alter table public.shops add column if not exists paid_until timestamptz;

-- 2) 운영자 명단 (아무도 직접 못 읽어요. 아래 함수로만 확인해요)
create table if not exists public.ops_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.ops_admins enable row level security;
revoke all on table public.ops_admins from anon, authenticated;

-- 3) 사이트 방문 수 (날짜·페이지별)
create table if not exists public.site_daily (
  day date not null,
  kind text not null,
  count int not null default 0,
  primary key (day, kind)
);
alter table public.site_daily enable row level security;
revoke all on table public.site_daily from anon, authenticated;

-- 4) 방문 1번 올리기 (소개 페이지 / 가입 페이지 / 손님 접수 화면)
create or replace function public.bump_site(p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_kind not in ('landing', 'start', 'shop') then
    return;
  end if;
  insert into public.site_daily (day, kind, count)
  values ((now() at time zone 'Asia/Seoul')::date, p_kind, 1)
  on conflict (day, kind) do update set count = public.site_daily.count + 1;
end;
$$;

-- 5) 마켓별 통계에 '손님 방문(view)'도 세요
create or replace function public.bump_metric(p_handle text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day text := to_char(now() at time zone 'Asia/Seoul', 'YYYY.MM.DD');
begin
  if p_kind not in ('track', 'lookup', 'view') then
    return;
  end if;
  update public.shops
     set metrics = jsonb_set(
           metrics,
           array[v_day],
           coalesce(metrics -> v_day, '{}'::jsonb)
             || jsonb_build_object(p_kind, coalesce((metrics -> v_day ->> p_kind)::int, 0) + 1)
         )
   where handle = lower(trim(p_handle));
end;
$$;

-- 6) 'ops' 주소는 사장님이 못 쓰게 막아요
create or replace function public.handle_available(p_handle text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select lower(trim(p_handle)) ~ '^[a-z0-9._]{3,20}$'
     and lower(trim(p_handle)) not in ('admin', 'start', 'signup', 'login', 'returnlink', 'help', 'api', 'ops')
     and not exists (select 1 from public.shops where handle = lower(trim(p_handle)));
$$;

-- 7) 내가 운영자인지
create or replace function public.is_ops()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.ops_admins where user_id = auth.uid());
$$;

-- 8) 운영실 데이터 한 번에 가져오기 (운영자만)
create or replace function public.ops_overview()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_week text := to_char((now() at time zone 'Asia/Seoul') - interval '6 days', 'YYYY.MM.DD');
  v_today text := to_char(now() at time zone 'Asia/Seoul', 'YYYY.MM.DD');
begin
  if not public.is_ops() then
    raise exception 'forbidden';
  end if;

  return jsonb_build_object(
    'now', now(),
    'shops', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb)
      from (
        select
          s.id,
          s.handle,
          s.settings ->> 'marketName' as market,
          s.created_at,
          s.plan,
          s.paid_until,
          u.last_sign_in_at,
          (select count(*) from public.requests r where r.shop_id = s.id) as req_total,
          (select count(*) from public.requests r
            where r.shop_id = s.id and r.created_at > now() - interval '7 days') as req_7d,
          (select max(r.created_at) from public.requests r where r.shop_id = s.id) as last_req_at,
          (select coalesce(sum((e.value ->> 'view')::int), 0)
             from jsonb_each(s.metrics) e where e.key >= v_week) as views_7d,
          (select coalesce(sum((e.value ->> 'view')::int), 0)
             from jsonb_each(s.metrics) e where e.key = v_today) as views_today
        from public.shops s
        left join auth.users u on u.id = s.owner_id
      ) x
    ),
    'site', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day, 'kind', d.kind, 'count', d.count) order by d.day), '[]'::jsonb)
      from public.site_daily d
      where d.day > ((now() at time zone 'Asia/Seoul')::date - 30)
    ),
    'no_shop_users', (
      select count(*) from auth.users u
      where not exists (select 1 from public.shops s where s.owner_id = u.id)
    )
  );
end;
$$;

-- 9) 요금제·다음 결제일 바꾸기 (운영자만)
create or replace function public.ops_set_plan(p_shop uuid, p_plan text, p_paid_until timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ops() then
    raise exception 'forbidden';
  end if;
  if p_plan not in ('free', 'basic') then
    raise exception 'invalid_plan';
  end if;
  update public.shops set plan = p_plan, paid_until = p_paid_until where id = p_shop;
end;
$$;

-- 10) 권한
revoke all on function public.bump_site(text) from public;
revoke all on function public.bump_metric(text, text) from public;
revoke all on function public.handle_available(text) from public;
revoke all on function public.is_ops() from public;
revoke all on function public.ops_overview() from public;
revoke all on function public.ops_set_plan(uuid, text, timestamptz) from public;
grant execute on function public.bump_site(text) to anon, authenticated;
grant execute on function public.bump_metric(text, text) to anon, authenticated;
grant execute on function public.handle_available(text) to anon, authenticated;
grant execute on function public.is_ops() to authenticated;
grant execute on function public.ops_overview() to authenticated;
grant execute on function public.ops_set_plan(uuid, text, timestamptz) to authenticated;

-- 11) 운영자 등록: 운영자가 아직 없으면 가장 먼저 가입한 마켓의 주인을 넣어요
insert into public.ops_admins (user_id)
select s.owner_id from public.shops s
where not exists (select 1 from public.ops_admins)
order by s.created_at
limit 1
on conflict do nothing;

-- 다른 계정을 운영자로 넣으려면 아래 줄의 앞 '--' 를 지우고 마켓 주소를 바꿔서 실행하세요.
-- insert into public.ops_admins (user_id) select owner_id from public.shops where handle = '마켓주소' on conflict do nothing;
