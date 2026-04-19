import { escapeHtml } from "./html-utils";
import type { NoteOutline, VideoOutline } from "./types";

/** 将大纲转为可插入文档的 HTML（文档流，无卡片） */
export function outlineToDocumentHtml(o: NoteOutline | VideoOutline): string {
  if (o.type === "note") {
    const note = o as NoteOutline & {
      sections?: Array<{
        heading?: string;
        bullets?: string[];
        title?: string;
        hint?: string;
      }>;
      intro?: string;
      closing?: string;
    };

    const sectionsHtml = (note.sections || [])
      .map((s) => {
        // 新接口结构：heading + bullets
        if (s.heading || s.bullets) {
          const bulletsHtml = (s.bullets || [])
            .map((b) => `<li>${escapeHtml(b)}</li>`)
            .join("");

          return [
            `<h4>${escapeHtml(s.heading || "未命名小节")}</h4>`,
            `<ul>${bulletsHtml}</ul>`,
          ].join("");
        }

        // 兼容旧 mock 结构：title + hint
        return `<p><strong>${escapeHtml(s.title || "未命名小节")}</strong> ${escapeHtml(
          s.hint || ""
        )}</p>`;
      })
      .join("");

    const body = [
      `<h2>${escapeHtml("大纲（笔记）")}</h2>`,
      `<p><strong>${escapeHtml("标题")}</strong> ${escapeHtml(note.title)}</p>`,
      `<h3>${escapeHtml("开头")}</h3>`,
      `<p>${escapeHtml(note.intro || "")}</p>`,
      `<h3>${escapeHtml("主体")}</h3>`,
      sectionsHtml || `<p>${escapeHtml("暂无主体内容")}</p>`,
      `<h3>${escapeHtml("结尾")}</h3>`,
      `<p>${escapeHtml(note.closing || "")}</p>`,
    ].join("");

    return `<hr data-outline-sep="1" class="my-8 border-[var(--border)]" />${body}`;
  }

  const video = o as VideoOutline & {
    segments?: Array<{
      title?: string;
      content?: string;
      script?: string;
    }>;
    opening?: string;
    ending?: string;
    videoTitle?: string;
  };

  const segmentsHtml = (video.segments || [])
    .map(
      (s) =>
        `<li><strong>${escapeHtml(s.title || "未命名分段")}</strong> ${escapeHtml(
          s.content || ""
        )}</li>`
    )
    .join("");

  const body = [
    `<h2>${escapeHtml("大纲（视频）")}</h2>`,
    `<p><strong>${escapeHtml("视频标题")}</strong> ${escapeHtml(video.videoTitle || "")}</p>`,
    `<h3>${escapeHtml("开场")}</h3>`,
    `<p>${escapeHtml(video.opening || "")}</p>`,
    `<h3>${escapeHtml("分段")}</h3>`,
    `<ol>${segmentsHtml}</ol>`,
    `<h3>${escapeHtml("结尾")}</h3>`,
    `<p>${escapeHtml(video.ending || "")}</p>`,
  ].join("");

  return `<hr data-outline-sep="1" class="my-8 border-[var(--border)]" />${body}`;
}