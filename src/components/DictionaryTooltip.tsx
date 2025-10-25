import { useState, useEffect, useCallback } from "react";
import { cn } from "../lib/utils";
import { EnhancedSkeleton, SkeletonWord, SkeletonLine } from "./ui/enhanced-skeleton";
import LoadingIndicator from "./ui/loading-indicator";

enum LoadingState {
  IDLE = 'idle',
  FETCHING = 'fetching',
  PARSING = 'parsing',
  RENDERING = 'rendering',
  SUCCESS = 'success',
  ERROR = 'error'
}

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
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [error, setError] = useState<string | null>(null);

  const fetchDefinition = useCallback(async () => {
    try {
      setLoadingState(LoadingState.FETCHING);
      setError(null);
      setDefinition(null);

      // Simulate fetching delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
        { signal: controller.signal }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error("Word not found");
      }

      setLoadingState(LoadingState.PARSING);
      await new Promise(resolve => setTimeout(resolve, 200));

      const data = await response.json();
      const entry = data[0];
      const meaning = entry.meanings?.[0];
      const def = meaning?.definitions?.[0];

      setLoadingState(LoadingState.RENDERING);
      await new Promise(resolve => setTimeout(resolve, 100));

      setDefinition({
        word: entry.word,
        phonetic: entry.phonetic || entry.phonetics?.[0]?.text || "",
        partOfSpeech: meaning?.partOfSpeech || "",
        definition: def?.definition || "No definition available",
        example: def?.example || undefined,
      });

      setLoadingState(LoadingState.SUCCESS);
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again.");
        } else if (err instanceof TypeError) {
          setError("Network error. Please check your connection.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoadingState(LoadingState.ERROR);
    }
  }, [word]);

  useEffect(() => {
    fetchDefinition();
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

    const timer = setTimeout(onClose, 5000);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      clearTimeout(timer);
    };
  }, [onClose]);

  return (
    <div
      className={cn(
        "dictionary-tooltip fixed z-50 max-w-80 min-w-50 p-3 rounded-xl",
        "bg-tooltip text-tooltip-foreground border border-tooltip-border",
        "shadow-tooltip animate-in fade-in-0 zoom-in-95 duration-200"
      )}
      style={{
        left: `${Math.min(position.x, window.innerWidth - 320)}px`,
        top: `${Math.max(position.y - 10, 10)}px`,
      }}
    >
      {loadingState === LoadingState.FETCHING && (
        <div className="space-y-3 animate-fade-in">
          <LoadingIndicator 
            variant="spinner" 
            text={`Fetching definition for "${word}"...`}
            className="text-sm text-muted-foreground"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonWord className="h-5 w-20" />
              <SkeletonWord className="h-3 w-16" />
              <SkeletonWord className="h-4 w-12" />
            </div>
            <SkeletonLine className="h-4" />
            <SkeletonLine className="h-4 w-4/5" />
          </div>
        </div>
      )}

      {loadingState === LoadingState.PARSING && (
        <div className="space-y-3 animate-fade-in">
          <LoadingIndicator 
            variant="dots" 
            text="Parsing definition..."
            className="text-sm text-muted-foreground"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <EnhancedSkeleton variant="wave" className="h-5 w-20" />
              <EnhancedSkeleton variant="wave" className="h-3 w-16" />
              <EnhancedSkeleton variant="wave" className="h-4 w-12" />
            </div>
            <EnhancedSkeleton variant="wave" className="h-4 w-full" />
            <EnhancedSkeleton variant="wave" className="h-4 w-4/5" />
          </div>
        </div>
      )}

      {loadingState === LoadingState.RENDERING && (
        <div className="space-y-3 animate-fade-in">
          <LoadingIndicator 
            variant="pulse" 
            text="Rendering..."
            className="text-sm text-muted-foreground"
          />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <EnhancedSkeleton variant="pulse" className="h-5 w-20" />
              <EnhancedSkeleton variant="pulse" className="h-3 w-16" />
              <EnhancedSkeleton variant="pulse" className="h-4 w-12" />
            </div>
            <EnhancedSkeleton variant="pulse" className="h-4 w-full" />
            <EnhancedSkeleton variant="pulse" className="h-4 w-4/5" />
          </div>
        </div>
      )}

      {loadingState === LoadingState.ERROR && error && (
        <div className="text-destructive text-sm space-y-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-destructive">⚠️</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDefinition()}
            className="text-sm bg-highlight text-white px-3 py-1.5 rounded-md hover:bg-highlight/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loadingState === LoadingState.SUCCESS && definition && (
        <div className="space-y-2 animate-slide-in">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-base text-highlight capitalize">
              {definition.word}
            </span>
            {definition.phonetic && (
              <span className="text-xs text-highlight/80 italic">
                {definition.phonetic}
              </span>
            )}
            {definition.partOfSpeech && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-md">
                {definition.partOfSpeech}
              </span>
            )}
          </div>

          <p className="text-sm leading-relaxed text-tooltip-foreground/90">
            {definition.definition}
          </p>

          {definition.example && (
            <div className="text-xs italic text-tooltip-foreground/70 border-l-2 border-highlight pl-2 mt-2">
              "{definition.example}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};