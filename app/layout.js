import "./globals.css";

const SITE = "https://returnlinks.com";
const TITLE = "ReturnLink | 1인 마켓 교환·반품 포털";
const DESC = "인스타그램 1인 마켓의 카톡 CS를 줄여주는 교환·반품 접수 포털, 리턴링크. 링크 하나로 접수하고 지금은 무료예요.";

export const metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESC,
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "ReturnLink",
    title: TITLE,
    description: DESC,
    url: SITE,
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "ReturnLink 리턴링크" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F5F4F1",
};

// 사장님이 고를 수 있는 손님 화면 글꼴 (구글 폰트)
const BRAND_FONTS =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&family=Gowun+Batang:wght@400;700&family=Nanum+Myeongjo:wght@400;700&family=Gowun+Dodum&family=Jua&family=Do+Hyeon&family=Nanum+Pen+Script&display=swap";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={BRAND_FONTS} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
