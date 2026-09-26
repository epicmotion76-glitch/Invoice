import { Fragment, type ReactNode } from "react";

/** Renders `**bold**` spans as <strong>; everything else stays plain text. */
function inline(text: string): ReactNode[] {
  return text
    .replace(/^#+\s*/, "")
    .split(/(\*\*[^*\n]+\*\*)/g)
    .map((part, index) =>
      part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={index}>{part.slice(2, -2)}</strong> : part,
    );
}

const BULLET = /^\s*(?:[-•*]|\d+[.)])\s+/;

/**
 * Safe renderer for assistant replies: paragraphs, line breaks, "- " bullet lists and bold, built
 * from React text nodes. Model output is never injected as HTML, and URLs stay plain text.
 */
export function FormattedText({ text }: { text: string }) {
  const nodes: ReactNode[] = [];

  for (const block of text.replace(/\r\n/g, "\n").trim().split(/\n{2,}/)) {
    let paragraph: string[] = [];
    let list: string[] = [];
    const flushParagraph = () => {
      if (!paragraph.length) return;
      const lines = paragraph;
      nodes.push(
        <p key={nodes.length}>
          {lines.map((line, index) => (
            <Fragment key={index}>
              {index > 0 && <br />}
              {inline(line)}
            </Fragment>
          ))}
        </p>,
      );
      paragraph = [];
    };
    const flushList = () => {
      if (!list.length) return;
      const items = list;
      nodes.push(
        <ul key={nodes.length}>
          {items.map((item, index) => (
            <li key={index}>{inline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    };

    for (const line of block.split("\n")) {
      if (!line.trim()) continue;
      if (BULLET.test(line)) {
        flushParagraph();
        list.push(line.replace(BULLET, ""));
      } else {
        flushList();
        paragraph.push(line.trim());
      }
    }
    flushParagraph();
    flushList();
  }

  return <>{nodes}</>;
}
