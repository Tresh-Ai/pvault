import { useCallback, useEffect, useRef, useState } from "react";

export interface EditorSnapshot {
  title: string;
  content: string;
}

const LIMIT = 100;

/**
 * Undo/redo history for the prompt editor.
 * Snapshots are pushed on a short debounce so typing groups into sensible steps.
 */
export function useEditorHistory(
  snapshot: EditorSnapshot,
  apply: (s: EditorSnapshot) => void,
  debounceMs = 500
) {
  const stack = useRef<EditorSnapshot[]>([snapshot]);
  const index = useRef(0);
  const restoring = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [, force] = useState(0);
  const rerender = () => force(n => n + 1);

  useEffect(() => {
    if (restoring.current) {
      restoring.current = false;
      return;
    }
    const current = stack.current[index.current];
    if (current && current.title === snapshot.title && current.content === snapshot.content) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      stack.current = stack.current.slice(0, index.current + 1);
      stack.current.push({ ...snapshot });
      if (stack.current.length > LIMIT) stack.current.shift();
      index.current = stack.current.length - 1;
      rerender();
    }, debounceMs);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [snapshot.title, snapshot.content, debounceMs]);

  /** Replace the whole history, e.g. after loading a prompt from storage. */
  const reset = useCallback((next: EditorSnapshot) => {
    if (timer.current) clearTimeout(timer.current);
    stack.current = [{ ...next }];
    index.current = 0;
    restoring.current = true;
    rerender();
  }, []);

  const undo = useCallback(() => {
    if (index.current <= 0) return;
    if (timer.current) clearTimeout(timer.current);
    index.current -= 1;
    restoring.current = true;
    apply({ ...stack.current[index.current] });
    rerender();
  }, [apply]);

  const redo = useCallback(() => {
    if (index.current >= stack.current.length - 1) return;
    if (timer.current) clearTimeout(timer.current);
    index.current += 1;
    restoring.current = true;
    apply({ ...stack.current[index.current] });
    rerender();
  }, [apply]);

  return {
    undo,
    redo,
    reset,
    canUndo: index.current > 0,
    canRedo: index.current < stack.current.length - 1,
  };
}
