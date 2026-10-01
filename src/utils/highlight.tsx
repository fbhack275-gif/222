import React from 'react';

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders text with matching query highlighted in glowing amber tag
 */
export const HighlightText: React.FC<{ text: string | number | undefined | null; query: string; className?: string }> = ({
  text,
  query,
  className = ''
}) => {
  if (text === undefined || text === null) return null;
  const strText = String(text);
  const cleanQuery = query.trim();

  if (!cleanQuery) {
    return <span className={className}>{strText}</span>;
  }

  try {
    const regex = new RegExp(`(${escapeRegex(cleanQuery)})`, 'gi');
    const parts = strText.split(regex);

    return (
      <span className={className}>
        {parts.map((part, i) =>
          part.toLowerCase() === cleanQuery.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400 text-slate-950 font-black px-1 py-0.5 rounded shadow-sm border border-amber-300"
            >
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  } catch {
    return <span className={className}>{strText}</span>;
  }
};

/**
 * Returns true if text matches query (case-insensitive)
 */
export function isMatch(text: string | undefined | null, query: string): boolean {
  if (!text || !query.trim()) return false;
  return text.toLowerCase().includes(query.trim().toLowerCase());
}
