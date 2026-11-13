"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, rowToRequest, requestToData, ONLINE_CHANNEL } from "../lib/supabase";
import { AdminView, CustomerView, Landing, SignupFlow, Toast, useToast } from "./ReturnLinkApp";

const TRACKING_ON = process.env.NEXT_PUBLIC_TRACKING === "on";
const KEEP_DAYS = 90;

// DB 주문 한 줄을 화면용으로 바꿔요.
function rowToOrder(r) {
  return {
    id: r.id,
    name: r.name,
    p4: r.phone4,
    item: r.item || "",
    courier: r.courier || "",
    inv: r.invoice || "",
    paid: !!r.paid,
    shipDate: r.ship_date || "",
    created_at: r.created_at,
  };
}

function makeId() {
  try {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  } catch (e) {
    /* 아래로 */
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}



function daysSince(dateStr) {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(dateStr || "");
  if (!m) return 0;
  const then = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

function isClosedAndOld(r) {
  if (r.decision === "rejected") return daysSince(r.date) >= KEEP_DAYS;
  if (r.paid && r.pickup === "done" && r.finished) return daysSince(r.finishedDate || r.date) >= KEEP_DAYS;
  return false;
}

// 지금 접속 중인 사람을 운영실에 알려요 (실시간 접속자 수)

function useOnline(kind, handle) {
  useEffect(() => {
    if (!supabase || !kind) return undefined;
    const key = Math.random().toString(36).slice(2) + Date.now().toString(36);
    const ch = supabase.channel(ONLINE_CHANNEL, { config: { presence: { key } } });
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        ch.track({ kind, handle: handle || "", at: new Date().toISOString() }).catch(() => {});
      }
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, [kind, handle]);
}

// 방문 수는 같은 창에서 한 번만 세요 (새로고침해도 다시 안 셈)
function countVisitOnce(key, fn) {
  try {
    if (window.sessionStorage.getItem("rl-visit-" + key)) return;
    window.sessionStorage.setItem("rl-visit-" + key, "1");
  } catch (e) {
    /* 사파리 개인정보 보호 모드 등에서는 그냥 셉니다 */
  }
  Promise.resolve(fn()).catch(() => {});
}

function useVisit(key, fn) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!supabase || !key) return;
    countVisitOnce(key, () => fnRef.current());
  }, [key]);
}

function Page({ children, toast }) {
  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {children}
      <Toast toast={toast} />
    </div>
  );
}

function Center({ children }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 text-center text-[14px] leading-relaxed text-neutral-500">
      <div>{children}</div>
    </div>
  );
}

function SetupNeeded() {
  return (
    <Center>
      <p className="text-[16px] font-bold text-neutral-800">서버 설정이 필요해요</p>
      <p className="mt-2">
        Vercel 환경변수에 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣고 다시 배포해 주세요.
      </p>
    </Center>
  );
}

