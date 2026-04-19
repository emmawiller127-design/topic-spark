import type { ContentFormat } from "./types";
import type { NoteOutline, VideoOutline } from "./types";

/**
 * Mock：根据原始灵感、标题、分类与形式生成结构化大纲（克制、偏框架占位）。
 * 替换为真实 AI：在 app/api/generate-outline/route.ts 中调用大模型，解析为 NoteOutline | VideoOutline。
 */
export function mockGenerateOutline(params: {
  rawContent: string;
  title: string;
  category: string;
  format: ContentFormat;
}): NoteOutline | VideoOutline {
  const { rawContent, title, category, format } = params;
  const trimmed = rawContent.trim();
  const short = trimmed.slice(0, 20);
  const ref = short ? `${short}${trimmed.length > 20 ? "…" : ""}` : title.slice(0, 24);
  const units = trimmed
    .split(/[。！？\n；;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 根据灵感内容自适应分块数量：内容少时 2 块，常规 3 块，信息较多可到 4 块。
  const blockCount = trimmed.length < 24 ? 2 : Math.max(2, Math.min(4, Math.ceil(units.length / 2) || 3));
  const noteHints = [
    "背景、现象或定义。",
    "核心观点与主要展开。",
    "延伸、对照或补充（可写短或略写）。",
    "补充观察、边界情况或进一步思考。",
  ];
  const videoHints = [
    "第一层：背景或前提。",
    "第二层：观点与展开。",
    "第三层：延伸或补充。",
    "第四层：补充信息或收束前过渡。",
  ];

  if (format === "note") {
    const sections = Array.from({ length: blockCount }, (_, i) => ({
      title: `主体${i + 1}`,
      hint: noteHints[i] ?? "围绕选题继续展开。",
    }));

    const note: NoteOutline = {
      type: "note",
      title,
      category,
      intro: `开头：由「${ref}」切入，交代背景与本文要写的大致范围。`,
      sections,
      closing: "结尾：收束观点，或与开头形成呼应。",
    };
    return note;
  }

  const segments = Array.from({ length: blockCount }, (_, i) => ({
    title: `分段${i + 1}`,
    content: videoHints[i] ?? "围绕选题继续展开。",
  }));

  const video: VideoOutline = {
    type: "video",
    videoTitle: title,
    category,
    opening: `开场：说明本支视频要讲什么，以及与「${ref}」的关系。`,
    segments,
    ending: "结尾：收束，或留下一句待讨论的问题。",
  };
  return video;
}
