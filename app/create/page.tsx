"use client";

import type { ChangeEvent } from "react";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconImage, IconMic } from "@/components/icons";
import { Spinner } from "@/components/Spinner";
import { TOPIC_CATEGORIES } from "@/lib/categories";
import { escapeHtml } from "@/lib/html-utils";
import type { Topic } from "@/lib/types";
import { loadTopics, saveTopics, upsertTopic } from "@/lib/topics-storage";

type SpeechRecognitionEventLike = {
  results: { 0: { transcript: string } }[];
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export default function CreatePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const [draft, setDraft] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [listening, setListening] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("知识教育");
  const [recognized, setRecognized] = useState(false);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImagePreview(reader.result);
    };
    reader.readAsDataURL(f);
  };

  const handleVoiceInput = () => {
    const w = window as Window & {
      SpeechRecognition?: SpeechRecognitionCtor;
      webkitSpeechRecognition?: SpeechRecognitionCtor;
    };
    const SpeechApi = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechApi) {
      setErr("当前浏览器暂不支持语音识别");
      return;
    }
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }
    const recog = new SpeechApi();
    recognitionRef.current = recog;
    recog.lang = "zh-CN";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onstart = () => {
      setListening(true);
      setErr(null);
    };
    recog.onerror = () => {
      setListening(false);
      setErr("语音识别暂不可用，请改为手动输入");
    };
    recog.onend = () => {
      setListening(false);
    };
    recog.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      setDraft((prev) => `${prev}${prev ? "\n" : ""}${transcript}`);
    };
    recog.start();
  };

  const analyze = async () => {
    if (!draft.trim()) {
      setErr("请先输入内容");
      return;
    }
    setErr(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data?.error ?? "识别失败");
        return;
      }
      setTitle(data.title ?? "");
      setCategory(data.category ?? "知识教育");
      setRecognized(true);
    } catch {
      setErr("网络异常，请稍后重试");
    } finally {
      setAnalyzing(false);
    }
  };

  const save = () => {
    if (!title.trim()) {
      setErr("请填写标题");
      return;
    }
    const topic: Topic = {
      id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      rawContent: draft.trim(),
      title: title.trim(),
      category: category.trim() || "知识教育",
      createdAt: Date.now(),
      status: undefined,
      order: loadTopics().length,
      documentHtml: `<p>${escapeHtml(draft.trim())}</p>`,
      imageDataUrl: imagePreview,
    };
    const next = upsertTopic(loadTopics(), topic);
    saveTopics(next);
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="focus-ring rounded-lg px-2 py-1 text-sm text-stone-600 hover:text-stone-900"
          >
            返回
          </button>
          <span className="text-xs text-stone-400">Topic Spark</span>
          <span className="w-10" aria-hidden />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8">
        <div className="relative min-h-[min(60vh,520px)] rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="请记录你当下的灵感"
            className="focus-ring min-h-[min(60vh,520px)] w-full resize-none rounded-2xl bg-transparent px-5 pb-16 pt-5 text-[15px] leading-relaxed text-stone-800 placeholder:text-stone-400"
          />

          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="focus-ring flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200"
              title="上传图片"
              aria-label="上传图片"
            >
              <IconImage className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleVoiceInput}
              className={`focus-ring flex h-11 w-11 items-center justify-center rounded-full transition ${
                listening ? "bg-[var(--accent-soft)] text-stone-800" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
              title={listening ? "结束语音输入" : "语音输入"}
              aria-label="语音输入"
            >
              <IconMic className="h-5 w-5" />
            </button>
          </div>
        </div>

        {imagePreview && (
          <div className="relative mt-4 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt=""
              className="max-h-40 rounded-xl border border-[var(--border)] object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setImagePreview(null);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="focus-ring absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--border)] bg-white text-xs text-stone-500 shadow-sm hover:bg-stone-50"
              aria-label="删除图片"
            >
              ×
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={analyze}
            disabled={analyzing}
            className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-stone-900 shadow-sm hover:opacity-95 disabled:opacity-50"
          >
            {analyzing && <Spinner className="!border-t-stone-800" />}
            识别选题
          </button>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        {recognized && (
          <div className="mt-8 space-y-4 border-t border-[var(--border)] pt-8">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-700">
                标题：
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="focus-ring ml-1 w-[75%] border-none bg-transparent font-medium text-stone-900 outline-none"
                />
              </label>
              <label className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-stone-700">
                分类：
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="focus-ring ml-1 bg-transparent text-stone-900"
                >
                  {TOPIC_CATEGORIES.includes(category as (typeof TOPIC_CATEGORIES)[number]) ? null : (
                    <option value={category}>{category}</option>
                  )}
                  {TOPIC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={save}
              className="focus-ring rounded-xl border border-[var(--border)] bg-white px-6 py-2.5 text-sm font-medium text-stone-800 shadow-sm hover:bg-stone-50"
            >
              保存
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