/* ------------------------------------------------------------------ */
/* 소개 페이지  /                                                       */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  const router = useRouter();
  const [toast] = useToast();
  useOnline("landing");
  useVisit("landing", () => supabase.rpc("bump_site", { p_kind: "landing" }));
  return (
    <Page toast={toast}>
      <Landing onStart={() => router.push("/start")} onDemo={() => router.push("/demo")} />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* 가입·처음 설정  /start                                               */
/* ------------------------------------------------------------------ */

// next/navigation 의 router 를 effect 안에서 안전하게 쓰기 위해 ref 로 감싸요.
function useStableRouter() {
  const router = useRouter();
  const ref = useRef(router);
  ref.current = router;
  return ref;
}

export function StartPage() {
  const routerRef = useStableRouter();
  const router = routerRef.current;
  const [toast, showToast] = useToast();
  useOnline("start");
  useVisit("start", () => supabase.rpc("bump_site", { p_kind: "start" }));
  const [state, setState] = useState({ loading: true, user: null });

  useEffect(() => {
    if (!supabase) return undefined;
    let alive = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      const user = data && data.session ? data.session.user : null;
      if (!user) {
        if (alive) setState({ loading: false, user: null });
        return;
      }
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).maybeSingle();
      if (shop) {
        routerRef.current.replace("/admin");
        return;
      }
      if (alive) setState({ loading: false, user });
    };
    check();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") check();
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [routerRef]);

  const onKakao = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: window.location.origin + "/start" },
    });
    return !error;
  }, []);

  const checkHandle = useCallback(async (handle) => {
    const { data, error } = await supabase.rpc("handle_available", { p_handle: handle });
    if (error) throw error;
    return !!data;
  }, []);

  const onFinish = useCallback(
    async (settings) => {
      if (!state.user) return false;
      const { error } = await supabase
        .from("shops")
        .insert({ owner_id: state.user.id, handle: settings.handle, settings });
      if (error) {
        showToast(
          error.code === "23505" ? "그 주소는 방금 다른 분이 가져갔어요. 1단계에서 바꿔 주세요" : "저장이 잠시 안 돼요. 다시 눌러 주세요",
          "warn"
        );
        return false;
      }
      return true;
    },
    [state.user, showToast]
  );

  if (!supabase) return <Page toast={toast}><SetupNeeded /></Page>;
  if (state.loading) return <Page toast={toast}><Center>확인하는 중이에요…</Center></Page>;

  return (
    <Page toast={toast}>
      <SignupFlow
        key={state.user ? "user" : "guest"}
        initialStage={state.user ? 1 : "login"}
        onKakao={onKakao}
        checkHandle={checkHandle}
        onFinish={onFinish}
        onGo={(view) => {
          if (view === "admin") router.push("/admin");
          else router.push("/");
        }}
        showToast={showToast}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면  /admin                                                  */
/* ------------------------------------------------------------------ */

export function AdminPage() {
  const routerRef = useStableRouter();
  const router = routerRef.current;
  const [toast, showToast] = useToast();
  const [shop, setShop] = useState(null);
  useOnline(shop ? "admin" : "", shop ? shop.handle : "");
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [asks, setAsks] = useState([]);
  const [loading, setLoading] = useState(true);
  const requestsRef = useRef([]);
  requestsRef.current = requests;
  const ordersRef = useRef([]);
  ordersRef.current = orders;
  const shopRef = useRef(null);
  shopRef.current = shop;

  const loadRequests = useCallback(async (shopId) => {
    const { data, error } = await supabase
      .from("requests")
      .select("id, data, created_at")
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false })
      .limit(2000);
    if (error) throw error;
    const list = (data || []).map(rowToRequest);
    // 개인정보 보관 기간(90일)이 지난 끝난 건은 지워요.
    const old = list.filter(isClosedAndOld).map((r) => r.id);
    if (old.length) {
      await supabase.from("requests").delete().in("id", old);
    }
    return list.filter((r) => !old.includes(r.id));
  }, []);

  useEffect(() => {
    if (!supabase) return undefined;
    let alive = true;
    let channel = null;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data && data.session ? data.session.user : null;
      if (!user) {
        routerRef.current.replace("/start");
        return;
      }
      const { data: s, error } = await supabase.from("shops").select("*").eq("owner_id", user.id).maybeSingle();
      if (error) {
        if (alive) {
          setLoading(false);
          showToast("불러오기가 잠시 안 돼요. 새로고침해 주세요", "warn");
        }
        return;
      }
      if (!s) {
        routerRef.current.replace("/start");
        return;
      }
      try {
        const list = await loadRequests(s.id);
        if (!alive) return;
        setShop(s);
        setRequests(list);
      } catch (e) {
        if (alive) showToast("접수 목록을 불러오지 못했어요. 새로고침해 주세요", "warn");
      }
      // 주문·송장과 1:1 문의 (cs.sql 을 실행하지 않았으면 조용히 건너뛰어요)
      try {
        const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString();
        await supabase.from("orders").delete().eq("shop_id", s.id).lt("created_at", cutoff);
        await supabase.from("asks").delete().eq("shop_id", s.id).lt("created_at", cutoff);
        const [o, a] = await Promise.all([
          supabase.from("orders").select("*").eq("shop_id", s.id).order("created_at", { ascending: false }).limit(5000),
          supabase.from("asks").select("*").eq("shop_id", s.id).order("created_at", { ascending: false }).limit(500),
        ]);
        if (alive && !o.error) setOrders((o.data || []).map(rowToOrder));
        if (alive && !a.error) setAsks((a.data || []).map((x) => ({ ...x, p4: x.phone4 })));
      } catch (e) {
        /* 무시 */
      }
      if (alive) setLoading(false);

      // 새 접수가 들어오면 바로 목록에 넣어요.
      channel = supabase
        .channel("requests-" + s.id)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "requests", filter: "shop_id=eq." + s.id },
          (payload) => {
            const r = rowToRequest(payload.new);
            if (requestsRef.current.some((x) => x.id === r.id)) return;
            setRequests((prev) => [r, ...prev]);
            const day = r.date;
            if (day) {
              setShop((prev) => {
                if (!prev) return prev;
                const m = prev.metrics || {};
                const cur = m[day] || {};
                return { ...prev, metrics: { ...m, [day]: { ...cur, req: (cur.req || 0) + 1 } } };
              });
            }
            showToast("새 " + (r.type === "exchange" ? "교환" : "반품") + " 접수가 들어왔어요 · " + r.name + "님");
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "asks", filter: "shop_id=eq." + s.id },
          (payload) => {
            const a = { ...payload.new, p4: payload.new.phone4 };
            setAsks((prev) => (prev.some((x) => x.id === a.id) ? prev : [a, ...prev]));
            showToast("새 1:1 문의가 들어왔어요 · " + a.name + "님");
          }
        )
        .subscribe();
    })();
    return () => {
      alive = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [routerRef, loadRequests, showToast]);

  const onUpdate = useCallback(
    async (id, patch) => {
      const before = requestsRef.current.find((r) => r.id === id);
      if (!before) return;
      const after = { ...before, ...patch };
      setRequests((prev) => prev.map((r) => (r.id === id ? after : r)));
      const { error } = await supabase.from("requests").update({ data: requestToData(after) }).eq("id", id);
      if (error) {
        setRequests((prev) => prev.map((r) => (r.id === id ? before : r)));
        showToast("저장이 안 됐어요. 인터넷 연결을 확인하고 다시 눌러 주세요", "warn");
      }
    },
    [showToast]
  );

  const onDelete = useCallback(
    async (ids) => {
      const backup = requestsRef.current;
      setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
      const { error } = await supabase.from("requests").delete().in("id", ids);
      if (error) {
        setRequests(backup);
        showToast("삭제가 안 됐어요. 다시 시도해 주세요", "warn");
      }
    },
    [showToast]
  );

  const onSaveSettings = useCallback(
    async (next) => {
      const prev = shop;
      setShop({ ...shop, handle: next.handle, settings: next });
      const { error } = await supabase
        .from("shops")
        .update({ handle: next.handle, settings: next })
        .eq("id", shop.id);
      if (error) {
        setShop(prev);
        showToast(
          error.code === "23505" ? "그 링크 주소는 이미 다른 분이 쓰고 있어요" : "설정 저장이 안 됐어요. 다시 시도해 주세요",
          "warn"
        );
      }
    },
    [shop, showToast]
  );

  const onWithdraw = useCallback(async () => {
    const { error } = await supabase.rpc("delete_my_account");
    if (error) return false;
    await supabase.auth.signOut();
    showToast("탈퇴가 끝났어요. 모든 정보를 지웠어요");
    routerRef.current.replace("/");
    return true;
  }, [routerRef, showToast]);

  // ----- 주문·송장 -----
  const onImportOrders = useCallback(
    async (items) => {
      const s = shopRef.current;
      if (!s) return false;
      const now = new Date().toISOString();
      const rows = items.map((o) => ({ ...o, id: o.id || makeId() }));
      const payload = rows.map((o) => ({
        id: o.id,
        shop_id: s.id,
        name: o.name,
        phone4: o.p4,
        item: o.item || "",
        courier: o.courier || "",
        invoice: o.inv || "",
        paid: !!o.paid,
        ship_date: o.shipDate || null,
        sent_at: o.inv ? now : null,
      }));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase.from("orders").upsert(payload.slice(i, i + 500));
        if (error) {
          showToast(
            error.code === "42P01" ? "주문 기능 준비가 안 됐어요. Supabase 에서 cs.sql 을 실행해 주세요" : "올리기가 안 됐어요. 다시 시도해 주세요",
            "warn"
          );
          return false;
        }
      }
      const byId = new Map(rows.map((o) => [o.id, o]));
      setOrders((prev) => {
        const known = new Set(prev.map((o) => o.id));
        const fresh = rows
          .filter((o) => !known.has(o.id))
          .map((o) => {
            const { _key, ...rest } = o;
            return { ...rest, created_at: now };
          });
        return [...fresh, ...prev.map((o) => (byId.has(o.id) ? { ...o, ...byId.get(o.id) } : o))];
      });
      // 처음 올리면 손님 화면이 '주문 조회'부터 보이게 켜요.
      if (!(s.settings && s.settings.orderLookup)) {
        const next = { ...s.settings, orderLookup: true };
        setShop({ ...s, settings: next });
        supabase.from("shops").update({ settings: next }).eq("id", s.id).then(() => {});
      }
      return true;
    },
    [showToast]
  );

  const onSaveOrder = useCallback(
    async (o) => {
      const s = shopRef.current;
      const before = o.id ? ordersRef.current.find((x) => x.id === o.id) : null;
      const row = {
        id: o.id || makeId(),
        shop_id: s.id,
        name: o.name,
        phone4: o.p4,
        item: o.item || "",
        courier: o.courier || "",
        invoice: o.inv || "",
        paid: !!o.paid,
        ship_date: o.shipDate || null,
        sent_at: o.inv ? (before && before.inv === o.inv ? undefined : new Date().toISOString()) : null,
      };
      if (row.sent_at === undefined) delete row.sent_at;
      const { error } = await supabase.from("orders").upsert(row);
      if (error) {
        showToast("저장이 안 됐어요. 다시 시도해 주세요", "warn");
        return false;
      }
      const view = {
        id: row.id,
        name: row.name,
        p4: row.phone4,
        item: row.item,
        courier: row.courier,
        inv: row.invoice,
        paid: row.paid,
        shipDate: o.shipDate || "",
        created_at: before ? before.created_at : new Date().toISOString(),
      };
      setOrders((prev) => (before ? prev.map((x) => (x.id === row.id ? view : x)) : [view, ...prev]));
      return true;
    },
    [showToast]
  );

  const onDeleteOrders = useCallback(
    async (ids) => {
      const { error } = await supabase.from("orders").delete().in("id", ids);
      if (error) {
        showToast("삭제가 안 됐어요. 다시 시도해 주세요", "warn");
        return false;
      }
      setOrders((prev) => prev.filter((o) => !ids.includes(o.id)));
      return true;
    },
    [showToast]
  );

  const onBulkOrders = useCallback(
    async (ids, patch) => {
      const dbPatch = {};
      if ("paid" in patch) dbPatch.paid = !!patch.paid;
      if ("shipDate" in patch) dbPatch.ship_date = patch.shipDate || null;
      if ("inv" in patch) {
        dbPatch.invoice = patch.inv || "";
        dbPatch.courier = patch.inv ? patch.courier || "" : "";
        dbPatch.sent_at = patch.inv ? new Date().toISOString() : null;
      }
      const { error } = await supabase.from("orders").update(dbPatch).in("id", ids);
      if (error) {
        showToast("저장이 안 됐어요. 다시 시도해 주세요", "warn");
        return false;
      }
      setOrders((prev) => prev.map((o) => (ids.includes(o.id) ? { ...o, ...patch } : o)));
      return true;
    },
    [showToast]
  );

  // ----- 1:1 문의 -----
  const onAnswerAsk = useCallback(
    async (id, answer) => {
      const { error } = await supabase.from("asks").update({ answer, answered_at: new Date().toISOString() }).eq("id", id);
      if (error) {
        showToast("저장이 안 됐어요. 다시 시도해 주세요", "warn");
        return false;
      }
      setAsks((prev) => prev.map((a) => (a.id === id ? { ...a, answer } : a)));
      return true;
    },
    [showToast]
  );
  const onDeleteAsk = useCallback(
    async (id) => {
      const { error } = await supabase.from("asks").delete().eq("id", id);
      if (error) {
        showToast("삭제가 안 됐어요. 다시 시도해 주세요", "warn");
        return false;
      }
      setAsks((prev) => prev.filter((a) => a.id !== id));
      return true;
    },
    [showToast]
  );

  const onFeedback = useCallback(async (message) => {
    const { error } = await supabase.rpc("submit_feedback", { p_message: message });
    return !error;
  }, []);

  const onLogout = useCallback(async () => {
    await supabase.auth.signOut();
    routerRef.current.replace("/");
  }, [routerRef]);

  if (!supabase) return <Page toast={toast}><SetupNeeded /></Page>;
  if (loading || !shop) return <Page toast={toast}><Center>불러오는 중이에요…</Center></Page>;

  return (
    <Page toast={toast}>
      <AdminView
        settings={{ ...shop.settings, handle: shop.handle }}
        requests={requests}
        metrics={shop.metrics || {}}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onSaveSettings={onSaveSettings}
        onReset={onLogout}
        onLogout={onLogout}
        onFeedback={onFeedback}
        orders={orders}
        asks={asks}
        onImportOrders={onImportOrders}
        onSaveOrder={onSaveOrder}
        onDeleteOrders={onDeleteOrders}
        onBulkOrders={onBulkOrders}
        onAnswerAsk={onAnswerAsk}
        onDeleteAsk={onDeleteAsk}
        resetLabel="로그아웃"
        onWithdraw={onWithdraw}
        showToast={showToast}
      />
    </Page>
  );
}

