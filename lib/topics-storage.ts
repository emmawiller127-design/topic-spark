import type { Topic } from "./types";
import { escapeHtml } from "./html-utils";
import { ensureTopicDocument } from "./topic-document";

const STORAGE_KEY = "topic-spark-topics";

/** 示例1：咖啡探店 / 自习场景 */
const SEED_1_RAW =
  "最近周末都会去咖啡馆学习，去了10来家了，感觉可以做个上海咖啡店评测了，毕竟大部分店都有缺点，可以给在意的人一个参考，比如环境、氛围、充电、咖啡、厕所等。正好可以记录下今天这家：空间很大、环境挺好的，但是因为绿化太好有蚊子，而且因为在文化公园里，晚饭后很多人来聊天，像集市一样非常非常非常吵，要来的话感觉白天还行。";

/** 示例2：职场成长输出 */
const SEED_2_RAW =
  "近几个月在工作上有很多成长和感悟，这个方向可以做一些输出，主要软技能和个人感悟上。";

/** 示例3：生活美食与 Vlog */
const SEED_3_RAW =
  "我就这样一直吃吃吃。过年到现在存了好多美食图片和视频，最近可以慢慢p和剪素材了，可以发一个生活vlog";

/** 内置示例：首次进入且本地无数据时写入，便于演示 */
export const SEED_TOPICS: Topic[] = [
  {
    id: "seed-cafe-shanghai",
    rawContent: SEED_1_RAW,
    title: "上海咖啡自习室评测",
    category: "美食饮品",
    createdAt: Date.now() - 86400000 * 4,
    status: "in_progress",
    order: 0,
    documentHtml: `<p>${escapeHtml(SEED_1_RAW)}</p>`,
  },
  {
    id: "seed-work-growth",
    rawContent: SEED_2_RAW,
    title: "最近工作成长感悟",
    category: "职场成长",
    createdAt: Date.now() - 86400000 * 2,
    status: "in_progress",
    order: 1,
    documentHtml: `<p>${escapeHtml(SEED_2_RAW)}</p>`,
  },
  {
    id: "seed-food-vlog",
    rawContent: SEED_3_RAW,
    title: "生活美食 Vlog 选题",
    category: "文化娱乐",
    createdAt: Date.now() - 3600000 * 8,
    status: "in_progress",
    order: 2,
    documentHtml: `<p>${escapeHtml(SEED_3_RAW)}</p>`,
  },
];

function statusWeight(status?: Topic["status"]): number {
  return status === "done" ? 2 : status === "in_progress" ? 1 : 0;
}

function normalizeTopic(topic: Topic, fallbackOrder: number): Topic {
  const withDoc = ensureTopicDocument(topic);
  return {
    ...withDoc,
    status:
      withDoc.status === "done" || withDoc.status === "in_progress"
        ? withDoc.status
        : undefined,
    order: typeof withDoc.order === "number" ? withDoc.order : fallbackOrder,
  };
}

/** 首页显示顺序：先进行中，再完成；同状态按 order 升序。 */
export function sortTopicsForDisplay(list: Topic[]): Topic[] {
  return [...list].sort((a, b) => {
    const s = statusWeight(a.status) - statusWeight(b.status);
    if (s !== 0) return s;
    const ao = typeof a.order === "number" ? a.order : Number.MAX_SAFE_INTEGER;
    const bo = typeof b.order === "number" ? b.order : Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return b.createdAt - a.createdAt;
  });
}

export function normalizeTopics(list: Topic[]): Topic[] {
  const normalized = list.map((t, i) => normalizeTopic(t, i));
  return sortTopicsForDisplay(normalized);
}

/** 仅重排 order，不改变状态。 */
export function reorderTopicsByIds(topics: Topic[], orderedIds: string[]): Topic[] {
  const map = new Map(topics.map((t) => [t.id, t]));
  const next: Topic[] = [];
  orderedIds.forEach((id, idx) => {
    const t = map.get(id);
    if (!t) return;
    next.push({ ...t, order: idx });
    map.delete(id);
  });
  // 兜底：把缺失 id 的条目拼到末尾，避免数据丢失
  Array.from(map.values()).forEach((t, extraIdx) => {
    next.push({ ...t, order: orderedIds.length + extraIdx });
  });
  return next;
}

export function loadTopics(): Topic[] {
  if (typeof window === "undefined") return normalizeTopics(SEED_TOPICS);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = normalizeTopics(SEED_TOPICS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Topic[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const seeded = normalizeTopics(SEED_TOPICS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const normalized = normalizeTopics(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return normalizeTopics(SEED_TOPICS);
  }
}

export function saveTopics(topics: Topic[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  } catch {
    /* ignore */
  }
}

export function upsertTopic(topics: Topic[], topic: Topic): Topic[] {
  const normalized = normalizeTopics(topics);
  const maxOrder = normalized.reduce((m, t) => Math.max(m, t.order ?? 0), -1);
  const others = topics.filter((t) => t.id !== topic.id);
  const nextTopic: Topic = {
    ...topic,
    status:
      topic.status === "done" || topic.status === "in_progress"
        ? topic.status
        : undefined,
    order: typeof topic.order === "number" ? topic.order : maxOrder + 1,
  };
  return normalizeTopics([...others, nextTopic]);
}
