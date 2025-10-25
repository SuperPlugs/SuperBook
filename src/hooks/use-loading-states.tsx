// Minimal stub: useLoadingStates was removed to reduce complexity.
// Keep a tiny export so imports won't break if referenced elsewhere.

export type LoadingState = string;

export const useLoadingStates = () => {
  return {
    loadingState: 'idle' as LoadingState,
    error: null as string | null,
    isLoading: false,
    setLoadingState: (_: LoadingState) => {},
    setError: (_: string | null) => {},
    executeWithStates: async (_fn: () => Promise<unknown>) => {
      return undefined as unknown;
    },
    reset: () => {},
  };
};

export default useLoadingStates;