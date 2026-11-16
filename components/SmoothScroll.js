"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// 사이트 전체 관성 스크롤 (데스크톱 마우스 휠·트랙패드만)
// - 모바일 터치는 기기 기본 관성 그대로 둬요 (syncTouch: false)
// - "동작 줄이기"를 켠 사람에게는 켜지 않아요
// - 안에서 따로 스크롤되는 상자(모달, 목록 등)와 화면 잠금 중에는 기본 스크롤을 써요
export default function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis = null;
    let raf = 0;

    const scrollableY = (node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (node === document.body || node === document.documentElement) return false;
      if (node.hasAttribute("data-lenis-prevent")) return true;
      const cs = window.getComputedStyle(node);
      return /(auto|scroll)/.test(cs.overflowY) && node.scrollHeight > node.clientHeight + 1;
    };

    const start = () => {
      if (lenis || mq.matches) return;
      lenis = new Lenis({
        lerp: 0.24,
        wheelMultiplier: 1.1,
        smoothWheel: true,
        syncTouch: false,
        prevent: (node) => document.body.style.overflow === "hidden" || scrollableY(node),
      });
      window.__lenis = lenis;
      const loop = (t) => {
        if (!lenis) return;
        lenis.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(raf);
      if (lenis) lenis.destroy();
      lenis = null;
      if (window.__lenis) delete window.__lenis;
    };

    const onPref = () => (mq.matches ? stop() : start());
    start();
    if (mq.addEventListener) mq.addEventListener("change", onPref);
    else if (mq.addListener) mq.addListener(onPref);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onPref);
      else if (mq.removeListener) mq.removeListener(onPref);
      stop();
    };
  }, []);

  return null;
}
