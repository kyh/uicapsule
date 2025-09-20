import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Column, DataTableFilterActions } from "../filter-package";
import { isAnyOf } from "../filter-package";

interface UseAiFilterSimulationParams<TData> {
  visibleOptionColumns: Column<TData>[];
  actions: DataTableFilterActions;
}

interface UseAiFilterSimulationResult {
  aiGenerating: boolean;
  pendingColumnIds: string[];
  handleAiFilterSubmit: (prompt: string) => void;
}

export function useAiFilterSimulation<TData>(
  params: UseAiFilterSimulationParams<TData>,
): UseAiFilterSimulationResult {
  const { visibleOptionColumns, actions } = params;
  const [aiGenerating, setAiGenerating] = useState(false);
  const [pendingColumnIds, setPendingColumnIds] = useState<string[]>([]);
  const aiTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAiTimeouts = useCallback(() => {
    aiTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    aiTimeoutsRef.current = [];
  }, []);

  useEffect(() => clearAiTimeouts, [clearAiTimeouts]);

  const optionColumns = useMemo(
    () =>
      visibleOptionColumns.filter((column) =>
        isAnyOf(column.type, ["option", "multiOption"]),
      ),
    [visibleOptionColumns],
  );

  const handleAiFilterSubmit = useCallback(
    (prompt: string) => {
      if (!prompt.trim()) return;

      clearAiTimeouts();

      const availableColumns = [...optionColumns];
      for (let i = availableColumns.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableColumns[i], availableColumns[j]] = [
          availableColumns[j],
          availableColumns[i],
        ];
      }

      const maxFilters = Math.min(availableColumns.length, 3);
      if (maxFilters === 0) {
        setPendingColumnIds([]);
        setAiGenerating(false);
        return;
      }

      const filtersToGenerate =
        Math.floor(Math.random() * maxFilters) + 1 /* 1..maxFilters */;
      const selectedColumns = availableColumns.slice(0, filtersToGenerate);

      setAiGenerating(true);
      setPendingColumnIds(selectedColumns.map((column) => column.id));

      let remaining = selectedColumns.length;

      const finishIfComplete = () => {
        remaining -= 1;
        if (remaining > 0) return;

        const finishTimeout = setTimeout(() => {
          setAiGenerating(false);
          setPendingColumnIds([]);
        }, 300);
        aiTimeoutsRef.current.push(finishTimeout);
      };

      selectedColumns.forEach((column, index) => {
        const options = column.getOptions();
        if (!options || options.length === 0) {
          setPendingColumnIds((prev) => prev.filter((id) => id !== column.id));
          finishIfComplete();
          return;
        }

        const option = options[Math.floor(Math.random() * options.length)];
        const delay = 900 + index * 600 + Math.floor(Math.random() * 400);

        const timeout = setTimeout(() => {
          actions.setFilterValue(column as Column<TData, any>, [
            option.value,
          ] as any);
          setPendingColumnIds((prev) =>
            prev.filter((columnId) => columnId !== column.id),
          );
          finishIfComplete();
        }, delay);

        aiTimeoutsRef.current.push(timeout);
      });
    },
    [actions, clearAiTimeouts, optionColumns],
  );

  return {
    aiGenerating,
    pendingColumnIds,
    handleAiFilterSubmit,
  };
}
