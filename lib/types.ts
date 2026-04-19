import type { TopicCategory } from "./categories";

export type ContentFormat = "note" | "video";
export type TopicStatus = "in_progress" | "done";

export interface Topic {
  id: string;
  /** 与文档同步的纯文本摘要（用于接口与检索） */
  rawContent: string;
  title: string;
  category: TopicCategory | string;
  createdAt: number;
  /** 列表状态：进行中 / 完成 */
  status?: TopicStatus;
  /** 列表拖拽排序用的序号（数值越小越靠前） */
  order?: number;
  /** 文档正文 HTML（正文 + 可选大纲）；缺省时由 rawContent 推导 */
  documentHtml?: string;
  /** 创建页可选图片预览 */
  imageDataUrl?: string | null;
}

/** /api/analyze 响应 */
export interface AnalyzeResult {
  title: string;
  category: string;
}

/** 笔记大纲：骨架结构，轻量占位提示 */
export interface NoteOutline {
  type: "note";
  title: string;
  category: string;
  /** 开头部分 */
  intro: string;
  /** 主体块：兼容旧 mock 结构和新 API 结构 */
  sections: {
    /** 旧 mock 结构 */
    title?: string;
    hint?: string;
    /** 新 API 结构 */
    heading?: string;
    bullets?: string[];
  }[];
  /** 结尾部分 */
  closing: string;
}

/** 视频大纲：骨架结构，轻量占位提示 */
export interface VideoOutline {
  type: "video";
  videoTitle: string;
  category: string;
  /** 开场部分 */
  opening: string;
  /** 分段：按灵感内容自适应数量（通常 2-4 段） */
  segments: { title: string; content: string }[];
  /** 结尾部分 */
  ending: string;
}

export type OutlineResult = NoteOutline | VideoOutline;
