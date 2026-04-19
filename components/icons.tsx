/** 轻量 SVG 图标，无额外依赖 */
import type { SVGProps } from "react";

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3-3" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden {...props}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

export function IconFolder(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 7a2 2 0 012-2h4l2 2h6a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" strokeLinejoin="round" />
    </svg>
  );
}

/** 图片上传：相框 + 山形（参考图） */
export function IconImage(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M8 14l2.5-2.5a1 1 0 011.4 0L16 16" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 17h10" strokeLinecap="round" />
      <circle cx="16.5" cy="9.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** 麦克风（参考图） */
export function IconMic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M12 14a3 3 0 003-3V6a3 3 0 10-6 0v5a3 3 0 003 3z" strokeLinejoin="round" />
      <path d="M8 11v1a4 4 0 008 0v-1M12 18v2M9 21h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconBold(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M8 5h5.5a3.5 3.5 0 010 7H8V5zm0 7h6.5a3.5 3.5 0 010 7H8v-7z" />
    </svg>
  );
}

export function IconItalic(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden {...props}>
      <path d="M12 5l-2 14M10 5h6M8 19h6" strokeLinecap="round" />
    </svg>
  );
}

export function IconHeading2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 6v12M4 12h6M10 6v12" strokeLinecap="round" />
      <path d="M14 10h6l-3 4h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconHeading3(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <path d="M4 6v12M4 12h6M10 6v12" strokeLinecap="round" />
      <path d="M14 10h4M16 8v8M14 16h4" strokeLinecap="round" />
    </svg>
  );
}

export function IconCheckCircle(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M8.5 12.5l2.1 2.1 4.7-4.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCircleStatus(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <circle cx="12" cy="12" r="7.5" />
    </svg>
  );
}

export function IconTrash(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9 7V5h6v2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7l.8 11h6.4L16 7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 10.5v5M13.5 10.5v5" strokeLinecap="round" />
    </svg>
  );
}

export function IconList(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <circle cx="5" cy="6" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="5" cy="12" r="1.35" fill="currentColor" stroke="none" />
      <circle cx="5" cy="18" r="1.35" fill="currentColor" stroke="none" />
      <path d="M9 6h10" strokeLinecap="round" />
      <path d="M9 12h10" strokeLinecap="round" />
      <path d="M9 18h10" strokeLinecap="round" />
    </svg>
  );
}

export function IconListOrdered(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden {...props}>
      <path d="M4.5 7h2M6.5 5v4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.5 13.5c0-1 0.8-1.8 1.8-1.8s1.8 0.6 1.8 1.5c0 0.7-0.5 1.2-1.1 1.6l-2.2 1.4h3.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.7 17.4h2.7c0.8 0 1.4 0.5 1.4 1.2S8.2 20 7.4 20H4.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 6h10" strokeLinecap="round" />
      <path d="M10 12h10" strokeLinecap="round" />
      <path d="M10 18h10" strokeLinecap="round" />
    </svg>
  );
}
