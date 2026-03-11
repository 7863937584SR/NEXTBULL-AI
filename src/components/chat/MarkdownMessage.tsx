import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

// Module-level constant to avoid recreating on every render
const REMARK_PLUGINS = [remarkGfm];

/* ═══════════════════════════════════════════
   MARKDOWN MESSAGE RENDERER
   Beautiful, readable AI response formatting
   ═══════════════════════════════════════════ */

const markdownComponents: Components = {
  /* ── HEADINGS ── */
  h1: ({ children }) => (
    <h1 className="text-lg font-bold text-white mt-5 mb-2 pb-1.5 border-b border-blue-500/20 flex items-center gap-2">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-[15px] font-bold text-white mt-4 mb-1.5 flex items-center gap-2">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-blue-300 mt-3 mb-1">
      {children}
    </h3>
  ),

  /* ── PARAGRAPHS ── */
  p: ({ children }) => (
    <p className="text-[13px] leading-relaxed text-gray-200 mb-2 last:mb-0">
      {children}
    </p>
  ),

  /* ── BOLD / ITALIC / CODE ── */
  strong: ({ children }) => {
    const text = String(children);
    // Section headers with emoji (like **📊 MARKET DATA SNAPSHOT**)
    if (/^[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(text) && text.length > 3) {
      return (
        <span className="block text-[14px] font-bold text-white mt-4 mb-1.5 pb-1 border-b border-white/10">
          {children}
        </span>
      );
    }
    // Colored labels for key data points
    if (text.includes('₹') || text.match(/[+-]?\d+\.?\d*%/) || text.match(/^\d[\d,.]+$/)) {
      return <span className="font-bold text-emerald-400">{children}</span>;
    }
    return <strong className="font-semibold text-white">{children}</strong>;
  },
  em: ({ children }) => (
    <em className="text-gray-400 not-italic text-[11px]">{children}</em>
  ),
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block bg-black/40 rounded-lg p-3 my-2 text-xs font-mono text-emerald-300 border border-white/5 overflow-x-auto">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-amber-300">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2">{children}</pre>
  ),

  /* ── LISTS ── */
  ul: ({ children }) => (
    <ul className="space-y-1 my-2 pl-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="space-y-1.5 my-2 pl-0 counter-reset-list">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-[13px] leading-relaxed text-gray-200 flex items-start gap-2">
      <span className="mt-[7px] min-w-[5px] h-[5px] rounded-full bg-blue-400/70 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),

  /* ── BLOCKQUOTE ── */
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-blue-500/40 pl-3 my-2 text-gray-300 italic">
      {children}
    </blockquote>
  ),

  /* ── HORIZONTAL RULE ── */
  hr: () => (
    <hr className="border-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-3" />
  ),

  /* ── TABLES ── */
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-xs">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-white/5 border-b border-white/10">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-white/5">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-white/5 transition-colors">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-[11px] font-bold text-blue-300 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => {
    const text = String(children);
    // Color numbers green/red based on +/-
    const isPositive = text.match(/^\+/) || (text.includes('%') && !text.startsWith('-'));
    const isNegative = text.startsWith('-');
    const colorClass = isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-gray-200';
    return (
      <td className={`px-3 py-2 text-[12px] font-mono ${colorClass}`}>
        {children}
      </td>
    );
  },

  /* ── LINKS ── */
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 hover:text-blue-300 underline underline-offset-2 decoration-blue-400/30 transition-colors"
    >
      {children}
    </a>
  ),
};

interface MarkdownMessageProps {
  content: string;
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = memo(({ content }) => {
  return (
    <div className="markdown-message space-y-0.5">
      <ReactMarkdown
        remarkPlugins={REMARK_PLUGINS}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownMessage.displayName = 'MarkdownMessage';

export default MarkdownMessage;
