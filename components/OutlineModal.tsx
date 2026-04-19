"use client";

import { Spinner } from "@/components/Spinner";
import type { ContentFormat } from "@/lib/types";

type Props = {
  open: boolean;
  format: ContentFormat;
  onFormatChange: (f: ContentFormat) => void;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
};

export function OutlineModal({
  open,
  format,
  onFormatChange,
  onClose,
  onConfirm,
  loading,
  error,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/25 backdrop-blur-[2px]"
        aria-label="关闭"
        disabled={loading}
        onClick={() => {
          if (!loading) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="outline-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-lg"
      >
        <h2 id="outline-modal-title" className="text-base font-semibold text-stone-800">
          生成大纲
        </h2>
        <p className="mt-1 text-sm text-stone-500">选择内容形式后生成，将追加在正文下方</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onFormatChange("note")}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              format === "note"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <span className="font-medium text-stone-900">笔记</span>
            <p className="mt-0.5 text-xs text-stone-500">图文结构大纲</p>
          </button>
          <button
            type="button"
            onClick={() => onFormatChange("video")}
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              format === "video"
                ? "border-[var(--accent)] bg-[var(--accent-soft)] ring-1 ring-[var(--accent)]"
                : "border-stone-200 bg-white hover:border-stone-300"
            }`}
          >
            <span className="font-medium text-stone-900">视频</span>
            <p className="mt-0.5 text-xs text-stone-500">分段结构大纲</p>
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
          >
            取消
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="focus-ring inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-stone-900 shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {loading && <Spinner className="!border-t-stone-700" />}
            生成
          </button>
        </div>
      </div>
    </div>
  );
}