/* ------------------------------------------------------------------ */
/* 손님 화면  /@마켓주소                                                */
/* ------------------------------------------------------------------ */

export function ShopPage() {
  const params = useParams();
  const raw = params && params.slug ? String(params.slug) : "";
  const handle = decodeURIComponent(raw).replace(/^@/, "").toLowerCase();
  const [toast, showToast] = useToast();
  const [state, setState] = useState({ loading: true, settings: null });
  const found = !!state.settings;
  useOnline(found ? "shop" : "", handle);
  useVisit(found ? "shop-" + handle : "", () =>
    Promise.all([
      supabase.rpc("bump_site", { p_kind: "shop" }),
      supabase.rpc("bump_metric", { p_handle: handle, p_kind: "view" }),
    ])
  );

  useEffect(() => {
    if (!supabase) return undefined;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.rpc("get_shop", { p_handle: handle });
      if (!alive) return;
      if (error) {
        setState({ loading: false, settings: null, error: true });
        return;
      }
      setState({
        loading: false,
        settings: data ? { ...data.settings, handle: data.handle } : null,
      });
    })();
    return () => {
      alive = false;
    };
  }, [handle]);

  useEffect(() => {
    if (state.settings && state.settings.marketName) {
      document.title = state.settings.marketName + " | 주문 조회·교환·반품";
    }
  }, [state.settings]);

  const onSubmit = useCallback(
    async (request) => {
      const { data, error } = await supabase.rpc("submit_request", { p_handle: handle, p_payload: request });
      if (error || !data) return null;
      return data;
    },
    [handle]
  );

  const fetchLookup = useCallback(
    async (name, phone4) => {
      const { data, error } = await supabase.rpc("lookup_requests", {
        p_handle: handle,
        p_name: name,
        p_phone4: phone4,
      });
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    },
    [handle]
  );

  const onMetric = useCallback(
    (kind) => {
      supabase.rpc("bump_metric", { p_handle: handle, p_kind: kind }).then(
        () => {},
        () => {}
      );
    },
    [handle]
  );

  const cs = useMemo(
    () => ({
      lookupOrders: async (name, phone4) => {
        const { data, error } = await supabase.rpc("lookup_orders", { p_handle: handle, p_name: name, p_phone4: phone4 });
        if (error) throw error;
        return (Array.isArray(data) ? data : []).map((o) => ({
          ...o,
          inv: o.invoice || "",
          paid: !!o.paid,
          shipDate: o.ship_date || "",
        }));
      },
      submitAsk: async (name, phone4, message) => {
        const { error } = await supabase.rpc("submit_ask", {
          p_handle: handle,
          p_name: name,
          p_phone4: phone4,
          p_message: message,
        });
        return !error;
      },
      lookupAsks: async (name, phone4) => {
        const { data, error } = await supabase.rpc("lookup_asks", { p_handle: handle, p_name: name, p_phone4: phone4 });
        if (error) throw error;
        return Array.isArray(data) ? data : [];
      },
    }),
    [handle]
  );

  if (!supabase) return <Page toast={toast}><SetupNeeded /></Page>;
  if (state.loading) return <Page toast={toast}><Center>불러오는 중이에요…</Center></Page>;
  if (!state.settings) {
    return (
      <Page toast={toast}>
        <Center>
          <p className="text-[16px] font-bold text-neutral-800">
            {state.error ? "잠시 연결이 안 돼요" : "없는 페이지예요"}
          </p>
          <p className="mt-2">
            {state.error ? "잠시 후 새로고침해 주세요." : "주소를 다시 확인해 주세요."}
          </p>
        </Center>
      </Page>
    );
  }

  return (
    <Page toast={toast}>
      <CustomerView
        settings={state.settings}
        onSubmit={onSubmit}
        fetchLookup={fetchLookup}
        onMetric={onMetric}
        showTracking={TRACKING_ON}
        showToast={showToast}
        cs={cs}
      />
    </Page>
  );
}
