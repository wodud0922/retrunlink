-- =====================================================================
-- 리턴링크 데이터베이스 설정
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여 넣고 Run 하세요.
-- 처음 한 번만 실행하면 됩니다.
-- =====================================================================

-- 1) 사장님 마켓
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9._]{3,20}$'),
  settings jsonb not null,
  metrics jsonb not null default '{}'::jsonb,
  trial_ends_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now()
);

-- 2) 교환·반품 접수
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops (id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists requests_shop_created_idx on public.requests (shop_id, created_at desc);

-- 3) 보안: 사장님은 자기 마켓·접수만 보고 고칠 수 있어요
alter table public.shops enable row level security;
alter table public.requests enable row level security;

drop policy if exists "shops_owner_select" on public.shops;
drop policy if exists "shops_owner_insert" on public.shops;
drop policy if exists "shops_owner_update" on public.shops;
create policy "shops_owner_select" on public.shops for select using (owner_id = auth.uid());
create policy "shops_owner_insert" on public.shops for insert with check (owner_id = auth.uid());
create policy "shops_owner_update" on public.shops for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "requests_owner_all" on public.requests;
create policy "requests_owner_all" on public.requests for all
  using (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
  with check (exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

-- 손님(로그인 안 한 사람)은 테이블을 직접 못 건드리고, 아래 함수로만 접수·조회해요.
revoke all on table public.shops from anon, authenticated;
revoke all on table public.requests from anon, authenticated;
grant select on table public.shops to authenticated;
grant insert (owner_id, handle, settings) on table public.shops to authenticated;
grant update (handle, settings) on table public.shops to authenticated;
grant select, update (data), delete on table public.requests to authenticated;

-- 4) 손님 화면: 마켓 정보 가져오기
create or replace function public.get_shop(p_handle text)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select jsonb_build_object('handle', s.handle, 'settings', s.settings)
  from public.shops s
  where s.handle = lower(trim(p_handle));
$$;

-- 5) 가입: 주소 사용 가능 여부
create or replace function public.handle_available(p_handle text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select lower(trim(p_handle)) ~ '^[a-z0-9._]{3,20}$'
     and lower(trim(p_handle)) not in ('admin', 'start', 'signup', 'login', 'returnlink', 'help', 'api')
     and not exists (select 1 from public.shops where handle = lower(trim(p_handle)));
$$;

-- 6) 통계용 횟수 올리기 (손님 배송조회·진행조회)
create or replace function public.bump_metric(p_handle text, p_kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_day text := to_char(now() at time zone 'Asia/Seoul', 'YYYY.MM.DD');
begin
  if p_kind not in ('track', 'lookup') then
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

-- 7) 손님 접수 (서버에서 배송비·상태를 다시 계산해서 손님이 값을 조작할 수 없어요)
create or replace function public.submit_request(p_handle text, p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.shops;
  v_reason jsonb;
  v_free boolean;
  v_amount int;
  v_now timestamptz := now();
  v_kst timestamp := now() at time zone 'Asia/Seoul';
  v_day text;
  v_items jsonb;
  v_data jsonb;
  v_id uuid;
  v_phone text;
  v_type text;
begin
  select * into s from public.shops where handle = lower(trim(p_handle));
  if not found then
    raise exception 'shop_not_found';
  end if;
  if octet_length(p_payload::text) > 3000000 then
    raise exception 'payload_too_large';
  end if;

  v_type := p_payload ->> 'type';
  if v_type is null or v_type not in ('exchange', 'return') then
    raise exception 'invalid_type';
  end if;

  v_phone := regexp_replace(coalesce(p_payload ->> 'phone', ''), '\D', '', 'g');
  if coalesce(trim(p_payload ->> 'name'), '') = '' or v_phone !~ '^01[0-9]{8,9}$' then
    raise exception 'invalid_contact';
  end if;

  v_items := p_payload -> 'items';
  if v_items is null or jsonb_typeof(v_items) <> 'array'
     or jsonb_array_length(v_items) = 0 or jsonb_array_length(v_items) > 20 then
    raise exception 'invalid_items';
  end if;

  select e.value into v_reason
    from jsonb_array_elements(coalesce(s.settings -> 'reasons', '[]'::jsonb)) as e(value)
   where e.value ->> 'label' = p_payload ->> 'reason'
   limit 1;
  if v_reason is null then
    raise exception 'invalid_reason';
  end if;

  v_free := coalesce((v_reason ->> 'free')::boolean, false)
            or not coalesce((s.settings ->> 'feeOnCustomer')::boolean, true);
  v_amount := case when v_free then 0 else greatest(coalesce((s.settings ->> 'shippingFee')::int, 0), 0) end;
  v_day := to_char(v_kst, 'YYYY.MM.DD');

  v_data := jsonb_build_object(
    'no', 'R-' || to_char(v_kst, 'YYMMDD') || '-' || upper(substr(md5(random()::text), 1, 4)),
    'ts', (extract(epoch from v_now) * 1000)::bigint,
    'date', v_day,
    'time', to_char(v_kst, 'HH24:MI'),
    'type', v_type,
    'name', left(trim(p_payload ->> 'name'), 30),
    'phone', substr(v_phone, 1, 3) || '-' || substr(v_phone, 4, length(v_phone) - 7) || '-' || right(v_phone, 4),
    'phone4', right(v_phone, 4),
    'pickupMethod', case when p_payload ->> 'pickupMethod' = 'other' then 'other' else 'order' end,
    'address', case when p_payload ->> 'pickupMethod' = 'other' then left(coalesce(p_payload ->> 'address', ''), 200) else '' end,
    'items', v_items,
    'product', left(coalesce(p_payload ->> 'product', ''), 200),
    'kind', coalesce(p_payload ->> 'kind', 'default'),
    'productImg', coalesce(p_payload ->> 'productImg', ''),
    'option', left(coalesce(p_payload ->> 'option', ''), 300),
    'changeKind', coalesce(p_payload ->> 'changeKind', ''),
    'reason', v_reason ->> 'label',
    'detail', left(coalesce(p_payload ->> 'detail', ''), 500),
    'depositor', case when v_amount > 0
                      then left(coalesce(nullif(trim(p_payload ->> 'depositor'), ''), trim(p_payload ->> 'name')), 30)
                      else '' end,
    'amount', v_amount,
    'paid', v_amount = 0,
    'pickup', case when v_amount = 0 then 'progress' else 'none' end,
    'pickupDate', '',
    'finished', false,
    'finishedDate', '',
    'decision', 'null'::jsonb,
    'photo', coalesce(p_payload ->> 'photo', ''),
    'refundAccount', case when v_type = 'return' then left(coalesce(p_payload ->> 'refundAccount', ''), 100) else '' end,
    'memo', '',
    'outInvoice', '',
    'outCourier', '',
    'rejectReason', ''
  );

  insert into public.requests (shop_id, data) values (s.id, v_data) returning id into v_id;

  update public.shops
     set metrics = jsonb_set(
           metrics,
           array[v_day],
           coalesce(metrics -> v_day, '{}'::jsonb)
             || jsonb_build_object('req', coalesce((metrics -> v_day ->> 'req')::int, 0) + 1)
         )
   where id = s.id;

  return v_data || jsonb_build_object('id', v_id);
end;
$$;

-- 8) 손님 진행 상황 조회 (연락처·주소·메모 같은 민감한 정보는 빼고 돌려줘요)
create or replace function public.lookup_requests(p_handle text, p_name text, p_phone4 text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(p_phone4, '') !~ '^[0-9]{4}$' then
    return '[]'::jsonb;
  end if;
  perform public.bump_metric(p_handle, 'lookup');
  select coalesce(
           jsonb_agg(
             (r.data - 'phone' - 'address' - 'memo' - 'refundAccount' - 'depositor' - 'photo')
               || jsonb_build_object('id', r.id)
             order by r.created_at desc
           ),
           '[]'::jsonb
         )
    into v_result
    from public.requests r
    join public.shops s on s.id = r.shop_id
   where s.handle = lower(trim(p_handle))
     and r.data ->> 'name' = trim(p_name)
     and r.data ->> 'phone4' = p_phone4
     and r.created_at > now() - interval '180 days';
  return v_result;
end;
$$;

revoke all on function public.get_shop(text) from public;
revoke all on function public.handle_available(text) from public;
revoke all on function public.bump_metric(text, text) from public;
revoke all on function public.submit_request(text, jsonb) from public;
revoke all on function public.lookup_requests(text, text, text) from public;
grant execute on function public.get_shop(text) to anon, authenticated;
grant execute on function public.handle_available(text) to anon, authenticated;
grant execute on function public.bump_metric(text, text) to anon, authenticated;
grant execute on function public.submit_request(text, jsonb) to anon, authenticated;
grant execute on function public.lookup_requests(text, text, text) to anon, authenticated;

-- 9) 회원 탈퇴: 내 마켓·접수(자동으로 같이 삭제)·로그인 계정을 모두 지워요
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in';
  end if;
  delete from public.shops where owner_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- 10) 새 접수가 사장님 화면에 바로 뜨게 (실시간)
do $$
begin
  alter publication supabase_realtime add table public.requests;
exception when duplicate_object then null;
end $$;
