/** 纯文本插入 HTML 时转义 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 从 HTML 取纯文本（浏览器端） */
export function stripHtml(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  }
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/** 重新生成大纲前，移除上一份大纲（从最后一个 hr[data-outline-sep] 起到文末） */
export function removeAppendedOutline(html: string): string {
  if (typeof document === "undefined") return html;
  const d = document.createElement("div");
  d.innerHTML = html;
  const hrs = d.querySelectorAll("hr[data-outline-sep]");
  if (hrs.length === 0) return html;
  const last = hrs[hrs.length - 1];
  let cur: ChildNode | null = last;
  while (cur) {
    const nxt: ChildNode | null = cur.nextSibling;
    cur.parentNode?.removeChild(cur);
    cur = nxt;
  }
  return d.innerHTML;
}
