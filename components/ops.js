"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  Eye,
  Inbox,
  LogOut,
  RefreshCw,
  Search,
  Store,
  Wallet,
} from "lucide-react";
import { supabase, ONLINE_CHANNEL } from "../lib/supabase";

const PRICE = 9900; // 베이직 월 요금 (나중에 바꾸면 여기만 고치면 돼요)
const PLANS = {
  free: { label: "무료", cls: "bg-neutral-100 text-neutral-600" },
  basic: { label: "베이직 " + PRICE.toLocaleString() + "원", cls: "bg-emerald-50 text-emerald-700" },
};
const KIND_LABEL = { landing: "소개 페이지", start: "가입 화면", shop: "손님 접수 화면", admin: "사장님 화면" };
const NAVY = "#0E1B42";
const GREEN = "#12C48B";

/* ---------------- 작은 도우미 ---------------- */

function kstDay(d) {
  return new Date(d).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); // 2026-11-12
}

function fmtDate(iso) {
  if (!iso) return "-";
  return kstDay(iso).replace(/-/g, ".");
}

function ago(iso) {
  if (!iso) return "-";
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "방금";
  if (m < 60) return m + "분 전";
  const h = Math.floor(m / 60);
  if (h < 24) return h + "시간 전";
  const d = Math.floor(h / 24);
  if (d < 30) return d + "일 전";
  return fmtDate(iso);
}

function daysLeft(iso) {
  if (!iso) return null;
  const a = new Date(kstDay(Date.now()));
  const b = new Date(kstDay(iso));
  return Math.round((b - a) / 86400000);
}

function addMonth(iso) {
  const base = iso && new Date(iso) > new Date() ? new Date(iso) : new Date();
  base.setMonth(base.getMonth() + 1);
  return kstDay(base);
}

function siteHost() {
  return typeof window !== "undefined" ? window.location.host : "";
}

/* ---------------- 실시간 접속자 ---------------- */

function useOnlineList() {
  const [list, setList] = useState([]);
  useEffect(() => {
    if (!supabase) return undefined;
    const ch = supabase.channel(ONLINE_CHANNEL);
    ch.on("presence", { event: "sync" }, () => {
      const st = ch.presenceState();
      const out = [];
      Object.keys(st).forEach((k) => {
        const meta = st[k] && st[k][0];
        if (meta && meta.kind) out.push({ key: k, kind: meta.kind, handle: meta.handle || "", at: meta.at });
      });
      setList(out);
    });
    ch.subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);
  return list;
}

/* ---------------- 화면 조각 ---------------- */

function Shell({ children }) {
  return <div className="min-h-screen bg-[#F5F4F1] pb-16">{children}</div>;
}

function Center({ title, children }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 text-center">
      <div className="max-w-sm">
        <p className="text-[17px] font-bold text-neutral-900">{title}</p>
        <div className="mt-2 text-[14px] leading-relaxed text-neutral-500">{children}</div>
      </div>
    </div>
  );
}

function Word() {
  return (
    <span className="font-extrabold">
      <span style={{ color: NAVY }}>Return</span>
      <span style={{ color: GREEN }}>Link</span>
    </span>
  );
}

function Kpi({ icon, label, value, unit, sub }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-1.5 text-[13px] text-neutral-500">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-[26px] font-bold leading-none tracking-tight text-neutral-900">
        {value}
        <span className="ml-1 text-[14px] font-semibold text-neutral-500">{unit}</span>
      </p>
      {sub ? <p className="mt-2 text-[12px] leading-snug text-neutral-500">{sub}</p> : null}
    </div>
  );
}

