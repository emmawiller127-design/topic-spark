"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OnboardingHintModel, OnboardingHighlightRadius, OnboardingPlacement } from "@/components/useOnboarding";

type PlacementResolved = Exclude<OnboardingPlacement, "auto">;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function radiusClass(r?: OnboardingHighlightRadius) {
  if (r === "full") return "rounded-full";
  if (r === "lg") return "rounded-2xl";
  if (r === "xl") return "rounded-[20px]";
  return "rounded-[24px]";
}

export function OnboardingHint(props: {
  hint: OnboardingHintModel | null;
  goPrev: () => void;
  goNext: () => void;
}) {
  const { hint, goPrev, goNext } = props;
  const cardRef = useRef<HTMLDivElement>(null);

  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [cardSize, setCardSize] = useState<{ w: number; h: number } | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    if (!hint) return;
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, [hint]);

  useEffect(() => {
    if (!hint) {
      setAnchorRect(null);
      return;
    }

    const resolve = () => {
      const el = document.querySelector(hint.anchorSelector) as HTMLElement | null;
      if (!el) {
        setAnchorRect(null);
        return;
      }
      setAnchorRect(el.getBoundingClientRect());
    };

    resolve();

    const onScroll = () => resolve();
    const onResize = () => resolve();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [hint?.anchorSelector, hint]);

  useEffect(() => {
    if (!hint) {
      setCardSize(null);
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        setCardSize({ w: rect.width, h: rect.height });
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [hint]);

  const resolvedPlacement: PlacementResolved = useMemo(() => {
    if (!hint) return "bottom";
    if (hint.placement !== "auto") return hint.placement;

    if (!anchorRect || !cardSize) return "bottom";

    const margin = 14;
    const topSpace = anchorRect.top;
    const bottomSpace = window.innerHeight - anchorRect.bottom;
    const leftSpace = anchorRect.left;
    const rightSpace = window.innerWidth - anchorRect.right;

    if (bottomSpace >= cardSize.h + margin) return "bottom";
    if (topSpace >= cardSize.h + margin) return "top";
    if (rightSpace >= cardSize.w + margin) return "right";
    if (leftSpace >= cardSize.w + margin) return "left";
    return "bottom";
  }, [anchorRect, cardSize, hint]);

  const { cardStyle, arrow } = useMemo(() => {
    const fallback = {
      cardStyle: {
        top: 92,
        right: 14,
      } as CSSProperties,
      arrow: null as null | { dir: PlacementResolved },
    };

    if (!hint) return fallback;
    if (!anchorRect || !cardSize) return fallback;

    const margin = 14;
    const minX = 12;
    const minY = 12;
    const maxX = window.innerWidth - cardSize.w - 12;
    const maxY = window.innerHeight - cardSize.h - 12;

    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const anchorCenterY = anchorRect.top + anchorRect.height / 2;

    let top = 0;
    let left = 0;

    if (resolvedPlacement === "top") {
      top = anchorRect.top - margin - cardSize.h;
      left = anchorCenterX - cardSize.w / 2;
    } else if (resolvedPlacement === "bottom") {
      top = anchorRect.bottom + margin;
      left = anchorCenterX - cardSize.w / 2;
    } else if (resolvedPlacement === "left") {
      top = anchorCenterY - cardSize.h / 2;
      left = anchorRect.left - margin - cardSize.w;
    } else {
      top = anchorCenterY - cardSize.h / 2;
      left = anchorRect.right + margin;
    }

    top = clamp(top, minY, maxY);
    left = clamp(left, minX, maxX);

    return {
      cardStyle: {
        top,
        left,
      } as CSSProperties,
      arrow: { dir: resolvedPlacement },
    };
  }, [anchorRect, cardSize, hint, resolvedPlacement]);

  if (!hint) return null;

  const highlightStyle = anchorRect
    ? ({
        top: anchorRect.top - 6,
        left: anchorRect.left - 6,
        width: anchorRect.width + 12,
        height: anchorRect.height + 12,
      } as CSSProperties)
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="absolute inset-0 bg-[#0f0a05]/18" aria-hidden />

      {highlightStyle ? (
        <div
          className={`fixed ${radiusClass(hint.highlightRadius)} ring-1 ring-black/5`}
          style={{
            ...highlightStyle,
            boxShadow:
              "0 0 0 1.5px rgba(183,151,103,0.38), 0 0 0 10px rgba(183,151,103,0.10), 0 18px 55px rgba(15,12,8,0.12)",
          }}
          aria-hidden
        />
      ) : null}

      <div
        ref={cardRef}
        className={`pointer-events-auto fixed w-[332px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[22px] border border-black/5 bg-white/82 p-4 shadow-[0_18px_50px_rgba(15,12,8,0.14),0_2px_10px_rgba(15,12,8,0.06)] backdrop-blur-xl transition-all ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"
        }`}
        style={cardStyle}
        role="status"
        aria-label="首次使用引导"
      >
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[color:rgba(183,151,103,0.14)] to-transparent" />

        <div className="relative">
          <div className="mt-1 max-w-[18.5rem] text-[15px] font-semibold leading-snug tracking-tight text-stone-900">
            {hint.title}
          </div>
          <div className="mt-2 max-w-[19.5rem] text-[13.5px] leading-relaxed text-stone-600">{hint.description}</div>

          <div className="mt-4 flex items-center justify-between">
            {hint.showBack === false ? (
              <div />
            ) : (
              <button
                type="button"
                onClick={goPrev}
                className="focus-ring -ml-1 rounded-2xl px-2 py-1.5 text-sm font-medium text-stone-600 transition hover:bg-black/[0.03] hover:text-stone-900"
              >
                返回上一步
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              className="focus-ring inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-3.5 py-1.5 text-sm font-medium text-stone-900 shadow-[0_10px_24px_rgba(183,151,103,0.18)] ring-4 ring-[var(--accent-soft)] transition hover:opacity-95 active:scale-[0.99]"
            >
              {hint.primaryButtonText}
            </button>
          </div>

          {arrow ? <Arrow dir={arrow.dir} /> : null}
        </div>
      </div>
    </div>
  );
}

function Arrow(props: { dir: PlacementResolved }) {
  const { dir } = props;
  const border = "border-[color:rgba(0,0,0,0.06)]";

  if (dir === "top") {
    return (
      <>
        <div
          className={`absolute -bottom-[10px] left-1/2 -translate-x-1/2 h-0 w-0 border-x-[11px] border-x-transparent border-t-[11px] ${border}`}
          aria-hidden
        />
        <div
          className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 h-0 w-0 border-x-[10px] border-x-transparent border-t-[10px] border-t-white/80"
          aria-hidden
        />
      </>
    );
  }

  if (dir === "bottom") {
    return (
      <>
        <div
          className={`absolute -top-[10px] left-1/2 -translate-x-1/2 h-0 w-0 border-x-[11px] border-x-transparent border-b-[11px] ${border}`}
          aria-hidden
        />
        <div
          className="absolute -top-[9px] left-1/2 -translate-x-1/2 h-0 w-0 border-x-[10px] border-x-transparent border-b-[10px] border-b-white/80"
          aria-hidden
        />
      </>
    );
  }

  if (dir === "left") {
    return (
      <>
        <div
          className={`absolute -right-[10px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[11px] border-y-transparent border-l-[11px] ${border}`}
          aria-hidden
        />
        <div
          className="absolute -right-[9px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[10px] border-y-transparent border-l-[10px] border-l-white/80"
          aria-hidden
        />
      </>
    );
  }

  return (
    <>
      <div
        className={`absolute -left-[10px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[11px] border-y-transparent border-r-[11px] ${border}`}
        aria-hidden
      />
      <div
        className="absolute -left-[9px] top-1/2 -translate-y-1/2 h-0 w-0 border-y-[10px] border-y-transparent border-r-[10px] border-r-white/80"
        aria-hidden
      />
    </>
  );
}
