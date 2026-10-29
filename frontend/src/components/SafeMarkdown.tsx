"use client";

import React, { useState } from "react";

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Sanitasi URL untuk mencegah XSS melalui javascript:, data:, atau vbscript:
 */
function sanitizeUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }
  return null;
}

/**
 * Parsing inline formatting seperti bold, italic, code, link, dan teks biasa
 */
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  // Regex untuk inline code, link, bold, italic
  const tokenRegex =
    /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex));
    }

    const token = match[0];
    const key = `${matchIndex}-${token}`;

    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={key} className="inline-code">
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("[") && token.includes("](") && token.endsWith(")")) {
      const splitIdx = token.indexOf("](");
      const linkText = token.slice(1, splitIdx);
      const linkUrl = token.slice(splitIdx + 2, -1);
      const safeHref = sanitizeUrl(linkUrl);

      if (safeHref) {
        nodes.push(
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {renderInline(linkText)}
          </a>
        );
      } else {
        nodes.push(<span key={key}>{linkText}</span>);
      }
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(
        <strong key={key}>
          {renderInline(token.slice(2, -2))}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(
        <em key={key}>
          {renderInline(token.slice(1, -1))}
        </em>
      );
    }

    lastIndex = matchIndex + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

/**
 * Komponen Blok Kode dengan Tombol Salin
 */
function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-block-wrapper">
      <header className="code-block-header">
        <span className="code-lang">{lang || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          aria-label="Salin kode"
        >
          {copied ? "Tersalin!" : "Salin"}
        </button>
      </header>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Komponen SafeMarkdown:
 * Merender Markdown secara aman tanpa evaluasi script / event-handler berbahaya.
 */
export function SafeMarkdown({ content, className = "" }: SafeMarkdownProps) {
  if (!content) return null;

  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  let keyIndex = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block (```)
    if (line.trim().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <CodeBlock
          key={`code-${keyIndex++}`}
          code={codeLines.join("\n")}
          lang={lang}
        />
      );
      i++;
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (line.startsWith("#")) {
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const headingText = headingMatch[2];
        const headingId = headingText
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

        if (level === 1) {
          elements.push(
            <h1 key={`h1-${keyIndex++}`} id={headingId}>
              {renderInline(headingText)}
            </h1>
          );
        } else if (level === 2) {
          elements.push(
            <h2 key={`h2-${keyIndex++}`} id={headingId}>
              {renderInline(headingText)}
            </h2>
          );
        } else if (level === 3) {
          elements.push(
            <h3 key={`h3-${keyIndex++}`} id={headingId}>
              {renderInline(headingText)}
            </h3>
          );
        } else {
          elements.push(
            <h4 key={`h4-${keyIndex++}`} id={headingId}>
              {renderInline(headingText)}
            </h4>
          );
        }
        i++;
        continue;
      }
    }

    // 3. Blockquote (>)
    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${keyIndex++}`}>
          {quoteLines.map((q, qIdx) => (
            <p key={qIdx}>{renderInline(q)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 4. Tables (| Header 1 | Header 2 |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim().startsWith("|") &&
        lines[i].trim().endsWith("|")
      ) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerRow = tableLines[0]
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        const isDivider = /^(\|\s*:?-+:?\s*)+\|$/.test(tableLines[1]);

        const bodyRows = (isDivider ? tableLines.slice(2) : tableLines.slice(1)).map(
          (row) =>
            row
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim())
        );

        elements.push(
          <div key={`table-${keyIndex++}`} className="table-responsive">
            <table className="md-table">
              <thead>
                <tr>
                  {headerRow.map((h, hIdx) => (
                    <th key={hIdx}>{renderInline(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((r, rIdx) => (
                  <tr key={rIdx}>
                    {r.map((cell, cIdx) => (
                      <td key={cIdx}>{renderInline(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 5. Unordered List (- atau *)
    if (/^\s*[-*]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${keyIndex++}`}>
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 6. Ordered List (1., 2.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\s*\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${keyIndex++}`}>
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // 7. Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 8. Paragraph
    elements.push(
      <p key={`p-${keyIndex++}`}>{renderInline(line)}</p>
    );
    i++;
  }

  return <div className={`safe-markdown ${className}`}>{elements}</div>;
}