function LiveCard({ online }) {
  const by = { landing: 0, start: 0, shop: 0, admin: 0 };
  const perShop = {};
  online.forEach((o) => {
    if (by[o.kind] !== undefined) by[o.kind] += 1;
    if ((o.kind === "shop" || o.kind === "admin") && o.handle) {
      perShop[o.handle] = perShop[o.handle] || { shop: 0, admin: 0 };
      perShop[o.handle][o.kind] += 1;
    }
  });
  const shops = Object.keys(perShop).sort((a, b) => perShop[b].shop - perShop[a].shop);
  return (
    <div className="rounded-2xl p-5 text-white" style={{ background: NAVY }}>
      <div className="flex items-center gap-2 text-[13px] text-white/70">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: GREEN }} />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: GREEN }} />
        </span>
        지금 접속 중
      </div>
      <p className="mt-2 text-[40px] font-bold leading-none tracking-tight">
        {online.length}
        <span className="ml-1 text-[16px] font-semibold text-white/70">명</span>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Object.keys(by).map((k) => (
          <div key={k} className="rounded-xl bg-white/10 px-3 py-2">
            <p className="text-[12px] text-white/60">{KIND_LABEL[k]}</p>
            <p className="text-[18px] font-bold">{by[k]}</p>
          </div>
        ))}
      </div>
      {shops.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {shops.map((h) => (
            <span key={h} className="rounded-full bg-white/10 px-2.5 py-1 text-[12px]">
              @{h}
              {perShop[h].shop ? " · 손님 " + perShop[h].shop + "명" : ""}
              {perShop[h].admin ? " · 사장님 접속" : ""}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function VisitChart({ site }) {
  const days = [];
  for (let i = 13; i >= 0; i -= 1) days.push(kstDay(Date.now() - i * 86400000));
  const map = {};
  site.forEach((r) => {
    const d = String(r.day).slice(0, 10);
    map[d] = map[d] || { landing: 0, start: 0, shop: 0 };
    map[d][r.kind] = (map[d][r.kind] || 0) + r.count;
  });
  const rows = days.map((d) => {
    const v = map[d] || { landing: 0, start: 0, shop: 0 };
    return { d, intro: (v.landing || 0) + (v.start || 0), shop: v.shop || 0 };
  });
  const max = Math.max(1, ...rows.map((r) => r.intro + r.shop));
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[15px] font-bold text-neutral-900">최근 14일 방문</p>
        <div className="flex gap-3 text-[12px] text-neutral-500">
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: GREEN }} />
            손님 접수 화면
          </span>
          <span className="flex items-center gap-1">
            <i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: NAVY }} />
            소개·가입
          </span>
        </div>
      </div>
      <div className="mt-4 flex h-36 items-end gap-1">
        {rows.map((r) => (
          <div key={r.d} className="group relative flex h-full flex-1 flex-col justify-end">
            <div className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-[11px] text-white group-hover:block">
              {r.d.slice(5).replace("-", ".")} · 손님 {r.shop} · 소개 {r.intro}
            </div>
            <div style={{ height: (r.shop / max) * 100 + "%", background: GREEN }} className="rounded-t-sm" />
            <div
              style={{ height: (r.intro / max) * 100 + "%", background: NAVY }}
              className={r.shop ? "" : "rounded-t-sm"}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 text-center text-[10px] text-neutral-400">
        {rows.map((r, i) => (
          <span key={r.d} className="flex-1">
            {i % 2 === 1 || i === 13 ? Number(r.d.slice(8)) : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanEditor({ shop, onSave, onClose }) {
  const [plan, setPlan] = useState(shop.plan || "free");
  const [until, setUntil] = useState(shop.paid_until ? kstDay(shop.paid_until) : "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[12px] text-neutral-500">
          요금제
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="mt-1 block rounded-lg border border-neutral-300 bg-white px-2.5 py-2 text-[14px] text-neutral-900"
          >
            <option value="free">무료</option>
            <option value="basic">베이직 {PRICE.toLocaleString()}원/월</option>
          </select>
        </label>
        <label className="text-[12px] text-neutral-500">
          다음 결제일
          <input
            type="date"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="mt-1 block rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-[14px] text-neutral-900"
          />
        </label>
        <button
          type="button"
          onClick={() => setUntil(addMonth(until ? until + "T00:00:00+09:00" : null))}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] font-medium text-neutral-800"
        >
          +1달
        </button>
        <button
          type="button"
          onClick={() => setUntil("")}
          className="rounded-lg px-2 py-2 text-[13px] text-neutral-500"
        >
          비우기
        </button>
        <span className="flex-1" />
        <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-[13px] text-neutral-500">
          닫기
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const ok = await onSave(shop.id, plan, until ? until + "T00:00:00+09:00" : null);
            setBusy(false);
            if (ok) onClose();
          }}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {busy ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

function ShopRow({ s, live, onSavePlan }) {
  const [edit, setEdit] = useState(false);
  const p = PLANS[s.plan] || PLANS.free;
  const left = daysLeft(s.paid_until);
  let pay = "결제 없음";
  let payCls = "text-neutral-400";
  if (s.paid_until) {
    pay = left < 0 ? "결제일 " + -left + "일 지남" : left === 0 ? "오늘 결제일" : "결제까지 D-" + left;
    payCls = left <= 3 ? "text-rose-600 font-bold" : left <= 7 ? "text-amber-600 font-bold" : "text-neutral-700";
  }
  return (
    <div className="border-b border-neutral-100 px-4 py-3.5 last:border-b-0">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="text-[15px] font-bold text-neutral-900">{s.market || "(이름 없음)"}</span>
            <a
              href={"https://" + siteHost() + "/@" + s.handle}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[13px] text-neutral-500 hover:text-neutral-900"
            >
              @{s.handle}
              <ArrowUpRight size={12} />
            </a>
            {live.shop ? (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                손님 {live.shop}명 보는 중
              </span>
            ) : null}
            {live.admin ? (
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">사장님 접속 중</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            가입 {fmtDate(s.created_at)} ({ago(s.created_at)}) · 마지막 로그인 {ago(s.last_sign_in_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEdit((v) => !v)}
          className={"rounded-full px-2.5 py-1 text-[12px] font-bold " + p.cls}
        >
          {p.label} ▾
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[13px] sm:grid-cols-4">
        <p className="text-neutral-500">
          접수 <b className="text-neutral-900">{s.req_7d}</b>
          <span className="text-neutral-400"> /7일 · 누적 {s.req_total}</span>
        </p>
        <p className="text-neutral-500">
          손님 방문 <b className="text-neutral-900">{s.views_7d}</b>
          <span className="text-neutral-400"> /7일 · 오늘 {s.views_today}</span>
        </p>
        <p className="text-neutral-500">
          마지막 접수 <b className="text-neutral-900">{s.last_req_at ? ago(s.last_req_at) : "없음"}</b>
        </p>
        <p className={payCls}>{pay}</p>
      </div>
      {edit ? <PlanEditor shop={s} onSave={onSavePlan} onClose={() => setEdit(false)} /> : null}
    </div>
  );
}

/* ---------------- 운영실 화면 ---------------- */

export function OpsPage() {
  const [auth, setAuth] = useState({ loading: true, user: null });
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("new");
  const online = useOnlineList();

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data: d }) => {
      setAuth({ loading: false, user: d && d.session ? d.session.user : null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuth({ loading: false, user: session ? session.user : null });
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setBusy(true);
    const { data: d, error } = await supabase.rpc("ops_overview");
    setBusy(false);
    if (error) {
      setErr(/forbidden/.test(error.message || "") ? "forbidden" : "error");
      return;
    }
    setErr("");
    setData(d);
    setUpdatedAt(new Date());
  }, []);

  useEffect(() => {
    if (!auth.user) return undefined;
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [auth.user, load]);

  const onSavePlan = useCallback(
    async (id, plan, until) => {
      const { error } = await supabase.rpc("ops_set_plan", { p_shop: id, p_plan: plan, p_paid_until: until });
      if (error) {
        window.alert("저장이 안 됐어요. 잠시 후 다시 해 주세요.");
        return false;
      }
      await load();
      return true;
    },
    [load]
  );

  const liveByShop = useMemo(() => {
    const m = {};
    online.forEach((o) => {
      if (!o.handle) return;
      m[o.handle] = m[o.handle] || { shop: 0, admin: 0 };
      if (o.kind === "shop") m[o.handle].shop += 1;
      if (o.kind === "admin") m[o.handle].admin += 1;
    });
    return m;
  }, [online]);

  if (!supabase) return <Shell><Center title="서버 설정이 필요해요">Vercel 환경변수를 확인해 주세요.</Center></Shell>;
  if (auth.loading) return <Shell><Center title="확인하는 중이에요…" /></Shell>;

  if (!auth.user) {
    return (
      <Shell>
        <Center title="운영실">
          <p>운영자 카카오 계정으로 로그인해 주세요.</p>
          <button
            type="button"
            onClick={() =>
              supabase.auth.signInWithOAuth({
                provider: "kakao",
                options: { redirectTo: window.location.origin + "/ops" },
              })
            }
            className="mt-5 w-full rounded-xl bg-[#FEE500] py-3.5 text-[15px] font-bold text-[#191919]"
          >
            카카오로 로그인
          </button>
        </Center>
      </Shell>
    );
  }

  if (err === "forbidden") {
    return (
      <Shell>
        <Center title="운영자 계정이 아니에요">
          <p>이 화면은 운영자만 볼 수 있어요.</p>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="mt-4 text-[13px] text-neutral-500 underline"
          >
            다른 계정으로 로그인
          </button>
        </Center>
      </Shell>
    );
  }

  if (err === "error" && !data) {
    return (
      <Shell>
        <Center title="불러오지 못했어요">
          <p>Supabase에서 ops.sql 을 실행했는지 확인해 주세요.</p>
          <button type="button" onClick={load} className="mt-4 text-[13px] font-bold text-neutral-900 underline">
            다시 시도
          </button>
        </Center>
      </Shell>
    );
  }

  if (!data) return <Shell><Center title="불러오는 중이에요…" /></Shell>;

  const shops = data.shops || [];
  const site = data.site || [];
  const today = kstDay(Date.now());
  const weekAgo = Date.now() - 7 * 86400000;
  const newThisWeek = shops.filter((s) => new Date(s.created_at).getTime() > weekAgo).length;
  const todayVisits = site.filter((r) => String(r.day).slice(0, 10) === today);
  const visit = (k) => todayVisits.filter((r) => r.kind === k).reduce((a, r) => a + r.count, 0);
  const req7 = shops.reduce((a, s) => a + Number(s.req_7d || 0), 0);
  const reqAll = shops.reduce((a, s) => a + Number(s.req_total || 0), 0);
  const paid = shops.filter((s) => s.plan === "basic");
  const dueSoon = paid.filter((s) => {
    const l = daysLeft(s.paid_until);
    return l !== null && l <= 7;
  }).length;

  const kw = q.trim().toLowerCase();
  const list = shops
    .filter((s) => !kw || (s.market || "").toLowerCase().includes(kw) || s.handle.includes(kw))
    .sort((a, b) => {
      if (sort === "req") return b.req_7d - a.req_7d || b.req_total - a.req_total;
      if (sort === "view") return b.views_7d - a.views_7d;
      if (sort === "pay") {
        const la = daysLeft(a.paid_until);
        const lb = daysLeft(b.paid_until);
        return (la === null ? 9999 : la) - (lb === null ? 9999 : lb);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <Shell>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-4 lg:px-6">
          <p className="text-[20px] tracking-tight">
            <Word /> <span className="font-bold text-neutral-900">운영실</span>
          </p>
          <span className="flex-1" />
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-[13px] text-neutral-700"
          >
            <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
            {updatedAt ? updatedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : "새로고침"}
          </button>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            aria-label="로그아웃"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 pt-5 lg:px-6">
        <LiveCard online={online} />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<Store size={14} />}
            label="가입 사장님"
            value={shops.length}
            unit="명"
            sub={"이번 주 +" + newThisWeek + (data.no_shop_users ? " · 로그인만 하고 마켓 안 만든 사람 " + data.no_shop_users : "")}
          />
          <Kpi
            icon={<Eye size={14} />}
            label="오늘 방문"
            value={visit("landing") + visit("start") + visit("shop")}
            unit="번"
            sub={"소개 " + visit("landing") + " · 가입 " + visit("start") + " · 손님 화면 " + visit("shop")}
          />
          <Kpi icon={<Inbox size={14} />} label="최근 7일 접수" value={req7} unit="건" sub={"누적 " + reqAll + "건"} />
          <Kpi
            icon={<Wallet size={14} />}
            label="유료 사장님"
            value={paid.length}
            unit="명"
            sub={
              "월 예상 " +
              (paid.length * PRICE).toLocaleString() +
              "원" +
              (dueSoon ? " · 7일 안에 결제 " + dueSoon + "명" : "")
            }
          />
        </div>

        <VisitChart site={site} />

        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex flex-wrap items-center gap-2 border-b border-neutral-100 px-4 py-3">
            <p className="flex items-center gap-1.5 text-[15px] font-bold text-neutral-900">
              <Activity size={15} /> 사장님 목록 {shops.length}
            </p>
            <span className="flex-1" />
            <label className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-2.5 py-1.5">
              <Search size={14} className="text-neutral-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="마켓 이름·주소 검색"
                className="w-36 text-[13px] outline-none"
              />
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-neutral-200 px-2 py-1.5 text-[13px]"
            >
              <option value="new">최근 가입순</option>
              <option value="req">접수 많은 순</option>
              <option value="view">손님 방문 많은 순</option>
              <option value="pay">결제일 가까운 순</option>
            </select>
          </div>
          {list.length ? (
            list.map((s) => (
              <ShopRow key={s.id} s={s} live={liveByShop[s.handle] || {}} onSavePlan={onSavePlan} />
            ))
          ) : (
            <p className="px-4 py-10 text-center text-[14px] text-neutral-400">
              {shops.length ? "검색 결과가 없어요" : "아직 가입한 사장님이 없어요"}
            </p>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-[12px] text-neutral-400">
          <CalendarClock size={13} />
          1분마다 자동으로 새로 불러와요. 방문 수는 같은 창에서 한 번만 세요.
        </p>
      </main>
    </Shell>
  );
}
