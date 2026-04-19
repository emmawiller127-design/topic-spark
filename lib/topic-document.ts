import { escapeHtml } from "./html-utils";
import type { Topic } from "./types";

/** 补齐 documentHtml，兼容旧数据 */
export function ensureTopicDocument(t: Topic): Topic {
  if (t.documentHtml) return t;
  return {
    ...t,
    documentHtml: `<p>${escapeHtml(t.rawContent)}</p>`,
  };
}
