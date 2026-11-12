"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase, rowToRequest, requestToData, ONLINE_CHANNEL } from "../lib/supabase";
import { AdminView, CustomerView, Landing, SignupFlow, Toast, useToast } from "./ReturnLinkApp";

const TRACKING_ON = process.env.NEXT_PUBLIC_TRACKING === "on";
const KEEP_DAYS = 90;

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
      <Landing onStart={() => router.push("/start")} />
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
  const [loading, setLoading] = useState(true);
  const requestsRef = useRef([]);
  requestsRef.current = requests;

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
      document.title = state.settings.marketName + " | 교환·반품 접수";
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
      />
    </Page>
  );
}
