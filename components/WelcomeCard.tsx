"use client";

import { useEffect, useState } from "react";

export function WelcomeCard(props: { open: boolean; onStart: () => void }) {
  const { open, onStart } = props;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const t = window.setTimeout(() => setVisible(true), 10);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <div
        className={`absolute inset-0 bg-[#0f0a05]/18 backdrop-blur-[1px] transition-opacity ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Topic Spark 欢迎弹层"
        className={`relative w-full max-w-[22.5rem] overflow-hidden rounded-[28px] border border-black/5 bg-white/78 shadow-[0_18px_50px_rgba(15,12,8,0.14),0_2px_10px_rgba(15,12,8,0.06)] backdrop-blur-xl transition-all ${
          visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
        }`}
      >
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[color:rgba(183,151,103,0.16)] via-[color:rgba(183,151,103,0.08)] to-transparent" />

        <div className="relative px-6 pb-6 pt-5">
          <div className="flex items-center gap-1.5 text-[11.5px] font-medium tracking-wide text-stone-500/80">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/[0.025] text-[12px] font-semibold text-stone-700 ring-1 ring-black/5">
              TS
            </div>
            <div className="translate-y-[0.25px]">记录・整理・生成大纲</div>
          </div>

          <div className="mt-6 max-w-[18rem] text-[23px] font-semibold leading-snug tracking-tight text-stone-900">
            欢迎使用 Topic Spark👏
          </div>
          <div className="mt-2 max-w-[20.5rem] text-[14px] leading-relaxed text-stone-600">
            把你的零散想法，慢慢变成可创作的内容
          </div>

          <div className="mt-8 flex items-center justify-end">
            <button
              type="button"
              onClick={onStart}
              className="focus-ring inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-stone-900 shadow-[0_10px_24px_rgba(183,151,103,0.18)] ring-4 ring-[var(--accent-soft)] transition hover:opacity-95 active:scale-[0.99]"
            >
              开始体验
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
