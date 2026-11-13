"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  Box,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  ExternalLink,
  House,
  ImagePlus,
  Inbox,
  Lightbulb,
  Link as LinkIcon,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  Palette,
  Phone,
  Plus,
  RefreshCw,
  Repeat,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Shirt,
  SlidersHorizontal,
  Star,
  StickyNote,
  Store,
  Trash2,
  Truck,
  Undo2,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* 상수 & 더미 데이터                                                    */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = "returnlink-simple-v2";

// 실제 카카오톡 채널 주소로 바꿔 주세요 (예: https://pf.kakao.com/_xxxxxx/chat)
// 사장님이 설정에 넣은 카카오톡 채널·오픈채팅 주소만 허용해요.
function normalizeKakaoUrl(u) {
  const t = (u || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : "https://" + t;
}
function validKakaoUrl(u) {
  return /^https?:\/\/(pf\.kakao\.com|open\.kakao\.com)\/\S+$/i.test(normalizeKakaoUrl(u));
}

// 손님에게 보이는 리턴링크 글자 (로고 색)
function RLWord({ className = "" }) {
  return (
    <span className={"font-extrabold " + className}>
      <span style={{ color: "#0E1B42" }}>Return</span>
      <span style={{ color: "#12C48B" }}>Link</span>
    </span>
  );
}

const SAMPLE_TRACKING = "681234567895";

// 코드는 스마트택배(스윗트래커) API 택배사 코드예요.
const COURIERS = [
  { code: "04", name: "CJ대한통운" },
  { code: "01", name: "우체국택배" },
  { code: "05", name: "한진택배" },
  { code: "08", name: "롯데택배" },
  { code: "06", name: "로젠택배" },
  { code: "24", name: "GS25 편의점택배" },
  { code: "46", name: "CU 편의점택배" },
  { code: "23", name: "경동택배" },
];

const BANKS = [
  "카카오뱅크",
  "토스뱅크",
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
];

const FONTS = [
  { id: "basic", name: "기본 고딕", family: "inherit", weight: 700, scale: 1 },
  { id: "noto-serif", name: "본명조", family: "'Noto Serif KR', serif", weight: 700, scale: 1 },
  { id: "gowun-batang", name: "고운바탕", family: "'Gowun Batang', serif", weight: 700, scale: 1 },
  { id: "nanum-myeongjo", name: "나눔명조", family: "'Nanum Myeongjo', serif", weight: 700, scale: 1 },
  { id: "gowun-dodum", name: "고운돋움", family: "'Gowun Dodum', sans-serif", weight: 400, scale: 1 },
  { id: "jua", name: "주아", family: "'Jua', sans-serif", weight: 400, scale: 1.05 },
  { id: "do-hyeon", name: "도현", family: "'Do Hyeon', sans-serif", weight: 400, scale: 1.05 },
  { id: "nanum-pen", name: "나눔손글씨 펜", family: "'Nanum Pen Script', cursive", weight: 400, scale: 1.35 },
];

const DEFAULT_SETTINGS = {
  marketName: "오트 스튜디오",
  intro: "매일 입고 싶은 편안함을 만들어요.\n천천히, 오래 입는 옷",
  logo: "",
  font: "noto-serif",
  handle: "oat_studio",
  kakaoUrl: "https://pf.kakao.com/_oatstudio/chat",
  feeOnCustomer: true,
  shippingFee: 6000,
  bank: "카카오뱅크",
  accountNumber: "3333-12-3456789",
  accountHolder: "오트스튜디오",
  productMode: "list",
  allowOther: true,
  products: [
    { id: "p1", name: "Classic Wool Jacket", colors: "블랙 / 차콜", sizes: "S / M / L", kind: "jacket", img: "" },
    { id: "p2", name: "Linen Half Shirt", colors: "아이보리 / 스카이블루", sizes: "S / M / L", kind: "shirt", img: "" },
    { id: "p3", name: "Wide Denim Pants", colors: "연청 / 중청", sizes: "S / M / L", kind: "pants", img: "" },
    { id: "p4", name: "Balloon Skirt", colors: "블랙, 베이지", sizes: "FREE", kind: "skirt", img: "" },
  ],
  reasons: [
    { id: "size", label: "사이즈 불만족", free: false },
    { id: "mind", label: "단순 변심", free: false },
    { id: "color", label: "색상 불만", free: false },
    { id: "defect", label: "상품 불량", free: true },
    { id: "wrong", label: "오배송", free: true },
  ],
  faqs: [
    {
      id: "f1",
      q: "반품 신청은 어떻게 하나요?",
      a: "이 페이지의 '교환/반품 1분 간편 접수'에서 바로 신청할 수 있어요. 접수 후 배송비를 입금하시면 기사님이 상품을 회수하러 가요.",
    },
    {
      id: "f2",
      q: "반품 배송비는 얼마인가요?",
      a: "사이즈 불만족·단순 변심은 왕복 택배비를 부담해 주셔야 해요. 상품 불량·오배송은 저희가 전부 부담해요.",
    },
    {
      id: "f3",
      q: "교환은 어떻게 진행되나요?",
      a: "① 교환 접수 → ② 왕복 배송비 입금 → ③ 기사님 상품 회수 → ④ 상품 확인 후 새 상품 발송 순서예요. 보통 접수 후 5~7일 정도 걸려요.",
    },
    {
      id: "f4",
      q: "배송은 얼마나 걸리나요?",
      a: "결제 확인 후 영업일 기준 1~3일 안에 출고돼요. 제주·도서산간은 1~2일 더 걸릴 수 있어요.",
    },
  ],
};

const T0 = 1794300000000;

const DEFAULT_REQUESTS = [
  {
    id: "r-1001",
    no: "R-2026-11-00128",
    ts: T0 + 5,
    date: "2026.11.11",
    time: "10:23",
    type: "exchange",
    name: "김민지",
    phone4: "5678",
    product: "Classic Wool Jacket",
    kind: "jacket",
    productImg: "",
    option: "블랙 M → 블랙 L",
    reason: "사이즈 불만족",
    detail: "좀 더 여유 있게 착용하고 싶어요.",
    amount: 6000,
    paid: true,
    pickup: "done",
    pickupDate: "2026.11.12",
    courier: "CJ대한통운",
    decision: "approved",
    orderNo: "ORD-20261105-000123",
    price: 129000,
    photo: "",
    refundAccount: "",
  },
  {
    id: "r-1002",
    no: "R-2026-11-00127",
    ts: T0 + 4,
    date: "2026.11.11",
    time: "09:15",
    type: "return",
    name: "이서연",
    phone4: "5432",
    product: "Wide Denim Pants (M)",
    kind: "pants",
    productImg: "",
    option: "",
    reason: "단순 변심",
    depositor: "이영희",
    detail: "생각했던 핏과 달라서 반품할게요.",
    amount: 6000,
    paid: false,
    pickup: "none",
    pickupDate: "",
    courier: "CJ대한통운",
    decision: null,
    orderNo: "ORD-20261106-000131",
    price: 68000,
    photo: "",
    refundAccount: "토스뱅크 1000-1234-5678 (이서연)",
  },
  {
    id: "r-1003",
    no: "R-2026-11-00126",
    ts: T0 + 3,
    date: "2026.11.10",
    time: "16:42",
    type: "exchange",
    name: "박준호",
    phone4: "6789",
    product: "Linen Half Shirt",
    kind: "shirt",
    productImg: "",
    option: "아이보리 S → 아이보리 M",
    reason: "사이즈 불만족",
    detail: "어깨가 조금 끼어요.",
    memo: "금요일 오후 수거 희망하심 (통화함)",
    amount: 6000,
    paid: true,
    pickup: "progress",
    pickupDate: "",
    courier: "CJ대한통운",
    decision: "approved",
    orderNo: "ORD-20261104-000118",
    price: 54000,
    photo: "",
    refundAccount: "",
  },
  {
    id: "r-1004",
    no: "R-2026-11-00125",
    ts: T0 + 2,
    date: "2026.11.10",
    time: "11:08",
    type: "return",
    name: "최유나",
    phone4: "7890",
    product: "Balloon Skirt (블랙 FREE)",
    kind: "skirt",
    productImg: "",
    option: "",
    reason: "상품 불량",
    detail: "포켓 부분에 오염이 있습니다.",
    amount: 0,
    paid: true,
    pickup: "done",
    pickupDate: "2026.11.11",
    courier: "CJ대한통운",
    decision: "approved",
    orderNo: "ORD-20261103-000109",
    price: 72000,
    photo: "sample",
    refundAccount: "토스뱅크 1000-9876-5432 (최유나)",
  },
  {
    id: "r-1005",
    no: "R-2026-11-00124",
    ts: T0 + 1,
    date: "2026.11.09",
    time: "15:30",
    type: "exchange",
    name: "정다은",
    phone4: "8901",
    product: "Classic Wool Jacket",
    kind: "jacket",
    productImg: "",
    option: "블랙 L → 블랙 M",
    reason: "사이즈 불만족",
    detail: "소매가 조금 길어요.",
    amount: 6000,
    paid: true,
    pickup: "progress",
    pickupDate: "",
    courier: "CJ대한통운",
    decision: "approved",
    orderNo: "ORD-20261102-000097",
    price: 129000,
    photo: "",
    refundAccount: "",
  },
  {
    id: "r-1006",
    no: "R-2026-11-00123",
    ts: T0,
    date: "2026.11.09",
    time: "10:02",
    type: "return",
    name: "한지우",
    phone4: "6290",
    product: "Linen Half Shirt (아이보리 L) 외 1개",
    items: [
      { product: "Linen Half Shirt (아이보리 L)", kind: "shirt", productImg: "", option: "" },
      { product: "Wide Denim Pants (연청 M)", kind: "pants", productImg: "", option: "" },
    ],
    kind: "shirt",
    productImg: "",
    option: "",
    reason: "단순 변심",
    detail: "",
    amount: 6000,
    paid: false,
    pickup: "none",
    pickupDate: "",
    courier: "CJ대한통운",
    decision: null,
    orderNo: "ORD-20261101-000088",
    price: 54000,
    photo: "",
    refundAccount: "카카오뱅크 3333-05-1122334 (한지우)",
  },
];

const OLD_NAMES = [
  "윤서아",
  "강지호",
  "임하은",
  "오세린",
  "신유준",
  "서다인",
  "권민서",
  "황지민",
  "안채원",
  "송현우",
  "조은비",
  "배수아",
];

const OLD_ITEMS = [
  { product: "Classic Wool Jacket", kind: "jacket", opts: ["블랙 S", "블랙 M", "블랙 L"], price: 129000 },
  { product: "Linen Half Shirt", kind: "shirt", opts: ["아이보리 S", "아이보리 M", "아이보리 L"], price: 54000 },
  { product: "Wide Denim Pants", kind: "pants", opts: ["S", "M", "L"], price: 68000 },
  { product: "Balloon Skirt", kind: "skirt", opts: ["블랙 FREE", "베이지 FREE"], price: 72000 },
];

const OLD_REASONS = ["사이즈 불만족", "단순 변심", "사이즈 불만족", "색상 불만", "상품 불량"];

// 처리 완료된 지난 접수 22건 (페이지 넘김 확인용 예시)
function makeOldRequests() {
  const list = [];
  for (let i = 0; i < 22; i += 1) {
    const day = 31 - Math.floor(i * 1.3);
    const item = OLD_ITEMS[i % OLD_ITEMS.length];
    const isEx = i % 3 !== 1;
    const reason = OLD_REASONS[i % OLD_REASONS.length];
    const free = reason === "상품 불량";
    const a = item.opts[i % item.opts.length];
    const b = item.opts[(i + 1) % item.opts.length];
    const pickDay = day + 2;
    const finDay = day + 3;
    const dateOf = (d) => (d > 31 ? "2026.11." + pad(d - 31) : "2026.10." + pad(d));
    list.push({
      id: "r-0" + (900 - i),
      no: "R-2026-10-" + String(122 - i).padStart(5, "0"),
      ts: T0 - (i + 1) * 100000,
      date: dateOf(day),
      time: pad(9 + ((i * 5) % 12)) + ":" + pad((i * 17) % 60),
      type: isEx ? "exchange" : "return",
      name: OLD_NAMES[i % OLD_NAMES.length],
      phone4: String(1000 + ((i * 7919) % 9000)).slice(0, 4),
      product: isEx ? item.product : item.product + " (" + a + ")",
      kind: item.kind,
      productImg: "",
      option: isEx ? (free ? a + " (새 상품)" : a + " → " + b) : "",
      reason,
      detail: "",
      amount: free ? 0 : 6000,
      paid: true,
      pickup: "done",
      pickupDate: dateOf(pickDay),
      finished: true,
      finishedDate: dateOf(finDay),
      courier: "CJ대한통운",
      decision: "approved",
      orderNo: "ORD-202610" + pad(day) + "-000" + (300 + i),
      price: item.price,
      photo: "",
      refundAccount: "",
    });
  }
  return list;
}

// 손님이 배송 조회(track)·진행 조회(lookup)를 한 횟수 (날짜별). 예시 값으로 시작해요.
const DEFAULT_METRICS = {
  "2026.11.03": { track: 5, lookup: 2 },
  "2026.11.05": { track: 4, lookup: 3 },
  "2026.11.06": { track: 3, lookup: 1 },
  "2026.11.09": { req: 2, track: 4, lookup: 2 },
  "2026.11.10": { req: 2, track: 3, lookup: 2 },
  "2026.11.11": { req: 2, track: 4, lookup: 3 },
};

// 통계 계산 기준 (추정치)
const MIN_PER_REQUEST = 6;
const MIN_PER_LOOKUP = 2;

const REJECT_PRESETS = [
  "상품을 받은 지 7일이 지났어요",
  "착용·세탁 흔적이 있어요",
  "택(tag)이 제거됐어요",
  "주문 내역을 찾을 수 없어요",
  "같은 건으로 이미 접수됐어요",
];

const SAMPLE_ADDRESSES = [
  "서울 마포구 와우산로 94 302호",
  "서울 동대문구 이문로 107 B동 1104호",
  "경기 성남시 분당구 정자일로 95 1203호",
  "인천 연수구 송도과학로 32 805호",
  "서울 송파구 올림픽로 300 2201호",
  "부산 해운대구 센텀중앙로 79 1502호",
];

const INITIAL_REQUESTS = [
  ...DEFAULT_REQUESTS.map((r) =>
    r.id === "r-1004" ? { ...r, finished: true, finishedDate: "2026.11.11" } : r
  ),
  ...makeOldRequests(),
].map((r, i) => ({
  ...r,
  phone: "010-" + String(2000 + ((i * 3571) % 7000)) + "-" + r.phone4,
  pickupMethod: i % 3 === 0 ? "other" : "order",
  address: i % 3 === 0 ? SAMPLE_ADDRESSES[i % SAMPLE_ADDRESSES.length] : "",
}));

/* ------------------------------------------------------------------ */
/* 유틸                                                                 */
/* ------------------------------------------------------------------ */

function won(n) {
  const num = Number(n) || 0;
  return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
}

function pad(n) {
  return String(n).padStart(2, "0");
}

const DEMO_SETTINGS = { ...DEFAULT_SETTINGS, shipNotice: "11월 공구는 마감 후 7~10일 안에 주문 순서대로 보내요." };

// 예시 주문을 바꾸면 이 숫자를 올려요. 예전에 저장된 데모 주문 대신 새 예시가 보여요.
const DEMO_ORDERS_VERSION = 3;

const DEMO_ORDERS = [
  { id: "o-1", name: "김민지", p4: "5678", item: "Classic Wool Jacket (블랙 M)", courier: "CJ대한통운", inv: "689012340001", paid: true, shipDate: "2026-11-10", created_at: "2026-11-08T10:00:00" },
  { id: "o-2", name: "김민지", p4: "5678", item: "Cotton Knit Vest (오트밀)", courier: "", inv: "", paid: true, shipDate: "2026-11-20", created_at: "2026-11-11T09:00:00" },
  { id: "o-3", name: "이서연", p4: "5432", item: "Wide Denim Pants (M)", courier: "롯데택배", inv: "245678901234", paid: true, shipDate: "", created_at: "2026-11-07T15:00:00" },
  { id: "o-4", name: "박지호", p4: "1234", item: "Linen Half Shirt (아이보리 L)", courier: "", inv: "", paid: false, shipDate: "", created_at: "2026-11-12T11:00:00" },
  { id: "o-6", name: "정다은", p4: "2222", item: "Wide Denim Pants (S)", courier: "", inv: "", paid: true, shipDate: "2026-11-20", created_at: "2026-11-12T14:00:00" },
  { id: "o-7", name: "정다은", p4: "2222", item: "Cotton Knit Vest (그레이)", courier: "", inv: "", paid: true, shipDate: "2026-11-20", created_at: "2026-11-12T14:00:00" },
  { id: "o-5", name: "최유나", p4: "3456", item: "Balloon Skirt (블랙 FREE)", courier: "", inv: "", paid: true, shipDate: "", created_at: "2026-11-12T13:00:00" },
];
const DEMO_ASKS = [
  { id: "a-1", name: "최유나", p4: "3456", message: "입금자명을 엄마 이름(이정희)으로 보냈어요!", answer: "", created_at: "2026-11-12T13:20:00" },
];

function stamp() {
  const d = new Date();
  return {
    date: d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate()),
    time: pad(d.getHours()) + ":" + pad(d.getMinutes()),
    ym: d.getFullYear() + "-" + pad(d.getMonth() + 1),
  };
}

function accountText(s) {
  return s.bank + " " + s.accountNumber + " (예금주 " + s.accountHolder + ")";
}

function linkHost() {
  const real = typeof window !== "undefined" ? window.location.host : "";
  // 미리보기(아티팩트·로컬)에서는 실제 서비스 주소 모양으로 보여 줘요.
  return real && !/claudeusercontent|localhost|^$/.test(real) ? real : "returnlink.kr";
}

function shopLink(s) {
  return linkHost() + "/@" + s.handle;
}

function fontOf(id) {
  return FONTS.find((f) => f.id === id) || FONTS[0];
}

function splitOptions(text) {
  return (text || "")
    .split(/[,，/·、|\n]+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function statusOf(r) {
  if (r.decision === "rejected") return "rejected";
  if (!r.paid) return "waiting";
  if (r.pickup !== "done") return "progress";
  if (!r.finished) return "arrived";
  return "done";
}

// 목록 탭 기준 (거절한 건은 완료 탭에 모아요)
function tabOf(st) {
  return st === "rejected" ? "done" : st;
}

// 버튼을 눌렀을 때 바뀔 내용과 안내 문구를 정해요.
function transition(r, action, extra) {
  const st = statusOf(r);
  const isEx = r.type === "exchange";
  if (action === "togglePaid") {
    if (st === "rejected") return { message: "거절한 접수예요" };
    if (st === "arrived" || st === "done")
      return { message: "수거가 끝난 건은 입금 상태를 바꿀 수 없어요" };
    return r.paid
      ? {
          patch: { paid: false, pickup: "none", pickupDate: "" },
          message: r.name + "님 건을 입금확인대기로 되돌렸어요",
        }
      : {
          patch: { paid: true, pickup: "progress" },
          message: r.name + "님 입금 확인 · 수거진행으로 옮겼어요",
        };
  }
  if (action === "next") {
    if (st === "waiting") return { message: "배송비 입금 토글을 먼저 켜 주세요" };
    if (st === "progress")
      return {
        patch: { pickup: "done", pickupDate: stamp().date },
        message: r.name + "님 상품 수거 완료 · " + (isEx ? "교환품을 보내 주세요" : "환불을 진행해 주세요"),
      };
    if (st === "arrived")
      return {
        patch: { finished: true, finishedDate: stamp().date },
        message: r.name + "님 건 " + (isEx ? "교환품 발송" : "환불") + " 완료! 완료 탭으로 옮겼어요",
      };
    if (st === "rejected") return { message: "거절한 접수예요. 상세에서 거절을 취소할 수 있어요" };
    return { message: "이미 처리가 끝난 건이에요" };
  }
  if (action === "undo") {
    if (st === "arrived")
      return { patch: { pickup: "progress", pickupDate: "" }, message: "수거진행중으로 되돌렸어요" };
    if (st === "done")
      return { patch: { finished: false, finishedDate: "" }, message: "발송·환불 대기로 되돌렸어요" };
    return { message: "되돌릴 단계가 없어요" };
  }
  if (action === "reject")
    return {
      patch: { decision: "rejected", rejectReason: extra || "" },
      message: r.name + "님 접수를 거절했어요",
    };
  if (action === "unreject")
    return { patch: { decision: null, rejectReason: "" }, message: "거절을 취소했어요" };
  return { message: "" };
}

function daysAgo(dateStr) {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(dateStr || "");
  if (!m) return 0;
  const then = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - then) / 86400000);
}

// 끝난 건(완료·거절)이 기준일보다 오래됐는지
function isOldClosed(r, days) {
  const st = statusOf(r);
  if (st !== "done" && st !== "rejected") return false;
  return daysAgo(st === "done" ? r.finishedDate || r.date : r.date) >= days;
}

// 개인정보 동의 문구대로 처리 끝난 지 90일 지난 접수는 자동 삭제해요.
const KEEP_DAYS = 90;
function purgeOld(list) {
  return list.filter((r) => !isOldClosed(r, KEEP_DAYS));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function copyText(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* 아래 방식으로 다시 시도 */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

// 첨부 사진을 작게 줄여서 저장해요.
function shrinkImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("image"));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* 배송 조회                                                            */
/* ------------------------------------------------------------------ */

// 택배사 단계(level 1~6)를 화면의 4단계로 바꿔요.
function stageFromLevel(level) {
  if (level >= 6) return 3;
  if (level >= 5) return 2;
  if (level >= 3) return 1;
  return 0;
}

const STAGE_TEXT = [
  { headline: "상품 인수 · 출고 준비 중", sub: "택배사가 상품을 받아서 곧 출발해요." },
  { headline: "이동 중 · 곧 도착 예정", sub: "배송 지역 터미널로 이동하고 있어요." },
  { headline: "배송 출발 · 오늘 도착 예정", sub: "기사님이 배송을 출발했어요." },
  { headline: "배송 완료", sub: "배송이 완료됐어요." },
];

function demoTracking(number, courierName) {
  const last = Number(number[number.length - 1]);
  const level = last <= 2 ? 3 : last <= 7 ? 5 : 6;
  const all = [
    { time: "어제 16:20", place: "서울 성동 집화점", text: "상품을 인수했어요" },
    { time: "어제 21:45", place: "곤지암 허브", text: "간선 상차 후 이동 중이에요" },
    { time: "오늘 07:12", place: "서울 동대문 배송점", text: "배송지 터미널에 도착했어요" },
    { time: "오늘 09:30", place: "서울 동대문 배송점", text: "기사님이 배송을 출발했어요" },
    { time: "오늘 13:48", place: "문 앞", text: "배송이 완료됐어요" },
  ];
  const count = level === 3 ? 2 : level === 5 ? 4 : 5;
  const stage = stageFromLevel(level);
  return {
    number,
    courierName,
    stage,
    demo: true,
    headline: STAGE_TEXT[stage].headline,
    sub: STAGE_TEXT[stage].sub,
    history: all.slice(0, count).reverse(),
  };
}

function realTracking(number, courierName, data) {
  const stage = stageFromLevel(Number(data.level) || 1);
  const latest = data.history && data.history[0];
  return {
    number,
    courierName,
    stage,
    demo: false,
    headline: STAGE_TEXT[stage].headline.split(" · ")[0],
    sub: latest ? latest.place + "에서 " + latest.text : STAGE_TEXT[stage].sub,
    history: data.history || [],
  };
}

/* ------------------------------------------------------------------ */
/* 공용 UI                                                              */
/* ------------------------------------------------------------------ */

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-3 text-neutral-900 placeholder:text-neutral-400 outline-none transition focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10";

const panelClass = "rounded-2xl border border-neutral-200/80 bg-white shadow-card";

const outlineBtn =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-300 bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 transition active:scale-95";

function Garment({ kind, className }) {
  const body = "M22 8l10 6 10-6 14 10-6 9-6-4v33H20V23l-6 4-6-9z";
  if (kind === "pants") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M20 8h24l4 48H36l-4-30-4 30H16z" fill="#6B93C4" />
        <path d="M20 8h24v5H20z" fill="#557DB0" />
      </svg>
    );
  }
  if (kind === "skirt") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d="M22 12h20l12 42H10z" fill="#1F1F1F" />
        <path d="M22 12h20v5H22z" fill="#3D3D3D" />
      </svg>
    );
  }
  if (kind === "jacket") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d={body} fill="#2A2A2A" />
        <path d="M22 8l10 20 10-20" fill="none" stroke="#5A5A5A" strokeWidth="1.5" />
        <path d="M32 28v28" stroke="#5A5A5A" strokeWidth="1.5" />
      </svg>
    );
  }
  if (kind === "shirt") {
    return (
      <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
        <path d={body} fill="#FBF8F2" stroke="#D9D2C5" strokeWidth="1.5" />
        <path d="M32 14v42" stroke="#D9D2C5" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d={body} fill="#D8C9B0" />
    </svg>
  );
}

function Thumb({ kind, img, size = "h-16 w-16" }) {
  return (
    <span
      className={
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 " + size
      }
    >
      {img ? (
        <img src={img} alt="" className="h-full w-full object-cover" />
      ) : (
        <Garment kind={kind} className="h-[78%] w-[78%]" />
      )}
    </span>
  );
}

function StainSample() {
  return (
    <svg viewBox="0 0 320 180" className="h-full w-full" role="img" aria-label="예시 상품 상태 사진">
      <rect width="320" height="180" fill="#D9CDB6" />
      <path d="M0 40h320M0 90h320M0 140h320" stroke="#CFC2A9" strokeWidth="1" />
      <path d="M150 50h170M150 50v130" stroke="#B9AB90" strokeWidth="3" fill="none" />
      <circle cx="70" cy="70" r="16" fill="#B7A27A" stroke="#9C8A66" strokeWidth="2" />
      <ellipse cx="215" cy="112" rx="34" ry="20" fill="#A8873F" opacity="0.45" />
      <ellipse cx="228" cy="118" rx="16" ry="9" fill="#8F6E2C" opacity="0.4" />
    </svg>
  );
}

