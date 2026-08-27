import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, RotateCcw, X } from "lucide-react";
import { cn } from "../lib/utils";

interface Definition {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example?: string;
}

interface DictionaryTooltipProps {
  word: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export const DictionaryTooltip = ({ word, position, onClose }: DictionaryTooltipProps) => {
  const [definition, setDefinition] = useState<Definition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const fetchDefinition = useCallback(async () => {
    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
        { signal: controller.signal }
      );

      if (!response.ok) {
        throw new Error("Word not found");
      }

      const data = await response.json();
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      const def = meaning?.definitions?.[0];

      if (requestId.current !== currentRequest) return;
      setDefinition({
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
        partOfSpeech: meaning?.partOfSpeech || "",
        definition: def?.definition || "No definition available",
        example: def?.example || undefined,
      });
    } catch (err: unknown) {
      if (requestId.current !== currentRequest) return;
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Request timed out. Please try again.");
      } else if (err instanceof TypeError) {
        setError("Network error. Please check your connection.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      if (requestId.current === currentRequest) setLoading(false);
    }
  }, [word]);

  useEffect(() => {
    fetchDefinition();
    const requestCounter = requestId;
    return () => { requestCounter.current++; };
  }, [fetchDefinition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest(".dictionary-tooltip")) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "dictionary-tooltip fixed z-50 w-[min(360px,calc(100vw-24px))] p-4 rounded-2xl",
        "text-tooltip-foreground border",
        "animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: `${Math.max(12, Math.min(position.x - 180, window.innerWidth - 372))}px`,
        top: `${Math.max(12, Math.min(position.y, window.innerHeight - 260))}px`,
      }}
    >
      <button className="tooltip-close" onClick={onClose} aria-label="Close definition"><X size={15} /></button>
      {loading && (
        <div className="flex items-center gap-3 text-sm text-white/70 py-3">
          <div className="w-4 h-4 border-2 border-highlight border-t-transparent rounded-full animate-spin" />
          <span>Looking up "{word}"...</span>
        </div>
      )}

      {error && (
        <div className="text-red-300 text-sm space-y-3">
          <div>{error}</div>
          <button
            onClick={() => fetchDefinition()}
            className="tooltip-action"
          >
            <RotateCcw size={14} /> Retry
          </button>
        </div>
      )}

      {definition && (
        <div className="space-y-3">
          <div className="tooltip-label"><BookOpen size={13} /> Definition</div>
          <div className="flex items-end gap-2 flex-wrap pr-7">
            <span className="font-semibold text-2xl text-white capitalize leading-none">
              {definition.word}
            </span>
            {definition.phonetic && (
              <span className="text-sm text-white/45">
                {definition.phonetic}
              </span>
            )}
            {definition.partOfSpeech && (
              <span className="part-of-speech">
                {definition.partOfSpeech}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-white/80">
            {definition.definition}
          </p>

          {definition.example && (
            <div className="text-xs italic text-white/50 border-l border-highlight pl-3 mt-2">
              "{definition.example}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};
