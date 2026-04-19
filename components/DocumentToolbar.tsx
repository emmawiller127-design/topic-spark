"use client";

import type { RefObject } from "react";
import {
  IconBold,
  IconHeading2,
  IconItalic,
  IconList,
  IconListOrdered,
} from "@/components/icons";

type Props = {
  editorRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
};

function getSelectionInEditor(editor: HTMLDivElement) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode) return null;
  if (!editor.contains(anchorNode) || !editor.contains(focusNode)) return null;
  return { selection, range };
}

function getClosestBlock(node: Node | null, editor: HTMLDivElement): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== editor) {
    if (
      current instanceof HTMLElement &&
      ["P", "DIV", "LI", "H1", "H2", "H3", "H4", "H5", "H6"].includes(current.tagName)
    ) {
      return current;
    }
    current = current.parentNode;
  }
  return null;
}

function placeCursorAtEnd(selection: Selection, node: Node) {
  const range = document.createRange();
  range.selectNodeContents(node);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function unwrapList(list: HTMLOListElement | HTMLUListElement, selection: Selection) {
  const parent = list.parentNode;
  if (!parent) return;
  const items = Array.from(list.children).filter((node): node is HTMLLIElement => node instanceof HTMLLIElement);
  let lastInserted: HTMLElement | null = null;

  items.forEach((item) => {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = item.innerHTML.trim() || "<br>";
    parent.insertBefore(paragraph, list);
    lastInserted = paragraph;
  });

  parent.removeChild(list);
  if (lastInserted) {
    placeCursorAtEnd(selection, lastInserted);
  }
}

function toggleHeading(editor: HTMLDivElement) {
  const selectionInfo = getSelectionInEditor(editor);
  if (!selectionInfo) return;

  const { selection, range } = selectionInfo;
  const block = getClosestBlock(range.startContainer, editor);
  if (!block) return;

  if (block.tagName === "H2") {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = block.innerHTML.trim() || "<br>";
    block.replaceWith(paragraph);
    placeCursorAtEnd(selection, paragraph);
    return;
  }

  const heading = document.createElement("h2");
  heading.innerHTML = block.innerHTML.trim() || "<br>";
  block.replaceWith(heading);
  placeCursorAtEnd(selection, heading);
}

function toggleList(editor: HTMLDivElement, ordered: boolean) {
  const selectionInfo = getSelectionInEditor(editor);
  if (!selectionInfo) return;

  const { range, selection } = selectionInfo;
  const targetTag = ordered ? "OL" : "UL";
  const currentList = (range.commonAncestorContainer instanceof Element
    ? range.commonAncestorContainer.closest("ol, ul")
    : range.commonAncestorContainer.parentElement?.closest("ol, ul")) as HTMLOListElement | HTMLUListElement | null;

  if (currentList) {
    if (currentList.tagName === targetTag) {
      unwrapList(currentList, selection);
      return;
    }

    const replacement = document.createElement(ordered ? "ol" : "ul");
    replacement.innerHTML = currentList.innerHTML;
    currentList.replaceWith(replacement);
    placeCursorAtEnd(selection, replacement.lastElementChild ?? replacement);
    return;
  }

  const block = getClosestBlock(range.startContainer, editor);
  if (!block) return;

  const list = document.createElement(ordered ? "ol" : "ul");
  const item = document.createElement("li");

  if (!selection.isCollapsed) {
    const extracted = range.extractContents();
    const wrapper = document.createElement("div");
    wrapper.appendChild(extracted);
    const html = wrapper.innerHTML.trim();
    item.innerHTML = html || block.innerHTML.trim() || "<br>";
    if (block.textContent?.trim() === "") {
      block.remove();
    }
  } else {
    item.innerHTML = block.innerHTML.trim() || "<br>";
    block.replaceWith(list);
  }

  if (!list.parentNode) {
    block.replaceWith(list);
  }

  list.appendChild(item);
  placeCursorAtEnd(selection, item);
}

function run(editorRef: RefObject<HTMLDivElement | null>, disabled: boolean, fn: (editor: HTMLDivElement) => void) {
  const editor = editorRef.current;
  if (!editor || disabled) return;
  editor.focus();
  fn(editor);
  editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
}

export function DocumentToolbar({ editorRef, disabled = false }: Props) {
  const btn = `focus-ring flex h-9 w-9 items-center justify-center rounded-lg text-stone-600 transition hover:bg-stone-100 active:bg-stone-200 ${
    disabled ? "cursor-not-allowed opacity-40 hover:bg-transparent active:bg-transparent" : ""
  }`;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1"
      role="toolbar"
      aria-label="文本格式"
    >
      <button
        type="button"
        className={btn}
        title="加粗"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          run(editorRef, disabled, () => {
            document.execCommand("bold", false);
          })
        }
      >
        <IconBold className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={btn}
        title="斜体"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          run(editorRef, disabled, () => {
            document.execCommand("italic", false);
          })
        }
      >
        <IconItalic className="h-4 w-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
      <button
        type="button"
        className={btn}
        title="标题"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          run(editorRef, disabled, (editor) => {
            toggleHeading(editor);
          })
        }
      >
        <IconHeading2 className="h-5 w-5" />
      </button>
      <span className="mx-1 h-5 w-px bg-stone-200" aria-hidden />
      <button
        type="button"
        className={btn}
        title="无序列表"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          run(editorRef, disabled, (editor) => {
            toggleList(editor, false);
          })
        }
      >
        <IconList className="h-5 w-5" />
      </button>
      <button
        type="button"
        className={btn}
        title="有序列表"
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() =>
          run(editorRef, disabled, (editor) => {
            toggleList(editor, true);
          })
        }
      >
        <IconListOrdered className="h-5 w-5" />
      </button>
    </div>
  );
}
