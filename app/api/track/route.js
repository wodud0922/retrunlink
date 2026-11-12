import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 스마트택배(스윗트래커) 배송조회 API를 대신 불러 주는 서버 주소예요.
// Vercel 환경변수 SWEETTRACKER_API_KEY 에 발급받은 키를 넣으면 실제 조회가 되고,
// 키가 없으면 { demo: true } 를 돌려줘서 화면이 예시 데이터를 보여 줘요.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const courier = (searchParams.get("courier") || "").replace(/\D/g, "");
  const invoice = (searchParams.get("invoice") || "").replace(/\D/g, "");

  if (!courier || invoice.length < 9 || invoice.length > 14) {
    return NextResponse.json(
      { ok: false, message: "택배사와 운송장 번호를 확인해 주세요." },
      { status: 400 }
    );
  }

  const key = process.env.SWEETTRACKER_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: true, demo: true });
  }

  try {
    const url =
      "https://info.sweettracker.co.kr/api/v1/trackingInfo?t_key=" +
      encodeURIComponent(key) +
      "&t_code=" +
      courier +
      "&t_invoice=" +
      invoice;
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();

    if (data.status === false || !Array.isArray(data.trackingDetails)) {
      return NextResponse.json(
        { ok: false, message: data.msg || "배송 정보를 찾지 못했어요. 번호를 다시 확인해 주세요." },
        { status: 404 }
      );
    }

    const details = data.trackingDetails;
    const lastLevel = details.length ? Number(details[details.length - 1].level) : 1;
    const level = data.complete ? 6 : Number(data.level) || lastLevel || 1;

    return NextResponse.json({
      ok: true,
      demo: false,
      level,
      history: details
        .map((d) => ({
          time: d.timeString || "",
          place: d.where || "",
          text: d.kind || "",
        }))
        .reverse(),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, message: "택배사 조회가 잠시 안 돼요. 잠시 후 다시 시도해 주세요." },
      { status: 502 }
    );
  }
}
