"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconCheckCircle,
  IconCircleStatus,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@/components/icons";
import { Spinner } from "@/components/Spinner";
import { WelcomeCard } from "@/components/WelcomeCard";
import { OnboardingHint } from "@/components/OnboardingHint";
import { useOnboarding } from "@/components/useOnboarding";
import type { Topic } from "@/lib/types";
import { loadTopics, reorderTopicsByIds, saveTopics, sortTopicsForDisplay } from "@/lib/topics-storage";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type DisplayMode = "default" | "latest" | "category";

const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  default: "默认",
  latest: "按最新",
  category: "按分类",
};

const DISPLAY_MODE_STORAGE_KEY = "topic-spark-display-mode";

export default function HomePage() {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("default");
  const [displayMenuOpen, setDisplayMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const displayMenuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = sortTopicsForDisplay(topics);
    if (!q) return sorted;
    return sorted.filter((t) => {
      const title = t.title.toLowerCase();
      const content = (t.rawContent ?? "").toLowerCase();
      return title.includes(q) || content.includes(q);
    });
  }, [topics, query]);

  const latestTopics = useMemo(
    () => [...filtered].sort((a, b) => b.createdAt - a.createdAt),
    [filtered],
  );

  const groupedTopics = useMemo(() => {
    const groups = new Map<string, Topic[]>();
    filtered.forEach((topic) => {
      const key = topic.category || "未分类";
      const list = groups.get(key) ?? [];
      list.push(topic);
      groups.set(key, list);
    });

    return Array.from(groups.entries())
      .map(([category, list]) => [
        category,
        [...list].sort((a, b) => b.createdAt - a.createdAt),
      ] as [string, Topic[]])
      .sort(([categoryA, listA], [categoryB, listB]) => {
        const latestA = Math.max(...listA.map((topic) => topic.createdAt));
        const latestB = Math.max(...listB.map((topic) => topic.createdAt));
        if (latestA !== latestB) return latestB - latestA;
        return categoryA.localeCompare(categoryB, "zh-CN");
      });
  }, [filtered]);

  const visibleOrderedTopics = useMemo(() => {
    if (displayMode === "category") {
      return groupedTopics.flatMap(([, list]) => list);
    }
    if (displayMode === "latest") return latestTopics;
    return filtered;
  }, [displayMode, filtered, groupedTopics, latestTopics]);

  const onboardingTargetTopicId = useMemo(() => {
    const preferred = visibleOrderedTopics.find((t) => t.status === "in_progress");
    return (preferred ?? visibleOrderedTopics[0])?.id ?? null;
  }, [visibleOrderedTopics]);

  const persist = (next: Topic[]) => {
    const normalized = sortTopicsForDisplay(next);
    saveTopics(normalized);
    setTopics(normalized);
  };

  const setStatus = (id: string, status?: Topic["status"]) => {
    persist(topics.map((t) => (t.id === id ? { ...t, status } : t)));
    setContextMenu(null);
  };

  const removeTopic = (id: string) => {
    persist(topics.filter((t) => t.id !== id));
    setContextMenu(null);
  };

  const { welcomeOpen, closeWelcome, hint, goPrev, goNext } = useOnboarding({
    page: "home",
    enabled: hydrated,
    hasTopics: visibleOrderedTopics.length > 0,
  });

  useEffect(() => {
    const storedMode = window.localStorage.getItem(DISPLAY_MODE_STORAGE_KEY);
    if (storedMode === "default" || storedMode === "latest" || storedMode === "category") {
      setDisplayMode(storedMode);
    }
    setTopics(sortTopicsForDisplay(loadTopics()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DISPLAY_MODE_STORAGE_KEY, displayMode);
  }, [displayMode, hydrated]);

  useEffect(() => {
    if (!contextMenu && !displayMenuOpen) return;
    const close = (e: MouseEvent) => {
      const target = e.target as Node;
      if (contextMenu && menuRef.current && !menuRef.current.contains(target)) {
        setContextMenu(null);
      }
      if (displayMenuOpen && displayMenuRef.current && !displayMenuRef.current.contains(target)) {
        setDisplayMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [contextMenu, displayMenuOpen]);

  const handleDropOn = (targetId: string) => {
    if (!draggingId || draggingId === targetId) return;
    const shown = [...filtered];
    const ids = shown.map((t) => t.id);
    const from = ids.indexOf(draggingId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, draggingId);
    const reordered = reorderTopicsByIds(sortTopicsForDisplay(topics), ids);
    persist(reordered);
    setDraggingId(null);
  };

  const renderTopicItem = (t: Topic) => {
    const isPeek = visibleOrderedTopics[0]?.id === t.id;
    const isTitleTarget = t.id === onboardingTargetTopicId;

    return (
      <li
        key={t.id}
        draggable={displayMode === "default"}
        onDragStart={(e) => {
          if (displayMode !== "default") return;
          setDraggingId(t.id);
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", t.id);
        }}
        onDragOver={(e) => {
          if (displayMode !== "default") return;
          e.preventDefault();
        }}
        onDrop={(e) => {
          if (displayMode !== "default") return;
          e.preventDefault();
          handleDropOn(t.id);
        }}
        onDragEnd={() => setDraggingId(null)}
      >
        <button
          type="button"
          data-onboarding={isPeek ? "topic-item-peek" : undefined}
          data-onboarding-card-target={isTitleTarget ? "true" : undefined}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenu({ id: t.id, x: e.clientX, y: e.clientY });
          }}
          onClick={() => router.push(`/topic/${t.id}`)}
          className={`focus-ring w-full rounded-[22px] border border-black/5 bg-white/70 px-5 py-4 text-left shadow-[0_14px_34px_rgba(15,12,8,0.06),0_1px_0_rgba(15,12,8,0.03)] backdrop-blur transition hover:bg-white/85 hover:shadow-[0_18px_44px_rgba(15,12,8,0.08),0_1px_0_rgba(15,12,8,0.04)] ${
            t.status === "done" ? "opacity-[0.92]" : ""
          } ${draggingId === t.id ? "opacity-45" : ""}`}
        >
          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2
                className={`line-clamp-2 text-[15px] font-semibold leading-snug ${
                  t.status === "done" ? "text-stone-500 line-through" : "text-stone-900"
                }`}
              >
                {t.title}
              </h2>

              {t.status ? (
                <div className="mt-3">
                  <span
                    className={`inline-flex items-center rounded-full bg-black/[0.035] px-3 py-1 text-[13px] font-medium ${
                      t.status === "done" ? "text-stone-600" : "bg-[var(--accent-soft)] text-stone-700"
                    }`}
                  >
                    {t.status === "done" ? "已完成" : "进行中"}
                  </span>
                </div>
              ) : null}
            </div>
            <span className="shrink-0 rounded-full bg-black/[0.03] px-2.5 py-0.5 text-xs text-stone-600 ring-1 ring-black/5">
              {t.category}
            </span>
          </div>
          <p className="mt-3 text-xs text-stone-400">{formatTime(t.createdAt)}</p>
        </button>
      </li>
    );
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Spinner className="h-8 w-8 !border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-32">
      <WelcomeCard open={welcomeOpen} onStart={closeWelcome} />
      <OnboardingHint hint={hint} goPrev={goPrev} goNext={goNext} />

      <header className="sticky top-0 z-20 border-b border-black/5 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-semibold text-stone-800 ring-1 ring-black/5"
              aria-hidden
            >
              TS
            </div>
            <h1 className="truncate text-base font-semibold tracking-tight text-stone-900">Topic Spark</h1>
          </div>

          <div className="relative w-[150px] sm:w-[190px]">
            <label htmlFor="topic-search" className="sr-only">
              搜索选题
            </label>
            <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              id="topic-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索"
              className="focus-ring w-full rounded-full border border-black/5 bg-white/70 py-2 pl-9 pr-3 text-sm text-stone-700 shadow-[0_10px_30px_rgba(15,12,8,0.04)] backdrop-blur placeholder:text-stone-400"
            />
          </div>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/5 bg-white/60 text-xs font-medium text-stone-600 shadow-[0_10px_26px_rgba(15,12,8,0.04)] backdrop-blur"
            title="账户入口占位"
          >
            我
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8">
        {filtered.length === 0 ? (
          <div
            data-onboarding="empty-state"
            className="rounded-[22px] border border-dashed border-black/10 bg-white/55 px-8 py-20 text-center shadow-[0_18px_44px_rgba(15,12,8,0.04)] backdrop-blur"
          >
            <p className="text-sm text-stone-500">
              {query.trim() ? "没有匹配的选题" : "还没有选题，点击下方 + 开始记录"}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-end">
              <div ref={displayMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setDisplayMenuOpen((open) => !open)}
                  className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white/70 px-3 py-1.5 text-sm font-medium text-stone-700 shadow-[0_12px_30px_rgba(15,12,8,0.05)] backdrop-blur hover:bg-white/85"
                >
                  展示模式
                  <span className="text-stone-400">▾</span>
                </button>

                {displayMenuOpen ? (
                  <div className="absolute right-0 top-full z-30 mt-2 min-w-[9rem] rounded-xl border border-[var(--border)] bg-white py-1.5 shadow-lg">
                    {(["default", "latest", "category"] as DisplayMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setDisplayMode(mode);
                          setDisplayMenuOpen(false);
                        }}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-stone-50 ${
                          displayMode === mode ? "text-stone-900" : "text-stone-700"
                        }`}
                      >
                        <span>{DISPLAY_MODE_LABELS[mode]}</span>
                        <span className="text-stone-400">{displayMode === mode ? "✓" : ""}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {displayMode === "category" ? (
              <div className="flex flex-col gap-6">
                {groupedTopics.map(([category, list]) => (
                  <section key={category}>
                    <div className="mb-3 px-1 text-sm font-medium text-stone-500">{category}</div>
                    <ul className="flex flex-col gap-2">{list.map((t) => renderTopicItem(t))}</ul>
                  </section>
                ))}
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {(displayMode === "latest" ? latestTopics : filtered).map((t) => renderTopicItem(t))}
              </ul>
            )}
          </>
        )}
      </main>

      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-40 w-40 rounded-xl border border-[var(--border)] bg-white py-1.5 shadow-lg"
          style={{ top: contextMenu.y + 6, left: contextMenu.x + 6 }}
        >
          <button
            type="button"
            onClick={() => setStatus(contextMenu.id, undefined)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
          >
            <IconCircleStatus className="h-4 w-4" /> 无状态
          </button>
          <button
            type="button"
            onClick={() => setStatus(contextMenu.id, "in_progress")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
          >
            <IconCircleStatus className="h-4 w-4" /> 进行中
          </button>
          <button
            type="button"
            onClick={() => setStatus(contextMenu.id, "done")}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
          >
            <IconCheckCircle className="h-4 w-4" /> 完成
          </button>
          <button
            type="button"
            onClick={() => removeTopic(contextMenu.id)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-amber-800 hover:bg-amber-50"
          >
            <IconTrash className="h-4 w-4" /> 删除
          </button>
        </div>
      )}

      <div className="pointer-events-none fixed bottom-8 left-0 right-0 z-30 flex justify-center px-4">
        <button
          type="button"
          data-onboarding="create-button"
          onClick={() => router.push("/create")}
          className="pointer-events-auto focus-ring flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-[var(--accent)] text-stone-900 shadow-[0_18px_44px_rgba(183,151,103,0.22)] ring-4 ring-[var(--accent-soft)] transition hover:opacity-95 active:scale-[0.98]"
          aria-label="创建选题"
        >
          <IconPlus className="h-9 w-9" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
