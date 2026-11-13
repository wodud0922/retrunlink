-- =====================================================================
-- 리턴링크 사장님 피드백 (사장님 화면 → 운영실 /ops)
-- Supabase → SQL Editor → New query 에 전체를 붙여 넣고 Run 하세요.
-- ops.sql 을 먼저 실행한 뒤에 실행해 주세요. 여러 번 실행해도 괜찮아요.
-- =====================================================================

-- 1) 피드백 저장 칸 (아무도 직접 못 읽어요. 아래 함수로만 써요)
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops (id) on delete set null,
  owner_id uuid references auth.users (id) on delete set null,
  handle text,
  market text,
  message text not null check (char_length(message) between 1 and 2000),
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx on public.feedback (created_at desc);
alter table public.feedback enable row level security;
revoke all on table public.feedback from anon, authenticated;

-- 2) 사장님이 피드백 보내기 (로그인한 사장님만, 하루 20개까지)
create or replace function public.submit_feedback(p_message text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop public.shops%rowtype;
  v_msg text := btrim(coalesce(p_message, ''));
begin
  if auth.uid() is null then
    raise exception 'login required';
  end if;
  if char_length(v_msg) = 0 or char_length(v_msg) > 2000 then
    raise exception 'invalid message';
  end if;
  if (select count(*) from public.feedback
      where owner_id = auth.uid() and created_at > now() - interval '1 day') >= 20 then
    raise exception 'too many';
  end if;
  select * into v_shop from public.shops where owner_id = auth.uid();
  insert into public.feedback (shop_id, owner_id, handle, market, message)
  values (v_shop.id, auth.uid(), v_shop.handle, v_shop.settings ->> 'marketName', v_msg);
  return true;
end;
$$;

-- 3) 운영실에서 피드백 목록 보기 (운영자만)
create or replace function public.ops_feedback()
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ops() then
    raise exception 'forbidden';
  end if;
  return coalesce((
    select json_agg(f order by f.created_at desc)
    from (
      select id, handle, market, message, done, created_at
      from public.feedback
      order by created_at desc
      limit 300
    ) f
  ), '[]'::json);
end;
$$;

-- 4) 운영실에서 "확인함" 표시하기 (운영자만)
create or replace function public.ops_feedback_done(p_id uuid, p_done boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_ops() then
    raise exception 'forbidden';
  end if;
  update public.feedback set done = coalesce(p_done, true) where id = p_id;
  return true;
end;
$$;

grant execute on function public.submit_feedback(text) to authenticated;
grant execute on function public.ops_feedback() to authenticated;
grant execute on function public.ops_feedback_done(uuid, boolean) to authenticated;
