import type { ReactNode } from 'react';

/**
 * Rendu Markdown minimal (titres, gras, listes, citations, paragraphes) pour
 * un document interne de confiance (RULES.md). Ne vise pas à être un
 * moteur Markdown complet ni à traiter du contenu utilisateur non fiable.
 */
export function renderMarkdown(source: string): ReactNode[] {
  const lines = source.split('\n');
  const blocks: ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`ul-${key++}`}>
        {listItems.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith('# ')) {
      flushList();
      continue; // titre principal déjà affiché par l'en-tête de l'écran
    }
    if (line.startsWith('## ')) {
      flushList();
      blocks.push(<h2 key={key++}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      flushList();
      blocks.push(<h3 key={key++}>{renderInline(line.slice(4))}</h3>);
    } else if (/^[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^[-*]\s+/, ''));
    } else if (line.startsWith('> ')) {
      flushList();
      blocks.push(<blockquote key={key++}>{renderInline(line.slice(2))}</blockquote>);
    } else if (line.trim().length === 0) {
      flushList();
    } else if (line.startsWith('|')) {
      // Tables simplifiées en texte pour rester lisible sans layout complexe.
      if (!/^\|[\s-]+\|/.test(line)) {
        blocks.push(<p key={key++}>{renderInline(line.replace(/\|/g, ' · '))}</p>);
      }
    } else {
      flushList();
      blocks.push(<p key={key++}>{renderInline(line)}</p>);
    }
  }
  flushList();
  return blocks;
}

function renderInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}
