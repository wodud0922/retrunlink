"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경변수가 없으면 null 이에요. 화면에서 "설정이 필요해요" 안내를 보여 줘요.
export const supabase = url && key ? createClient(url, key) : null;

// 실시간 접속자(운영실)용 채널 이름
export const ONLINE_CHANNEL = "rl-online";

// DB 한 줄(row)을 화면에서 쓰는 접수 객체로 바꿔요.
export function rowToRequest(row) {
  return { ...(row.data || {}), id: row.id };
}

// 화면의 접수 객체를 DB에 저장할 data 로 바꿔요. (id 는 따로 저장돼요)
export function requestToData(r) {
  const { id, ...rest } = r;
  return rest;
}
