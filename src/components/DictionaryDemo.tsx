import { useState } from "react";
import { BookMarked, Clock3, Languages } from "lucide-react";
import { DictionaryTooltip } from "./DictionaryTooltip";

const selectableWords = new Set(["serendipity", "ephemeral", "eloquent", "mellifluous", "perseverance"]);

const renderParagraph = (text: string, onSelect: (word: string, event: React.MouseEvent) => void) =>
  text.split(/(\s+)/).map((token, index) => {
    const word = token.replace(/[^a-zA-Z]/g, "").toLowerCase();
    if (!selectableWords.has(word)) return token;
    return <button type="button" className="superbook-highlight" key={`${word}-${index}`} onClick={(event) => onSelect(word, event)}>{token}</button>;
  });

export const DictionaryDemo = () => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleWordClick = (word: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.bottom + 12 });
    setSelectedWord(word);
  };

  return (
    <div className="reader-layout">
      <article className="reading-surface">
        <div className="article-meta"><span>Essay · Language</span><span><Clock3 size={13} /> 4 min read</span></div>
        <div className="cover-image" role="img" aria-label="Open book in soft window light">
          <div className="cover-caption">Words shape the way we notice the world.</div>
        </div>
        <div className="article-copy">
          <p className="drop-cap">{renderParagraph("Serendipity is more than luck. It is the quiet art of noticing something valuable while looking for something else.", handleWordClick)}</p>
          <p>{renderParagraph("A word can hold an ephemeral feeling still long enough for us to understand it. The most eloquent language rarely announces itself; it simply makes a thought feel inevitable.", handleWordClick)}</p>
          <blockquote>“Language is the archive of history.”<cite>Ralph Waldo Emerson</cite></blockquote>
          <p>{renderParagraph("Some words are mellifluous, pleasing before their meaning is even known. Others reward perseverance, revealing their character only after we live with them for a while.", handleWordClick)}</p>
        </div>
      </article>
      <aside className="reader-sidebar">
        <div className="side-heading"><div className="side-icon"><BookMarked size={18} /></div><div><p className="eyebrow">Dictionary</p><h2>Explore as you read</h2></div></div>
        <p className="side-copy">Select a highlighted word in the essay to reveal its meaning without leaving the page.</p>
        <div className="word-list">
          {[...selectableWords].map((word) => <button key={word} onClick={(event) => handleWordClick(word, event)}><span>{word}</span><Languages size={15} /></button>)}
        </div>
      </aside>
      {selectedWord && <DictionaryTooltip word={selectedWord} position={tooltipPosition} onClose={() => setSelectedWord(null)} />}
    </div>
  );
};
