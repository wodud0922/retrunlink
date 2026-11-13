import { ShopPage } from "../../components/pages";

// 링크를 카톡·인스타로 공유할 때 "오트 스튜디오 | 교환·반품 접수"처럼 마켓 이름이 보이게 해요.
export async function generateMetadata({ params }) {
  const handle = decodeURIComponent((params && params.slug) || "").replace(/^@/, "").toLowerCase();
  const fallback = { title: "주문 조회·교환·반품 | ReturnLink" };
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !handle) return fallback;
  try {
    const res = await fetch(url + "/rest/v1/rpc/get_shop", {
      method: "POST",
      headers: { apikey: key, Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ p_handle: handle }),
      next: { revalidate: 60 },
    });
    if (!res.ok) return fallback;
    const shop = await res.json();
    const name = shop && shop.settings && shop.settings.marketName;
    if (!name) return fallback;
    const intro = (shop.settings.intro || "").replace(/\s+/g, " ").trim();
    const title = name + " | 주문 조회·교환·반품";
    const description = intro || "카톡 기다릴 필요 없이 배송 조회와 교환·반품을 여기서 바로 해결해요.";
    return {
      title,
      description,
      openGraph: {
        type: "website",
        locale: "ko_KR",
        siteName: name,
        title,
        description,
        images: [{ url: "/og.png", width: 1200, height: 630, alt: name }],
      },
      twitter: { card: "summary_large_image", title, description, images: ["/og.png"] },
    };
  } catch (e) {
    return fallback;
  }
}

export default function Shop() {
  return <ShopPage />;
}