// 접수 → 입금 → 수거 → 발송/환불 진행 단계
function Steps({ r }) {
  const st = statusOf(r);
  const doneCount = { waiting: 1, progress: 2, arrived: 3, done: 4, rejected: 1 }[st];
  const labels = [
    "접수",
    r.amount > 0 ? "입금 확인" : "배송비 무료",
    "상품 수거",
    r.type === "exchange" ? "교환품 발송" : "환불 완료",
  ];
  return (
    <ol className="flex items-start">
      {labels.map((label, i) => {
        const done = i < doneCount;
        const current = i === doneCount && st !== "rejected";
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center">
            {i > 0 ? (
              <span
                className={
                  "absolute right-1/2 top-[9px] h-0.5 w-full " + (done ? "bg-emerald-600" : "bg-neutral-200")
                }
              />
            ) : null}
            <span
              className={
                "relative z-10 flex h-5 w-5 items-center justify-center rounded-full border-2 " +
                (done
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : current
                  ? "border-emerald-600 bg-white"
                  : "border-neutral-200 bg-white")
              }
            >
              {done ? (
                <Check size={11} strokeWidth={3} />
              ) : current ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              ) : null}
            </span>
            <span
              className={
                "mt-1 whitespace-nowrap text-[11px] " +
                (done ? "font-medium text-neutral-700" : current ? "font-bold text-emerald-700" : "text-neutral-400")
              }
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

// 빠진 항목 안내를 다시 흔들어 보여 주기 위한 번호
const FlashContext = createContext(0);

function Field({ label, error, hint, children }) {
  const flash = useContext(FlashContext);
  return (
    <label className="block scroll-mt-24" data-error={error ? "true" : undefined}>
      {label ? (
        <span className="mb-1.5 block text-[13px] font-semibold text-neutral-700">{label}</span>
      ) : null}
      {children}
      {hint ? <span className="mt-1 block text-[12px] text-neutral-400">{hint}</span> : null}
      {error ? (
        <span key={flash} className="error-flash mt-1 block text-[12px] font-medium text-rose-500">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectBox({ value, onChange, children, label, muted }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={inputClass + " appearance-none pr-10 " + (muted ? "text-neutral-400" : "")}
      >
        {children}
      </select>
      <ChevronDown
        size={18}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
      />
    </div>
  );
}

function Toggle({ checked, onChange, label, tone = "green", small = false, disabled = false }) {
  const on = tone === "blue" ? "bg-blue-500" : "bg-emerald-600";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={
        "relative shrink-0 rounded-full transition-all duration-300 active:scale-90 " +
        (disabled ? "opacity-40 " : "") +
        (small ? "h-6 w-11 " : "h-7 w-12 ") +
        (checked ? on : "bg-neutral-200")
      }
    >
      <span
        className={
          "absolute left-0.5 top-0.5 rounded-full bg-white shadow-md transition-transform duration-300 ease-out " +
          (small ? "h-5 w-5 " : "h-6 w-6 ") +
          (checked ? "translate-x-5" : "translate-x-0")
        }
      />
    </button>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      key={toast.id}
      role="status"
      className="animate-toast fixed bottom-6 left-1/2 z-[70] flex max-w-[88vw] items-center gap-2 rounded-full bg-neutral-900 px-4 py-3 text-[14px] font-medium text-white shadow-lg"
    >
      {toast.tone === "warn" ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500 text-[13px] font-bold">
          !
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
          <Check size={13} strokeWidth={3} />
        </span>
      )}
      <span className="truncate">{toast.message}</span>
    </div>
  );
}

function Modal({ title, desc, onClose, footer, children, z = "z-50" }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className={"fixed inset-0 flex items-end justify-center sm:items-center sm:p-4 " + z}>
      <div
        className="animate-fade-in absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet relative flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-neutral-900">{title}</h2>
            {desc ? <p className="mt-1 text-[12px] text-neutral-500">{desc}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 pb-4">{children}</div>
        {footer ? (
          <div className="flex items-center gap-2 border-t border-neutral-200 px-5 py-4">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}

function Box2({ title, hint, children, right }) {
  return (
    <section className="rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-bold text-neutral-900">{title}</h3>
        {right}
      </div>
      {hint ? <p className="mt-1 text-[12px] text-neutral-500">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 손님 화면                                                            */
/* ------------------------------------------------------------------ */

function CustomerCard({ children, className = "" }) {
  return <section className={panelClass + " p-5 " + className}>{children}</section>;
}

function CustomerTitle({ icon, title, desc }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-neutral-900">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-100 text-neutral-700">
          {icon}
        </span>
        {title}
      </h2>
      {desc ? <p className="mt-1.5 text-[13px] text-neutral-500">{desc}</p> : null}
    </div>
  );
}

function BrandHeader({ settings, compact = false }) {
  const font = fontOf(settings.font);
  const initial = (settings.marketName || "R").trim().charAt(0) || "R";
  return (
    <header className={"text-center " + (compact ? "py-2" : "px-1 pb-1 pt-3")}>
      <div
        className={
          "mx-auto flex items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-white text-neutral-900 shadow-card " +
          (compact ? "h-14 w-14 text-[22px]" : "h-20 w-20 text-[30px]")
        }
        style={{ fontFamily: font.family, fontWeight: font.weight }}
      >
        {settings.logo ? (
          <img src={settings.logo} alt={settings.marketName + " 로고"} className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </div>
      <h1
        className="mt-3 leading-tight tracking-tight text-neutral-900"
        style={{
          fontFamily: font.family,
          fontWeight: font.weight,
          fontSize: (compact ? 20 : 26) * font.scale + "px",
        }}
      >
        {settings.marketName}
      </h1>
      {settings.intro ? (
        <p
          className="mx-auto mt-2 max-w-[300px] whitespace-pre-line leading-relaxed text-neutral-500"
          style={{
            fontFamily: font.family,
            fontSize: (compact ? 12.5 : 14) * font.scale + "px",
          }}
        >
          {settings.intro}
        </p>
      ) : null}
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700">
        <ShieldCheck size={14} />
        공식 안심 CS 센터
      </div>
    </header>
  );
}

function TrackingCard({ onTracked }) {
  const [courier, setCourier] = useState("");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const alive = useRef(true);
  const seq = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const search = async (code, value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (!code) {
      setError("택배사를 먼저 골라 주세요.");
      setResult(null);
      return;
    }
    if (digits.length < 9 || digits.length > 14) {
      setError("운송장 번호를 숫자로 정확히 입력해 주세요.");
      setResult(null);
      return;
    }
    const courierName = (COURIERS.find((c) => c.code === code) || {}).name || "";
    const mySeq = ++seq.current;
    setError("");
    setResult(null);
    setLoading(true);

    let view = null;
    let failMessage = "";
    try {
      const res = await fetch(
        "/api/track?courier=" + encodeURIComponent(code) + "&invoice=" + digits
      );
      const data = await res.json();
      if (data && data.ok && !data.demo) view = realTracking(digits, courierName, data);
      else if (data && data.ok === false) failMessage = data.message || "배송 정보를 찾지 못했어요.";
    } catch (e) {
      /* 서버가 없는 미리보기에서는 예시 데이터로 보여 줘요 */
    }
    if (!view && !failMessage) {
      await wait(500);
      view = demoTracking(digits, courierName);
    }
    if (!alive.current || mySeq !== seq.current) return;
    setLoading(false);
    if (failMessage) setError(failMessage);
    else {
      setResult(view);
      if (onTracked) onTracked();
    }
  };

  const steps = [
    { label: "상품 인수", icon: <Package size={16} /> },
    { label: "이동 중", icon: <ArrowRight size={16} /> },
    { label: "배송 출발", icon: <Truck size={16} /> },
    { label: "배송 완료", icon: <PackageCheck size={16} /> },
  ];

  return (
    <CustomerCard>
      <CustomerTitle
        icon={<Truck size={16} />}
        title="내 택배 어디쯤 왔을까?"
        desc="택배사를 고르고 운송장 번호를 넣으면 바로 확인할 수 있어요."
      />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          search(courier, number);
        }}
        className="space-y-2"
      >
        <SelectBox
          value={courier}
          onChange={(v) => {
            setCourier(v);
            setError("");
          }}
          label="택배사"
          muted={!courier}
        >
          <option value="" disabled>
            택배사 선택
          </option>
          {COURIERS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </SelectBox>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d-]/g, ""))}
            placeholder="운송장 번호 입력"
            aria-label="운송장 번호"
            className={inputClass + " min-w-0 flex-1"}
          />
          <button
            type="submit"
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-900 px-4 font-semibold text-white transition active:scale-95 disabled:opacity-60"
          >
            <Search size={16} />
            조회
          </button>
        </div>
      </form>
      <button
        type="button"
        onClick={() => {
          setCourier("04");
          setNumber(SAMPLE_TRACKING);
          search("04", SAMPLE_TRACKING);
        }}
        className="mt-2 text-[12px] font-medium text-neutral-500 underline underline-offset-2"
      >
        예시 번호로 조회해 보기
      </button>
      {error ? <p className="mt-2 text-[12px] font-medium text-rose-500">{error}</p> : null}

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-neutral-50 px-4 py-4 text-[14px] text-neutral-500">
          <RefreshCw size={16} className="animate-spin text-emerald-600" />
          택배사에서 배송 정보를 불러오는 중이에요…
        </div>
      ) : null}

      {result ? (
        <div className="animate-fade-up mt-4 rounded-xl bg-neutral-50 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[12px] text-neutral-500">
                {result.courierName} · {result.number}
              </p>
              <p className="mt-0.5 text-[18px] font-bold text-emerald-600">{result.headline}</p>
              <p className="mt-0.5 text-[13px] text-neutral-600">{result.sub}</p>
            </div>
            {result.demo ? (
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-neutral-400">
                예시 데이터
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex items-start">
            {steps.map((s, i) => {
              const done = i <= result.stage;
              const current = i === result.stage;
              return (
                <div key={s.label} className="relative flex flex-1 flex-col items-center">
                  {i > 0 ? (
                    <span
                      className={
                        "absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 " +
                        (done ? "bg-emerald-600" : "bg-neutral-200")
                      }
                    />
                  ) : null}
                  <span
                    className={
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 " +
                      (done
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-neutral-200 bg-white text-neutral-300") +
                      (current ? " ring-4 ring-emerald-600/20" : "")
                    }
                  >
                    {s.icon}
                  </span>
                  <span
                    className={
                      "mt-1.5 whitespace-nowrap text-[11px] " +
                      (current
                        ? "font-bold text-emerald-600"
                        : done
                        ? "font-medium text-neutral-600"
                        : "text-neutral-400")
                    }
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {result.history.length > 0 ? (
            <ul className="mt-4 space-y-2.5 border-t border-neutral-200 pt-3">
              {result.history.map((h, i) => (
                <li key={h.time + i} className="flex gap-3 text-[13px]">
                  <span
                    className={
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full " +
                      (i === 0 ? "bg-emerald-600" : "bg-neutral-300")
                    }
                  />
                  <div>
                    <p className={i === 0 ? "font-semibold text-neutral-900" : "text-neutral-600"}>
                      {h.text}
                    </p>
                    <p className="text-[12px] text-neutral-400">
                      {h.time} · {h.place}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </CustomerCard>
  );
}

const OTHER = "__other";

const EMPTY_FORM = {
  type: "exchange",
  name: "",
  phone: "",
  address: "",
  addressDetail: "",
  productId: "",
  productText: "",
  curColor: "",
  curSize: "",
  wishColor: "",
  wishSize: "",
  wishText: "",
  reasonId: "",
  detail: "",
  refundAccount: "",
  photo: "",
  depositor: "",
  pickupMethod: "order",
  agree: false,
};

function formatPhone(value) {
  const d = (value || "").replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return d.slice(0, 3) + "-" + d.slice(3);
  if (d.length === 10) return d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
  return d.slice(0, 3) + "-" + d.slice(3, 7) + "-" + d.slice(7);
}

function optLabel(color, size) {
  return [color, size].filter(Boolean).join(" ");
}

function changeKind(curColor, curSize, color, size) {
  const c = color !== curColor;
  const s = size !== curSize;
  if (c && s) return "색상·사이즈 교환";
  if (c) return "색상 교환";
  if (s) return "사이즈 교환";
  return "";
}

function Chips({ options, value, onChange, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value === o;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o)}
            className={
              "min-w-[52px] rounded-full border px-3.5 py-2 text-[14px] font-medium transition active:scale-95 " +
              (on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700")
            }
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function OptionPicker({ title, colors, sizes, color, size, onColor, onSize, error }) {
  const flash = useContext(FlashContext);
  return (
    <div
      data-error={error ? "true" : undefined}
      className={"rounded-xl border p-3.5 transition-colors " + (error ? "border-rose-300" : "border-neutral-200")}
    >
      <p className="text-[13px] font-semibold text-neutral-700">{title}</p>
      {colors.length > 0 ? (
        <div className="mt-2.5">
          <p className="mb-1.5 text-[12px] text-neutral-500">색상</p>
          <Chips options={colors} value={color} onChange={onColor} label={title + " 색상"} />
        </div>
      ) : null}
      {sizes.length > 0 ? (
        <div className="mt-2.5">
          <p className="mb-1.5 text-[12px] text-neutral-500">사이즈</p>
          <Chips options={sizes} value={size} onChange={onSize} label={title + " 사이즈"} />
        </div>
      ) : null}
      {error ? (
        <p key={flash} className="error-flash mt-2 text-[12px] font-medium text-rose-500">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function RequestForm({ settings, onSubmit, showToast, onTrack }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [flash, setFlash] = useState(0);
  const [cart, setCart] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const fileRef = useRef(null);
  const formRef = useRef(null);

  // 빠진 항목이 있으면 첫 번째 항목으로 부드럽게 이동해요.
  useEffect(() => {
    if (!flash || !formRef.current) return;
    const el = formRef.current.querySelector('[data-error="true"]');
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [flash]);

  const isExchange = form.type === "exchange";
  const listMode = settings.productMode === "list" && settings.products.length > 0;
  const product = listMode ? settings.products.find((p) => p.id === form.productId) : null;
  const isOtherProduct = listMode && form.productId === OTHER;
  const colors = product ? splitOptions(product.colors) : [];
  const sizes = product ? splitOptions(product.sizes) : [];
  const hasOpts = colors.length > 0 || sizes.length > 0;
  const curDone = (!colors.length || !!form.curColor) && (!sizes.length || !!form.curSize);
  const wishColor = form.wishColor || form.curColor;
  const wishSize = form.wishSize || form.curSize;
  const kind = changeKind(form.curColor, form.curSize, wishColor, wishSize);
  const typeWord = isExchange ? "교환" : "반품";

  const reason = settings.reasons.find((r) => r.id === form.reasonId);
  const isFree = !settings.feeOnCustomer || (reason ? reason.free : false);
  const amount = isFree ? 0 : Number(settings.shippingFee) || 0;

  const set = (patch, errKey) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => {
        next[k] = "";
      });
      if (errKey) next[errKey] = "";
      return next;
    });
  };

  const pickProduct = (id) => {
    const p = settings.products.find((x) => x.id === id);
    const cs = p ? splitOptions(p.colors) : [];
    const ss = p ? splitOptions(p.sizes) : [];
    set(
      {
        productId: id,
        curColor: cs.length === 1 ? cs[0] : "",
        curSize: ss.length === 1 ? ss[0] : "",
        wishColor: "",
        wishSize: "",
        wishText: "",
      },
      "product"
    );
  };

  const handleCopy = async () => {
    const ok = await copyText(accountText(settings));
    if (ok) {
      setCopied(true);
      showToast("계좌번호를 복사했어요");
      setTimeout(() => setCopied(false), 1800);
    } else {
      showToast("복사가 안 됐어요. 길게 눌러 직접 복사해 주세요");
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const data = await shrinkImage(file);
      set({ photo: data });
    } catch (err) {
      showToast("사진을 불러오지 못했어요");
    }
    e.target.value = "";
  };

  const itemStarted = listMode ? !!form.productId : !!form.productText.trim();

  // 지금 고른 상품 1개를 검사해서 접수용 항목으로 만들어요.
  const checkItem = () => {
    const err = {};
    if (listMode) {
      if (!form.productId) err.product = "상품을 골라 주세요.";
      else if (isOtherProduct && !form.productText.trim()) err.product = "상품명을 입력해 주세요.";
      else if (product && hasOpts && !curDone) err.cur = "받으신 옵션을 골라 주세요.";
    } else if (!form.productText.trim()) {
      err.product = "상품명을 입력해 주세요.";
    }
    if (isExchange && !err.product && !err.cur) {
      if (product && hasOpts) {
        if (!kind) err.wish = "받으신 것과 다른 색상이나 사이즈를 골라 주세요.";
      } else if (!form.wishText.trim()) {
        err.wish = "어떤 옵션으로 바꿀지 알려 주세요.";
      }
    }
    if (Object.keys(err).length) return { err };
    const baseName = product ? product.name : form.productText.trim();
    const cur = product ? optLabel(form.curColor, form.curSize) : "";
    return {
      item: {
        product: !isExchange && cur ? baseName + " (" + cur + ")" : baseName,
        kind: product ? product.kind || "default" : "default",
        productImg: product ? product.img || "" : "",
        option: isExchange
          ? product && hasOpts
            ? cur + " → " + optLabel(wishColor, wishSize)
            : form.wishText.trim()
          : "",
        changeKind: isExchange && product && hasOpts ? kind : "",
      },
    };
  };

  const RESET_ITEM = {
    productId: "",
    productText: "",
    curColor: "",
    curSize: "",
    wishColor: "",
    wishSize: "",
    wishText: "",
  };

  const addToCart = () => {
    const res = checkItem();
    if (res.err) {
      setErrors((prev) => ({ ...prev, ...res.err }));
      setFlash((f) => f + 1);
      showToast("담을 상품을 먼저 골라 주세요", "warn");
      return;
    }
    setCart((c) => [...c, res.item]);
    set(RESET_ITEM, "product");
    showToast("담았어요. 다음 상품을 골라 주세요");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const digits = form.phone.replace(/\D/g, "");
    const next = {};
    if (!form.name.trim()) next.name = "주문자 성함을 입력해 주세요.";
    if (!/^01\d{8,9}$/.test(digits)) next.phone = "휴대폰 번호를 정확히 입력해 주세요.";
    if (form.pickupMethod === "other" && !form.address.trim())
      next.address = "상품을 가져갈 주소를 입력해 주세요.";
    const items = [...cart];
    if (itemStarted || cart.length === 0) {
      const res = checkItem();
      if (res.err) Object.assign(next, res.err);
      else items.push(res.item);
    }
    if (!reason) next.reasonId = "사유를 선택해 주세요.";
    if (!form.agree) next.agree = "개인정보 수집·이용에 동의해 주세요.";
    setErrors(next);
    const missing = Object.keys(next).length;
    if (missing > 0) {
      setFlash((f) => f + 1);
      showToast("빠진 항목 " + missing + "개를 확인해 주세요", "warn");
      return;
    }

    const now = stamp();
    const request = {
      id: "r-" + Date.now(),
      no: "R-" + now.ym + "-" + String(Date.now()).slice(-5),
      ts: Date.now(),
      date: now.date,
      time: now.time,
      type: form.type,
      name: form.name.trim(),
      phone: formatPhone(digits),
      phone4: digits.slice(-4),
      pickupMethod: form.pickupMethod,
      address:
        form.pickupMethod === "other"
          ? (form.address.trim() + " " + form.addressDetail.trim()).trim()
          : "",
      items,
      product: items[0].product + (items.length > 1 ? " 외 " + (items.length - 1) + "개" : ""),
      kind: items[0].kind,
      productImg: items[0].productImg,
      option: items.map((i) => i.option).filter(Boolean).join(" / "),
      changeKind: items.length === 1 ? items[0].changeKind : "",
      reason: reason.label,
      depositor: amount > 0 ? form.depositor.trim() || form.name.trim() : "",
      detail: form.detail.trim(),
      amount,
      paid: amount === 0,
      pickup: amount === 0 ? "progress" : "none",
      pickupDate: "",
      courier: "CJ대한통운",
      decision: null,
      orderNo: "",
      price: 0,
      photo: form.photo,
      refundAccount: isExchange ? "" : form.refundAccount.trim(),
    };
    setSubmitting(true);
    let saved = null;
    try {
      saved = await onSubmit(request);
    } catch (err) {
      saved = null;
    }
    setSubmitting(false);
    if (!saved) {
      showToast("접수가 잠시 안 돼요. 잠시 후 다시 눌러 주세요", "warn");
      return;
    }
    setSubmitted(saved);
    setForm(EMPTY_FORM);
    setCart([]);
    showToast("접수가 완료됐어요");
  };

  if (submitted) {
    return (
      <CustomerCard className="animate-fade-up text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <Check size={28} strokeWidth={3} />
        </div>
        <h2 className="mt-3 text-[18px] font-bold text-neutral-900">
          {submitted.type === "exchange" ? "교환" : "반품"} 접수가 완료됐어요
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
          {submitted.amount > 0
            ? "아래 금액을 입금해 주시면 바로 회수를 접수해 드릴게요."
            : "배송비는 저희가 부담해요. 곧 회수 기사님이 방문할 거예요."}
        </p>
        <dl className="mt-4 space-y-2 rounded-xl bg-neutral-50 p-4 text-left text-[13px]">
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-neutral-500">상품 {itemsOf(submitted).length}개</dt>
            <dd className="space-y-0.5 text-right font-medium text-neutral-900">
              {itemsOf(submitted).map((it, i) => (
                <span key={i} className="block">
                  {it.product}
                  {it.option ? <span className="block text-[12px] font-normal text-neutral-500">{it.option}</span> : null}
                </span>
              ))}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-neutral-500">회수 장소</dt>
            <dd className="text-right font-medium text-neutral-900">
              {submitted.address || "주문 때 받은 주소"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 border-t border-neutral-200 pt-2">
            <dt className="shrink-0 text-neutral-500">입금하실 금액</dt>
            <dd className="text-right text-[15px] font-bold text-emerald-600">
              {submitted.amount > 0 ? won(submitted.amount) : "무료"}
            </dd>
          </div>
        </dl>
        {submitted.amount > 0 ? (
          <button
            type="button"
            onClick={handleCopy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-[14px] font-semibold text-neutral-800 transition active:scale-[0.98]"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            입금 계좌 복사하기
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onTrack(submitted.name, submitted.phone4)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-neutral-900 py-3 text-[14px] font-semibold text-white transition active:scale-[0.98]"
        >
          내 접수 진행 상황 보기 <ArrowRight size={15} />
        </button>
        <button
          type="button"
          onClick={() => setSubmitted(null)}
          className="mt-1 w-full rounded-xl py-3 text-[14px] font-semibold text-neutral-500"
        >
          다른 상품도 접수하기
        </button>
      </CustomerCard>
    );
  }

  return (
    <CustomerCard>
      <CustomerTitle
        icon={<ArrowLeftRight size={16} />}
        title="교환/반품 1분 간편 접수"
        desc="카톡 기다릴 필요 없이 여기서 바로 접수돼요."
      />
      <FlashContext.Provider value={flash}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        <fieldset>
          <legend className="mb-1.5 text-[13px] font-semibold text-neutral-700">접수 유형</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "exchange", icon: <ArrowLeftRight size={22} />, title: "교환", sub: "사이즈·색상 바꾸기" },
              { id: "return", icon: <Undo2 size={22} />, title: "반품", sub: "돌려보내고 환불받기" },
            ].map((t) => {
              const active = form.type === t.id;
              return (
                <label
                  key={t.id}
                  className={
                    "flex cursor-pointer flex-col items-center rounded-xl border-2 px-2 py-3 text-center transition " +
                    (active ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white")
                  }
                >
                  <input
                    type="radio"
                    name="type"
                    value={t.id}
                    checked={active}
                    onChange={() => {
                      if (cart.length) {
                        setCart([]);
                        showToast("유형을 바꿔서 담아 둔 상품을 비웠어요");
                      }
                      set({ type: t.id }, "wish");
                    }}
                    className="sr-only"
                  />
                  <span
                    className={
                      "flex h-11 w-11 items-center justify-center rounded-full transition " +
                      (active ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500")
                    }
                  >
                    {t.icon}
                  </span>
                  <span className="mt-1.5 block text-[15px] font-bold text-neutral-900">{t.title}</span>
                  <span className="block whitespace-nowrap text-[12px] text-neutral-500">{t.sub}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {cart.length ? (
          <div className="space-y-1.5">
            <p className="text-[13px] font-semibold text-neutral-700">담은 상품 {cart.length}개</p>
            {cart.map((it, i) => (
              <div key={i} className="animate-fade-up flex items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-50 p-2.5">
                <Thumb kind={it.kind} img={it.productImg} size="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-neutral-900">{it.product}</p>
                  {it.option ? <p className="truncate text-[12px] text-neutral-500">{it.option}</p> : null}
                </div>
                <button
                  type="button"
                  onClick={() => setCart((c) => c.filter((_, j) => j !== i))}
                  aria-label={it.product + " 빼기"}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {listMode ? (
          <>
            <Field label={cart.length ? "하나 더 " + typeWord + "할 상품 (선택)" : typeWord + "할 상품"} error={errors.product}>
              <SelectBox
                value={form.productId}
                onChange={pickProduct}
                label={typeWord + "할 상품"}
                muted={!form.productId}
              >
                <option value="" disabled>
                  상품을 선택해 주세요
                </option>
                {settings.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
                {settings.allowOther ? <option value={OTHER}>목록에 없어요 (직접 입력)</option> : null}
              </SelectBox>
            </Field>
            {isOtherProduct ? (
              <input
                value={form.productText}
                onChange={(e) => set({ productText: e.target.value }, "product")}
                placeholder="예) 오트 린넨 셔츠 (아이보리 M)"
                aria-label="상품명 직접 입력"
                className={inputClass + " animate-fade-up -mt-2"}
              />
            ) : null}
            {product && hasOpts ? (
              <div className="animate-fade-up space-y-2">
                <OptionPicker
                  title="받으신 옵션"
                  colors={colors}
                  sizes={sizes}
                  color={form.curColor}
                  size={form.curSize}
                  onColor={(v) => set({ curColor: v, wishColor: "" }, "cur")}
                  onSize={(v) => set({ curSize: v, wishSize: "" }, "cur")}
                  error={errors.cur}
                />
                {isExchange && curDone ? (
                  <>
                    <OptionPicker
                      title="바꾸고 싶은 옵션"
                      colors={colors}
                      sizes={sizes}
                      color={wishColor}
                      size={wishSize}
                      onColor={(v) => set({ wishColor: v }, "wish")}
                      onSize={(v) => set({ wishSize: v }, "wish")}
                      error={errors.wish}
                    />
                    <div
                      className={
                        "flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-[14px] " +
                        (kind ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-500")
                      }
                    >
                      <span className="min-w-0 truncate font-semibold">
                        {optLabel(form.curColor, form.curSize)}
                        <ArrowRight size={14} className="mx-1.5 inline -translate-y-px" />
                        {optLabel(wishColor, wishSize)}
                      </span>
                      <span className="shrink-0 text-[12px] font-medium opacity-80">
                        {kind || "바꿀 옵션을 골라 주세요"}
                      </span>
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <Field label={cart.length ? "하나 더 " + typeWord + "할 상품명 (선택)" : typeWord + "할 상품명"} error={errors.product}>
            <input
              value={form.productText}
              onChange={(e) => set({ productText: e.target.value }, "product")}
              placeholder="예) 오트 린넨 셔츠 (아이보리 M)"
              className={inputClass}
            />
          </Field>
        )}

        {isExchange && !(product && hasOpts) && (!listMode || form.productId) ? (
          <Field label="바꾸고 싶은 옵션" error={errors.wish}>
            <input
              value={form.wishText}
              onChange={(e) => set({ wishText: e.target.value }, "wish")}
              placeholder="예) 아이보리 M → 블랙 L"
              className={inputClass}
            />
          </Field>
        ) : null}

        <div>
          <button
            type="button"
            onClick={addToCart}
            className="flex w-full items-center justify-center gap-1 py-1 text-[13px] font-semibold text-neutral-500 underline-offset-2 hover:underline"
          >
            <Plus size={14} /> 상품 하나 더 {typeWord}하기 (배송비는 한 번만)
          </button>
        </div>

        <Field label="사유" error={errors.reasonId}>
          <SelectBox
            value={form.reasonId}
            onChange={(v) => set({ reasonId: v })}
            label="사유"
            muted={!form.reasonId}
          >
            <option value="" disabled>
              사유를 선택해 주세요
            </option>
            {settings.reasons.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
                {r.free && settings.feeOnCustomer ? " (배송비 무료)" : ""}
              </option>
            ))}
          </SelectBox>
        </Field>

        {showExtra || form.detail || form.photo ? (
          <div className="animate-fade-up space-y-4">
        <Field label="상세 사유 (선택)">
          <textarea
            value={form.detail}
            onChange={(e) => set({ detail: e.target.value })}
            rows={2}
            placeholder="예) 포켓 부분에 오염이 있어요"
            className={inputClass + " resize-none"}
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-neutral-700">
            상품 상태 사진 (선택)
          </span>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          {form.photo ? (
            <div className="relative overflow-hidden rounded-xl border border-neutral-200">
              <img src={form.photo} alt="첨부한 사진" className="h-40 w-full object-cover" />
              <button
                type="button"
                onClick={() => set({ photo: "" })}
                aria-label="사진 지우기"
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current && fileRef.current.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 py-4 text-[13px] font-medium text-neutral-500"
            >
              <ImagePlus size={18} />
              불량·오염 부분 사진 첨부하기
            </button>
          )}
        </div>

          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowExtra(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-neutral-200 bg-neutral-50 py-3 text-[13px] font-medium text-neutral-600"
          >
            <ImagePlus size={15} /> 상세 사유 · 사진 추가 (선택)
          </button>
        )}

        <div className="space-y-3 rounded-xl border border-neutral-200 p-3.5">
          <p className="text-[13px] font-semibold text-neutral-700">
            연락처 · 회수 정보 <span className="font-normal text-neutral-400">· 진행 안내와 상품 회수에 써요</span>
          </p>
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <Field label="주문자 성함" error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set({ name: e.target.value })}
                placeholder="홍길동"
                autoComplete="name"
                className={inputClass}
              />
            </Field>
            <Field label="휴대폰 번호" error={errors.phone}>
              <input
                value={form.phone}
                onChange={(e) => set({ phone: formatPhone(e.target.value) })}
                placeholder="010-0000-0000"
                inputMode="numeric"
                autoComplete="tel"
                className={inputClass}
              />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-neutral-700">회수 장소</span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "order", title: "주문 때 받은 주소", sub: "따로 안 적어도 돼요" },
                { id: "other", title: "다른 주소에서", sub: "회사·본가 등" },
              ].map((m) => {
                const on = form.pickupMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set({ pickupMethod: m.id }, "address")}
                    aria-pressed={on}
                    className={
                      "rounded-xl border-2 px-3 py-2.5 text-left transition " +
                      (on ? "border-neutral-900 bg-neutral-50" : "border-neutral-200 bg-white")
                    }
                  >
                    <span className="block text-[13.5px] font-bold text-neutral-900">{m.title}</span>
                    <span className="block text-[11.5px] text-neutral-500">{m.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {form.pickupMethod === "other" ? (
            <div className="animate-fade-up space-y-2">
              <Field label="회수 주소" error={errors.address}>
                <input
                  value={form.address}
                  onChange={(e) => set({ address: e.target.value })}
                  placeholder="도로명 주소"
                  autoComplete="street-address"
                  className={inputClass}
                />
              </Field>
              <input
                value={form.addressDetail}
                onChange={(e) => set({ addressDetail: e.target.value })}
                placeholder="상세 주소 (동·호수)"
                aria-label="상세 주소"
                className={inputClass}
              />
            </div>
          ) : null}
        </div>

        {!isExchange ? (
          <Field label="환불 받을 계좌 (선택)" hint="계좌이체로 결제하신 경우에만 적어 주세요.">
            <input
              value={form.refundAccount}
              onChange={(e) => set({ refundAccount: e.target.value })}
              placeholder="예) 토스뱅크 1000-1234-5678 (홍길동)"
              className={inputClass}
            />
          </Field>
        ) : null}

        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-neutral-700">
              <Banknote size={16} className="text-emerald-600" />
              왕복 택배비
            </p>
            <p className="text-[17px] font-bold text-emerald-600">{isFree ? "무료" : won(amount)}</p>
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
            {!settings.feeOnCustomer
              ? "교환·반품 배송비는 저희가 전부 부담해요."
              : isFree
              ? "이 사유는 저희가 배송비를 전부 부담해요."
              : "고객 사유 교환·반품은 왕복 택배비를 입금해 주셔야 접수가 진행돼요."}
          </p>
          {!isFree ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-2 pl-3">
              <p className="min-w-0 flex-1 break-all text-[13px] font-medium text-neutral-900">
                {accountText(settings)}
              </p>
              <button
                type="button"
                onClick={handleCopy}
                className="flex shrink-0 items-center gap-1 rounded-md bg-neutral-900 px-3 py-2 text-[13px] font-semibold text-white transition active:scale-95"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사됨" : "복사"}
              </button>
            </div>
          ) : null}
          {!isFree ? (
            <input
              value={form.depositor}
              onChange={(e) => set({ depositor: e.target.value })}
              placeholder="입금자명 (주문자와 다를 때만 적어 주세요)"
              aria-label="입금자명"
              className={inputClass + " mt-2 py-2.5 text-[14px]"}
            />
          ) : null}
        </div>

        <div data-error={errors.agree ? "true" : undefined} className="scroll-mt-24">
          <div className="flex items-start gap-2.5">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.agree}
              aria-label="개인정보 수집·이용 동의"
              onClick={() => set({ agree: !form.agree })}
              className={
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition " +
                (form.agree
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : errors.agree
                  ? "border-rose-400 bg-white"
                  : "border-neutral-300 bg-white")
              }
            >
              {form.agree ? <Check size={13} strokeWidth={3} /> : null}
            </button>
            <div className="min-w-0 flex-1 text-[13px] leading-relaxed text-neutral-700">
              <span onClick={() => set({ agree: !form.agree })} className="cursor-pointer">
                [필수] 교환·반품 처리를 위한 개인정보 수집·이용에 동의해요
              </span>{" "}
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="text-[12px] text-neutral-400 underline underline-offset-2"
              >
                {showTerms ? "접기" : "자세히"}
              </button>
              {showTerms ? (
                <ul className="animate-fade-up mt-2 space-y-0.5 rounded-lg bg-neutral-50 p-3 text-[12px] text-neutral-500">
                  <li>수집 항목: 성함, 휴대폰 번호, (다른 주소를 고른 경우) 회수 주소, (반품 시) 환불 계좌</li>
                  <li>이용 목적: 상품 회수, 교환품 발송, 환불, 진행 안내</li>
                  <li>보관 기간: 처리 완료 후 90일 뒤 삭제</li>
                  <li>수집하는 곳: {settings.marketName}</li>
                </ul>
              ) : null}
              {errors.agree ? (
                <p key={flash} className="error-flash mt-1 text-[12px] font-medium text-rose-500">
                  {errors.agree}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-neutral-900 py-4 text-[16px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "접수하는 중이에요…" : typeWord + " 접수하기"}
        </button>
      </form>
      </FlashContext.Provider>
    </CustomerCard>
  );
}

function FaqCard({ faqs }) {
  const [open, setOpen] = useState("");
  if (faqs.length === 0) return null;
  return (
    <CustomerCard>
      <CustomerTitle icon={<MessageCircle size={16} />} title="자주 묻는 질문" />
      <ul className="divide-y divide-neutral-200">
        {faqs.map((f) => {
          const isOpen = open === f.id;
          return (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? "" : f.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
              >
                <span className="text-[14px] font-semibold text-neutral-900">Q. {f.q}</span>
                <ChevronDown
                  size={18}
                  className={
                    "shrink-0 text-neutral-400 transition-transform duration-300 " +
                    (isOpen ? "rotate-180" : "")
                  }
                />
              </button>
              <div
                className={
                  "grid transition-all duration-300 ease-out " +
                  (isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
                }
              >
                <div className="overflow-hidden">
                  <p className="pb-4 text-[13px] leading-relaxed text-neutral-600">{f.a}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </CustomerCard>
  );
}

function statusSentence(r, settings) {
  const st = statusOf(r);
  const isEx = r.type === "exchange";
  if (st === "rejected")
    return (
      "접수가 반려됐어요." +
      (r.rejectReason ? " 사유: " + r.rejectReason + "." : "") +
      " 궁금한 점은 카카오톡 상담으로 문의해 주세요."
    );
  if (st === "waiting") return "왕복 배송비 " + won(r.amount) + "을 입금해 주시면 회수가 시작돼요.";
  if (st === "progress") return "기사님이 곧 상품을 가지러 가요. 상자에 담아 문 앞에 두세요.";
  if (st === "arrived")
    return isEx ? "상품이 잘 도착했어요. 교환품을 곧 보내 드려요." : "상품이 잘 도착했어요. 곧 환불해 드려요.";
  return isEx
    ? "교환품을 보냈어요 (" + r.finishedDate + "). 위에서 배송 조회를 할 수 있어요."
    : "환불을 완료했어요 (" + r.finishedDate + ").";
}

function MyRequests({ fetchLookup, settings, lookup, setLookup, showToast, sectionRef }) {
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const fetchRef = useRef(fetchLookup);
  fetchRef.current = fetchLookup;

  useEffect(() => {
    if (!lookup) return undefined;
    let alive = true;
    setName(lookup.name);
    setPhone4(lookup.phone4);
    setLoading(true);
    Promise.resolve(fetchRef.current(lookup.name, lookup.phone4))
      .then((list) => {
        if (alive) setResults(Array.isArray(list) ? [...list].sort((a, b) => b.ts - a.ts) : []);
      })
      .catch(() => {
        if (alive) {
          setResults(null);
          setError("조회가 잠시 안 돼요. 잠시 후 다시 시도해 주세요.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [lookup]);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !/^\d{4}$/.test(phone4)) {
      setError("성함과 연락처 뒤 4자리를 입력해 주세요.");
      return;
    }
    setError("");
    setLookup({ name: name.trim(), phone4, at: Date.now() });
  };

  return (
    <div ref={sectionRef} className="scroll-mt-20">
      <CustomerCard>
        <CustomerTitle
          icon={<Search size={16} />}
          title="내 교환·반품 진행 상황"
          desc="접수할 때 쓴 성함과 뒤 4자리로 지금 어디까지 왔는지 볼 수 있어요."
        />
        <form onSubmit={submit} className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="성함"
            aria-label="조회할 성함"
            className={inputClass + " min-w-0 flex-1"}
          />
          <div className="w-[92px] shrink-0">
            <input
              value={phone4}
              onChange={(e) => setPhone4(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="뒤 4자리"
              inputMode="numeric"
              aria-label="조회할 연락처 뒤 4자리"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-neutral-900 px-4 font-semibold text-white transition active:scale-95"
          >
            조회
          </button>
        </form>
        {error ? <p className="mt-2 text-[12px] font-medium text-rose-500">{error}</p> : null}

        {loading ? (
          <p className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-neutral-50 py-6 text-[13px] text-neutral-500">
            <RefreshCw size={15} className="animate-spin" /> 불러오는 중이에요
          </p>
        ) : results ? (
          results.length === 0 ? (
            <p className="animate-fade-up mt-4 rounded-xl bg-neutral-50 py-6 text-center text-[13px] text-neutral-500">
              일치하는 접수 내역이 없어요. 성함과 번호를 다시 확인해 주세요.
            </p>
          ) : (
            <ul className="animate-fade-up mt-4 space-y-3">
              {results.map((r) => {
                const st = statusOf(r);
                return (
                  <li key={r.id} className="rounded-xl border border-neutral-200 p-4">
                    <div className="flex items-start gap-3">
                      <Thumb kind={r.kind} img={r.productImg} size="h-12 w-12" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5">
                          <TypeChip type={r.type} />
                          <span className="text-[11px] text-neutral-400">
                            {r.date} 접수
                          </span>
                        </p>
                        {itemsOf(r).map((it, i) => (
                          <div key={i} className={i ? "mt-1" : "mt-1"}>
                            <p className="truncate text-[14px] font-semibold text-neutral-900">{it.product}</p>
                            {it.option ? <p className="truncate text-[12px] text-neutral-500">{it.option}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Steps r={r} />
                    </div>
                    <p
                      className={
                        "mt-3 rounded-lg px-3 py-2 text-[12.5px] leading-relaxed " +
                        (st === "rejected" ? "bg-rose-50 text-rose-700" : "bg-neutral-50 text-neutral-700")
                      }
                    >
                      {statusSentence(r, settings)}
                    </p>
                    {r.outInvoice ? (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2">
                        <Truck size={15} className="shrink-0 text-emerald-600" />
                        <p className="min-w-0 flex-1 text-[12.5px] text-neutral-700">
                          교환품 송장 · {r.outCourier} <span className="font-semibold">{r.outInvoice}</span>
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copyText(r.outInvoice);
                            showToast(ok ? "송장번호를 복사했어요" : "복사가 안 됐어요");
                          }}
                          className="shrink-0 text-[12px] font-semibold text-neutral-600 underline underline-offset-2"
                        >
                          복사
                        </button>
                      </div>
                    ) : null}
                    {st === "waiting" ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const ok = await copyText(accountText(settings));
                          showToast(ok ? "계좌번호를 복사했어요" : "복사가 안 됐어요");
                        }}
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2.5 text-[13px] font-semibold text-neutral-800"
                      >
                        <Copy size={14} /> 입금 계좌 복사하기
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )
        ) : null}
      </CustomerCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CS 센터: 주문·송장 조회 + 1:1 문의                                     */
/* ------------------------------------------------------------------ */

const COURIER_NAMES = ["CJ대한통운", "롯데택배", "한진택배", "우체국택배", "로젠택배", "CU 편의점택배", "GS25 편의점택배", "경동택배"];

function onlyDigits(s) {
  return String(s == null ? "" : s).replace(/\D/g, "");
}

function trackSearchUrl(o) {
  return "https://search.naver.com/search.naver?query=" + encodeURIComponent((o.courier || "") + " " + o.inv);
}

function shortDate(t) {
  if (!t) return "";
  const d = new Date(t);
  if (isNaN(d.getTime())) return "";
  return d.getMonth() + 1 + "/" + d.getDate() + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

// 엑셀을 읽는 도구(SheetJS)는 처음 쓸 때만 불러와요.
let xlsxPromise = null;
function loadXlsx() {
  if (typeof window !== "undefined" && window.XLSX) return Promise.resolve(window.XLSX);
  if (xlsxPromise) return xlsxPromise;
  xlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    s.async = true;
    s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error("xlsx")));
    s.onerror = () => {
      xlsxPromise = null;
      reject(new Error("xlsx"));
    };
    document.head.appendChild(s);
  });
  return xlsxPromise;
}

// CSV 는 도구 없이도 읽어요.
function parseCsvGrid(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function readSheet(file) {
  const name = (file.name || "").toLowerCase();
  if (name.endsWith(".csv")) {
    const buf = await file.arrayBuffer();
    let text = new TextDecoder("utf-8").decode(buf);
    if (text.includes("�")) {
      try {
        text = new TextDecoder("euc-kr").decode(buf);
      } catch (e) {
        /* 그대로 써요 */
      }
    }
    return rowsFromGrid(parseCsvGrid(text));
  }
  const XLSX = await loadXlsx();
  const wb = XLSX.read(new Uint8Array(await file.arrayBuffer()), { type: "array" });
  const grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "", raw: false });
  return rowsFromGrid(grid);
}

// 택배사 엑셀은 위에 제목 줄이 몇 줄 있는 경우가 많아요. 칸 이름이 있는 줄을 찾아서 거기부터 읽어요.
function rowsFromGrid(grid) {
  const keys = SHEET_FIELDS.reduce((a, f) => a.concat(f.keys), []).map(normKey);
  let headAt = 0;
  let best = 0;
  grid.slice(0, 15).forEach((row, i) => {
    const hit = row.filter((c) => {
      const n = normKey(c);
      return n && keys.some((k) => n.indexOf(k) > -1);
    }).length;
    if (hit > best) {
      best = hit;
      headAt = i;
    }
  });
  const head = (grid[headAt] || []).map((h, i) => String(h || "").replace(/^\uFEFF/, "").trim() || "칸" + (i + 1));
  return grid
    .slice(headAt + 1)
    .filter((r) => r.some((v) => String(v).trim()))
    .map((r) => {
      const o = {};
      head.forEach((h, i) => (o[h] = r[i] == null ? "" : r[i]));
      return o;
    });
}

const SHEET_FIELDS = [
  { k: "name", label: "받는 분 이름", req: true, keys: ["받는분성명", "받는분", "수취인명", "수취인", "수령인", "수하인명", "수하인", "고객명", "주문자명", "구매자명", "이름", "성함"] },
  { k: "phone", label: "전화번호", req: true, keys: ["받는분전화번호", "받는분핸드폰", "수취인연락처", "수하인휴대폰", "수하인전화", "휴대폰", "핸드폰", "연락처", "전화번호", "전화"] },
  { k: "item", label: "상품명", req: false, keys: ["상품명", "품목명", "품목", "상품", "내품명", "옵션정보"] },
  { k: "inv", label: "송장번호", req: false, keys: ["운송장번호", "송장번호", "운송장", "송장", "등기번호"] },
  { k: "courier", label: "택배사", req: false, keys: ["택배사", "배송사", "택배회사"] },
];

function normKey(s) {
  return String(s || "").replace(/[\s()·\-_/.]/g, "");
}

function autoMapColumns(cols) {
  const map = {};
  SHEET_FIELDS.forEach((f) => {
    let found = "";
    f.keys.forEach((k) => {
      if (found) return;
      const hit = cols.find((c) => normKey(c).indexOf(normKey(k)) > -1);
      if (hit) found = hit;
    });
    map[f.k] = found;
  });
  // 전화번호가 상품명·송장 칸과 겹치지 않게
  if (map.phone && (map.phone === map.inv || map.phone === map.item)) map.phone = "";
  return map;
}


// 엑셀 줄들을 지금 주문 목록에 어떻게 합칠지 계산해요.
// 송장 줄은 같은 사람(이름 + 뒤 4자리)의 송장 없는 주문에 붙여요. 상품명이 "외 2건"처럼 달라도 붙어요.
function planImport(orders, rows) {
  const cur = orders.map((o) => ({ ...o }));
  const touched = new Map();
  let add = 0;
  let upd = 0;
  let same = 0;
  const invCount = {};
  rows.forEach((r) => {
    if (r.inv) invCount[r.name + "|" + r.p4] = (invCount[r.name + "|" + r.p4] || 0) + 1;
  });
  let tmp = 0;
  rows.forEach((r) => {
    const mine = cur.filter((o) => o.name === r.name && o.p4 === r.p4);
    let targets = [];
    if (r.inv) {
      targets = mine.filter((o) => o.inv === r.inv);
      if (!targets.length && r.item) targets = mine.filter((o) => o.item === r.item);
      if (!targets.length) {
        const open = mine.filter((o) => !o.inv);
        targets = invCount[r.name + "|" + r.p4] > 1 ? open.slice(0, 1) : open;
      }
    } else {
      targets = mine.filter((o) => !r.item || !o.item || o.item === r.item).slice(0, 1);
    }
    if (targets.length) {
      targets.forEach((ex) => {
        let changed = false;
        if (r.inv && ex.inv !== r.inv) {
          ex.inv = r.inv;
          ex.courier = r.courier;
          changed = true;
        }
        if ((r.paid || r.inv) && !ex.paid) {
          ex.paid = true;
          changed = true;
        }
        if (r.item && !ex.item) {
          ex.item = r.item;
          changed = true;
        }
        if (changed) {
          touched.set(ex.id, ex);
          upd++;
        } else same++;
      });
    } else {
      const n = { ...r, id: "", _key: "new-" + tmp++, paid: !!r.paid || !!r.inv, shipDate: "" };
      cur.unshift(n);
      touched.set(n._key, n);
      add++;
    }
  });
  return { items: [...touched.values()], add, upd, same };
}

function sameOrder(o, r) {
  return o.name === r.name && o.p4 === r.p4 && (!r.item || !o.item || o.item === r.item);
}

/* ---------- 손님: 배송 조회 ---------- */

const ORDER_STEPS = ["주문 확인", "결제 확인", "발송 준비", "송장 나옴"];
const WEEK = ["일", "월", "화", "수", "목", "금", "토"];

// 주문이 지금 몇 번째 단계인지 (0부터)
function orderStep(o) {
  if (o.inv) return 3;
  if (o.shipDate) return 2;
  if (o.paid) return 1;
  return 0;
}

function orderBadge(o) {
  const st = orderStep(o);
  return [
    { label: "결제 확인 전", cls: "bg-neutral-100 text-neutral-600" },
    { label: "결제 확인", cls: "bg-blue-50 text-blue-700" },
    { label: "발송 준비", cls: "bg-orange-50 text-orange-700" },
    { label: "송장 등록", cls: "bg-emerald-50 text-emerald-700" },
  ][st];
}

function prettyDate(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd || "");
  if (!m) return "";
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number(m[2]) + "월 " + Number(m[3]) + "일(" + WEEK[d.getDay()] + ")";
}

/* ---------- 손님: 내 주문 조회 ---------- */

// 손님 화면: 상태·예정일·송장이 같은 상품끼리 카드 하나로 묶어요. (나눠 보내면 카드가 나뉘어요)
function groupBoxes(list) {
  const map = new Map();
  list.forEach((o) => {
    const key = o.inv ? "inv:" + o.inv : "s:" + orderStep(o) + ":" + (o.shipDate || "");
    if (!map.has(key)) map.set(key, { ...o, id: key, names: [] });
    map.get(key).names.push(o.item || "주문 상품");
  });
  return [...map.values()];
}

function ShipLookup({ cs, settings, onMetric, showToast, onGoReturn }) {
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState(null);

  const run = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("성함을 적어 주세요");
    if (!/^\d{4}$/.test(phone4)) return setError("전화번호 뒤 4자리를 숫자로 적어 주세요");
    setError("");
    setLoading(true);
    try {
      const res = await cs.lookupOrders(name.trim(), phone4);
      setList(res);
      if (res.length && onMetric) onMetric("lookup");
    } catch (x) {
      setList(null);
      setError("조회가 잠시 안 돼요. 잠시 후 다시 해 주세요");
    }
    setLoading(false);
  };

  const notice = (settings.shipNotice || "").trim();

  return (
    <CustomerCard>
      <CustomerTitle
        icon={<Package size={16} />}
        title="내 주문 조회"
        desc="결제 확인, 발송 예정일, 송장번호를 여기서 바로 확인해요."
      />
      {notice ? (
        <div className="mb-4 flex gap-2.5 rounded-xl bg-amber-50 px-3.5 py-3 text-[13.5px] leading-relaxed text-amber-900">
          <Clock size={16} className="mt-0.5 shrink-0" />
          <p className="whitespace-pre-line">{notice}</p>
        </div>
      ) : null}
      <form onSubmit={run} className="grid grid-cols-2 gap-2.5">
        <Field label="주문자 성함">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="김민지" autoComplete="name" />
        </Field>
        <Field label="전화번호 뒤 4자리">
          <input
            value={phone4}
            onChange={(e) => setPhone4(onlyDigits(e.target.value).slice(0, 4))}
            className={inputClass}
            inputMode="numeric"
            placeholder="5678"
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="col-span-2 rounded-xl bg-neutral-900 py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "찾는 중…" : "조회하기"}
        </button>
      </form>
      {error ? <p className="mt-2 text-[13px] font-medium text-rose-500">{error}</p> : null}
      <div aria-live="polite">
        {list && !list.length ? (
          <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-[13.5px] leading-relaxed text-neutral-600">
            조회되는 주문이 없어요. 주문할 때 쓴 이름과 번호가 맞는지 확인해 주세요. 방금 주문했다면 사장님이 확인하는 대로 여기에 떠요.
          </p>
        ) : null}
        {list && list.length
          ? groupBoxes(list).map((o) => {
              const st = orderStep(o);
              const msg = [
                "주문이 잘 들어왔어요. 결제가 확인되면 여기에 바로 표시돼요.",
                "결제가 확인됐어요. 발송 날짜가 정해지면 여기에 알려 드려요.",
                o.shipDate ? prettyDate(o.shipDate) + "쯤 보낼 예정이에요." : "발송을 준비하고 있어요.",
                "송장이 나왔어요. 택배 기사님이 가져가면 하루 안에 위치 조회가 돼요.",
              ][st];
              return (
                <div key={o.id} className="mt-4 rounded-xl border border-neutral-200 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {o.names.map((n, i) => (
                        <p key={i} className="text-[15px] font-bold leading-snug text-neutral-900">
                          {n}
                        </p>
                      ))}
                    </div>
                    <span className={"shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold " + orderBadge(o).cls}>
                      {ORDER_STEPS[st]}
                    </span>
                  </div>
                  {o.names.length > 1 ? (
                    <p className="mt-1 text-[12px] text-neutral-500">상품 {o.names.length}개 · {o.inv ? "한 상자로 같이 보내요" : "같이 준비하고 있어요"}</p>
                  ) : null}
                  <ol className="mt-3 grid grid-cols-4 gap-1 text-center text-[11.5px]">
                    {ORDER_STEPS.map((s, i) => (
                      <li key={s} className="flex flex-col items-center gap-1">
                        <span
                          className={
                            "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold " +
                            (i <= st ? "bg-emerald-600 text-white" : "border border-neutral-300 bg-white text-neutral-400")
                          }
                        >
                          {i < st ? <Check size={13} /> : i + 1}
                        </span>
                        <span className={i <= st ? "font-semibold text-neutral-800" : "text-neutral-400"}>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3 rounded-lg bg-neutral-50 px-3 py-2.5 text-[13.5px] leading-relaxed text-neutral-700">{msg}</p>
                  {st === 2 && o.shipDate ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-orange-700">
                      <Truck size={14} /> 발송 예정 {prettyDate(o.shipDate)}
                    </p>
                  ) : null}
                  {o.inv ? (
                    <>
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-neutral-200 px-3 py-2.5">
                        <p className="min-w-0 text-[13.5px] text-neutral-700">
                          {o.courier} <b className="text-neutral-900">{o.inv}</b>
                        </p>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await copyText(o.inv);
                            showToast(ok ? "송장번호를 복사했어요" : "복사가 안 됐어요");
                          }}
                          className="shrink-0 rounded-lg bg-neutral-900 px-3 py-1.5 text-[12.5px] font-semibold text-white"
                        >
                          복사
                        </button>
                      </div>
                      <a
                        href={trackSearchUrl(o)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-neutral-300 py-3 text-[14px] font-semibold text-neutral-800"
                      >
                        <MapPin size={15} /> 지금 어디쯤인지 보기
                      </a>
                    </>
                  ) : null}
                </div>
              );
            })
          : null}
        {list && list.length ? (
          <button
            type="button"
            onClick={onGoReturn}
            className="mt-3 w-full text-center text-[13px] font-semibold text-neutral-600 underline underline-offset-2"
          >
            받은 상품을 교환·반품하고 싶어요
          </button>
        ) : null}
      </div>
    </CustomerCard>
  );
}

/* ---------- 손님: 1:1 문의 ---------- */

function AskCard({ cs, settings, showToast }) {
  const [name, setName] = useState("");
  const [phone4, setPhone4] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState(null);

  const check = () => {
    if (!name.trim()) {
      setError("성함을 적어 주세요");
      return false;
    }
    if (!/^\d{4}$/.test(phone4)) {
      setError("전화번호 뒤 4자리를 숫자로 적어 주세요");
      return false;
    }
    setError("");
    return true;
  };

  const loadMine = async () => {
    if (!check()) return;
    try {
      setMine(await cs.lookupAsks(name.trim(), phone4));
    } catch (e) {
      setError("불러오기가 잠시 안 돼요. 잠시 후 다시 해 주세요");
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!check()) return;
    if (!msg.trim()) return setError("문의 내용을 적어 주세요");
    setBusy(true);
    const ok = await cs.submitAsk(name.trim(), phone4, msg.trim());
    setBusy(false);
    if (!ok) {
      setError("보내지 못했어요. 잠시 후 다시 해 주세요");
      return;
    }
    setMsg("");
    showToast("문의를 남겼어요. 답변은 여기서 확인할 수 있어요");
    loadMine();
  };

  return (
    <>
      <CustomerCard>
        <CustomerTitle icon={<MessageCircle size={16} />} title="1:1 문의" desc="남겨 주시면 사장님이 확인하고 답을 드려요." />
        <form onSubmit={send} className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="성함">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
            </Field>
            <Field label="전화번호 뒤 4자리">
              <input
                value={phone4}
                onChange={(e) => setPhone4(onlyDigits(e.target.value).slice(0, 4))}
                className={inputClass}
                inputMode="numeric"
              />
            </Field>
          </div>
          <Field label="문의 내용" hint={msg.length + " / 500"}>
            <textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value.slice(0, 500))}
              rows={4}
              className={inputClass + " resize-none"}
              placeholder="예) 입금자명을 엄마 이름으로 보냈어요"
            />
          </Field>
          {error ? <p className="text-[13px] font-medium text-rose-500">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 py-3.5 text-[15px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {busy ? "보내는 중…" : "문의 남기기"}
          </button>
          <button
            type="button"
            onClick={loadMine}
            className="w-full text-center text-[13px] font-semibold text-neutral-600 underline underline-offset-2"
          >
            내가 남긴 문의와 답변 보기
          </button>
        </form>
        {mine ? (
          <div className="mt-4 space-y-2" aria-live="polite">
            {mine.length ? (
              mine.map((a) => (
                <div key={a.id} className="rounded-xl border border-neutral-200 p-3.5 text-[13.5px]">
                  <p className="text-[12px] text-neutral-400">{shortDate(a.created_at)}</p>
                  <p className="mt-1 whitespace-pre-wrap text-neutral-800">{a.message}</p>
                  {a.answer ? (
                    <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2.5">
                      <p className="text-[12px] font-bold text-emerald-700">사장님 답변</p>
                      <p className="mt-0.5 whitespace-pre-wrap text-neutral-800">{a.answer}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-[12.5px] text-neutral-400">답변을 기다리는 중이에요</p>
                  )}
                </div>
              ))
            ) : (
              <p className="rounded-xl bg-neutral-50 p-3.5 text-[13px] text-neutral-500">아직 남긴 문의가 없어요.</p>
            )}
          </div>
        ) : null}
      </CustomerCard>
      {validKakaoUrl(settings.kakaoUrl) ? (
        <a
          href={normalizeKakaoUrl(settings.kakaoUrl)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-4 text-[15px] font-bold text-[#191919] shadow-card transition active:scale-[0.98]"
        >
          <MessageCircle size={18} fill="#191919" />
          급하면 카카오톡으로 바로 문의하기
        </a>
      ) : null}
    </>
  );
}

/* ---------- 사장님: 주문·송장 ---------- */

function OrdersPanel({ orders, onImport, onSave, onDelete, onBulk, settings, onSaveSettings, showToast }) {
  const [sel, setSel] = useState([]);
  const [bulkDate, setBulkDate] = useState("");
  const [notice, setNotice] = useState(settings.shipNotice || "");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [over, setOver] = useState(false);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const fileRef = useRef(null);
  // 되돌리기: 방금 한 일 하나를 기억해 뒀다가 원래대로 돌려놓아요.
  const [undo, setUndo] = useState(null);
  const ordersNow = useRef(orders);
  ordersNow.current = orders;
  const snapshot = (ids) => ordersNow.current.filter((o) => ids.includes(o.id)).map((o) => ({ ...o }));
  const remember = (label, before, newIds) => setUndo({ label, before, newIds, at: Date.now() });
  useEffect(() => {
    if (!undo) return undefined;
    const t = setTimeout(() => setUndo(null), 30000);
    return () => clearTimeout(t);
  }, [undo]);
  const runUndo = async () => {
    const u = undo;
    if (!u) return;
    setUndo(null);
    let ok = true;
    if (u.newIds.length) ok = (await onDelete(u.newIds)) && ok;
    if (u.before.length) ok = !!(await onImport(u.before)) && ok;
    showToast(ok ? "되돌렸어요" : "되돌리기가 일부 안 됐어요. 목록을 확인해 주세요", ok ? undefined : "warn");
  };

  const takeFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const rows = (await readSheet(file)).filter((r) => Object.values(r).some((v) => String(v).trim()));
      if (!rows.length) {
        showToast("빈 파일이에요", "warn");
      } else {
        const cols = Object.keys(rows[0]);
        setPending({ label: file.name, rows, cols, map: autoMapColumns(cols), courier: COURIER_NAMES[0], paidAll: true });
      }
    } catch (e) {
      showToast("파일을 읽지 못했어요. 엑셀(.xlsx)이나 CSV 파일인지 확인해 주세요", "warn");
    }
    setBusy(false);
  };

  const parsed = useMemo(() => {
    if (!pending) return null;
    const m = pending.map;
    const good = [];
    let bad = 0;
    const badRows = [];
    pending.rows.forEach((r, idx) => {
      const name = String(r[m.name] || "").trim().slice(0, 40);
      const p4 = onlyDigits(r[m.phone]).slice(-4);
      if (!name || p4.length !== 4) {
        bad++;
        if (badRows.length < 3)
          badRows.push({ n: idx + 1, why: !name ? "이름이 비어 있어요" : "전화번호가 4자리보다 짧아요 (" + (String(r[m.phone] || "").trim() || "빈칸") + ")" });
        return;
      }
      const inv = m.inv ? String(r[m.inv] || "").replace(/[^0-9A-Za-z]/g, "").slice(0, 40) : "";
      good.push({
        name,
        p4,
        item: m.item ? String(r[m.item] || "").trim().slice(0, 200) : "",
        inv,
        courier: inv ? ((m.courier ? String(r[m.courier] || "").trim() : "") || pending.courier).slice(0, 30) : "",
        paid: !!pending.paidAll || !!inv,
      });
    });
    const pl = planImport(orders, good);
    return { rows: good, items: pl.items, add: pl.add, upd: pl.upd, same: pl.same, bad, badRows };
  }, [pending, orders]);

  const doImport = async () => {
    if (!parsed || !parsed.rows.length) return;
    if (!parsed.items.length) {
      showToast("바뀐 게 없어요. 이미 다 들어가 있어요");
      setPending(null);
      return;
    }
    setBusy(true);
    const before = snapshot(parsed.items.filter((o) => o.id).map((o) => o.id));
    const saved = await onImport(parsed.items);
    setBusy(false);
    if (saved) {
      const newIds = Array.isArray(saved) ? saved.filter((o) => !before.some((b) => b.id === o.id)).map((o) => o.id) : [];
      remember("엑셀 반영 · 새 주문 " + parsed.add + "건, 바뀐 주문 " + parsed.upd + "건", before, newIds);
      showToast("새 주문 " + parsed.add + "건, 바뀐 주문 " + parsed.upd + "건을 반영했어요");
      setPending(null);
    }
  };

  // 같은 사람(이름 + 뒤 4자리)의 상품들을 한 줄로 묶어요.
  const groups = useMemo(() => {
    const k = normKey(q).toLowerCase();
    const map = new Map();
    orders.forEach((o) => {
      const key = o.name + "|" + o.p4;
      if (!map.has(key)) map.set(key, { key, name: o.name, p4: o.p4, items: [], at: o.created_at || "" });
      const g = map.get(key);
      g.items.push(o);
      if (String(o.created_at || "") > g.at) g.at = String(o.created_at || "");
    });
    return [...map.values()]
      .map((g) => {
        const steps = g.items.map(orderStep);
        const step = Math.min(...steps);
        const invs = [...new Set(g.items.filter((o) => o.inv).map((o) => o.courier + " · " + o.inv))];
        const dates = [...new Set(g.items.filter((o) => !o.inv && o.shipDate).map((o) => o.shipDate))];
        return { ...g, step, mixed: Math.max(...steps) !== step, invs, dates, ids: g.items.map((o) => o.id) };
      })
      .filter((g) => {
        if (filter === "unpaid" && g.step !== 0) return false;
        if (filter === "ready" && (g.step === 0 || g.step === 3)) return false;
        if (filter === "sent" && g.step !== 3) return false;
        if (!k) return true;
        return normKey(g.name + g.p4 + g.items.map((o) => o.inv + o.item).join("")).toLowerCase().indexOf(k) > -1;
      })
      .sort((a, b) => (a.at < b.at ? 1 : -1));
  }, [orders, q, filter]);
  const people = new Set(orders.map((o) => o.name + "|" + o.p4)).size;
  const unpaid = orders.filter((o) => orderStep(o) === 0).length;
  const ORDER_PAGE = 20;
  const pages = Math.max(1, Math.ceil(groups.length / ORDER_PAGE));
  const curPage = Math.min(page, pages);
  const shown = groups.slice((curPage - 1) * ORDER_PAGE, curPage * ORDER_PAGE);
  const allOn = shown.length > 0 && shown.every((g) => g.ids.every((id) => sel.includes(id)));
  const toggleGroup = (g) => {
    const on = g.ids.every((id) => sel.includes(id));
    setSel((p) => (on ? p.filter((x) => !g.ids.includes(x)) : [...new Set([...p, ...g.ids])]));
  };
  const selPeople = new Set(orders.filter((o) => sel.includes(o.id)).map((o) => o.name + "|" + o.p4)).size;
  const runBulk = async (patch, msg) => {
    if (!sel.length) return;
    const before = snapshot(sel);
    const ok = await onBulk(sel, patch);
    if (ok) {
      remember(selPeople + "명 " + msg, before, []);
      showToast(selPeople + "명 " + msg);
      setSel([]);
    }
  };
  const [open, setOpen] = useState({});
  const [groupEdit, setGroupEdit] = useState(null);

  return (
    <div className="space-y-4">
      <section className={panelClass + " p-5"}>
        <h2 className="text-[17px] font-bold text-neutral-900">손님에게 보일 발송 안내</h2>
        <p className="mt-1 text-[13px] text-neutral-500">
          손님이 &lsquo;주문 조회&rsquo;를 열면 맨 위에 보여요. &ldquo;언제 보내요?&rdquo; 문의가 가장 많이 줄어드는 칸이에요.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label className="flex-1">
            <span className="sr-only">발송 안내 문구</span>
            <textarea
              value={notice}
              onChange={(e) => setNotice(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="예) 11월 공구는 마감 후 7~10일 안에 주문 순서대로 보내요. 계좌이체 입금은 하루 한 번 저녁에 확인해요."
              className={inputClass + " resize-none text-[14px]"}
            />
          </label>
          <button
            type="button"
            disabled={notice.trim() === (settings.shipNotice || "").trim()}
            onClick={() => {
              onSaveSettings({ ...settings, shipNotice: notice.trim() });
              showToast("발송 안내를 저장했어요");
            }}
            className="rounded-xl bg-neutral-900 px-5 py-3 text-[14px] font-bold text-white disabled:opacity-40 sm:self-stretch"
          >
            저장
          </button>
        </div>
      </section>

      <section className={panelClass + " p-5"}>
        <h2 className="text-[17px] font-bold text-neutral-900">주문·송장 엑셀 올리기</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
          주문 엑셀을 올리면 손님이 &lsquo;주문 확인&rsquo;을 볼 수 있어요. 나중에 송장 엑셀을 올리면 같은 사람(이름 + 전화번호 뒤 4자리)에게
          송장이 알아서 붙어요.
        </p>
        <button
          type="button"
          onClick={() => fileRef.current && fileRef.current.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            takeFile(e.dataTransfer.files && e.dataTransfer.files[0]);
          }}
          className={
            "mt-4 flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-4 py-7 text-center transition " +
            (over ? "border-emerald-500 bg-emerald-50" : "border-neutral-300 bg-neutral-50 hover:border-neutral-400")
          }
        >
          <Inbox size={28} className="text-emerald-600" />
          <span className="mt-2 text-[15px] font-bold text-neutral-900">
            {busy ? "읽는 중…" : "엑셀(.xlsx, .csv)을 끌어다 놓거나 눌러서 고르세요"}
          </span>
          <span className="mt-1 text-[12.5px] text-neutral-500">택배사·스마트스토어 엑셀 그대로 OK · 칸 이름을 알아서 찾아요</span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          aria-label="엑셀 파일 고르기"
          onChange={(e) => {
            takeFile(e.target.files && e.target.files[0]);
            e.target.value = "";
          }}
        />

        {pending && parsed ? (
          <div className="mt-5 border-t border-neutral-100 pt-4">
            <p className="text-[15px] font-bold text-neutral-900">
              {pending.label} · {pending.rows.length}줄
            </p>
            <p className="mt-0.5 text-[12.5px] text-neutral-500">칸을 맞게 찾았는지 확인해 주세요. 틀리면 바꿔 주세요.</p>
            {!pending.map.name || !pending.map.phone ? (
              <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13.5px] leading-relaxed text-rose-800" role="alert">
                <p className="font-bold">
                  {[!pending.map.name ? "받는 분 이름" : "", !pending.map.phone ? "전화번호" : ""].filter(Boolean).join("·")} 칸을 찾지 못했어요
                </p>
                <p className="mt-1">아래 칸에서 직접 골라 주세요. 이 파일에 있는 칸 이름은 이래요:</p>
                <p className="mt-1 text-[12.5px] text-rose-700">{pending.cols.slice(0, 20).join(" · ")}</p>
              </div>
            ) : null}
            {pending.map.name && pending.map.phone && !pending.map.inv ? (
              <p className="mt-3 rounded-xl bg-blue-50 px-4 py-2.5 text-[13px] text-blue-800">
                송장번호 칸이 없어요. 주문만 등록돼요. 송장 엑셀이라면 &lsquo;송장번호&rsquo; 칸을 직접 골라 주세요.
              </p>
            ) : null}
            {parsed.bad && pending.map.name && pending.map.phone ? (
              <div className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-[13px] text-amber-900">
                <p>
                  <b>{parsed.bad}줄은 건너뛰어요.</b> 이름이나 전화번호가 없는 줄이에요.
                </p>
                <ul className="mt-1 text-[12.5px] text-amber-800">
                  {parsed.badRows.map((b) => (
                    <li key={b.n}>
                      · {b.n}번째 줄: {b.why}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {pending.map.name && pending.map.phone && !parsed.rows.length ? (
              <p className="mt-3 rounded-xl bg-rose-50 px-4 py-2.5 text-[13px] font-medium text-rose-800">
                읽을 수 있는 줄이 하나도 없어요. 고른 칸이 맞는지 다시 확인해 주세요.
              </p>
            ) : null}
            <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
              {SHEET_FIELDS.map((f) => (
                <Field key={f.k} label={f.label + (f.req ? " *" : "")}>
                  <select
                    value={pending.map[f.k]}
                    onChange={(e) => setPending({ ...pending, map: { ...pending.map, [f.k]: e.target.value } })}
                    className={inputClass + " py-2.5 text-[14px]"}
                  >
                    <option value="">(없음)</option>
                    {pending.cols.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
              {!pending.map.courier ? (
                <Field label="택배사 (파일에 없을 때)">
                  <select
                    value={pending.courier}
                    onChange={(e) => setPending({ ...pending, courier: e.target.value })}
                    className={inputClass + " py-2.5 text-[14px]"}
                  >
                    {COURIER_NAMES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              ) : null}
            </div>
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-neutral-200 px-3.5 py-3">
              <input
                type="checkbox"
                checked={!!pending.paidAll}
                onChange={(e) => setPending({ ...pending, paidAll: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-neutral-900"
              />
              <span className="text-[13.5px] leading-relaxed text-neutral-800">
                <b>이 파일의 주문은 모두 결제가 끝났어요</b>
                <span className="block text-[12.5px] text-neutral-500">
                  카드·스마트스토어 결제처럼 이미 결제된 주문이면 켜 두세요. 계좌이체 입금을 아직 확인하지 않았다면 끄고, 나중에 체크해서
                  &lsquo;결제 확인&rsquo;을 누르면 돼요.
                </span>
              </span>
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-bold">
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">새 주문 {parsed.add}</span>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">바뀜(송장·결제) {parsed.upd}</span>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-neutral-600">그대로 {parsed.same}</span>
              {parsed.bad ? (
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">건너뜀 {parsed.bad} (이름·번호 없음)</span>
              ) : null}
            </div>
            <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-neutral-100">
              <table className="w-full text-left text-[13px]">
                <thead className="sticky top-0 bg-neutral-50 text-[12px] text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">받는 분</th>
                    <th className="px-3 py-2 font-semibold">뒤 4자리</th>
                    <th className="px-3 py-2 font-semibold">상품</th>
                    <th className="px-3 py-2 font-semibold">송장</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.rows.slice(0, 8).map((r, i) => (
                    <tr key={i} className="border-t border-neutral-100">
                      <td className="whitespace-nowrap px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.p4}</td>
                      <td className="max-w-[240px] truncate px-3 py-2">{r.item}</td>
                      <td className="whitespace-nowrap px-3 py-2">{r.inv ? r.courier + " " + r.inv : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={doImport}
                disabled={busy || !pending.map.name || !pending.map.phone || !parsed.rows.length}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-[14px] font-bold text-white transition active:scale-95 disabled:opacity-40"
              >
                {busy ? "올리는 중…" : parsed.rows.length + "건 등록하기"}
              </button>
              <button type="button" onClick={() => setPending(null)} className={outlineBtn + " py-3"}>
                취소
              </button>
              {!pending.map.name || !pending.map.phone ? (
                <span className="text-[12.5px] font-medium text-rose-500">이름과 전화번호 칸은 꼭 골라 주세요</span>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={panelClass + " p-5"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[17px] font-bold text-neutral-900">
            주문 목록{" "}
            <span className="text-[13px] font-medium text-neutral-500">
              손님 {people}명 · 상품 {orders.length}개 · 결제 확인 전 {unpaid} · 송장 대기 {orders.filter((o) => !o.inv).length}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setEdit({ id: "", name: "", p4: "", item: "", courier: COURIER_NAMES[0], inv: "", paid: true, shipDate: "" })}
            className="flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-semibold text-white"
          >
            <Plus size={15} /> 직접 추가
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1">
            <span className="sr-only">검색</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="이름, 뒤 4자리, 송장번호, 상품 검색"
              className={inputClass + " py-2.5 pl-9 text-[14px]"}
            />
          </label>
          <Segmented
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={[
              { id: "all", label: "전체" },
              { id: "unpaid", label: "결제 확인 전" },
              { id: "ready", label: "발송 준비" },
              { id: "sent", label: "송장 등록" },
            ]}
          />
        </div>
        {undo ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5" role="status">
            <RotateCcw size={16} className="shrink-0 text-amber-700" />
            <p className="min-w-0 flex-1 text-[13.5px] text-amber-900">
              방금: <b>{undo.label}</b>
            </p>
            <button type="button" onClick={runUndo} className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-[13px] font-bold text-white">
              되돌리기
            </button>
            <button type="button" onClick={() => setUndo(null)} aria-label="되돌리기 알림 닫기" className="shrink-0 text-amber-700">
              <X size={16} />
            </button>
          </div>
        ) : null}
        {sel.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-neutral-900 px-4 py-3 text-white">
            <span className="text-[13.5px] font-bold">
              {selPeople}명 선택 <span className="font-normal text-white/60">(상품 {sel.length}개)</span>
            </span>
            <span className="flex-1" />
            <button type="button" onClick={() => runBulk({ paid: true }, "결제 확인했어요")} className="rounded-lg bg-white px-3 py-2 text-[13px] font-semibold text-neutral-900">
              결제 확인
            </button>
            <label className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1">
              <span className="text-[12.5px]">발송 예정일</span>
              <input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} className="rounded-md bg-white px-2 py-1 text-[13px] text-neutral-900" />
            </label>
            <button
              type="button"
              disabled={!bulkDate}
              onClick={() => runBulk({ paid: true, shipDate: bulkDate }, "발송 예정일을 " + prettyDate(bulkDate) + "로 정했어요")}
              className="rounded-lg bg-emerald-500 px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              예정일 저장
            </button>
            <button type="button" onClick={() => runBulk({ paid: false }, "결제 확인을 취소했어요")} className="rounded-lg px-2 py-2 text-[12.5px] text-white/80 underline underline-offset-2">
              결제 취소
            </button>
            <button type="button" onClick={() => setConfirmDel({ ids: sel, people: selPeople })} className="rounded-lg bg-rose-500 px-3 py-2 text-[13px] font-semibold text-white">
              삭제
            </button>
            <button type="button" onClick={() => setSel([])} className="px-2 py-2 text-[13px] text-white/70">
              선택 취소
            </button>
          </div>
        ) : (
          <p className="mt-3 text-[12.5px] text-neutral-500">
            한 손님이 여러 개를 사도 한 줄로 묶여요. 체크하면 그 손님 상품 전체에 &lsquo;결제 확인&rsquo;, &lsquo;발송 예정일&rsquo;이 한 번에 적용돼요.
          </p>
        )}
        <div className="mt-3 overflow-x-auto rounded-xl border border-neutral-100">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-neutral-50 text-[12px] text-neutral-500">
              <tr>
                <th className="w-10 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="보이는 손님 모두 선택"
                    checked={allOn}
                    onChange={() => {
                      const ids = shown.reduce((a, g) => a.concat(g.ids), []);
                      setSel(allOn ? sel.filter((id) => !ids.includes(id)) : [...new Set([...sel, ...ids])]);
                    }}
                    className="h-4 w-4 accent-neutral-900"
                  />
                </th>
                <th className="px-3 py-2.5 font-semibold">손님</th>
                <th className="px-3 py-2.5 font-semibold">뒤 4자리</th>
                <th className="px-3 py-2.5 font-semibold">상품</th>
                <th className="px-3 py-2.5 font-semibold">상태</th>
                <th className="px-3 py-2.5 font-semibold">발송 예정 · 송장</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => {
                const on = g.ids.every((id) => sel.includes(id));
                const isOpen = !!open[g.key];
                const badge = orderBadge({ inv: g.step === 3 ? "x" : "", shipDate: g.step >= 2 ? "x" : "", paid: g.step >= 1 });
                return (
                  <React.Fragment key={g.key}>
                    <tr className={"border-t border-neutral-100 " + (on ? "bg-neutral-50" : "")}>
                      <td className="px-3 py-2.5">
                        <input type="checkbox" aria-label={g.name + " 선택"} checked={on} onChange={() => toggleGroup(g)} className="h-4 w-4 accent-neutral-900" />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-neutral-900">{g.name}</td>
                      <td className="px-3 py-2.5">{g.p4}</td>
                      <td className="max-w-[280px] px-3 py-2.5 text-neutral-700">
                        {g.items.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => setOpen({ ...open, [g.key]: !isOpen })}
                            aria-expanded={isOpen}
                            className="flex max-w-full items-center gap-1 text-left"
                          >
                            <span className="truncate">{(g.items[0].item || "상품") + " 외 " + (g.items.length - 1) + "개"}</span>
                            <ChevronDown size={15} className={"shrink-0 text-neutral-400 transition " + (isOpen ? "rotate-180" : "")} />
                          </button>
                        ) : (
                          <span className="block truncate">{g.items[0].item || "-"}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={"whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold " + badge.cls}>{badge.label}</span>
                        {g.mixed ? <span className="ml-1.5 whitespace-nowrap text-[11.5px] text-neutral-400">일부 진행</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-neutral-700">
                        {g.invs.length > 1
                          ? "나눠 보냄 · 송장 " + g.invs.length + "개"
                          : g.invs.length === 1 && g.step === 3
                          ? g.invs[0]
                          : g.dates.length
                          ? prettyDate(g.dates[0]) + " 예정"
                          : g.invs.length
                          ? "일부 송장 등록"
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => setGroupEdit(g)} className={outlineBtn + " px-3 py-1.5"}>
                            {g.step === 3 ? "수정" : "송장 넣기"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDel({ ids: g.ids, people: 1, name: g.name })}
                            aria-label={g.name + " 주문 삭제"}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isOpen
                      ? g.items.map((o) => (
                          <tr key={o.id} className="bg-neutral-50/60 text-[13px]">
                            <td />
                            <td colSpan={2} className="px-3 py-2 text-right text-[12px] text-neutral-400">
                              └ 상품별
                            </td>
                            <td className="max-w-[280px] truncate px-3 py-2 text-neutral-700">{o.item || "-"}</td>
                            <td className="px-3 py-2">
                              <span className={"whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-bold " + orderBadge(o).cls}>{orderBadge(o).label}</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                              {o.inv ? o.courier + " · " + o.inv : o.shipDate ? prettyDate(o.shipDate) + " 예정" : "-"}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex justify-end gap-1.5">
                                <button type="button" onClick={() => setEdit({ ...o, courier: o.courier || COURIER_NAMES[0] })} className={outlineBtn + " px-2.5 py-1 text-[12px]"}>
                                  이 상품만 수정
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDel({ ids: [o.id], people: 0, name: o.name + " · " + (o.item || "") })}
                                  aria-label={(o.item || "상품") + " 삭제"}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-rose-50 hover:text-rose-600"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      : null}
                  </React.Fragment>
                );
              })}
              {!shown.length ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[13.5px] text-neutral-400">
                    {orders.length ? "검색 결과가 없어요" : "아직 주문이 없어요. 위에서 엑셀을 올리거나 직접 추가해 보세요"}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        {pages > 1 ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] text-neutral-500">
              손님 {groups.length}명 중 {(curPage - 1) * ORDER_PAGE + 1}–{Math.min(curPage * ORDER_PAGE, groups.length)}
            </p>
            <Pager page={curPage} pages={pages} onPage={setPage} />
          </div>
        ) : null}
        <p className="mt-2 text-[12px] text-neutral-400">
          나눠 보낼 때는 상품명 옆 화살표를 눌러 &lsquo;이 상품만 수정&rsquo;으로 송장을 따로 넣어요. 주문 기록은 개인정보 보호를 위해 올린 지 90일이 지나면 자동으로 지워져요.
        </p>
      </section>

      {groupEdit ? (
        <GroupShipModal
          group={groupEdit}
          onClose={() => setGroupEdit(null)}
          onSave={async (patch) => {
            const before = snapshot(groupEdit.ids);
            const ok = await onBulk(groupEdit.ids, patch);
            if (ok) {
              remember(groupEdit.name + "님 주문 수정", before, []);
              setGroupEdit(null);
              showToast(groupEdit.name + "님 주문 " + groupEdit.ids.length + "개에 저장했어요");
            }
          }}
        />
      ) : null}

      {edit ? (
        <OrderEditModal
          order={edit}
          onClose={() => setEdit(null)}
          onSave={async (o) => {
            const before = o.id ? snapshot([o.id]) : [];
            const ok = await onSave(o);
            if (ok) {
              if (o.id) remember(o.name + "님 상품 수정", before, []);
              setEdit(null);
              showToast("저장했어요");
            }
          }}
        />
      ) : null}
      {confirmDel ? (
        <Modal
          title={confirmDel.people > 1 ? confirmDel.people + "명의 주문을 지울까요?" : "이 주문을 지울까요?"}
          desc={(confirmDel.name ? confirmDel.name + " · " : "") + "상품 " + confirmDel.ids.length + "개"}
          onClose={() => setConfirmDel(null)}
          footer={
            <>
              <button type="button" onClick={() => setConfirmDel(null)} className={outlineBtn + " flex-1 py-3"}>
                취소
              </button>
              <button
                type="button"
                onClick={async () => {
                  const ids = confirmDel.ids;
                  setConfirmDel(null);
                  const before = snapshot(ids);
                  const ok = await onDelete(ids);
                  if (ok) {
                    remember("상품 " + ids.length + "개 삭제", before, []);
                    showToast("상품 " + ids.length + "개를 지웠어요");
                    setSel((p) => p.filter((x) => !ids.includes(x)));
                  }
                }}
                className="flex-1 rounded-lg bg-rose-600 py-3 text-[14px] font-bold text-white"
              >
                지우기
              </button>
            </>
          }
        >
          <p className="text-[13.5px] text-neutral-600">손님이 더 이상 조회할 수 없어요. 공구가 끝나면 한꺼번에 지워도 돼요.</p>
        </Modal>
      ) : null}
    </div>
  );
}

// 한 손님의 상품 전체에 결제·예정일·송장을 한 번에 넣어요. (상자 하나로 같이 보낼 때)
function GroupShipModal({ group, onClose, onSave }) {
  const first = group.items.find((o) => o.inv) || group.items[0];
  const [paid, setPaid] = useState(group.items.every((o) => o.paid) || group.step >= 1);
  const [shipDate, setShipDate] = useState(group.dates[0] || "");
  const [courier, setCourier] = useState(first.courier || COURIER_NAMES[0]);
  const [inv, setInv] = useState(group.invs.length === 1 ? first.inv : "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const clean = String(inv || "").replace(/[^0-9A-Za-z]/g, "");
    const patch = { paid: paid || !!clean, shipDate };
    if (clean) {
      patch.inv = clean;
      patch.courier = courier;
    }
    await onSave(patch);
    setBusy(false);
  };
  return (
    <Modal
      title={group.name + "님 주문"}
      desc={"상품 " + group.items.length + "개 · 뒤 4자리 " + group.p4}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={outlineBtn + " flex-1 py-3"}>
            닫기
          </button>
          <button type="button" onClick={save} disabled={busy} className="flex-[2] rounded-lg bg-neutral-900 py-3 text-[14px] font-bold text-white disabled:opacity-60">
            {busy ? "저장 중…" : "상품 " + group.items.length + "개에 저장"}
          </button>
        </>
      }
    >
      <ul className="space-y-1 rounded-xl bg-neutral-50 px-3.5 py-3 text-[13.5px] text-neutral-700">
        {group.items.map((o) => (
          <li key={o.id} className="flex items-center justify-between gap-2">
            <span className="truncate">{o.item || "상품"}</span>
            <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-bold " + orderBadge(o).cls}>{orderBadge(o).label}</span>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="결제">
          <button
            type="button"
            onClick={() => setPaid(!paid)}
            aria-pressed={paid}
            className={
              "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3.5 py-3 text-[14px] font-semibold " +
              (paid ? "border-blue-600 bg-blue-50 text-blue-700" : "border-neutral-200 bg-white text-neutral-500")
            }
          >
            {paid ? (
              <>
                <Check size={15} /> 결제 확인됨
              </>
            ) : (
              "결제 확인 전"
            )}
          </button>
        </Field>
        <Field label="발송 예정일 (선택)">
          <input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
        <Field label="택배사">
          <select value={courier} onChange={(e) => setCourier(e.target.value)} className={inputClass}>
            {COURIER_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="송장번호" hint="상자 하나로 같이 보냈다면 여기 한 번만">
          <input value={inv} onChange={(e) => setInv(e.target.value.slice(0, 40))} inputMode="numeric" className={inputClass} />
        </Field>
      </div>
      {group.invs.length > 1 ? (
        <p className="text-[12.5px] text-amber-700">이미 상품별로 송장이 따로 들어가 있어요. 여기에 적으면 모든 상품이 같은 송장으로 바뀌어요.</p>
      ) : null}
    </Modal>
  );
}

function OrderEditModal({ order, onClose, onSave }) {
  const [d, setD] = useState(order);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const save = async () => {
    if (!d.name.trim()) return setErr("받는 분 이름을 적어 주세요");
    if (!/^\d{4}$/.test(d.p4)) return setErr("전화번호 뒤 4자리를 숫자로 적어 주세요");
    setErr("");
    setBusy(true);
    const inv = String(d.inv || "").replace(/[^0-9A-Za-z]/g, "");
    await onSave({ ...d, name: d.name.trim(), item: (d.item || "").trim(), inv, courier: inv ? d.courier : "", paid: !!d.paid || !!inv, shipDate: d.shipDate || "" });
    setBusy(false);
  };
  return (
    <Modal
      title={order.id ? "주문 수정" : "주문 직접 추가"}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={outlineBtn + " flex-1 py-3"}>
            닫기
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="flex-[2] rounded-lg bg-neutral-900 py-3 text-[14px] font-bold text-white disabled:opacity-60"
          >
            {busy ? "저장 중…" : "저장"}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="받는 분">
          <input value={d.name} onChange={(e) => set("name", e.target.value.slice(0, 40))} className={inputClass} />
        </Field>
        <Field label="전화번호 뒤 4자리">
          <input value={d.p4} onChange={(e) => set("p4", onlyDigits(e.target.value).slice(0, 4))} inputMode="numeric" className={inputClass} />
        </Field>
      </div>
      <Field label="상품명">
        <input value={d.item} onChange={(e) => set("item", e.target.value.slice(0, 200))} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-2.5">
        <Field label="결제">
          <button
            type="button"
            onClick={() => set("paid", !d.paid)}
            aria-pressed={!!d.paid}
            className={
              "flex w-full items-center justify-center gap-1.5 rounded-xl border px-3.5 py-3 text-[14px] font-semibold " +
              (d.paid ? "border-blue-600 bg-blue-50 text-blue-700" : "border-neutral-200 bg-white text-neutral-500")
            }
          >
            {d.paid ? (
              <>
                <Check size={15} /> 결제 확인됨
              </>
            ) : (
              "결제 확인 전"
            )}
          </button>
        </Field>
        <Field label="발송 예정일 (선택)">
          <input type="date" value={d.shipDate || ""} onChange={(e) => set("shipDate", e.target.value)} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-2.5">
        <Field label="택배사">
          <select value={d.courier} onChange={(e) => set("courier", e.target.value)} className={inputClass}>
            {COURIER_NAMES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="송장번호" hint="송장이 나오면 적어 주세요">
          <input value={d.inv} onChange={(e) => set("inv", e.target.value.slice(0, 40))} inputMode="numeric" className={inputClass} />
        </Field>
      </div>
      {err ? <p className="text-[13px] font-medium text-rose-500">{err}</p> : null}
    </Modal>
  );
}

/* ---------- 사장님: 1:1 문의 ---------- */

function AsksPanel({ asks, onAnswer, onDelete, showToast }) {
  const [drafts, setDrafts] = useState({});
  const [show, setShow] = useState("open");
  const open = asks.filter((a) => !a.answer);
  const list = show === "open" ? open : asks;
  return (
    <section className={panelClass + " p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[17px] font-bold text-neutral-900">1:1 문의</h2>
        <Segmented
          value={show}
          onChange={setShow}
          options={[
            { id: "open", label: "답변 대기 " + open.length },
            { id: "all", label: "전체 " + asks.length },
          ]}
        />
      </div>
      <div className="mt-4 space-y-3">
        {list.map((a) => {
          const draft = drafts[a.id] != null ? drafts[a.id] : a.answer;
          return (
            <div key={a.id} className={"rounded-xl border p-4 " + (a.answer ? "border-neutral-200" : "border-neutral-900")}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[14px]">
                  <b className="text-neutral-900">{a.name}</b>
                  <span className="text-[12.5px] text-neutral-500"> · {a.p4} · {shortDate(a.created_at)}</span>
                </p>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-[12px] font-bold " +
                    (a.answer ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700")
                  }
                >
                  {a.answer ? "답변 완료" : "답변 대기"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-[14px] leading-relaxed text-neutral-800">{a.message}</p>
              <label className="mt-3 block">
                <span className="sr-only">답변</span>
                <textarea
                  value={draft}
                  onChange={(e) => setDrafts({ ...drafts, [a.id]: e.target.value.slice(0, 1000) })}
                  rows={2}
                  placeholder="답변을 적으면 손님이 링크에서 확인해요"
                  className={inputClass + " resize-none text-[14px]"}
                />
              </label>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  disabled={!String(draft || "").trim()}
                  onClick={async () => {
                    const ok = await onAnswer(a.id, String(draft).trim());
                    if (ok) showToast("답변을 저장했어요. 손님이 조회하면 보여요");
                  }}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
                >
                  {a.answer ? "답변 수정" : "답변 보내기"}
                </button>
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await onDelete(a.id);
                    if (ok) showToast("문의를 지웠어요");
                  }}
                  className="text-[12.5px] font-medium text-neutral-400 hover:text-rose-600"
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
        {!list.length ? (
          <p className="py-10 text-center text-[13.5px] text-neutral-400">
            {asks.length ? "답변을 기다리는 문의가 없어요" : "아직 들어온 문의가 없어요"}
          </p>
        ) : null}
      </div>
    </section>
  );
}

const CS_TABS = [
  { id: "ship", label: "주문 조회", icon: <Package size={20} /> },
  { id: "return", label: "교환·반품", icon: <ArrowLeftRight size={20} /> },
  { id: "faq", label: "자주 묻는 질문", icon: <Lightbulb size={20} /> },
  { id: "ask", label: "1:1 문의", icon: <MessageCircle size={20} /> },
];

export function CustomerView({ settings, onSubmit, fetchLookup, showToast, goAdmin, onMetric, showTracking = true, cs }) {
  const [lookup, setLookup] = useState(null);
  const [panel, setPanel] = useState("");
  const [tab, setTab] = useState(cs && settings.orderLookup ? "ship" : "return");
  const lookupRef = useRef(null);

  const track = (name, phone4) => {
    setTab("return");
    setPanel("lookup");
    setLookup({ name, phone4, at: Date.now() });
    setTimeout(() => {
      if (lookupRef.current) lookupRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const returnPart = (
    <>
      <div className={"grid gap-2 " + (showTracking && !cs ? "grid-cols-2" : "grid-cols-1")}>
        {[
          { id: "lookup", icon: <Search size={15} />, label: "내 교환·반품 진행 상황" },
          ...(showTracking && !cs ? [{ id: "track", icon: <Truck size={15} />, label: "택배 배송 조회" }] : []),
        ].map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setPanel(panel === b.id ? "" : b.id)}
            aria-expanded={panel === b.id}
            className={
              "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border py-3 text-[13.5px] font-semibold transition " +
              (panel === b.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700")
            }
          >
            {b.icon} {b.label}
          </button>
        ))}
      </div>
      {panel === "track" && showTracking && !cs ? (
        <div className="animate-fade-up">
          <TrackingCard onTracked={() => onMetric("track")} />
        </div>
      ) : null}
      {panel === "lookup" ? (
        <div className="animate-fade-up">
          <MyRequests
            fetchLookup={fetchLookup}
            settings={settings}
            lookup={lookup}
            setLookup={setLookup}
            showToast={showToast}
            sectionRef={lookupRef}
          />
        </div>
      ) : null}
      <RequestForm settings={settings} onSubmit={onSubmit} showToast={showToast} onTrack={track} />
    </>
  );

  const kakaoPart = validKakaoUrl(settings.kakaoUrl) ? (
    <div className="pt-1">
      <p className="mb-2 text-center text-[12px] text-neutral-500">여기서 해결이 안 됐다면 편하게 물어봐 주세요</p>
      <a
        href={normalizeKakaoUrl(settings.kakaoUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-4 text-[15px] font-bold text-[#191919] shadow-card transition active:scale-[0.98]"
      >
        <MessageCircle size={18} fill="#191919" />
        카카오톡 1:1 상담 바로가기
      </a>
    </div>
  ) : null;

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 pb-10 pt-4">
      <BrandHeader settings={settings} />
      {cs ? (
        <>
          <div className="grid grid-cols-4 gap-1.5" role="tablist" aria-label="메뉴">
            {CS_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => setTab(t.id)}
                className={
                  "flex min-h-[74px] flex-col items-center justify-center gap-1.5 rounded-xl border bg-white px-1 text-[12.5px] font-semibold transition " +
                  (tab === t.id ? "border-2 border-neutral-900 text-neutral-900" : "border-neutral-200 text-neutral-500")
                }
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
          <div key={tab} className="animate-fade-up space-y-4">
            {tab === "ship" ? (
              <ShipLookup cs={cs} settings={settings} onMetric={onMetric} showToast={showToast} onGoReturn={() => setTab("return")} />
            ) : tab === "return" ? (
              returnPart
            ) : tab === "faq" ? (
              settings.faqs.length ? (
                <FaqCard faqs={settings.faqs} />
              ) : (
                <CustomerCard>
                  <p className="py-6 text-center text-[13.5px] text-neutral-400">아직 등록된 질문이 없어요.</p>
                </CustomerCard>
              )
            ) : (
              <AskCard cs={cs} settings={settings} showToast={showToast} />
            )}
          </div>
        </>
      ) : (
        <>
          {returnPart}
          <FaqCard faqs={settings.faqs} />
          {kakaoPart}
        </>
      )}

      <footer className="pt-4 text-center">
        <button
          type="button"
          onClick={goAdmin || (() => (window.location.href = "/"))}
          className="inline-flex flex-wrap items-center justify-center gap-1 text-[13px] font-semibold text-neutral-700 underline-offset-2 hover:underline"
        >
          Powered by <RLWord /> · 나도 1분 만에 CS 센터 만들기
          <ArrowRight size={13} />
        </button>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면: 대시보드                                                 */
/* ------------------------------------------------------------------ */

function StatCard({ icon, tone, label, value, unit, pill, pillTone }) {
  return (
    <div className={panelClass + " p-4 sm:p-5"}>
      <div className="flex items-center gap-2.5">
        <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-full " + tone}>{icon}</span>
        <p className="min-w-0 text-[13px] leading-snug text-neutral-600">{label}</p>
      </div>
      <p className="mt-3 whitespace-nowrap text-[28px] font-bold leading-tight tracking-tight text-neutral-900">
        {value}
        <span className="ml-1 text-[17px] font-semibold">{unit}</span>
      </p>
      <span
        className={
          "mt-2 inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-full px-2.5 py-1 text-[12px] font-medium leading-snug " +
          pillTone
        }
      >
        {pill}
      </span>
    </div>
  );
}

function itemsOf(r) {
  return r.items && r.items.length
    ? r.items
    : [{ product: r.product, kind: r.kind, productImg: r.productImg, option: r.option }];
}

function requestLine(r) {
  const items = itemsOf(r);
  if (items.length > 1) {
    const opts = items.map((i) => i.option).filter(Boolean);
    return (r.type === "exchange" ? "교환 " : "반품 ") + items.length + "개" + (opts.length ? " · " + opts.join(" / ") : "");
  }
  return r.type === "exchange" ? "교환 (" + r.option + ")" : "반품";
}

function TypeChip({ type }) {
  const isEx = type === "exchange";
  return (
    <span
      className={
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-bold " +
        (isEx ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700")
      }
    >
      {isEx ? <ArrowLeftRight size={11} /> : <Undo2 size={11} />}
      {isEx ? "교환" : "반품"}
    </span>
  );
}

function FeeCell({ r, onRun, align = "center" }) {
  const st = statusOf(r);
  const label =
    st === "rejected"
      ? { text: "[거절됨]", cls: "text-neutral-400" }
      : r.amount === 0
      ? { text: "[판매자 부담]", cls: "text-neutral-500" }
      : !r.paid
      ? { text: "[입금확인대기]", cls: "text-orange-600" }
      : { text: "[입금확인완료]", cls: "text-emerald-700" };
  const locked = st === "arrived" || st === "done";
  return (
    <div className={"flex flex-col gap-1 " + (align === "center" ? "items-center" : "items-start")}>
      <p className="whitespace-nowrap text-[13px] text-neutral-800">
        배송비 {r.amount === 0 ? "무료" : won(r.amount)}
      </p>
      <p className={"whitespace-nowrap text-[13px] font-semibold transition-colors " + label.cls}>
        {label.text}
      </p>
      {r.depositor && r.depositor !== r.name ? (
        <p className="whitespace-nowrap text-[11.5px] text-neutral-500">입금자 {r.depositor}</p>
      ) : null}
      {r.amount > 0 && st !== "rejected" ? (
        <Toggle
          small
          checked={r.paid}
          disabled={locked}
          onChange={() => onRun(r, "togglePaid")}
          label={r.name + " 입금 확인"}
        />
      ) : null}
    </div>
  );
}

function nextLabel(r) {
  const st = statusOf(r);
  if (st === "progress") return "수거 완료 처리";
  if (st === "arrived") return r.type === "exchange" ? "교환품 발송 완료" : "환불 완료 처리";
  return "";
}

function StatusCell({ r, onRun }) {
  const st = statusOf(r);
  const base =
    "w-[128px] whitespace-nowrap rounded-lg border py-2 text-[13px] font-semibold transition active:scale-95 ";
  let button;
  let sub;
  if (st === "waiting") {
    button = (
      <button type="button" onClick={() => onRun(r, "next")} className={base + "border-neutral-300 bg-white text-neutral-400"}>
        입금 대기 중
      </button>
    );
    sub = "입금 확인 후 진행";
  } else if (st === "progress") {
    button = (
      <button type="button" onClick={() => onRun(r, "next")} className={base + "border-blue-600 bg-blue-600 text-white"}>
        {nextLabel(r)}
      </button>
    );
    sub = "";
  } else if (st === "arrived") {
    button = (
      <button type="button" onClick={() => onRun(r, "next")} className={base + "border-violet-600 bg-violet-600 text-white"}>
        {nextLabel(r)}
      </button>
    );
    sub = "수거 " + r.pickupDate;
  } else if (st === "done") {
    button = (
      <span className={base + "flex items-center justify-center gap-1 border-emerald-600 bg-white text-emerald-700"}>
        <Check size={14} strokeWidth={3} /> 처리 완료
      </span>
    );
    sub = r.finishedDate;
  } else {
    button = <span className={base + "block border-neutral-200 bg-white text-center text-neutral-400"}>거절됨</span>;
    sub = "-";
  }
  return (
    <div className="flex flex-col items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {button}
      {sub ? <span className="whitespace-nowrap text-[12px] text-neutral-500">{sub}</span> : null}
      {st === "arrived" || st === "done" ? (
        <button
          type="button"
          onClick={() => onRun(r, "undo")}
          className="flex items-center gap-0.5 whitespace-nowrap text-[11px] text-neutral-400 underline-offset-2 hover:underline"
        >
          <RotateCcw size={10} /> 되돌리기
        </button>
      ) : null}
    </div>
  );
}

function MemoChip() {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
      <StickyNote size={11} /> 메모
    </span>
  );
}

function ReasonTag({ text }) {
  return (
    <span className="inline-block whitespace-nowrap rounded bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-600">
      {text}
    </span>
  );
}

const GRID =
  "xl:grid xl:grid-cols-[96px_124px_minmax(200px,1fr)_124px_80px_136px] xl:items-center xl:gap-3";

function rowAction(r) {
  const st = statusOf(r);
  if (st === "waiting") return { label: "입금 확인", act: "togglePaid", cls: "bg-neutral-900 text-white" };
  if (st === "progress") return { label: "수거 완료", act: "next", cls: "bg-blue-600 text-white" };
  if (st === "arrived")
    return { label: r.type === "exchange" ? "발송 완료" : "환불 완료", act: "next", cls: "bg-violet-600 text-white" };
  return null;
}

function feeText(r) {
  if (r.amount === 0) return "배송비 무료";
  const base = "배송비 " + won(r.amount) + (r.paid ? " 입금됨" : " 입금 전");
  return r.depositor && r.depositor !== r.name ? base + " (입금자 " + r.depositor + ")" : base;
}

function RequestRow({ r, leaving, onOpen, onRun }) {
  const st = statusOf(r);
  const action = rowAction(r);
  const isEx = r.type === "exchange";
  return (
    <div
      className={
        "grid transition-all duration-300 ease-in " +
        (leaving ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")
      }
    >
      <div className="overflow-hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpen(r.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onOpen(r.id);
          }}
          className="flex cursor-pointer items-center gap-3 border-t border-neutral-100 px-4 py-3.5 transition hover:bg-neutral-50"
        >
          <Thumb kind={r.kind} img={r.productImg} size="h-12 w-12" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5">
              <span className="truncate text-[15px] font-semibold text-neutral-900">{r.name}</span>
              <TypeChip type={r.type} />
              {r.memo ? <MemoChip /> : null}
            </p>
            <p className="truncate text-[13.5px] text-neutral-700">
              {r.product}
              {isEx && r.option ? <span className="text-neutral-500"> · {r.option}</span> : null}
            </p>
            <p className="truncate text-[12px] text-neutral-400">
              {r.reason} · {feeText(r)} · {r.date.slice(5).replace(".", "/")} {r.time}
            </p>
          </div>
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {action ? (
              <button
                type="button"
                onClick={() => onRun(r, action.act)}
                className={
                  "h-10 min-w-[84px] whitespace-nowrap rounded-lg px-3 text-[13px] font-semibold transition active:scale-95 " +
                  action.cls
                }
              >
                {action.label}
              </button>
            ) : (
              <span
                className={
                  "inline-flex h-10 items-center gap-1 whitespace-nowrap px-2 text-[13px] font-semibold " +
                  (st === "done" ? "text-emerald-700" : "text-neutral-400")
                }
              >
                {st === "done" ? (
                  <>
                    <Check size={14} strokeWidth={3} /> 완료
                  </>
                ) : (
                  "거절됨"
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({ onFeedback, showToast }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const send = async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    if (!onFeedback) {
      showToast("데모에서는 보내지지 않아요. 가입하면 바로 보낼 수 있어요");
      return;
    }
    setBusy(true);
    const ok = await onFeedback(msg);
    setBusy(false);
    if (ok) {
      setText("");
      setSent(true);
      showToast("피드백을 보냈어요. 고마워요!");
    } else {
      showToast("보내지 못했어요. 잠시 후 다시 해 주세요", "warn");
    }
  };
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50">
          <Send size={19} className="text-sky-600" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-neutral-900">운영자에게 피드백</h3>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">
            불편한 점, 필요한 기능을 남겨 주세요. 운영자가 직접 읽고 반영해요.
          </p>
        </div>
      </div>
      <label htmlFor="rl-feedback" className="sr-only">
        피드백 내용
      </label>
      <textarea
        id="rl-feedback"
        value={text}
        onChange={(e) => {
          setText(e.target.value.slice(0, 2000));
          setSent(false);
        }}
        rows={4}
        placeholder="예) 접수 목록을 엑셀로 받고 싶어요"
        className="mt-3 w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-[14px] text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-neutral-900"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[12px] text-neutral-400">{sent ? "보냈어요. 고마워요!" : text.length + " / 2000"}</span>
        <button
          type="button"
          onClick={send}
          disabled={!text.trim() || busy}
          className="whitespace-nowrap rounded-lg bg-neutral-900 px-4 py-2 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-40"
        >
          {busy ? "보내는 중…" : "보내기"}
        </button>
      </div>
    </div>
  );
}

function QuickCard({ icon, tone, title, children, action, onAction, external }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-4">
      <div className="flex gap-3">
        <span className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full " + tone}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-neutral-900">{title}</h3>
          <div className="mt-1.5 text-[12.5px] leading-relaxed text-neutral-500">{children}</div>
          <button type="button" onClick={onAction} className={outlineBtn + " mt-3"}>
            {action}
            {external ? <ExternalLink size={13} /> : null}
          </button>
        </div>
      </div>
    </div>
  );
}

function Pager({ page, pages, onPage }) {
  if (pages <= 1) return null;
  let start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  start = Math.max(1, end - 4);
  const nums = [];
  for (let i = start; i <= end; i += 1) nums.push(i);
  const btn =
    "flex h-9 min-w-[36px] items-center justify-center rounded-lg px-2 text-[14px] transition disabled:opacity-30";
  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1 py-4">
      <button
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        aria-label="이전 페이지"
        className={btn + " text-neutral-600 hover:bg-neutral-100"}
      >
        <ChevronLeft size={16} />
      </button>
      {start > 1 ? <span className="px-1 text-neutral-400">…</span> : null}
      {nums.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPage(n)}
          aria-current={n === page ? "page" : undefined}
          className={
            btn +
            (n === page ? " bg-neutral-900 font-bold text-white" : " text-neutral-600 hover:bg-neutral-100")
          }
        >
          {n}
        </button>
      ))}
      {end < pages ? <span className="px-1 text-neutral-400">…</span> : null}
      <button
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
        aria-label="다음 페이지"
        className={btn + " text-neutral-600 hover:bg-neutral-100"}
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

const PAGE_SIZE = 8;

function Segmented({ value, onChange, options }) {
  return (
    <div className="flex rounded-lg border border-neutral-200 bg-white p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className={
            "whitespace-nowrap rounded-md px-2.5 py-1.5 text-[12.5px] transition " +
            (value === o.id ? "bg-neutral-900 font-semibold text-white" : "text-neutral-600")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const SORTS = [
  { id: "new", label: "최신 접수순" },
  { id: "old", label: "오래된 접수순" },
  { id: "name", label: "고객명 가나다순" },
  { id: "product", label: "상품명순" },
  { id: "fee", label: "배송비 높은순" },
];

const smallSelect =
  "appearance-none rounded-lg border border-neutral-200 bg-white py-2 pl-3 pr-8 text-[13px] text-neutral-800 outline-none focus:border-neutral-900";

const STAGES = [
  { id: "all", label: "전체", badge: "", empty: "여기에 해당하는 접수가 없어요" },
  { id: "waiting", label: "입금확인대기", badge: "bg-red-50 text-red-600", empty: "입금을 기다리는 접수가 없어요" },
  { id: "progress", label: "수거진행", badge: "bg-blue-50 text-blue-600", empty: "돌아오는 중인 상품이 없어요" },
  { id: "arrived", label: "발송·환불", badge: "bg-violet-50 text-violet-700", empty: "보내거나 환불할 건이 없어요" },
  { id: "done", label: "완료", badge: "bg-emerald-50 text-emerald-700", empty: "끝난 건이 없어요" },
];

function Dashboard({ settings, requests, metrics, onOpen, onUpdate, onDelete, showToast, openSettings, onFeedback }) {
  const [guide, setGuide] = useState(false);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("new");
  const [typeFilter, setTypeFilter] = useState("all");
  const [feeFilter, setFeeFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [pend, setPend] = useState(null);
  const [cleanOpen, setCleanOpen] = useState(false);
  const [cleanScope, setCleanScope] = useState("old");
  const closeClean = useCallback(() => setCleanOpen(false), []);
  const timers = useRef([]);
  const listTop = useRef(null);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((t) => clearTimeout(t));
  }, []);

  const counts = useMemo(() => {
    const c = { all: requests.length, waiting: 0, progress: 0, arrived: 0, done: 0 };
    requests.forEach((r) => {
      c[tabOf(statusOf(r))] += 1;
    });
    return c;
  }, [requests]);

  const weekly = useMemo(() => {
    const now = new Date();
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
    const fmt = (d) => d.getFullYear() + "." + pad(d.getMonth() + 1) + "." + pad(d.getDate());
    const calc = (start) => {
      const a = fmt(start);
      const b = fmt(add(start, 6));
      let req = 0;
      let looks = 0;
      Object.keys(metrics || {}).forEach((k) => {
        if (k >= a && k <= b) {
          req += metrics[k].req || 0;
          looks += (metrics[k].track || 0) + (metrics[k].lookup || 0);
        }
      });
      return { req, looks, total: req + looks, minutes: req * MIN_PER_REQUEST + looks * MIN_PER_LOOKUP };
    };
    return { cur: calc(mon), prev: calc(add(mon, -7)) };
  }, [metrics]);

  const searching = query.trim().length > 0;
  const activeFilters = (sort !== "new" ? 1 : 0) + (typeFilter !== "all" ? 1 : 0) + (feeFilter !== "all" ? 1 : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = requests.filter((r) => {
      if (!q && tab !== "all" && tabOf(statusOf(r)) !== tab) return false;
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (feeFilter === "customer" && !(r.amount > 0)) return false;
      if (feeFilter === "seller" && r.amount > 0) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        (r.depositor || "").toLowerCase().includes(q) ||
        itemsOf(r).some((it) => it.product.toLowerCase().includes(q)) ||
        (r.phone || r.phone4).replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~")
      );
    });
    const cmp = {
      new: (a, b) => b.ts - a.ts,
      old: (a, b) => a.ts - b.ts,
      name: (a, b) => a.name.localeCompare(b.name, "ko") || b.ts - a.ts,
      product: (a, b) => a.product.localeCompare(b.product, "ko") || b.ts - a.ts,
      fee: (a, b) => b.amount - a.amount || b.ts - a.ts,
    }[sort];
    return list.sort(cmp);
  }, [requests, tab, query, sort, typeFilter, feeFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const closedAll = requests.filter((r) => tabOf(statusOf(r)) === "done");
  const closedOld = closedAll.filter((r) => isOldClosed(r, 30));
  const cleanTargets = cleanScope === "old" ? closedOld : closedAll;

  const goPage = (n) => {
    setPage(n);
    if (listTop.current) listTop.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const run = (r, action) => {
    if (pend) return;
    const t = transition(r, action);
    if (!t.patch) {
      if (t.message) showToast(t.message);
      return;
    }
    const next = { ...r, ...t.patch };
    const leaves = !searching && tab !== "all" && tabOf(statusOf(next)) !== tab;
    setPend({ id: r.id, patch: t.patch, leaving: false });
    if (leaves) {
      timers.current.push(
        setTimeout(() => setPend((p) => (p && p.id === r.id ? { ...p, leaving: true } : p)), 300)
      );
    }
    timers.current.push(
      setTimeout(
        () => {
          onUpdate(r.id, t.patch);
          showToast(t.message);
          setPend(null);
        },
        leaves ? 640 : 280
      )
    );
  };

  const viewOf = (r) => (pend && pend.id === r.id ? { ...r, ...pend.patch } : r);
  const stage = STAGES.find((s) => s.id === tab);
  const pctChange = weekly.prev.total
    ? Math.round(((weekly.cur.total - weekly.prev.total) / weekly.prev.total) * 100)
    : null;
  const hourDiff = (weekly.cur.minutes - weekly.prev.minutes) / 60;
  const jump = (t) => {
    setTab(t);
    setQuery("");
    setPage(1);
    if (listTop.current) listTop.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            icon={<MessageCircle className="h-5 w-5 text-violet-500" />}
            tone="bg-violet-100"
            label="이번 주 방어한 카톡"
            value={weekly.cur.total}
            unit="건"
            pill={
              pctChange === null ? (
                "접수 " + weekly.cur.req + " · 조회 " + weekly.cur.looks
              ) : (
                <>
                  지난 주 대비 {pctChange >= 0 ? "+" : ""}
                  {pctChange}% {pctChange >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </>
              )
            }
            pillTone="bg-violet-50 text-violet-700"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-emerald-700" />}
            tone="bg-emerald-100"
            label="아낀 CS 시간 (추정)"
            value={(weekly.cur.minutes / 60).toFixed(1)}
            unit="시간"
            pill={
              <>
                지난 주 대비 {hourDiff >= 0 ? "+" : ""}
                {hourDiff.toFixed(1)}시간 {hourDiff >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              </>
            }
            pillTone="bg-emerald-50 text-emerald-700"
          />
          <StatCard
            icon={<Box className="h-5 w-5 text-orange-500" />}
            tone="bg-orange-100"
            label="지금 할 일"
            value={counts.waiting + counts.progress + counts.arrived}
            unit="건"
            pill={
              <span className="flex flex-wrap items-center gap-x-2.5">
                {[
                  { id: "waiting", label: "입금", n: counts.waiting },
                  { id: "progress", label: "수거", n: counts.progress },
                  { id: "arrived", label: "발송", n: counts.arrived },
                ].map((x, i) => (
                  <span key={x.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => jump(x.id)}
                      className="underline decoration-orange-300 underline-offset-2"
                    >
                      {x.label} {x.n}
                    </button>
                  </span>
                ))}
              </span>
            }
            pillTone="bg-orange-50 text-orange-700"
          />
        </div>

        <p className="-mt-2 px-1 text-[12px] leading-relaxed text-neutral-400">
          이번 주 접수 {weekly.cur.req}건 + 손님이 직접 한 배송·진행 조회 {weekly.cur.looks}회를 카톡 문의 1건씩으로 세요.
          시간은 접수 1건 {MIN_PER_REQUEST}분, 조회 1회 {MIN_PER_LOOKUP}분으로 추정한 값이에요.
        </p>

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
          />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="이름, 상품, 전화번호로 찾기"
            aria-label="접수 검색"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-8 text-[14px] outline-none focus:border-neutral-900"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="검색어 지우기"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowFilter(!showFilter)}
          aria-expanded={showFilter}
          className={
            "flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-[13.5px] font-medium transition " +
            (showFilter || activeFilters
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-700")
          }
        >
          <SlidersHorizontal size={15} />
          필터{activeFilters ? " " + activeFilters : ""}
        </button>
      </div>

      {showFilter ? (
        <div className="animate-fade-up space-y-3 rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[12.5px] text-neutral-500">정렬</span>
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="정렬"
                className={smallSelect}
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[12.5px] text-neutral-500">유형</span>
            <Segmented
              value={typeFilter}
              onChange={(v) => {
                setTypeFilter(v);
                setPage(1);
              }}
              options={[
                { id: "all", label: "전체" },
                { id: "exchange", label: "교환" },
                { id: "return", label: "반품" },
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[12.5px] text-neutral-500">배송비</span>
            <Segmented
              value={feeFilter}
              onChange={(v) => {
                setFeeFilter(v);
                setPage(1);
              }}
              options={[
                { id: "all", label: "전체" },
                { id: "customer", label: "고객 부담" },
                { id: "seller", label: "판매자 부담" },
              ]}
            />
          </div>
          {activeFilters ? (
            <button
              type="button"
              onClick={() => {
                setSort("new");
                setTypeFilter("all");
                setFeeFilter("all");
                setPage(1);
              }}
              className="text-[12.5px] text-neutral-500 underline underline-offset-2"
            >
              필터 초기화
            </button>
          ) : null}
        </div>
      ) : null}

      <section ref={listTop} className={panelClass + " scroll-mt-16 overflow-hidden"}>
        <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-neutral-200 px-3">
          {STAGES.map((t) => {
            const active = !searching && tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setTab(t.id);
                  setQuery("");
                  setPage(1);
                }}
                className={
                  "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-[15px] transition " +
                  (active ? "border-neutral-900 font-bold text-neutral-900" : "border-transparent text-neutral-500")
                }
              >
                {t.label}
                {t.badge ? (
                  <span
                    className={
                      "flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5 text-[13px] font-semibold " +
                      t.badge
                    }
                  >
                    {counts[t.id]}
                  </span>
                ) : (
                  <span>{counts[t.id]}</span>
                )}
              </button>
            );
          })}
        </div>
        {searching || (tab === "done" && closedAll.length > 0) ? (
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <p className="text-[14px] font-bold text-neutral-900">
            {searching ? "검색 결과 " + filtered.length + "건" : ""}
          </p>
          {!searching && tab === "done" && closedAll.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setCleanScope(closedOld.length ? "old" : "all");
                setCleanOpen(true);
              }}
              className="flex items-center gap-1 whitespace-nowrap text-[12.5px] text-neutral-500 hover:text-red-600"
            >
              <Trash2 size={13} /> 정리하기
            </button>
          ) : null}
        </div>
        ) : null}

        {shown.length > 0 ? (
          shown.map((r) => (
            <RequestRow
              key={r.id}
              r={viewOf(r)}
              leaving={!!(pend && pend.id === r.id && pend.leaving)}
              onOpen={(id) => onOpen(id, filtered.map((x) => x.id))}
              onRun={run}
            />
          ))
        ) : (
          <div className="border-t border-neutral-100 px-4 py-12 text-center">
            <Inbox size={28} className="mx-auto text-neutral-300" />
            <p className="mt-2 text-[14px] font-semibold text-neutral-600">
              {requests.length === 0
                ? "아직 들어온 접수가 없어요"
                : searching
                ? "검색 결과가 없어요"
                : stage.empty}
            </p>
            {requests.length === 0 ? (
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText("https://" + shopLink(settings));
                  showToast(ok ? "내 링크를 복사했어요" : "복사가 안 됐어요");
                }}
                className={outlineBtn + " mt-3"}
              >
                <Copy size={13} /> 내 링크 복사해서 인스타에 붙이기
              </button>
            ) : null}
          </div>
        )}

        {pages > 1 ? <Pager page={cur} pages={pages} onPage={goPage} /> : null}
      </section>

      {cleanOpen ? (
        <Modal
          title="끝난 건 정리"
          desc="완료·거절된 건만 지워요. 지운 건은 되돌릴 수 없어요."
          onClose={closeClean}
          footer={
            <>
              <button type="button" onClick={closeClean} className={outlineBtn + " px-5 py-2.5"}>
                취소
              </button>
              <span className="flex-1" />
              <button
                type="button"
                disabled={cleanTargets.length === 0}
                onClick={() => {
                  onDelete(cleanTargets.map((r) => r.id));
                  setCleanOpen(false);
                  setPage(1);
                  showToast(cleanTargets.length + "건을 삭제했어요");
                }}
                className="whitespace-nowrap rounded-lg bg-red-600 px-5 py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-40"
              >
                {cleanTargets.length}건 삭제
              </button>
            </>
          }
        >
          {[
            { id: "old", title: "끝난 지 30일 지난 건만", n: closedOld.length },
            { id: "all", title: "완료 전부", n: closedAll.length },
          ].map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setCleanScope(o.id)}
              aria-pressed={cleanScope === o.id}
              className={
                "flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition " +
                (cleanScope === o.id ? "border-neutral-900 bg-neutral-50" : "border-neutral-200")
              }
            >
              <span className="text-[14px] font-semibold text-neutral-900">{o.title}</span>
              <span className="text-[13px] text-neutral-500">{o.n}건</span>
            </button>
          ))}
          <p className="text-[12px] leading-relaxed text-neutral-400">
            끝난 지 {KEEP_DAYS}일이 지난 건은 자동으로 지워져요.
          </p>
        </Modal>
      ) : null}
      </div>

      <aside className={panelClass + " h-fit space-y-4 p-5"}>
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-neutral-900">빠른 설정</h2>
          <button
            type="button"
            onClick={() => openSettings && openSettings("profile")}
            aria-label="설정 열기"
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <Settings size={18} />
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          <QuickCard
            icon={<Palette size={20} className="text-rose-500" />}
            tone="bg-rose-50"
            title="손님 화면 꾸미기"
            action="꾸미기"
            onAction={() => openSettings && openSettings("profile")}
          >
            <p>프로필 사진, 소개 문구, 글꼴({fontOf(settings.font).name})을 바꿀 수 있어요.</p>
          </QuickCard>
          <QuickCard
            icon={<Shirt size={20} className="text-emerald-700" />}
            tone="bg-emerald-50"
            title="상품·사유 관리"
            action="관리하기"
            onAction={() => openSettings && openSettings("products")}
          >
            <p>
              {settings.productMode === "list"
                ? "등록 상품 " + settings.products.length + "개에서 손님이 골라요."
                : "손님이 상품명을 직접 입력해요."}
            </p>
            <p>교환·반품 사유 {settings.reasons.length}개</p>
          </QuickCard>
          <QuickCard
            icon={<CreditCard size={20} className="text-blue-600" />}
            tone="bg-blue-50"
            title="계좌·배송비"
            action="수정"
            onAction={() => openSettings && openSettings("pay")}
          >
            <p>
              {settings.bank ? settings.bank + " " : ""}
              {settings.accountNumber}
            </p>
            <p>예금주: {settings.accountHolder}</p>
          </QuickCard>
          <QuickCard
            icon={<MessageCircle size={20} className="text-violet-600" />}
            tone="bg-violet-50"
            title="FAQ 빠른 수정"
            action="관리하기"
            onAction={() => openSettings && openSettings("faq")}
          >
            <p>자주 묻는 질문 {settings.faqs.length}개를 손님 화면에 보여 주고 있어요.</p>
          </QuickCard>
          <QuickCard
            icon={<Lightbulb size={20} className="text-amber-500" />}
            tone="bg-amber-50"
            title="도움말"
            action={guide ? "가이드 접기" : "가이드 보기"}
            onAction={() => setGuide(!guide)}
          >
            <p>처리 순서와 팁을 확인해 보세요.</p>
            {guide ? (
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-neutral-600">
                <li>내 링크를 복사해 인스타 프로필에 붙여요.</li>
                <li>입금이 들어오면 입금 확인을 눌러요. 수거 단계로 넘어가요.</li>
                <li>택배사에 회수를 접수하고, 상품이 도착하면 수거 완료를 눌러요.</li>
                <li>교환품을 보내거나 환불한 뒤 버튼을 누르면 완료 탭으로 가요.</li>
                <li>잘못 눌렀다면 되돌리기로 한 단계 돌아가요.</li>
              </ol>
            ) : null}
          </QuickCard>
          <FeedbackCard onFeedback={onFeedback} showToast={showToast} />
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면: 반품 카드 상세                                           */
/* ------------------------------------------------------------------ */

function Row({ label, children }) {
  return (
    <div>
      <p className="text-[12px] font-semibold text-neutral-900">{label}</p>
      <div className="mt-1 text-[13px] text-neutral-600">{children}</div>
    </div>
  );
}

function DetailModal({ r, ids, onNavigate, onClose, onAction, onDelete, onPatch, showToast }) {
  const [zoom, setZoom] = useState(100);
  const idx = ids.indexOf(r.id);
  const st = statusOf(r);
  const isExchange = r.type === "exchange";
  const typeLabel = isExchange ? "교환" : "반품";
  const statusLabel = {
    waiting: "입금확인대기",
    progress: "수거진행중",
    arrived: isExchange ? "교환품 발송 대기" : "환불 대기",
    done: "처리 완료",
    rejected: "거절됨",
  }[st];

  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const [memo, setMemo] = useState(r.memo || "");
  const [outCourier, setOutCourier] = useState(r.outCourier || COURIERS[0].name);
  const [outInvoice, setOutInvoice] = useState(r.outInvoice || "");
  const rejectRef = useRef(null);

  useEffect(() => {
    setZoom(100);
    setRejecting(false);
    setReason("");
    setConfirmDel(false);
    setMemo(r.memo || "");
    setOutCourier(r.outCourier || COURIERS[0].name);
    setOutInvoice(r.outInvoice || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id]);

  useEffect(() => {
    if (rejecting && rejectRef.current) rejectRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [rejecting]);

  const go = (step) => {
    const next = ids[idx + step];
    if (next) onNavigate(next);
  };

  const primary =
    st === "waiting"
      ? { label: "입금 확인", action: "togglePaid" }
      : st === "progress" || st === "arrived"
      ? { label: nextLabel(r), action: "next" }
      : null;

  return (
    <Modal
      title={typeLabel + " 카드 상세"}
      onClose={onClose}
      footer={
        rejecting ? (
          <>
            <button type="button" onClick={() => setRejecting(false)} className={outlineBtn + " px-5 py-2.5"}>
              취소
            </button>
            <span className="flex-1" />
            <button
              type="button"
              disabled={!reason.trim()}
              onClick={() => {
                onAction(r.id, "reject", reason.trim());
                setRejecting(false);
              }}
              className="whitespace-nowrap rounded-lg bg-red-600 px-6 py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-40"
            >
              거절 확정
            </button>
          </>
        ) : (
        <>
          <button type="button" onClick={onClose} className={outlineBtn + " px-5 py-2.5"}>
            닫기
          </button>
          {st === "done" || st === "rejected" ? (
            <button
              type="button"
              onClick={() => (confirmDel ? onDelete(r.id) : setConfirmDel(true))}
              className={
                "flex items-center gap-1 whitespace-nowrap rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition active:scale-95 " +
                (confirmDel ? "border-red-600 bg-red-600 text-white" : "border-red-300 bg-white text-red-600")
              }
            >
              <Trash2 size={14} />
              {confirmDel ? "한 번 더 누르면 삭제" : "삭제"}
            </button>
          ) : null}
          <span className="flex-1" />
          {st === "rejected" ? (
            <button type="button" onClick={() => onAction(r.id, "unreject")} className={outlineBtn + " px-5 py-2.5"}>
              거절 취소
            </button>
          ) : null}
          {st === "waiting" || st === "progress" ? (
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="whitespace-nowrap rounded-lg border border-red-300 bg-white px-5 py-2.5 text-[13px] font-semibold text-red-600 transition active:scale-95"
            >
              거절하기
            </button>
          ) : null}
          {st === "arrived" || st === "done" ? (
            <button type="button" onClick={() => onAction(r.id, "undo")} className={outlineBtn + " px-4 py-2.5"}>
              <RotateCcw size={13} /> 되돌리기
            </button>
          ) : null}
          {primary ? (
            <button
              type="button"
              onClick={() => onAction(r.id, primary.action)}
              className="whitespace-nowrap rounded-lg bg-neutral-900 px-5 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
            >
              {primary.label}
            </button>
          ) : null}
        </>
        )
      }
    >
      <div className="flex items-center gap-2 rounded-xl border border-neutral-200 p-3">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={idx <= 0}
          aria-label="이전 접수"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-neutral-900">
            {typeLabel} #{r.no}
            <span className="whitespace-nowrap rounded bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-600">
              {statusLabel}
            </span>
          </p>
          <p className="text-[12px] text-neutral-500">
            {r.date} {r.time} 접수
          </p>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={idx < 0 || idx >= ids.length - 1}
          aria-label="다음 접수"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-600 disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {rejecting ? (
        <section ref={rejectRef} className="animate-fade-up rounded-xl border border-red-200 bg-red-50/60 p-4">
          <p className="text-[13px] font-bold text-red-700">거절 사유를 골라 주세요</p>
          <p className="mt-1 text-[12px] text-neutral-500">
            고른 사유는 손님의 &lsquo;진행 상황&rsquo; 화면에 그대로 보여요.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {REJECT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                aria-pressed={reason === p}
                className={
                  "rounded-full border px-3 py-1.5 text-[12.5px] transition " +
                  (reason === p
                    ? "border-red-600 bg-red-600 text-white"
                    : "border-red-200 bg-white text-neutral-700")
                }
              >
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 100))}
            rows={2}
            placeholder="직접 적기"
            aria-label="거절 사유"
            className={inputClass + " mt-2 resize-none py-2 text-[14px]"}
          />
        </section>
      ) : null}

      {st === "rejected" ? (
        <section className="rounded-xl border border-red-200 bg-red-50/60 p-4">
          <p className="text-[12px] font-semibold text-red-700">거절 사유</p>
          <p className="mt-1 text-[13px] text-neutral-800">{r.rejectReason || "적지 않았어요"}</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-neutral-200 px-2 py-4">
        <Steps r={r} />
      </section>

      <section className="rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-neutral-900">고객 · 회수 정보</p>
          <button
            type="button"
            onClick={async () => {
              const text =
                r.name +
                " / " +
                (r.phone || "010-····-" + r.phone4) +
                " / " +
                (r.address || "주문 때 받은 배송지");
              const ok = await copyText(text);
              showToast(ok ? "회수 접수용 정보를 한 번에 복사했어요" : "복사가 안 됐어요");
            }}
            className="flex items-center gap-1 whitespace-nowrap rounded-md border border-neutral-300 px-2 py-1 text-[11.5px] font-semibold text-neutral-700"
          >
            <Copy size={12} /> 회수 접수용 복사
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-[13px]">
          {[
            { label: "성함", value: r.name },
            { label: "연락처", value: r.phone || "010-····-" + r.phone4 },
            {
              label: "회수 장소",
              value: r.address || "주문 때 받은 배송지 (주문 기록에서 확인)",
            },
          ].map((row) => (
            <div key={row.label} className="flex gap-3">
              <dt className="w-16 shrink-0 text-neutral-500">{row.label}</dt>
              <dd className="min-w-0 flex-1 break-words font-medium text-neutral-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        {r.phone ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a
              href={"tel:" + r.phone.replace(/\D/g, "")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2 text-[13px] font-semibold text-neutral-800"
            >
              <Phone size={14} /> 전화하기
            </a>
            <a
              href={"sms:" + r.phone.replace(/\D/g, "")}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-neutral-300 py-2 text-[13px] font-semibold text-neutral-800"
            >
              <Send size={14} /> 문자 보내기
            </a>
          </div>
        ) : null}
        <p className="mt-3 text-[11.5px] text-neutral-400">
          &lsquo;회수 접수용 복사&rsquo;를 택배사 반품 회수 접수 화면에 붙여 넣으면 돼요.
        </p>
      </section>

      <section className="space-y-3 rounded-xl border border-neutral-200 p-4">
        <Row label={typeLabel + " 사유"}>{r.reason}</Row>
        <Row label="상세 사유">{r.detail || "적지 않았어요"}</Row>
      </section>

      <section className="rounded-xl border border-neutral-200 p-4">
        <p className="text-[12px] font-semibold text-neutral-900">상품 정보 · {itemsOf(r).length}개</p>
        <div className="mt-2 space-y-2.5">
          {itemsOf(r).map((it, i) => (
            <div key={i} className="flex items-center gap-3">
              <Thumb kind={it.kind} img={it.productImg} size="h-14 w-14" />
              <div className="min-w-0 flex-1 text-[13px]">
                <p className="font-medium text-neutral-900">{it.product}</p>
                <p className="text-neutral-500">{isExchange ? "교환 " + it.option : "반품"}</p>
              </div>
            </div>
          ))}
        </div>

      </section>

      <section className="rounded-xl border border-neutral-200 p-4">
        <p className="text-[12px] font-semibold text-neutral-900">
          상품 상태 사진 <span className="font-normal text-neutral-400">(고객 첨부)</span>
        </p>
        {r.photo ? (
          <>
            <div className="mt-2 h-52 overflow-auto rounded-lg bg-neutral-100">
              <div style={{ width: zoom + "%", height: zoom + "%" }}>
                {r.photo === "sample" ? (
                  <StainSample />
                ) : (
                  <img src={r.photo} alt="고객이 첨부한 사진" className="h-full w-full object-cover" />
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => setZoom(Math.max(100, zoom - 50))}
                aria-label="축소"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600"
              >
                <ZoomOut size={15} />
              </button>
              <span className="w-12 text-center text-[12px] text-neutral-600">{zoom}%</span>
              <button
                type="button"
                onClick={() => setZoom(Math.min(300, zoom + 50))}
                aria-label="확대"
                className="flex h-8 w-8 items-center justify-center rounded-md border border-neutral-200 text-neutral-600"
              >
                <ZoomIn size={15} />
              </button>
            </div>
          </>
        ) : (
          <p className="mt-2 rounded-lg bg-neutral-50 py-6 text-center text-[13px] text-neutral-400">
            첨부된 사진이 없어요
          </p>
        )}
      </section>

      {isExchange ? (
        <section className="space-y-3 rounded-xl border border-neutral-200 p-4">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            교환 요청 정보
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[11px] text-blue-600">교환 요청</span>
          </p>
          <p className="text-[13px] text-neutral-700">{r.option}</p>
        </section>
      ) : (
        <section className="rounded-xl border border-neutral-200 p-4">
          <Row label="환불 계좌 정보">{r.refundAccount || "적지 않았어요 (결제 수단으로 환불)"}</Row>
        </section>
      )}

      {isExchange && (st === "arrived" || st === "done") ? (
        <section className="rounded-xl border border-neutral-200 p-4">
          <p className="text-[12px] font-semibold text-neutral-900">교환품 송장</p>
          <p className="mt-1 text-[12px] text-neutral-500">적어 두면 손님이 진행 상황에서 바로 볼 수 있어요.</p>
          <div className="mt-2 flex gap-2">
            <div className="w-[138px] shrink-0">
              <select
                value={outCourier}
                onChange={(e) => setOutCourier(e.target.value)}
                aria-label="교환품 택배사"
                className={smallSelect + " w-full py-2.5"}
              >
                {COURIERS.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <input
              value={outInvoice}
              onChange={(e) => setOutInvoice(e.target.value.replace(/[^\d-]/g, ""))}
              placeholder="송장번호"
              inputMode="numeric"
              aria-label="교환품 송장번호"
              className="min-w-0 flex-1 rounded-lg border border-neutral-200 px-3 text-[14px] outline-none focus:border-neutral-900"
            />
            <button
              type="button"
              disabled={outInvoice === (r.outInvoice || "") && outCourier === (r.outCourier || COURIERS[0].name)}
              onClick={() => {
                onPatch(r.id, { outInvoice: outInvoice.trim(), outCourier });
                showToast(outInvoice.trim() ? "송장을 저장했어요" : "송장을 지웠어요");
              }}
              className="shrink-0 rounded-lg bg-neutral-900 px-3.5 text-[13px] font-semibold text-white disabled:opacity-30"
            >
              저장
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-neutral-900">
            <StickyNote size={13} className="text-amber-600" /> 사장님 메모
          </p>
          {memo !== (r.memo || "") ? (
            <button
              type="button"
              onClick={() => {
                onPatch(r.id, { memo: memo.trim() });
                showToast("메모를 저장했어요");
              }}
              className="rounded-md bg-neutral-900 px-3 py-1 text-[12px] font-semibold text-white"
            >
              저장
            </button>
          ) : null}
        </div>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value.slice(0, 300))}
          rows={2}
          placeholder="손님은 볼 수 없어요. 통화 내용, 특이사항 등을 적어 두세요."
          aria-label="사장님 메모"
          className={inputClass + " mt-2 resize-none py-2 text-[14px]"}
        />
      </section>

      <section className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-4">
        <div>
          <p className="text-[12px] font-semibold text-neutral-900">배송비 입금 확인</p>
          <p className="mt-1 text-[12px] text-neutral-500">
            {r.amount === 0
              ? "판매자 부담이라 입금받을 배송비가 없어요."
              : st === "arrived" || st === "done"
              ? "수거가 끝나서 입금 상태는 잠겨 있어요."
              : "왕복 배송비 " + won(r.amount) + " 입금을 확인하면 켜 주세요."}
          </p>
          {r.amount > 0 && r.depositor ? (
            <p className="mt-1 text-[12px] text-neutral-700">
              입금자명: <span className="font-semibold">{r.depositor}</span>
            </p>
          ) : null}
        </div>
        {r.amount > 0 && st !== "rejected" ? (
          <Toggle
            checked={r.paid}
            disabled={st === "arrived" || st === "done"}
            onChange={() => onAction(r.id, "togglePaid")}
            label="입금 확인"
          />
        ) : null}
      </section>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면: 마켓 프로필 & CS 빠른 설정                               */
/* ------------------------------------------------------------------ */

const cellLabel =
  "flex w-24 shrink-0 items-center whitespace-nowrap border-r border-neutral-200 bg-neutral-50 px-3 text-[13px] text-neutral-600";
const cellInput = "min-w-0 flex-1 bg-white px-3 py-2.5 text-[14px] text-neutral-900 outline-none";
const cellRow =
  "flex overflow-hidden rounded-lg border border-neutral-200 focus-within:border-neutral-900";

const SETTINGS_TABS = [
  { id: "profile", label: "마켓 프로필" },
  { id: "products", label: "상품·사유" },
  { id: "pay", label: "계좌·배송비" },
  { id: "faq", label: "FAQ" },
];

function SettingsModal({ settings, initialTab, onClose, onSave, onReset, resetLabel, onWithdraw, showToast }) {
  const [tab, setTab] = useState(initialTab || "profile");
  const [leaving, setLeaving] = useState(false);
  const [leaveCheck, setLeaveCheck] = useState(false);
  const [leaveText, setLeaveText] = useState("");
  const [leaveBusy, setLeaveBusy] = useState(false);
  const closeLeave = useCallback(() => {
    setLeaving(false);
    setLeaveCheck(false);
    setLeaveText("");
  }, []);
  const [d, setD] = useState({
    ...settings,
    shippingFee: String(settings.shippingFee),
    faqs: settings.faqs.map((f) => ({ ...f })),
    products: settings.products.map((p) => ({ ...p })),
    reasons: settings.reasons.map((r) => ({ ...r })),
  });
  const [openFaq, setOpenFaq] = useState("");
  const [error, setError] = useState("");
  const logoRef = useRef(null);
  const productImgRef = useRef(null);
  const [imgTarget, setImgTarget] = useState("");

  const handleOk = /^[a-z0-9._]{3,20}$/.test(d.handle);
  const set = (key, value) => {
    setD((prev) => ({ ...prev, [key]: value }));
    setError("");
  };
  const setItem = (listKey, id, key, value) =>
    setD((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((x) => (x.id === id ? { ...x, [key]: value } : x)),
    }));
  const removeItem = (listKey, id) =>
    setD((prev) => ({ ...prev, [listKey]: prev[listKey].filter((x) => x.id !== id) }));

  const pickLogo = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      set("logo", await shrinkImage(file, 320));
    } catch (err) {
      showToast("사진을 불러오지 못했어요");
    }
  };

  const pickProductImg = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file || !imgTarget) return;
    try {
      const data = await shrinkImage(file, 240);
      setItem("products", imgTarget, "img", data);
    } catch (err) {
      showToast("사진을 불러오지 못했어요");
    }
  };

  const fail = (t, message) => {
    setTab(t);
    setError(message);
  };

  const save = () => {
    if (!d.marketName.trim()) return fail("profile", "마켓 이름을 입력해 주세요.");
    if (!handleOk) return fail("profile", "샵 URL은 영문 소문자·숫자·밑줄 3~20자로 적어 주세요.");
    if ((d.kakaoUrl || "").trim() && !validKakaoUrl(d.kakaoUrl))
      return fail("profile", "카카오톡 상담 주소는 pf.kakao.com 또는 open.kakao.com 으로 시작해야 해요.");
    const products = d.products
      .map((p) => ({
        ...p,
        name: p.name.trim(),
        colors: splitOptions(p.colors).join(" / "),
        sizes: splitOptions(p.sizes).join(" / "),
      }))
      .filter((p) => p.name);
    if (d.productMode === "list" && products.length === 0)
      return fail("products", "상품을 하나 이상 등록하거나, '손님이 직접 입력'으로 바꿔 주세요.");
    const reasons = d.reasons.map((r) => ({ ...r, label: r.label.trim() })).filter((r) => r.label);
    if (reasons.length === 0) return fail("products", "교환·반품 사유를 하나 이상 남겨 주세요.");
    if (!d.accountNumber.trim() || !d.accountHolder.trim())
      return fail("pay", "계좌번호와 예금주를 입력해 주세요.");
    if (d.feeOnCustomer && d.shippingFee === "") return fail("pay", "반품 배송비 금액을 입력해 주세요.");
    const faqs = d.faqs
      .map((f) => ({ ...f, q: f.q.trim(), a: f.a.trim() }))
      .filter((f) => f.q && f.a);
    onSave({
      ...d,
      marketName: d.marketName.trim(),
      kakaoUrl: normalizeKakaoUrl(d.kakaoUrl),
      intro: d.intro.trim(),
      accountNumber: d.accountNumber.trim(),
      accountHolder: d.accountHolder.trim(),
      shippingFee: Number(d.shippingFee) || 0,
      products,
      reasons,
      faqs,
    });
  };

  return (
    <Modal
      title="마켓 프로필 & CS 빠른 설정"
      desc="스토어 기본 정보와 CS 정책을 한 번에 설정하세요."
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onReset}
            className="whitespace-nowrap text-[12px] text-neutral-400 underline underline-offset-2"
          >
            {resetLabel}
          </button>
          <span className="flex-1" />
          <button type="button" onClick={onClose} className={outlineBtn + " px-6 py-2.5"}>
            취소
          </button>
          <button
            type="button"
            onClick={save}
            className="whitespace-nowrap rounded-lg bg-neutral-900 px-6 py-2.5 text-[13px] font-semibold text-white transition active:scale-95"
          >
            저장하기
          </button>
        </>
      }
    >
      <div className="sticky top-0 z-10 -mx-5 bg-white px-5 pb-2">
        <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-100 p-1">
          {SETTINGS_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={
                "whitespace-nowrap rounded-lg py-2 text-[12.5px] font-semibold transition " +
                (tab === t.id ? "bg-white text-neutral-900 shadow-card" : "text-neutral-500")
              }
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600">{error}</p>
      ) : null}

      {tab === "profile" ? (
        <>
          <div className="rounded-xl bg-[#F5F4F1] px-4 py-3">
            <p className="mb-1 text-[11px] font-semibold text-neutral-400">손님 화면 미리보기</p>
            <BrandHeader settings={d} compact />
          </div>

          <Box2 title="프로필 사진" hint="정사각형 사진이 가장 예쁘게 보여요.">
            <input ref={logoRef} type="file" accept="image/*" onChange={pickLogo} className="hidden" />
            <div className="flex items-center gap-3">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50 text-neutral-400">
                {d.logo ? (
                  <img src={d.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Camera size={22} />
                )}
              </span>
              <button
                type="button"
                onClick={() => logoRef.current && logoRef.current.click()}
                className={outlineBtn}
              >
                <ImagePlus size={14} /> {d.logo ? "사진 바꾸기" : "사진 올리기"}
              </button>
              {d.logo ? (
                <button
                  type="button"
                  onClick={() => set("logo", "")}
                  className="whitespace-nowrap text-[13px] font-medium text-neutral-400"
                >
                  삭제
                </button>
              ) : null}
            </div>
          </Box2>

          <Box2
            title="카카오톡 1:1 상담 연결"
            hint="손님 화면 맨 아래 노란 버튼을 누르면 여기로 연결돼요. 비워 두면 버튼이 숨겨져요."
          >
            <input
              value={d.kakaoUrl || ""}
              onChange={(e) => set("kakaoUrl", e.target.value)}
              placeholder="https://pf.kakao.com/_xxxx/chat"
              aria-label="카카오톡 상담 주소"
              className={inputClass + " py-2.5 text-[14px]"}
            />
            <p
              className={
                "mt-1.5 text-[12px] " +
                (!(d.kakaoUrl || "").trim()
                  ? "text-neutral-400"
                  : validKakaoUrl(d.kakaoUrl)
                  ? "text-emerald-600"
                  : "text-rose-500")
              }
            >
              {!(d.kakaoUrl || "").trim()
                ? "카카오톡 채널 채팅 주소나 오픈채팅 주소를 붙여 넣어 주세요."
                : validKakaoUrl(d.kakaoUrl)
                ? "연결할 수 있는 주소예요."
                : "pf.kakao.com 또는 open.kakao.com 주소만 넣을 수 있어요."}
            </p>
          </Box2>

          <Box2 title="마켓 이름 & 소개 문구">
            <div className="space-y-2">
              <div className={cellRow}>
                <span className={cellLabel}>마켓 이름</span>
                <input
                  value={d.marketName}
                  onChange={(e) => set("marketName", e.target.value.slice(0, 20))}
                  aria-label="마켓 이름"
                  className={cellInput}
                />
              </div>
              <textarea
                value={d.intro}
                onChange={(e) => set("intro", e.target.value.slice(0, 80))}
                rows={3}
                placeholder="손님에게 보여 줄 소개 문구 (줄바꿈 가능)"
                aria-label="소개 문구"
                className={inputClass + " resize-none py-2.5 text-[14px]"}
              />
              <p className="text-right text-[11px] text-neutral-400">{d.intro.length}/80</p>
            </div>
          </Box2>

          <Box2 title="글꼴" hint="마켓 이름과 소개 문구에 적용돼요.">
            <div className="grid grid-cols-2 gap-2">
              {FONTS.map((f) => {
                const on = d.font === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => set("font", f.id)}
                    aria-pressed={on}
                    className={
                      "rounded-lg border px-3 py-2.5 text-left transition " +
                      (on ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200")
                    }
                  >
                    <span
                      className="block truncate text-neutral-900"
                      style={{
                        fontFamily: f.family,
                        fontWeight: f.weight,
                        fontSize: 18 * f.scale + "px",
                      }}
                    >
                      {d.marketName || "마켓 이름"}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
                      {on ? <Check size={11} strokeWidth={3} /> : null}
                      {f.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </Box2>

          <Box2 title="샵 URL 설정" hint="고객에게 보여질 마켓 고유 링크입니다.">
            <div className={cellRow}>
              <span className={cellLabel + " w-auto"}>{linkHost()}/@</span>
              <input
                value={d.handle}
                onChange={(e) => set("handle", e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                aria-label="샵 URL"
                className={cellInput}
              />
              <span
                className={
                  "flex shrink-0 items-center gap-1 whitespace-nowrap px-3 text-[12px] font-medium " +
                  (handleOk ? "text-emerald-600" : "text-rose-500")
                }
              >
                {handleOk ? (
                  <>
                    <Check size={14} /> 사용 가능
                  </>
                ) : (
                  "3~20자"
                )}
              </span>
            </div>
            <button
              type="button"
              onClick={async () => {
                const ok = await copyText("https://" + shopLink(d));
                showToast(ok ? "링크를 복사했어요" : "복사가 안 됐어요");
              }}
              className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-500"
            >
              https://{shopLink(d)} <Copy size={12} />
            </button>
          </Box2>

          {onWithdraw ? (
            <section className="rounded-xl border border-neutral-200 p-4">
              <h3 className="text-[14px] font-bold text-neutral-900">계정</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                탈퇴하면 마켓 정보와 모든 접수 기록이 바로 지워지고, 내 링크도 더 이상 열리지 않아요.
              </p>
              <button
                type="button"
                onClick={() => setLeaving(true)}
                className="mt-3 text-[13px] font-semibold text-red-600 underline underline-offset-2"
              >
                회원 탈퇴
              </button>
            </section>
          ) : null}
        </>
      ) : null}

      {leaving ? (
        <Modal
          title="정말 탈퇴할까요?"
          desc="지운 정보는 다시 되돌릴 수 없어요."
          onClose={closeLeave}
          z="z-[60]"
          footer={
            <>
              <button type="button" onClick={closeLeave} className={outlineBtn + " px-5 py-2.5"}>
                취소
              </button>
              <span className="flex-1" />
              <button
                type="button"
                disabled={!leaveCheck || leaveText.trim() !== "탈퇴" || leaveBusy}
                onClick={async () => {
                  setLeaveBusy(true);
                  const ok = await Promise.resolve(onWithdraw()).catch(() => false);
                  setLeaveBusy(false);
                  if (ok === false) showToast("탈퇴 처리가 안 됐어요. 잠시 후 다시 시도해 주세요", "warn");
                }}
                className="whitespace-nowrap rounded-lg bg-red-600 px-5 py-2.5 text-[13px] font-semibold text-white transition active:scale-95 disabled:opacity-40"
              >
                {leaveBusy ? "지우는 중…" : "탈퇴하기"}
              </button>
            </>
          }
        >
          <ul className="space-y-1.5 rounded-xl bg-red-50 p-4 text-[13px] text-red-800">
            <li>· 마켓 정보, 상품, 설정이 모두 지워져요</li>
            <li>· 접수 기록 전부와 손님 개인정보가 지워져요</li>
            <li>· 내 링크({shopLink(settings)})로 손님이 더 이상 접수할 수 없어요</li>
          </ul>
          <button
            type="button"
            role="checkbox"
            aria-checked={leaveCheck}
            onClick={() => setLeaveCheck(!leaveCheck)}
            className="flex w-full items-start gap-2.5 text-left text-[13px] text-neutral-700"
          >
            <span
              className={
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 " +
                (leaveCheck ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300")
              }
            >
              {leaveCheck ? <Check size={13} strokeWidth={3} /> : null}
            </span>
            위 내용을 확인했고, 진행 중인 접수가 있어도 지워지는 데 동의해요
          </button>
          <Field label="확인을 위해 '탈퇴'라고 입력해 주세요">
            <input
              value={leaveText}
              onChange={(e) => setLeaveText(e.target.value)}
              placeholder="탈퇴"
              aria-label="탈퇴 확인 입력"
              className={inputClass + " py-2.5"}
            />
          </Field>
        </Modal>
      ) : null}

      {tab === "products" ? (
        <>
          <Box2 title="상품명 입력 방식" hint="손님이 교환·반품할 상품을 어떻게 적을지 정해요.">
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "list", title: "등록 상품에서 고르기", sub: "오타·확인 문의가 줄어요" },
                { id: "free", title: "손님이 직접 입력", sub: "상품 등록 없이 바로 써요" },
              ].map((m) => {
                const on = d.productMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => set("productMode", m.id)}
                    aria-pressed={on}
                    className={
                      "rounded-lg border px-3 py-3 text-left transition " +
                      (on ? "border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900" : "border-neutral-200")
                    }
                  >
                    <span className="flex items-center gap-1.5 text-[13px] font-bold text-neutral-900">
                      <span
                        className={
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                          (on ? "border-neutral-900 bg-neutral-900" : "border-neutral-300")
                        }
                      >
                        {on ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                      </span>
                      {m.title}
                    </span>
                    <span className="mt-1 block pl-[22px] text-[11.5px] text-neutral-500">{m.sub}</span>
                  </button>
                );
              })}
            </div>
            {d.productMode === "list" ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[13px] text-neutral-800">목록에 없는 상품은 직접 입력 허용</span>
                <Toggle
                  checked={d.allowOther}
                  tone="blue"
                  onChange={() => set("allowOther", !d.allowOther)}
                  label="목록에 없는 상품 직접 입력 허용"
                />
              </div>
            ) : null}
          </Box2>

          {d.productMode === "list" ? (
            <Box2
              title={"등록 상품 " + d.products.length + "개"}
              hint="상품마다 색상 한 줄, 사이즈 한 줄만 적으면 돼요(/ 로 구분). 비슷한 상품은 복제 버튼으로 옵션째 복사하세요."
            >
              <input
                ref={productImgRef}
                type="file"
                accept="image/*"
                onChange={pickProductImg}
                className="hidden"
              />
              <div className="space-y-2">
                {d.products.map((p) => (
                  <div key={p.id} className="flex gap-2 rounded-lg border border-neutral-200 p-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImgTarget(p.id);
                        if (productImgRef.current) productImgRef.current.click();
                      }}
                      aria-label={(p.name || "상품") + " 사진 올리기"}
                      className="relative shrink-0"
                    >
                      <Thumb kind={p.kind} img={p.img} size="h-14 w-14" />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-neutral-900 text-white">
                        <Camera size={11} />
                      </span>
                    </button>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <input
                        value={p.name}
                        onChange={(e) => setItem("products", p.id, "name", e.target.value)}
                        placeholder="상품명"
                        aria-label="상품명"
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-[14px] outline-none focus:border-neutral-900"
                      />
                      <div className="flex gap-1.5">
                        <input
                          value={p.colors || ""}
                          onChange={(e) => setItem("products", p.id, "colors", e.target.value)}
                          placeholder="색상: 블랙 / 아이보리"
                          aria-label="색상"
                          className="w-0 min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[13px] text-neutral-600 outline-none focus:border-neutral-900"
                        />
                        <input
                          value={p.sizes || ""}
                          onChange={(e) => setItem("products", p.id, "sizes", e.target.value)}
                          placeholder="사이즈: S / M / L"
                          aria-label="사이즈"
                          className="w-0 min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-1.5 text-[13px] text-neutral-600 outline-none focus:border-neutral-900"
                        />
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col">
                      <button
                        type="button"
                        onClick={() =>
                          setD((prev) => {
                            const at = prev.products.findIndex((x) => x.id === p.id);
                            const list = [...prev.products];
                            list.splice(at + 1, 0, { ...p, id: "p" + Date.now(), name: p.name + " (복사)", img: "" });
                            return { ...prev, products: list };
                          })
                        }
                        aria-label={(p.name || "상품") + " 복제"}
                        title="같은 옵션으로 복제"
                        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem("products", p.id)}
                        aria-label={(p.name || "상품") + " 삭제"}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setD((prev) => ({
                    ...prev,
                    products: [
                      ...prev.products,
                      { id: "p" + Date.now(), name: "", colors: "", sizes: "", kind: "default", img: "" },
                    ],
                  }))
                }
                className={outlineBtn + " mt-3"}
              >
                <Plus size={14} /> 상품 추가
              </button>
            </Box2>
          ) : null}

          <Box2
            title="교환·반품 사유"
            hint="'판매자 부담'을 켜면 그 사유를 고른 손님에게 배송비 무료로 안내돼요."
          >
            <div className="space-y-2">
              {d.reasons.map((r) => (
                <div key={r.id} className="flex items-center gap-2">
                  <input
                    value={r.label}
                    onChange={(e) => setItem("reasons", r.id, "label", e.target.value)}
                    placeholder="사유"
                    aria-label="사유"
                    className="min-w-0 flex-1 rounded-md border border-neutral-200 px-2.5 py-2 text-[14px] outline-none focus:border-neutral-900"
                  />
                  <span className="whitespace-nowrap text-[11.5px] text-neutral-500">판매자 부담</span>
                  <Toggle
                    small
                    checked={r.free}
                    onChange={() => setItem("reasons", r.id, "free", !r.free)}
                    label={(r.label || "사유") + " 판매자 부담"}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem("reasons", r.id)}
                    aria-label={(r.label || "사유") + " 삭제"}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setD((prev) => ({
                  ...prev,
                  reasons: [...prev.reasons, { id: "s" + Date.now(), label: "", free: false }],
                }))
              }
              className={outlineBtn + " mt-3"}
            >
              <Plus size={14} /> 사유 추가
            </button>
          </Box2>
        </>
      ) : null}

      {tab === "pay" ? (
        <>
          <Box2 title="계좌 정보 설정" hint="배송비를 입금받을 계좌를 등록해주세요.">
            <div className="space-y-2">
              <SelectBox value={d.bank} onChange={(v) => set("bank", v)} label="은행">
                {BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </SelectBox>
              <div className={cellRow}>
                <span className={cellLabel}>계좌번호</span>
                <input
                  value={d.accountNumber}
                  onChange={(e) => set("accountNumber", e.target.value.replace(/[^\d-]/g, ""))}
                  inputMode="numeric"
                  aria-label="계좌번호"
                  className={cellInput}
                />
              </div>
              <div className={cellRow}>
                <span className={cellLabel}>예금주</span>
                <input
                  value={d.accountHolder}
                  onChange={(e) => set("accountHolder", e.target.value)}
                  aria-label="예금주"
                  className={cellInput}
                />
              </div>
            </div>
          </Box2>

          <Box2 title="반품 배송비 설정" hint="기본 반품 배송비 정책을 설정합니다.">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-neutral-800">반품 배송비 고객 부담</span>
              <Toggle
                checked={d.feeOnCustomer}
                tone="blue"
                onChange={() => set("feeOnCustomer", !d.feeOnCustomer)}
                label="반품 배송비 고객 부담"
              />
            </div>
            {d.feeOnCustomer ? (
              <div className={cellRow + " mt-3"}>
                <span className={cellLabel}>금액</span>
                <input
                  value={d.shippingFee}
                  onChange={(e) => set("shippingFee", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  aria-label="반품 배송비 금액"
                  className={cellInput}
                />
                <span className="flex shrink-0 items-center px-3 text-[12px] text-neutral-400">KRW</span>
              </div>
            ) : null}
            <p className="mt-2 text-[12px] text-neutral-400">설정 금액은 반품 접수 시 자동으로 안내됩니다.</p>
          </Box2>
        </>
      ) : null}

      {tab === "faq" ? (
        <Box2 title="FAQ 설정" hint="자주 묻는 질문과 답변을 등록하세요.">
          <div className="space-y-2">
            {d.faqs.map((f) => {
              const isOpen = openFaq === f.id;
              return (
                <div key={f.id} className="rounded-lg border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? "" : f.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] text-neutral-800"
                  >
                    <span className="truncate">Q. {f.q || "새 질문"}</span>
                    <ChevronDown
                      size={16}
                      className={"shrink-0 text-neutral-400 transition-transform " + (isOpen ? "rotate-180" : "")}
                    />
                  </button>
                  {isOpen ? (
                    <div className="space-y-2 border-t border-neutral-200 p-3">
                      <input
                        value={f.q}
                        onChange={(e) => setItem("faqs", f.id, "q", e.target.value)}
                        placeholder="질문"
                        aria-label="질문"
                        className={inputClass + " py-2 text-[14px]"}
                      />
                      <textarea
                        value={f.a}
                        onChange={(e) => setItem("faqs", f.id, "a", e.target.value)}
                        rows={3}
                        placeholder="답변"
                        aria-label="답변"
                        className={inputClass + " resize-none py-2 text-[14px]"}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem("faqs", f.id)}
                        className="flex items-center gap-1 text-[12px] font-medium text-red-500"
                      >
                        <Trash2 size={13} /> 이 항목 삭제
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              const id = "f" + Date.now();
              setD((prev) => ({ ...prev, faqs: [...prev.faqs, { id, q: "", a: "" }] }));
              setOpenFaq(id);
            }}
            className={outlineBtn + " mt-3"}
          >
            <Plus size={14} /> FAQ 항목 추가
          </button>
        </Box2>
      ) : null}
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면: 포토 리뷰 갤러리                                         */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 소개 페이지 & 가입                                                    */
/* ------------------------------------------------------------------ */

const RESERVED_HANDLES = ["admin", "start", "signup", "login", "returnlink", "oat_studio", "help", "api", "ops"];

function KakaoButton({ onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex items-center justify-center gap-2 rounded-xl bg-[#FEE500] px-6 py-4 text-[15px] font-bold text-[#191919] shadow-card transition active:scale-[0.98] " +
        className
      }
    >
      <MessageCircle size={18} fill="#191919" />
      {children}
    </button>
  );
}

const SHOWCASE = [
  {
    src: "/showcase/1.webp",
    title: "방어한 카톡과 아낀 시간이 한눈에",
    desc: "사장님 화면에서 이번 주 숫자가 바로 보여요",
    alt: "이번 주 카톡 32건을 대신 막아 줬어요. 아낀 시간 4.1시간, 지금 할 일 12건",
  },
  {
    src: "/showcase/6.webp",
    title: "\"언제 와요?\" 카톡이 사라져요",
    desc: "손님이 결제 확인·발송 예정일·송장을 직접 확인해요",
    alt: "손님이 이름과 전화번호 뒤 4자리로 주문 상태와 발송 예정일을 조회하는 화면",
  },
  {
    src: "/showcase/2.webp",
    title: "입금·수거·발송, 체크만 하세요",
    desc: "단계별 탭과 버튼 하나로 다음 단계로 넘겨요",
    alt: "접수 목록과 입금확인대기, 수거진행, 발송 탭",
  },
  {
    src: "/showcase/3.webp",
    title: "손님은 내 링크로 들어와서 접수해요",
    desc: "가입이나 앱 설치 없이 바로 시작해요",
    alt: "손님이 보는 마켓 접수 화면",
  },
  {
    src: "/showcase/4.webp",
    title: "상품과 옵션은 눌러서 고르기만",
    desc: "다시 물어볼 필요 없이 정확하게 들어와요",
    alt: "손님이 상품과 옵션을 골라 교환을 접수하는 화면",
  },
  {
    src: "/showcase/7.webp",
    title: "엑셀 한 번, 체크 한 번으로 끝",
    desc: "결제 확인·발송 예정일·송장을 여러 손님에게 한 번에",
    alt: "사장님이 주문 목록에서 여러 손님을 체크해 발송 예정일을 한 번에 정하는 화면",
  },
  {
    src: "/showcase/5.webp",
    title: "빠른 설정으로 내 마켓을 바로 손봐요",
    desc: "꾸미기, 상품, 계좌, FAQ를 한곳에서 고쳐요",
    alt: "사장님 화면의 빠른 설정 카드",
  },
];

function Showcase() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return undefined;
    try {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    } catch (e) {
      /* 무시 */
    }
    const t = setInterval(() => setI((v) => (v + 1) % SHOWCASE.length), 3800);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div
      className="mx-auto w-full max-w-[560px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div className="relative aspect-[1600/1060] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-card">
        {SHOWCASE.map((x, n) => (
          <img
            key={x.src}
            src={x.src}
            alt={n === i ? x.alt : ""}
            aria-hidden={n !== i}
            loading={n === 0 ? "eager" : "lazy"}
            draggable={false}
            className={
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-700 " +
              (n === i ? "opacity-100" : "opacity-0")
            }
          />
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-1">
        {SHOWCASE.map((x, n) => (
          <button
            key={x.src}
            type="button"
            onClick={() => setI(n)}
            aria-label={n + 1 + "번째 사진 보기"}
            aria-current={n === i}
            className="flex h-8 w-6 items-center justify-center"
          >
            <span
              className={
                "block h-1.5 rounded-full transition-all " + (n === i ? "w-5 bg-neutral-900" : "w-1.5 bg-neutral-300")
              }
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function LandingStats() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-14">
      <div className="text-center">
        <p className="text-[13px] font-bold text-emerald-700">사장님 화면 미리보기</p>
        <h2 className="mt-1 text-[24px] font-bold tracking-tight text-neutral-900">
          방어한 카톡과 아낀 시간이 숫자로 쌓여요
        </h2>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<MessageCircle className="h-5 w-5 text-violet-500" />}
          tone="bg-violet-100"
          label="이번 주 방어한 카톡"
          value={32}
          unit="건"
          pill={
            <>
              지난 주 대비 +19% <ArrowUp size={12} />
            </>
          }
          pillTone="bg-violet-50 text-violet-700"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-emerald-700" />}
          tone="bg-emerald-100"
          label="아낀 CS 시간 (추정)"
          value="4.1"
          unit="시간"
          pill={
            <>
              지난 주 대비 +0.8시간 <ArrowUp size={12} />
            </>
          }
          pillTone="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          icon={<Box className="h-5 w-5 text-orange-500" />}
          tone="bg-orange-100"
          label="지금 할 일"
          value={12}
          unit="건"
          pill="입금 4 · 수거 5 · 발송 3"
          pillTone="bg-orange-50 text-orange-700"
        />
      </div>
      <p className="mt-3 text-center text-[12px] text-neutral-400">
        예시 화면이에요. 가입하면 내 접수와 조회가 이렇게 숫자로 쌓여요.
      </p>
    </section>
  );
}

function HeroMock() {
  const sample = { type: "exchange", amount: 6000, paid: true, pickup: "progress", decision: null };
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -right-3 -top-3 hidden rotate-3 rounded-2xl sm:block border border-neutral-200 bg-white p-4 opacity-60 shadow-card">
        <p className="text-[12px] text-neutral-400">반품 접수 · 이서연</p>
        <p className="mt-1 text-[13px] font-semibold text-neutral-700">Wide Denim Pants (M)</p>
      </div>
      <div className="relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            새 교환 접수
          </span>
          <span className="text-[11px] text-neutral-400">방금 전</span>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Thumb kind="jacket" size="h-12 w-12" />
          <div className="min-w-0">
            <p className="truncate text-[14px] font-bold text-neutral-900">Classic Wool Jacket</p>
            <p className="text-[12.5px] text-neutral-500">블랙 M → 블랙 L · 사이즈 교환</p>
          </div>
        </div>
        <p className="mt-3 text-[12px] text-neutral-500">김민지 · 010-2345-5678 · 배송비 입금 완료</p>
        <div className="mt-4">
          <Steps r={sample} />
        </div>
      </div>
    </div>
  );
}

export function Landing({ onStart, onDemo }) {
  const [openFaq, setOpenFaq] = useState(-1);
  const [whyOpen, setWhyOpen] = useState(false);
  const faqs = [
    {
      q: "손님도 가입해야 하나요?",
      a: "아니요. 손님은 사장님 링크를 눌러 바로 접수해요. 가입이나 앱 설치가 필요 없어요.",
    },
    {
      q: "새 접수가 오면 어떻게 알 수 있나요?",
      a: "사장님 화면에 할 일 개수가 바로 보여요. 새 접수 카카오톡 알림은 준비 중이에요.",
    },
    {
      q: "손님 개인정보는 안전한가요?",
      a: "접수 때 동의를 받고, 처리가 끝난 건은 90일 뒤 자동으로 지워져요. 다른 사장님은 내 접수를 볼 수 없어요.",
    },
    {
      q: "왜 무료인가요?",
      a: "더 나은 서비스를 위해 실제로 써 보신 사장님들의 피드백이 필요해요. 그래서 먼저 함께해 주시는 사장님 20분께는 평생 무료로 드려요. 카드 등록도 없고, 접수 개수 제한도 없어요.",
    },
    {
      q: "그만 쓰고 싶으면요?",
      a: "사장님 화면 설정에서 언제든 탈퇴할 수 있어요. 탈퇴하면 마켓 정보와 접수 기록이 모두 바로 지워져요.",
    },
  ];

  return (
    <div className="bg-[#F5F4F1]">
      <section className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-14 pt-10 md:grid-cols-2 md:pt-16">
        <div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700">
            <Store size={13} /> 인스타 1인 마켓 전용
          </p>
          <h1 className="mt-4 text-[32px] font-bold leading-[1.25] tracking-tight text-neutral-900 md:text-[42px]">
            반품·교환 카톡,
            <br />
            이제 링크 하나로 받으세요
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">
            손님은 링크에서 1분 만에 접수하고, 사장님은 입금·수거·발송을 체크리스트로 관리해요. 카톡으로
            하나하나 주고받을 필요가 없어요.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <KakaoButton onClick={onStart}>카카오로 3초 만에 시작하기</KakaoButton>
            {onDemo ? (
              <button
                type="button"
                onClick={onDemo}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 bg-emerald-600 px-6 py-4 text-[16px] font-bold text-white shadow-card transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                <Eye size={18} />
                구경할래요!
              </button>
            ) : null}
          </div>
          <p className="mt-3 text-[12.5px] text-neutral-500">무료 · 접수 무제한 · 카드 등록 없음</p>
        </div>
        <Showcase />
      </section>

      <LandingStats />

      <section className="bg-white py-14">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="text-center text-[24px] font-bold tracking-tight text-neutral-900">
            카톡으로 받을 때 vs 리턴링크
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <p className="text-[14px] font-bold text-neutral-500">카톡으로 받으면</p>
              <ul className="mt-3 space-y-2.5 text-[14px] text-neutral-600">
                {[
                  "상품명, 사이즈, 사유를 하나씩 다시 물어봐요",
                  "계좌번호와 배송비를 매번 복사해 보내요",
                  "입금했는지 대화를 뒤져서 확인해요",
                  "“언제 와요?” 문의에 계속 답장해요",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <X size={16} className="mt-0.5 shrink-0 text-neutral-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-emerald-500 bg-white p-6">
              <p className="text-[14px] font-bold text-emerald-700">리턴링크를 쓰면</p>
              <ul className="mt-3 space-y-2.5 text-[14px] text-neutral-800">
                {[
                  "필요한 정보가 한 번에 정리돼서 들어와요",
                  "계좌와 배송비는 손님 화면에 자동으로 안내돼요",
                  "입금·수거·발송을 한 화면에서 체크해요",
                  "손님이 진행 상황을 직접 조회해요",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" strokeWidth={3} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-center text-[24px] font-bold tracking-tight text-neutral-900">시작은 1분이면 돼요</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { t: "가입하고 내 링크 만들기", d: "카카오로 가입하고 마켓 이름, 계좌, 배송비만 적으면 내 링크가 생겨요." },
            { t: "인스타 프로필에 붙이기", d: "프로필 링크와 카톡 자동응답에 붙여 두면 손님이 알아서 들어와요." },
            { t: "접수 오면 체크만", d: "입금 확인, 수거 완료, 발송 완료를 차례로 누르면 끝이에요." },
          ].map((s, i) => (
            <li key={s.t} className={panelClass + " p-6"}>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-[14px] font-bold text-white">
                {i + 1}
              </span>
              <p className="mt-3 text-[16px] font-bold text-neutral-900">{s.t}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-500">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-[24px] font-bold tracking-tight text-neutral-900">요금</h2>
          <div className="relative mx-auto mt-8 max-w-md rounded-2xl border-2 border-neutral-900 bg-white p-6">
            <span className="absolute -top-3 left-6 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white">
              무료
            </span>
            <p className="text-[15px] font-bold text-neutral-900">리턴링크</p>
            <p className="mt-2 text-[34px] font-extrabold tracking-wide text-blue-600">FREE</p>
            <p className="mt-1 text-[13px] leading-relaxed text-neutral-500">
              모든 기능을 무료로 써요.
            </p>
            <ul className="mt-4 space-y-2 text-[13.5px] text-neutral-700">
              {[
                "접수 무제한 · 모든 기능 그대로",
                "카드 등록 없음",
                "가입은 카카오로 3초",
                "언제든 탈퇴할 수 있어요",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onStart}
              className="mt-6 w-full rounded-xl bg-neutral-900 py-3.5 text-[14px] font-semibold text-white"
            >
              지금 무료로 시작하기
            </button>
            <p className="mt-2.5 text-center text-[12.5px] font-semibold text-red-600">
              평생 무료 혜택이 얼마 남지 않았어요!
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-md overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
            <button
              type="button"
              onClick={() => setWhyOpen(!whyOpen)}
              aria-expanded={whyOpen}
              className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left"
            >
              <span className="text-[16px] font-bold text-neutral-900">왜 무료인가요?</span>
              <ChevronDown
                size={18}
                className={"shrink-0 text-emerald-700 transition " + (whyOpen ? "rotate-180" : "")}
              />
            </button>
            {whyOpen ? (
              <div className="animate-fade-up px-6 pb-6">
                <p className="text-[14px] leading-relaxed text-neutral-700">
                  리턴링크는 사장님들께 더 나은 서비스를 드리기 위해 실제로 써 보신 분들의 피드백이 필요해요.
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-neutral-700">
                  그래서 먼저 함께해 주시는 <b className="text-emerald-700">사장님 20분께는 평생 무료</b>로 드려요. 써 보시고
                  불편한 점이나 필요한 기능을 알려 주시면 바로 반영할게요.
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3">
                  <p className="text-[13.5px] font-bold text-neutral-900">선착순 20명 · 평생 무료</p>
                  <button
                    type="button"
                    onClick={onStart}
                    className="whitespace-nowrap rounded-lg bg-emerald-600 px-4 py-2.5 text-[13px] font-bold text-white transition active:scale-95"
                  >
                    지금 자리 잡기
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14">
        <h2 className="text-center text-[24px] font-bold tracking-tight text-neutral-900">자주 묻는 질문</h2>
        <ul className={panelClass + " mt-8 divide-y divide-neutral-200 px-5"}>
          {faqs.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <li key={f.q}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-3 py-4 text-left"
                >
                  <span className="text-[14.5px] font-semibold text-neutral-900">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={"shrink-0 text-neutral-400 transition-transform " + (isOpen ? "rotate-180" : "")}
                  />
                </button>
                {isOpen ? (
                  <p className="animate-fade-up pb-4 text-[13.5px] leading-relaxed text-neutral-600">{f.a}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="mt-10 text-center">
          <KakaoButton onClick={onStart} className="mx-auto">
            카카오로 3초 만에 시작하기
          </KakaoButton>
        </div>
      </section>

      <footer className="border-t border-neutral-200 py-8 text-center text-[12px] text-neutral-400">
        <p className="text-[14px]"><RLWord /></p>
        <p className="mt-2 flex justify-center gap-3">
          <span>이용약관</span>
          <span>개인정보 처리방침</span>
          <span>문의하기</span>
        </p>
        <p className="mt-2">© 2026 ReturnLink</p>
      </footer>
    </div>
  );
}

function StepShell({ step, title, desc, children, onBack, onNext, nextLabel = "다음", extra }) {
  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between">
        {onBack ? (
          <button type="button" onClick={onBack} className="flex items-center gap-1 text-[13px] text-neutral-500">
            <ChevronLeft size={16} /> 이전
          </button>
        ) : (
          <span />
        )}
        <span className="text-[12px] font-semibold text-neutral-400">{step} / 3</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-200">
        <div className="h-full rounded-full bg-neutral-900 transition-all duration-500" style={{ width: (step / 3) * 100 + "%" }} />
      </div>
      <h1 className="mt-6 text-[22px] font-bold tracking-tight text-neutral-900">{title}</h1>
      {desc ? <p className="mt-1.5 text-[13.5px] text-neutral-500">{desc}</p> : null}
      <div className="mt-5 space-y-4">{children}</div>
      <button
        type="button"
        onClick={onNext}
        className="mt-6 w-full rounded-xl bg-neutral-900 py-4 text-[15px] font-bold text-white transition active:scale-[0.98]"
      >
        {nextLabel}
      </button>
      {extra}
    </div>
  );
}

export function SignupFlow({ onFinish, onGo, showToast, onKakao, checkHandle, initialStage = "login" }) {
  const [stage, setStage] = useState(initialStage);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState({
    marketName: "",
    handle: "",
    kakaoUrl: "",
    feeOnCustomer: true,
    shippingFee: "6000",
    bank: BANKS[0],
    accountNumber: "",
    accountHolder: "",
    products: [{ id: "n1", name: "", colors: "", sizes: "S / M / L", kind: "default", img: "" }],
  });
  const [errors, setErrors] = useState({});
  const [flash, setFlash] = useState(0);
  const [result, setResult] = useState(null);

  const set = (patch) => {
    setD((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => {
        next[k] = "";
      });
      return next;
    });
  };
  const setProduct = (id, key, value) =>
    setD((prev) => ({ ...prev, products: prev.products.map((p) => (p.id === id ? { ...p, [key]: value } : p)) }));

  const fail = (next) => {
    setErrors(next);
    if (Object.keys(next).length) {
      setFlash((f) => f + 1);
      showToast("빠진 항목을 확인해 주세요", "warn");
      return true;
    }
    return false;
  };

  const go = (s) => {
    setStage(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTaken = RESERVED_HANDLES.includes(d.handle);
  const handleValid = /^[a-z0-9._]{3,20}$/.test(d.handle);

  const finish = async (skipProducts) => {
    if (busy) return;
    const products = skipProducts
      ? []
      : d.products
          .map((p) => ({
            ...p,
            name: p.name.trim(),
            colors: splitOptions(p.colors).join(" / "),
            sizes: splitOptions(p.sizes).join(" / "),
          }))
          .filter((p) => p.name);
    const next = {
      ...DEFAULT_SETTINGS,
      marketName: d.marketName.trim(),
      kakaoUrl: normalizeKakaoUrl(d.kakaoUrl),
      intro: "",
      logo: "",
      handle: d.handle,
      feeOnCustomer: d.feeOnCustomer,
      shippingFee: Number(d.shippingFee) || 0,
      bank: d.bank,
      accountNumber: d.accountNumber.trim(),
      accountHolder: d.accountHolder.trim(),
      products,
      productMode: products.length ? "list" : "free",
    };
    setBusy(true);
    const ok = await Promise.resolve(onFinish(next)).catch(() => false);
    setBusy(false);
    if (ok === false) return;
    setResult(next);
    go("done");
  };

  const shell = (inner) => (
    <div className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
      <FlashContext.Provider value={flash}>{inner}</FlashContext.Provider>
    </div>
  );

  if (stage === "login") {
    return shell(
      <div className="animate-fade-up">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-card">
          <div className="flex items-center gap-2 bg-[#FEE500] px-5 py-4">
            <MessageCircle size={20} fill="#191919" />
            <span className="text-[15px] font-bold text-[#191919]">카카오 로그인</span>
          </div>
          <div className="p-5">
            <p className="text-[15px] font-bold text-neutral-900">리턴링크에서 아래 정보를 요청해요</p>
            <ul className="mt-3 space-y-2 text-[13.5px] text-neutral-700">
              <li className="flex items-center gap-2"><Check size={15} className="text-emerald-600" /> 닉네임</li>
              <li className="flex items-center gap-2"><Check size={15} className="text-emerald-600" /> 카카오계정 이메일 (계정 확인용)</li>
            </ul>
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (!onKakao) {
                  go(1);
                  return;
                }
                setBusy(true);
                const ok = await onKakao();
                if (!ok) {
                  setBusy(false);
                  showToast("카카오 로그인을 열지 못했어요. 다시 눌러 주세요", "warn");
                }
              }}
              className="mt-5 w-full rounded-xl bg-[#FEE500] py-3.5 text-[15px] font-bold text-[#191919] transition active:scale-[0.98] disabled:opacity-60"
            >
              {busy ? "카카오로 이동하는 중…" : "카카오로 계속하기"}
            </button>
            <p className="mt-3 text-center text-[11.5px] text-neutral-400">
              가입하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봐요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 1) {
    return shell(
      <StepShell
        step={1}
        title="마켓 정보를 알려 주세요"
        desc="손님 화면 맨 위와 내 링크에 쓰여요."
        onNext={async () => {
          if (busy) return;
          const next = {};
          if (!d.marketName.trim()) next.marketName = "마켓 이름을 입력해 주세요.";
          if (!handleValid) next.handle = "영문 소문자·숫자·밑줄로 3~20자로 적어 주세요.";
          else if (handleTaken) next.handle = "이미 쓰고 있는 주소예요. 다른 주소를 적어 주세요.";
          else if (checkHandle) {
            setBusy(true);
            const free = await checkHandle(d.handle).catch(() => null);
            setBusy(false);
            if (free === null) {
              showToast("주소 확인이 잠시 안 돼요. 다시 눌러 주세요", "warn");
              return;
            }
            if (!free) next.handle = "이미 쓰고 있는 주소예요. 다른 주소를 적어 주세요.";
          }
          if (d.kakaoUrl.trim() && !validKakaoUrl(d.kakaoUrl))
            next.kakaoUrl = "pf.kakao.com 또는 open.kakao.com 주소만 넣을 수 있어요.";
          if (!fail(next)) go(2);
        }}
      >
        <Field label="마켓 이름" error={errors.marketName}>
          <input
            value={d.marketName}
            onChange={(e) => set({ marketName: e.target.value.slice(0, 20) })}
            placeholder="예) 오트 스튜디오"
            className={inputClass}
          />
        </Field>
        <Field
          label="내 링크 주소"
          error={errors.handle}
          hint={d.handle && handleValid && !handleTaken ? "사용할 수 있는 주소예요" : "인스타 아이디와 같게 하면 손님이 알아보기 쉬워요."}
        >
          <div className="flex overflow-hidden rounded-xl border border-neutral-200 bg-white focus-within:border-neutral-900">
            <span className="flex items-center whitespace-nowrap bg-neutral-50 px-3 text-[13px] text-neutral-500">
              {linkHost()}/@
            </span>
            <input
              value={d.handle}
              onChange={(e) => set({ handle: e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20) })}
              placeholder="oat_studio"
              className="min-w-0 flex-1 px-3 py-3 outline-none"
            />
          </div>
        </Field>
        <Field
          label="카카오톡 상담 주소 (선택)"
          error={errors.kakaoUrl}
          hint={
            d.kakaoUrl.trim() && validKakaoUrl(d.kakaoUrl)
              ? "손님 화면 맨 아래에 노란 1:1 상담 버튼이 생겨요"
              : "카카오톡 채널 채팅 주소나 오픈채팅 주소예요. 나중에 설정에서 넣어도 돼요."
          }
        >
          <input
            value={d.kakaoUrl}
            onChange={(e) => set({ kakaoUrl: e.target.value })}
            placeholder="https://pf.kakao.com/_xxxx/chat"
            className={inputClass}
          />
        </Field>
      </StepShell>
    );
  }

  if (stage === 2) {
    return shell(
      <StepShell
        step={2}
        title="배송비와 입금 계좌"
        desc="손님이 교환·반품 접수할 때 자동으로 안내돼요."
        onBack={() => go(1)}
        onNext={() => {
          const next = {};
          if (d.feeOnCustomer && !d.shippingFee) next.shippingFee = "왕복 배송비를 입력해 주세요.";
          if (d.feeOnCustomer && !d.accountNumber.trim()) next.accountNumber = "계좌번호를 입력해 주세요.";
          if (d.feeOnCustomer && !d.accountHolder.trim()) next.accountHolder = "예금주를 입력해 주세요.";
          if (!fail(next)) go(3);
        }}
      >
        <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
          <div>
            <p className="text-[14px] font-semibold text-neutral-900">고객 사유는 손님이 배송비 부담</p>
            <p className="text-[12px] text-neutral-500">불량·오배송은 따로 무료로 처리돼요.</p>
          </div>
          <Toggle checked={d.feeOnCustomer} onChange={() => set({ feeOnCustomer: !d.feeOnCustomer })} label="고객 배송비 부담" />
        </div>
        {d.feeOnCustomer ? (
          <>
            <Field label="왕복 배송비 (원)" error={errors.shippingFee}>
              <input
                value={d.shippingFee}
                onChange={(e) => set({ shippingFee: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                inputMode="numeric"
                className={inputClass}
              />
            </Field>
            <Field label="은행">
              <SelectBox value={d.bank} onChange={(v) => set({ bank: v })} label="은행">
                {BANKS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </SelectBox>
            </Field>
            <div className="grid grid-cols-[1.5fr_1fr] gap-2">
              <Field label="계좌번호" error={errors.accountNumber}>
                <input
                  value={d.accountNumber}
                  onChange={(e) => set({ accountNumber: e.target.value.replace(/[^\d-]/g, "") })}
                  inputMode="numeric"
                  placeholder="3333-12-3456789"
                  className={inputClass}
                />
              </Field>
              <Field label="예금주" error={errors.accountHolder}>
                <input
                  value={d.accountHolder}
                  onChange={(e) => set({ accountHolder: e.target.value })}
                  placeholder="홍길동"
                  className={inputClass}
                />
              </Field>
            </div>
          </>
        ) : (
          <p className="rounded-xl bg-neutral-50 p-4 text-[13px] text-neutral-600">
            모든 교환·반품 배송비를 사장님이 부담해요. 손님에게는 &lsquo;무료&rsquo;로 안내돼요.
          </p>
        )}
      </StepShell>
    );
  }

  if (stage === 3) {
    return shell(
      <StepShell
        step={3}
        title="자주 파는 상품 등록"
        desc="손님이 목록에서 상품과 옵션을 골라서 오타·확인 문의가 줄어요. 나중에 해도 돼요."
        onBack={() => go(2)}
        nextLabel="완료하고 내 링크 만들기"
        onNext={() => finish(false)}
        extra={
          <button
            type="button"
            onClick={() => finish(true)}
            className="mt-2 w-full py-3 text-[13.5px] font-semibold text-neutral-500"
          >
            건너뛰기 (손님이 상품명을 직접 적어요)
          </button>
        }
      >
        {d.products.map((p, i) => (
          <div key={p.id} className="space-y-2 rounded-xl border border-neutral-200 bg-white p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-neutral-400">상품 {i + 1}</span>
              {d.products.length > 1 ? (
                <button
                  type="button"
                  onClick={() => setD((prev) => ({ ...prev, products: prev.products.filter((x) => x.id !== p.id) }))}
                  aria-label="상품 삭제"
                  className="text-neutral-400"
                >
                  <Trash2 size={15} />
                </button>
              ) : null}
            </div>
            <input
              value={p.name}
              onChange={(e) => setProduct(p.id, "name", e.target.value)}
              placeholder="상품명"
              aria-label="상품명"
              className={inputClass + " py-2.5"}
            />
            <div className="flex gap-2">
              <input
                value={p.colors}
                onChange={(e) => setProduct(p.id, "colors", e.target.value)}
                placeholder="색상: 블랙 / 아이보리"
                aria-label="색상"
                className={inputClass + " w-0 min-w-0 flex-1 py-2.5 text-[14px]"}
              />
              <input
                value={p.sizes}
                onChange={(e) => setProduct(p.id, "sizes", e.target.value)}
                placeholder="사이즈: S / M / L"
                aria-label="사이즈"
                className={inputClass + " w-0 min-w-0 flex-1 py-2.5 text-[14px]"}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() =>
            setD((prev) => ({
              ...prev,
              products: [...prev.products, { id: "n" + Date.now(), name: "", colors: "", sizes: "S / M / L", kind: "default", img: "" }],
            }))
          }
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 py-3 text-[13.5px] font-semibold text-neutral-700"
        >
          <Plus size={15} /> 상품 하나 더
        </button>
      </StepShell>
    );
  }

  // 완료
  const link = "https://" + shopLink(result || d);
  const notice =
    "교환·반품은 아래 링크에서 1분이면 접수돼요. 진행 상황도 여기서 바로 확인할 수 있어요.\n" + link;
  return shell(
    <div className="animate-fade-up text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-white">
        <Check size={32} strokeWidth={3} />
      </div>
      <h1 className="mt-4 text-[22px] font-bold tracking-tight text-neutral-900">내 링크가 생겼어요</h1>
      <p className="mt-1.5 text-[13.5px] text-neutral-500">이제 손님이 이 링크로 교환·반품을 접수해요.</p>
      <div className="mt-5 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2 pl-4">
        <span className="min-w-0 flex-1 truncate text-left text-[14px] font-semibold text-neutral-900">{link}</span>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(link);
            showToast(ok ? "링크를 복사했어요" : "복사가 안 됐어요");
          }}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-[13px] font-semibold text-white"
        >
          <Copy size={14} /> 복사
        </button>
      </div>

      <div className="mt-6 space-y-3 text-left">
        <div className={panelClass + " p-4"}>
          <p className="text-[14px] font-bold text-neutral-900">1. 인스타 프로필 링크에 붙여 넣기</p>
          <p className="mt-1 text-[12.5px] text-neutral-500">프로필 편집 → 링크 추가에 위 링크를 넣어 주세요.</p>
        </div>
        <div className={panelClass + " p-4"}>
          <p className="text-[14px] font-bold text-neutral-900">2. 카톡 문의엔 이 문구로 답장하기</p>
          <p className="mt-2 whitespace-pre-line rounded-lg bg-neutral-50 p-3 text-[12.5px] leading-relaxed text-neutral-700">
            {notice}
          </p>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(notice);
              showToast(ok ? "안내 문구를 복사했어요" : "복사가 안 됐어요");
            }}
            className={outlineBtn + " mt-2"}
          >
            <Copy size={13} /> 문구 복사
          </button>
          <p className="mt-2 text-[11.5px] text-neutral-400">카카오톡 채널 자동응답에 넣어 두면 더 편해요.</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onGo("customer")}
          className="rounded-xl border border-neutral-300 bg-white py-3.5 text-[14px] font-semibold text-neutral-800"
        >
          내 손님 화면 보기
        </button>
        <button
          type="button"
          onClick={() => onGo("admin")}
          className="rounded-xl bg-neutral-900 py-3.5 text-[14px] font-semibold text-white"
        >
          사장님 화면으로
        </button>
      </div>
    </div>
  );
}

function TrialBanner({ trialEndsAt }) {
  if (!trialEndsAt) return null;
  const end = new Date(trialEndsAt);
  if (isNaN(end.getTime())) return null;
  const left = Math.ceil((end.getTime() - Date.now()) / 86400000);
  const label = end.getMonth() + 1 + "월 " + end.getDate() + "일";
  const tone =
    left <= 7 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <div className={"mb-4 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-[13px] " + tone}>
      <Clock size={16} className="shrink-0" />
      <p className="min-w-0 flex-1">
        {left > 0 ? (
          <>
            <span className="font-semibold">무료 기간 {left}일 남음</span> · {label}까지 모든 기능을 무료로 써요.
          </>
        ) : (
          <>
            <span className="font-semibold">계속 무료로 쓸 수 있어요.</span>
          </>
        )}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 사장님 화면: 틀                                                      */
/* ------------------------------------------------------------------ */

export function AdminView({
  settings,
  requests,
  metrics,
  onUpdate,
  onDelete,
  onSaveSettings,
  onReset,
  onLogout,
  onFeedback,
  resetLabel = "데모 되돌리기",
  onWithdraw,
  trialEndsAt,
  showToast,
  orders,
  asks,
  onImportOrders,
  onSaveOrder,
  onDeleteOrders,
  onBulkOrders,
  onAnswerAsk,
  onDeleteAsk,
}) {
  const [settingsTab, setSettingsTab] = useState("");
  const [section, setSection] = useState("returns");
  const hasCs = !!onImportOrders;
  const returnTodo = requests.filter((r) => {
    const st = statusOf(r);
    return st === "waiting" || st === "progress" || st === "arrived";
  }).length;
  const shipWait = hasCs ? orders.filter((o) => !o.inv).length : 0;
  const askOpen = hasCs ? asks.filter((a) => !a.answer).length : 0;
  const [detail, setDetail] = useState(null);

  const closeSettings = useCallback(() => setSettingsTab(""), []);
  const closeDetail = useCallback(() => setDetail(null), []);

  const current = detail ? requests.find((r) => r.id === detail.id) : null;

  const apply = (id, action, extra) => {
    const r = requests.find((x) => x.id === id);
    if (!r) return;
    const t = transition(r, action, extra);
    if (t.patch) onUpdate(id, t.patch);
    if (t.message) showToast(t.message);
  };

  return (
    <div>
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-4 gap-y-3 px-4 py-4 lg:px-8">
          <p className="flex items-baseline gap-2">
            <span
              className="whitespace-nowrap text-[26px] leading-none tracking-tight text-neutral-900 lg:text-[30px]"
              style={{
                fontFamily: fontOf(settings.font).family,
                fontWeight: fontOf(settings.font).weight,
              }}
            >
              {settings.marketName}
            </span>
            <span className="whitespace-nowrap text-[15px] font-medium text-neutral-700">어드민</span>
          </p>
          <span className="flex-1" />
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText("https://" + shopLink(settings));
              showToast(ok ? "내 링크를 복사했어요" : "복사가 안 됐어요");
            }}
            className="order-last flex w-full items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[14px] text-neutral-800 sm:order-none sm:w-auto"
          >
            <LinkIcon size={15} className="shrink-0" />
            <span className="min-w-0 flex-1 truncate text-left">{shopLink(settings)}</span>
            <span className="shrink-0 font-medium">[복사]</span>
          </button>
          <button
            type="button"
            onClick={() => setSettingsTab("profile")}
            aria-label="마켓 설정 열기"
            className="flex shrink-0 items-center gap-1.5 text-neutral-600"
          >
            <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-50">
              {settings.logo ? (
                <img src={settings.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </span>
            <span className="text-[13px] font-medium">설정</span>
          </button>
          {onLogout ? (
            <button
              type="button"
              onClick={onLogout}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-[13px] font-medium text-neutral-700 transition active:scale-95"
            >
              <LogOut size={15} /> 로그아웃
            </button>
          ) : null}
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 pb-12 pt-5 lg:px-8">
        <TrialBanner trialEndsAt={trialEndsAt} />
        {!validKakaoUrl(settings.kakaoUrl) ? (
          <button
            type="button"
            onClick={() => setSettingsTab("profile")}
            className="mb-4 flex w-full items-center gap-3 rounded-xl border border-[#F5D800] bg-[#FFFBD6] px-4 py-3 text-left"
          >
            <MessageCircle size={18} className="shrink-0 text-[#191919]" />
            <span className="min-w-0 flex-1 text-[14px] text-neutral-800">
              <b>카카오톡 상담 주소</b>를 넣으면 손님 화면 맨 아래에 1:1 상담 버튼이 생겨요
            </span>
            <span className="shrink-0 text-[13px] font-bold text-neutral-900">넣기 →</span>
          </button>
        ) : null}
        {hasCs ? (
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="관리 메뉴">
            {[
              { id: "returns", label: "교환·반품", n: returnTodo, tone: "bg-red-500" },
              { id: "orders", label: "주문·발송", n: shipWait, tone: "bg-orange-500" },
              { id: "asks", label: "1:1 문의", n: askOpen, tone: "bg-red-500" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={section === t.id}
                onClick={() => setSection(t.id)}
                className={
                  "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-[14px] font-semibold transition " +
                  (section === t.id ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-200 bg-white text-neutral-700")
                }
              >
                {t.label}
                {t.n ? <span className={"rounded-full px-1.5 py-0.5 text-[11px] leading-none text-white " + t.tone}>{t.n}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
        {hasCs && section === "orders" ? (
          <OrdersPanel
            orders={orders}
            onImport={onImportOrders}
            onSave={onSaveOrder}
            onDelete={onDeleteOrders}
            onBulk={onBulkOrders}
            settings={settings}
            onSaveSettings={onSaveSettings}
            showToast={showToast}
          />
        ) : hasCs && section === "asks" ? (
          <AsksPanel asks={asks} onAnswer={onAnswerAsk} onDelete={onDeleteAsk} showToast={showToast} />
        ) : (
        <Dashboard
          settings={settings}
          requests={requests}
          metrics={metrics}
          onOpen={(id, ids) => setDetail({ id, ids })}
          onUpdate={onUpdate}
          onDelete={onDelete}
          showToast={showToast}
          openSettings={(t) => setSettingsTab(t)}
          onFeedback={onFeedback}
        />
        )}
      </div>

      {current ? (
        <DetailModal
          r={current}
          ids={detail.ids}
          onNavigate={(id) => setDetail({ id, ids: detail.ids })}
          onClose={closeDetail}
          onAction={apply}
          onPatch={onUpdate}
          onDelete={(id) => {
            onDelete([id]);
            setDetail(null);
            showToast("접수를 삭제했어요");
          }}
          showToast={showToast}
        />
      ) : null}

      {settingsTab ? (
        <SettingsModal
          settings={settings}
          initialTab={settingsTab}
          onClose={closeSettings}
          showToast={showToast}
          onSave={(next) => {
            onSaveSettings(next);
            setSettingsTab("");
            showToast("설정을 저장했어요");
          }}
          resetLabel={resetLabel}
          onWithdraw={onWithdraw}
          onReset={() => {
            onReset();
            setSettingsTab("");
            showToast("데모 데이터를 처음으로 되돌렸어요");
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 최상위 앱                                                            */
/* ------------------------------------------------------------------ */

const PATHS = { landing: "/", start: "/start", customer: "/m/oat", admin: "/admin" };

export function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  const showToast = useCallback((message, tone) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ id: Date.now(), message, tone });
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  return [toast, showToast];
}

export default function ReturnLinkApp({ initialView = "landing", demo = false }) {
  const [view, setView] = useState(initialView);
  const [settings, setSettings] = useState(DEMO_SETTINGS);
  const [requests, setRequests] = useState(() => purgeOld(INITIAL_REQUESTS));
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [orders, setOrders] = useState(DEMO_ORDERS);
  const [asks, setAsks] = useState(DEMO_ASKS);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const lastSaved = useRef("");

  // 저장된 데이터 불러오기 + 다른 탭과 실시간 동기화
  useEffect(() => {
    const apply = (raw) => {
      try {
        const data = JSON.parse(raw);
        if (data && data.settings && Array.isArray(data.requests)) {
          lastSaved.current = raw;
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          setRequests(purgeOld(data.requests));
          setMetrics(data.metrics && typeof data.metrics === "object" ? data.metrics : DEFAULT_METRICS);
          if (data.ordersVersion === DEMO_ORDERS_VERSION) {
            if (Array.isArray(data.orders)) setOrders(data.orders);
            if (Array.isArray(data.asks)) setAsks(data.asks);
          }
        }
      } catch (e) {
        /* 깨진 데이터는 무시 */
      }
    };
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) apply(raw);
    } catch (e) {
      /* 저장소를 못 쓰는 환경이면 메모리 상태로만 동작 */
    }
    setLoaded(true);

    const onStorage = (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      if (e.newValue === lastSaved.current) return;
      apply(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 바뀔 때마다 저장
  useEffect(() => {
    if (!loaded) return;
    const raw = JSON.stringify({ settings, requests, metrics, orders, asks, ordersVersion: DEMO_ORDERS_VERSION });
    if (raw === lastSaved.current) return;
    lastSaved.current = raw;
    try {
      window.localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {
      /* 사진이 너무 많아 저장 공간이 부족하면 화면에서만 유지돼요 */
    }
  }, [settings, requests, metrics, orders, asks, loaded]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const showToast = useCallback((message, tone) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const switchView = (next) => {
    if (demo && (next === "landing" || next === "start")) {
      // 데모에서는 소개·가입으로 가면 진짜 페이지로 이동해요.
      window.location.href = next === "start" ? "/start" : "/";
      return;
    }
    setView(next);
    if (demo) {
      window.scrollTo({ top: 0 });
      return;
    }
    try {
      window.history.replaceState(null, "", PATHS[next] || "/");
    } catch (e) {
      /* 무시 */
    }
    window.scrollTo({ top: 0 });
  };

  const addRequest = (request) => {
    setRequests((prev) => [request, ...prev]);
    bumpMetric("req");
    return request;
  };
  const demoLookup = (name, phone4) => {
    bumpMetric("lookup");
    return requests.filter((r) => r.name === name && r.phone4 === phone4);
  };
  const deleteRequests = (ids) => setRequests((prev) => prev.filter((r) => !ids.includes(r.id)));
  const updateRequest = (id, patch) =>
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const resetDemo = () => {
    setSettings(DEMO_SETTINGS);
    setRequests(purgeOld(INITIAL_REQUESTS));
    setMetrics(DEFAULT_METRICS);
    setOrders(DEMO_ORDERS);
    setAsks(DEMO_ASKS);
  };

  // 데모용 주문·송장·문의 (이 기기에만 저장)
  const sameName = (a, b) => String(a).replace(/\s/g, "") === String(b).replace(/\s/g, "");
  const demoCs = {
    lookupOrders: async (name, p4) =>
      orders
        .filter((o) => sameName(o.name, name) && o.p4 === p4)
        .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))),
    submitAsk: async (name, p4, message) => {
      setAsks((prev) => [{ id: "a-" + Date.now(), name, p4, message, answer: "", created_at: new Date().toISOString() }, ...prev]);
      return true;
    },
    lookupAsks: async (name, p4) => asks.filter((a) => a.name === name && a.p4 === p4),
  };
  const demoImport = async (items) => {
    const stamp0 = Date.now();
    const saved = items.map((o, i) => {
      const { _key, ...rest } = o;
      return rest.id ? rest : { ...rest, id: "o-" + stamp0 + "-" + i, created_at: new Date().toISOString() };
    });
    setOrders((prev) => {
      const known = new Set(prev.map((o) => o.id));
      const byId = new Map(saved.map((o) => [o.id, o]));
      const fresh = saved.filter((o) => !known.has(o.id));
      return [...fresh, ...prev.map((o) => (byId.has(o.id) ? { ...o, ...byId.get(o.id) } : o))];
    });
    return saved;
  };
  const demoSaveOrder = async (o) => {
    if (o.id) setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, ...o } : x)));
    else setOrders((prev) => [{ ...o, id: "o-" + Date.now(), created_at: new Date().toISOString() }, ...prev]);
    return true;
  };

  // 가입을 마치면 새 마켓으로 시작해요. (데모: 예시 데이터 대신 빈 기록지)
  const finishSignup = (next) => {
    setSettings(next);
    setRequests([]);
    setMetrics({});
  };

  const bumpMetric = (kind) => {
    const day = stamp().date;
    setMetrics((m) => {
      const cur = m[day] || {};
      return { ...m, [day]: { ...cur, [kind]: (cur[kind] || 0) + 1 } };
    });
  };

  const todo = requests.filter((r) => {
    const st = statusOf(r);
    return st === "waiting" || st === "progress" || st === "arrived";
  }).length;

  return (
    <div className="min-h-screen bg-[#F5F4F1]">
      {demo ? (
        <div className="bg-neutral-900 px-4 py-2.5 text-white">
          <div className="mx-auto flex max-w-md items-center gap-2">
            <p className="min-w-0 flex-1 text-[12.5px] leading-snug">
              <span className="font-bold text-emerald-300">데모</span> · 손님으로 접수해 보고 사장님 화면에서 확인해 보세요.
              이 기기에만 저장돼요.
            </p>
            <a
              href="/start"
              className="shrink-0 rounded-lg bg-[#FEE500] px-3 py-1.5 text-[12px] font-bold text-neutral-900"
            >
              무료로 시작
            </a>
          </div>
        </div>
      ) : null}
      <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 px-4 py-2 backdrop-blur">
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 rounded-xl bg-neutral-100 p-1">
          {[
            {
              id: "landing",
              label: demo ? "소개" : "소개·가입",
              icon: <House size={15} />,
              on: view === "landing" || view === "start",
            },
            { id: "customer", label: "손님 화면", icon: <Store size={15} />, on: view === "customer" },
            { id: "admin", label: "사장님", icon: <Settings size={15} />, on: view === "admin" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchView(t.id)}
              aria-pressed={t.on}
              className={
                "flex items-center justify-center gap-1 whitespace-nowrap rounded-lg py-2 text-[12.5px] font-bold transition " +
                (t.on ? "bg-white text-neutral-900 shadow-card" : "text-neutral-500")
              }
            >
              {t.icon}
              {t.label}
              {t.id === "admin" && todo > 0 ? (
                <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white">{todo}</span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <main key={view} className="animate-fade-in">
        {view === "landing" ? (
          <Landing onStart={() => switchView("start")} onDemo={() => switchView("customer")} />
        ) : view === "start" ? (
          <SignupFlow onFinish={finishSignup} onGo={switchView} showToast={showToast} />
        ) : view === "customer" ? (
          <CustomerView
            settings={{ ...settings, orderLookup: true }}
            cs={demoCs}
            fetchLookup={demoLookup}
            onSubmit={addRequest}
            onMetric={bumpMetric}
            showToast={showToast}
            goAdmin={() => {
              switchView("admin");
              showToast("사장님 화면으로 이동했어요");
            }}
          />
        ) : (
          <AdminView
            settings={settings}
            requests={requests}
            metrics={metrics}
            onUpdate={updateRequest}
            onDelete={deleteRequests}
            onSaveSettings={setSettings}
            onReset={resetDemo}
            orders={orders}
            asks={asks}
            onImportOrders={demoImport}
            onSaveOrder={demoSaveOrder}
            onDeleteOrders={async (ids) => {
              setOrders((prev) => prev.filter((o) => !ids.includes(o.id)));
              return true;
            }}
            onBulkOrders={async (ids, patch) => {
              setOrders((prev) => prev.map((o) => (ids.includes(o.id) ? { ...o, ...patch } : o)));
              return true;
            }}
            onAnswerAsk={async (id, answer) => {
              setAsks((prev) => prev.map((a) => (a.id === id ? { ...a, answer } : a)));
              return true;
            }}
            onDeleteAsk={async (id) => {
              setAsks((prev) => prev.filter((a) => a.id !== id));
              return true;
            }}
            onWithdraw={() => {
              resetDemo();
              switchView("landing");
              showToast("탈퇴가 끝났어요. 모든 정보를 지웠어요");
              return true;
            }}
            showToast={showToast}
          />
        )}
      </main>
      <Toast toast={toast} />
    </div>
  );
}
