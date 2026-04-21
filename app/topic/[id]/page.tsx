"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DocumentToolbar } from "@/components/DocumentToolbar";
import { IconFolder } from "@/components/icons";
import { OutlineModal } from "@/components/OutlineModal";
import { Spinner } from "@/components/Spinner";
import { OnboardingHint } from "@/components/OnboardingHint";
import { useOnboarding } from "@/components/useOnboarding";
import { TOPIC_CATEGORIES } from "@/lib/categories";
import { removeAppendedOutline, stripHtml } from "@/lib/html-utils";
import { outlineToDocumentHtml } from "@/lib/outline-to-html";
import { ensureTopicDocument } from "@/lib/topic-document";
import type { ContentFormat, Topic } from "@/lib/types";
import { loadTopics, saveTopics, upsertTopic } from "@/lib/topics-storage";

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";

  const editorRef = useRef<HTMLDivElement>(null);
  const topicRef = useRef<Topic | null>(null);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [format, setFormat] = useState<ContentFormat>("note");
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineError, setOutlineError] = useState<string | null>(null);

  const { hint, goPrev, goNext } = useOnboarding({
    page: "topic",
    enabled: hydrated,
  });

  const persist = useCallback((updated: Topic) => {
    saveTopics(upsertTopic(loadTopics(), updated));
    topicRef.current = updated;
    setTopic(updated);
  }, []);

  const enterEditing = useCallback((focusTarget?: "title" | "editor") => {
    setIsEditing(true);
    window.requestAnimationFrame(() => {
      if (focusTarget === "title") {
        const titleInput = document.getElementById("topic-title-input") as HTMLInputElement | null;
        titleInput?.focus();
        titleInput?.setSelectionRange(titleInput.value.length, titleInput.value.length);
        return;
      }
      if (focusTarget === "editor") {
        editorRef.current?.focus();
      }
    });
  }, []);

  useEffect(() => {
    const list = loadTopics();
    const found = list.find((t) => t.id === id) ?? null;
    if (!found) {
      topicRef.current = null;
      setLoadError("未找到该选题。");
      setTopic(null);
    } else {
      const t = ensureTopicDocument(found);
      topicRef.current = t;
      setTopic(t);
      setTitle(t.title);
      setCategory(t.category);
    }
    setHydrated(true);
  }, [id]);

  useEffect(() => {
    if (!topic) return;
    const t = ensureTopicDocument(topic);
    if (editorRef.current) {
      editorRef.current.innerHTML = t.documentHtml ?? "";
    }
  }, [topic?.id, topic]);

  const saveCurrent = useCallback(() => {
    const cur = topicRef.current;
    if (!cur || !editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const updated: Topic = {
      ...cur,
      title: title.trim() || cur.title,
      category: category.trim() || cur.category,
      documentHtml: html,
      rawContent: stripHtml(html) || cur.rawContent,
    };
    persist(updated);
    setTitle(updated.title);
    setCategory(updated.category);
  }, [title, category, persist]);

  const handlePrimaryAction = useCallback(() => {
    if (isEditing) {
      saveCurrent();
      setIsEditing(false);
      editorRef.current?.blur();
      return;
    }
    router.push("/");
  }, [isEditing, router, saveCurrent]);

  const handleOutlineConfirm = async () => {
    const t = topicRef.current;
    if (!t || !editorRef.current) return;
    setOutlineError(null);
    setOutlineLoading(true);
    try {
      const htmlBefore = removeAppendedOutline(editorRef.current.innerHTML);
      editorRef.current.innerHTML = htmlBefore;

      const plain = stripHtml(htmlBefore) || t.rawContent;
      const res = await fetch("/api/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawContent: plain,
          title: title.trim() || t.title,
          category: category.trim() || t.category,
          format,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOutlineError(data?.error ?? "生成失败");
        return;
      }
      const piece = outlineToDocumentHtml(data);
      editorRef.current.innerHTML = htmlBefore + piece;
      setIsEditing(true);
      setModalOpen(false);
      window.requestAnimationFrame(() => {
        editorRef.current?.focus();
      });
    } catch {
      setOutlineError("网络异常，请稍后重试");
    } finally {
      setOutlineLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Spinner className="h-8 w-8 !border-t-[var(--accent)]" />
      </div>
    );
  }

  if (loadError || !topic) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
        <p className="text-center text-sm text-red-600">{loadError}</p>
        <Link
          href="/"
          className="focus-ring mt-6 text-center text-sm font-medium text-stone-700 underline underline-offset-4"
        >
          返回
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[var(--bg)]">
      <OnboardingHint hint={hint} goPrev={goPrev} goNext={goNext} />

      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={handlePrimaryAction}
            className="focus-ring rounded-full px-2 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-black/[0.03] hover:text-stone-900"
          >
            {isEditing ? "保存" : "返回"}
          </button>
          <span className="flex-1 text-center text-xs text-stone-400">Topic Spark</span>
          <button
            type="button"
            data-onboarding="generate-outline"
            onClick={() => {
              setOutlineError(null);
              setModalOpen(true);
            }}
            className="focus-ring rounded-full border border-black/5 bg-white/70 px-3.5 py-1.5 text-sm text-stone-700 shadow-[0_12px_30px_rgba(15,12,8,0.05)] backdrop-blur hover:bg-white/85"
          >
            生成大纲
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 pb-28 pt-6">
        <div className="mb-6 rounded-[22px] border border-black/5 bg-white/55 px-4 py-3 shadow-[0_18px_44px_rgba(15,12,8,0.04)] backdrop-blur">
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <IconFolder className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
            <select
              value={category}
              onChange={(e) => {
                const nextCategory = e.target.value;
                setCategory(nextCategory);
                const cur = topicRef.current;
                if (!cur || !editorRef.current) return;
                persist({
                  ...cur,
                  title: title.trim() || cur.title,
                  category: nextCategory,
                  documentHtml: editorRef.current.innerHTML,
                  rawContent: stripHtml(editorRef.current.innerHTML) || cur.rawContent,
                });
              }}
              className="focus-ring max-w-[70%] cursor-pointer border-none bg-transparent text-stone-700 underline decoration-stone-300 underline-offset-4"
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
          </div>
        </div>

        <input
          id="topic-title-input"
          value={title}
          readOnly={!isEditing}
          onMouseDown={() => {
            if (!isEditing) enterEditing("title");
          }}
          onChange={(e) => setTitle(e.target.value)}
          className="focus-ring mb-8 w-full rounded-2xl border border-transparent bg-transparent px-0 py-2 text-3xl font-semibold tracking-tight text-stone-900 placeholder:text-stone-300 focus:bg-white/70 focus:px-4 focus:shadow-[0_18px_44px_rgba(15,12,8,0.06)] focus:ring-0"
          placeholder="标题"
        />

        <div
          ref={editorRef}
          className="prose-editor focus-ring min-h-[min(55vh,560px)] rounded-2xl border border-black/5 bg-white/55 px-4 py-4 shadow-[0_18px_44px_rgba(15,12,8,0.05)] backdrop-blur outline-none"
          contentEditable={isEditing}
          suppressContentEditableWarning
          onMouseDown={() => {
            if (!isEditing) enterEditing("editor");
          }}
        />
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-black/5 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-2 py-2">
          <DocumentToolbar editorRef={editorRef} disabled={!isEditing} />
        </div>
      </div>

      <OutlineModal
        open={modalOpen}
        format={format}
        onFormatChange={setFormat}
        onClose={() => {
          if (!outlineLoading) setModalOpen(false);
        }}
        onConfirm={handleOutlineConfirm}
        loading={outlineLoading}
        error={outlineError}
      />
    </div>
  );
}
